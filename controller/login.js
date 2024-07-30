// Redis 연결
const redisStore = require("../DB/redisClient");
// MySQL 접근
const mysql = require("mysql");
const { dbconfig, dbconfig_ai } = require("../DB/database");
// Tips DB 연결
const connection = mysql.createConnection(dbconfig);
connection.connect();
// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();
// connection.end(); // 언제쓰지?

const { users } = require("../DB/database");
const moment = require("moment-timezone");

// JWT 관련
const { sign, verify } = require("jsonwebtoken");
// JWT 토큰 생성
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
  };
  let result = {
    accessToken: sign(payload, process.env.ACCESS_SECRET, {
      expiresIn: "1d", // 1일간 유효한 토큰을 발행합니다.
    }),
    refreshToken: sign(payload, process.env.REFRESH_SECRET, {
      expiresIn: "7d", // 일주일간 유효한 토큰을 발행합니다.
    }),
  };

  return result;
};
// JWT 토큰 검증
const verifyToken = (type, token) => {
  let secretKey, decoded;
  // access, refresh에 따라 비밀키 선택
  switch (type) {
    case "access":
      secretKey = process.env.ACCESS_SECRET;
      break;
    case "refresh":
      secretKey = process.env.REFRESH_SECRET;
      break;
    default:
      return null;
  }

  try {
    // 토큰을 비밀키로 복호화
    decoded = verify(token, secretKey);
  } catch (err) {
    console.log(`JWT Error: ${err.message}`);
    return null;
  }
  return decoded;
};

// google OAuth2Client 설정
const { OAuth2Client } = require("google-auth-library");
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URL
);
const { google } = require("googleapis");

// kakao OAuth 관련
const axios = require("axios");

// Database Table Info
const {
  User_Table_Info,
  Plan_Table_Info,
} = require("../DB/database_table_info");

// 동기식 DB 접근 함수 1. Promise 생성 함수
function queryAsync(connection, query, parameters) {
  return new Promise((resolve, reject) => {
    connection.query(query, parameters, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
// 프로미스 resolve 반환값 사용. (User Data return)
async function fetchUserData(connection, query) {
  try {
    let results = await queryAsync(connection, query, []);
    // console.log(results[0]);
    return results;
  } catch (error) {
    console.error(error);
  }
}

const user_ai_select = async (user_table, user_attribute, parsepUid) => {
  const select_query = `SELECT * FROM ${user_table} WHERE ${user_attribute.pKey}='${parsepUid}'`;
  const select_data = await fetchUserData(connection_AI, select_query);

  return select_data;
};

const loginController = {
  // JWT 토큰 유효성 검사
  vaildateToken: (req, res, next) => {
    const accessToken = req.session.accessToken;
    const refreshToken = req.cookies.refreshToken;
    // accessToken이 있는 경우
    if (accessToken) {
      const decoded = verifyToken("access", accessToken);
      if (users.find((user) => user.id === decoded.id)) {
        res.json({ message: "AccessToken Login Success" });
      }
      // refreshToken만 있는 경우
    } else if (refreshToken) {
      const decoded = verifyToken("refresh", refreshToken);
      if (users.find((user) => user.id === decoded.id)) {
        // accessToken 생성 후 세션에 저장
        req.session.accessToken = generateToken({
          id: decoded.id,
          email: `${decoded.id}@naver.com`,
        }).accessToken;
        res.json({ message: "RefreshToken Login Success" });
      }
    } else next();
  },
  // JWT 토큰 로그인
  tokenLoginHandler: (req, res) => {
    const { id, pwd } = req.body;
    console.log(id, pwd);
    // MySQL DB 연동
    connection.query(
      `SELECT * FROM teacher WHERE (teacher_uid = '${id}' AND teacher_pwd = '${pwd}')`,
      (error, rows, fields) => {
        if (error) console.log(error);
        // rows : 배열 형식으로 저장된 행 데이터
        // fields: 열(속성) 데이터

        // rows는 테이블의 데이터를 배열 형식 저장
        // 즉, 배열 메서드를 통해 접근 가능
        // 아래는 테이블 데이터의 member_name에 접근
        // console.log(rows.filter((el) => el.member_id === id)[0].member_phone);

        if (rows.length) {
          // 토큰을 활용한 쿠키, 세션
          // const token = generateToken({ id, email: `${id}@naver.com` });
          // // accessToken 세션에 추가
          // req.session.accessToken = token.accessToken;
          // req.session.refreshToken = token.refreshToken;

          res.json({ data: "Login Success" });
        } else res.json({ data: "Login fail" });
      }
    );

    // DB없이 서버 내장 데이터 사용
    // if (users.find((el) => el.id === id && el.pwd === pwd)) {
    //   res.json("Login Success");
    // } else res.json("Login Fail");
  },
  // JWT 토큰 로그아웃
  tokenLogoutHandler: (req, res) => {
    // // 세션 삭제
    // req.session.destroy();

    // // 쿠키 삭제
    // res.clearCookie("refreshToken", {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "none",
    // });

    res.json("Token LogOut Success");
  },
  // OAuth URL 발급
  oauthUrlHandler: (req, res) => {
    console.log("OAuth URL 발급 API 호출");
    // console.log(req.body);
    // const { oauthType } = req.body;
    // console.log("type: " + oauthType);

    // SCOPE 설정. 유저 정보를 어디까지 가져올지 결정
    // const scopeMap = {
    //   google: [
    //     "https://www.googleapis.com/auth/userinfo.profile", // 기본 프로필
    //     "https://www.googleapis.com/auth/userinfo.email", // 이메일
    //   ],

    //   // 다른 플랫폼의 OAuth 추가 대비
    //   // kakao: ["https://www.kakaoapis.com/auth/userinfo.profile"],
    //   default: [
    //     "https://www.googleapis.com/auth/userinfo.profile",
    //     "https://www.googleapis.com/auth/userinfo.email",
    //   ],
    // };

    try {
      // if (!oauthType) {
      //   res.json({ data: "" });
      //   return;
      // }
      const SCOPES = [
        "https://www.googleapis.com/auth/userinfo.profile", // 기본 프로필
        "https://www.googleapis.com/auth/userinfo.email", // 이메일
      ];

      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline", // 필요한 경우
        scope: SCOPES,
      });

      // console.log(authUrl);

      res.json({ url: authUrl });
    } catch (err) {
      console.error(err);
      res.json({ url: "Non" });
    }
  },
  // Kakao OAuth URL 발급
  oauthKakaoUrlHandler: (req, res) => {
    try {
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${
        process.env.KAKAO_REST_API_KEY
      }&redirect_uri=${
        process.env.REDIRECT_URL
      }?type=kakao&state=${Math.random().toString(36).substring(7)}`;
      return res.status(200).json({ url: kakaoAuthUrl });
    } catch (err) {
      console.error(err);
      res.json({ data: err });
    }
  },
  // AI Google OAuth 로그인 - AccessToken 발급
  oauthGoogleAccessTokenHandler: async (req, res) => {
    const { code } = req.body;
    console.log("Google OAuth AccessToken 발급 API 호출");
    const sessionId = req.sessionID;
    let parseUid = "",
      parseEmail = "";
    try {
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error("Error retrieving access token", err);
        oAuth2Client.setCredentials(token);

        // 액세스 토큰을 사용하여 API를 호출할 수 있습니다.
        const oauth2 = google.oauth2({
          auth: oAuth2Client,
          version: "v2",
        });

        // 유저 정보 GET
        oauth2.userinfo.get(async (err, response) => {
          if (err) return console.error(err);
          // console.log(response.data);

          const { id, email } = response.data;

          const table = User_Table_Info.table;
          const attribute = User_Table_Info.attribute;
          // 오늘 날짜 변환
          const dateObj = new Date();
          const year = dateObj.getFullYear();
          const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
          const day = ("0" + dateObj.getDate()).slice(-2);
          const date = `${year}-${month}-${day}`;

          // DB 계정 생성

          // 1. SELECT USER (row가 있는지 없는지 검사)
          const select_query = `SELECT * FROM ${table} WHERE ${attribute.pKey}='${response.data.id}'`;
          const ebt_data = await fetchUserData(connection_AI, select_query);

          // 2. INSERT USER (row값이 없는 경우 실행)
          if (!ebt_data[0]) {
            parseUid = id;
            parseEmail = email;
            const insert_query = `INSERT INTO ${table} (${Object.values(
              attribute
            ).join(", ")}) VALUES (${Object.values(attribute)
              .map((el) => "?")
              .join(", ")})`;
            // console.log(insert_query);

            const insert_value = [
              id,
              email,
              null,
              null,
              null,
              "google",
              date,
              date,
            ];
            // console.log(insert_value);

            // 계정 생성 쿼리 임시 주석
            connection_AI.query(
              insert_query,
              insert_value,
              (error, rows, fields) => {
                if (error) console.log(error);
                else console.log("OAuth User Row DB INSERT Success!");
              }
            );
          }
          // 3. UPDATE USER (row값이 있는 경우 실행)
          else {
            parseUid = ebt_data[0].uid;
            parseEmail = ebt_data[0].Email;
            // Update LastLoginDate
            const update_query = `UPDATE ${table} SET ${Object.values(attribute)
              .filter((el) => el === "lastLogin_date")
              .map((el) => {
                return `${el} = ?`;
              })
              .join(", ")} WHERE ${attribute.pKey} = ?`;
            // console.log(update_query);

            const update_value = [date, id];
            // console.log(update_value);

            connection_AI.query(
              update_query,
              update_value,
              (error, rows, fields) => {
                if (error) console.log(error);
                else console.log("Google OAuth User Data UPDATE Success!");
              }
            );
          }

          // JWT Token 발급 후 세션 저장
          const token = generateToken({
            id: parseUid,
            email: parseEmail,
          });

          // Session 내부에 accessToken 저장
          req.session.accessToken = token.accessToken;
          // browser Cookie에 refreshToken 저장
          res.cookie("refreshToken", token.refreshToken, {
            maxAge: 3600000,
            httpOnly: true,
            sameSite: process.env.DEV_OPS === "local" ? "strict" : "none",
            secure: process.env.DEV_OPS !== "local",
          });

          // Redis에서 기존 세션 ID 확인
          redisStore.get(`user_session:${parseUid}`, (err, oldSessionId) => {
            if (oldSessionId) {
              // 기존 세션 무효화
              redisStore.destroy(`user_session:${parseUid}`, (err, reply) => {
                console.log("Previous session invalidated");
              });
            }
            // 새 세션 ID를 사용자 ID와 연결
            redisStore.set(
              `user_session:${parseUid}`,
              sessionId,
              (err, reply) => {
                // 로그인 처리 로직
                console.log(`[${parseUid}] SessionID Update - ${sessionId}`);
              }
            );
          });

          res.json(response.data);
        });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ data: "Server Error!" });
    }
  },
  // AI Kakao OAuth 로그인 - AccessToken 발급
  oauthKakaoAccessTokenHandler: async (req, res) => {
    const { code } = req.body;
    console.log("Kakao OAuth AccessToken 발급 API 호출");
    // 현재 카카오 소셜 로그인은 사업자등록을 해두지 않았기에 닉네임 정보만 가져올 수 있습니다.
    const sessionId = req.sessionID;
    let parseUid = "",
      parseEmail = "";

    // console.log("KAKAO_REST_API_KEY: " + process.env.KAKAO_REST_API_KEY);
    try {
      // POST 요청으로 액세스 토큰 요청
      const tokenResponse = await axios.post(
        "https://kauth.kakao.com/oauth/token",
        null,
        {
          params: {
            grant_type: "authorization_code",
            client_id: process.env.KAKAO_REST_API_KEY, // 카카오 개발자 콘솔에서 발급받은 REST API 키
            redirect_uri: `${process.env.REDIRECT_URL}?type=kakao`, // 카카오 개발자 콘솔에 등록한 리디렉션 URI
            code: code, // 클라이언트로부터 받은 권한 코드
          },
          headers: {
            "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
          },
        }
      );

      const response = await axios.get("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      });

      // 성공적으로 사용자 정보를 받아옴
      // console.log(response.data);

      // DB 계정 생성 파트
      const { id } = response.data;
      const { email } = response.data.kakao_account;

      const table = User_Table_Info.table;
      const attribute = User_Table_Info.attribute;
      // 오늘 날짜 변환
      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      const day = ("0" + dateObj.getDate()).slice(-2);
      const date = `${year}-${month}-${day}`;

      // DB 계정 생성

      // 1. SELECT USER (row가 있는지 없는지 검사)
      const select_query = `SELECT * FROM ${table} WHERE ${attribute.pKey}='${response.data.id}'`;
      const ebt_data = await fetchUserData(connection_AI, select_query);

      // console.log(ebt_data);

      // 2. INSERT USER (row값이 없는 경우 실행)
      if (!ebt_data[0]) {
        parseUid = id;
        parseEmail = email;
        const insert_query = `INSERT INTO ${table} (${Object.values(
          attribute
        ).join(", ")}) VALUES (${Object.values(attribute)
          .map((el) => "?")
          .join(", ")})`;
        // console.log(insert_query);

        const insert_value = [id, email, null, null, null, "kakao", date, date];
        // console.log(insert_value);

        // 계정 생성 쿼리 임시 주석
        connection_AI.query(
          insert_query,
          insert_value,
          (error, rows, fields) => {
            if (error) console.log(error);
            else console.log("Kakao OAuth User Row DB INSERT Success!");
          }
        );
      } else {
        parseUid = ebt_data[0].uid;
        parseEmail = ebt_data[0].Email;
        // Update LastLoginDate
        const update_query = `UPDATE ${table} SET ${Object.values(attribute)
          .filter((el) => el === "lastLogin_date")
          .map((el) => {
            return `${el} = ?`;
          })
          .join(", ")} WHERE ${attribute.pKey} = ?`;
        // console.log(update_query);

        const update_value = [date, id];
        // console.log(update_value);

        connection_AI.query(
          update_query,
          update_value,
          (error, rows, fields) => {
            if (error) console.log(error);
            else console.log("KaKao OAuth User Data UPDATE Success!");
          }
        );
      }

      // JWT Token 발급 후 세션 저장
      const token = generateToken({
        id: parseUid,
        email: parseEmail,
      });

      // Session 내부에 accessToken 저장
      req.session.accessToken = token.accessToken;
      // browser Cookie에 refreshToken 저장
      res.cookie("refreshToken", token.refreshToken, {
        maxAge: 3600000,
        httpOnly: true,
        sameSite: process.env.DEV_OPS === "local" ? "strict" : "none",
        secure: process.env.DEV_OPS !== "local",
      });

      // Redis에서 기존 세션 ID 확인
      redisStore.get(`user_session:${parseUid}`, (err, oldSessionId) => {
        if (oldSessionId) {
          // 기존 세션 무효화
          redisStore.destroy(`user_session:${parseUid}`, (err, reply) => {
            console.log("Previous session invalidated");
          });
        }
        // 새 세션 ID를 사용자 ID와 연결
        redisStore.set(`user_session:${parseUid}`, sessionId, (err, reply) => {
          // 로그인 처리 로직
          console.log(`[${parseUid}] SessionID Update - ${sessionId}`);
        });
      });
      // 클라이언트에 사용자 정보 응답
      res.json(response.data);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ data: "Server Error!" });
    }
  },
  // AI Guest 로그인 - 인증
  postAILoginHandler: async (req, res) => {
    const { LoginData } = req.body;
    let parseLoginData;
    try {
      // 입력값 파싱
      if (typeof LoginData === "string") {
        parseLoginData = JSON.parse(LoginData);
      } else parseLoginData = LoginData;

      const { pUid, passWard } = parseLoginData;
      const sessionId = req.sessionID;

      let parsepUid = pUid;
      let parsePassWard = passWard;

      // Input 없을 경우
      if (!parsepUid || !parsePassWard) {
        console.log("Non Input Value - 400 Bad Request");
        return res
          .status(400)
          .json({ message: "Non Input Value - 400 Bad Request" });
      }

      console.log(`User Login Access - pUid: ${parsepUid}`);

      /* User DB 조회 */
      // User Table && attribut 명시
      const user_table = User_Table_Info.table;
      const user_attribute = User_Table_Info.attribute;

      // 오늘 날짜 변환
      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      const day = ("0" + dateObj.getDate()).slice(-2);
      const date = `${year}-${month}-${day}`;

      // 1. SELECT TEST (row가 있는지 없는지 검사)
      // User 계정 DB SELECT Method. uid를 입력값으로 받음
      const ebt_data = await user_ai_select(
        user_table,
        user_attribute,
        parsepUid
      );

      // User 계정이 있는 경우 (row값이 있는 경우 실행)
      if (ebt_data[0]) {
        // Password 불일치
        if (ebt_data[0].passWard !== parsePassWard) {
          console.log(
            `Password is incorrect! - 202 Accepted (pUid: ${parsepUid})`
          );
          return res
            .status(202)
            .json({ message: "Password is incorrect! - 202 Accepted" });
        }
        // Password 일치
        else {
          // 최종 로그인 날짜 갱신
          const update_query = `UPDATE ${user_table} SET ${Object.values(
            user_attribute
          )
            .filter((el) => el === "lastLogin_date")
            .map((el) => {
              return `${el} = ?`;
            })
            .join(", ")} WHERE ${user_attribute.pKey} = ?`;
          // console.log(update_query);

          const update_value = [date, parsepUid];
          // console.log(update_value);

          connection_AI.query(
            update_query,
            update_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("User Login Date UPDATE Success!");
            }
          );

          // JWT Token 발급 후 세션 저장
          const token = generateToken({
            id: ebt_data[0].uid,
            email: ebt_data[0].Email,
          });

          // Session 내부에 accessToken 저장
          req.session.accessToken = token.accessToken;
          // browser Cookie에 refreshToken 저장
          res.cookie("refreshToken", token.refreshToken, {
            maxAge: 3600000,
            httpOnly: true,
            sameSite: process.env.DEV_OPS === "local" ? "strict" : "none",
            secure: process.env.DEV_OPS !== "local",
          });

          const expire = String(dateObj.setHours(dateObj.getHours() + 1));

          // Redis에서 기존 세션 ID 확인
          redisStore.get(`user_session:${parsepUid}`, (err, oldSessionId) => {
            if (oldSessionId) {
              // 기존 세션 무효화
              redisStore.destroy(`user_session:${parsepUid}`, (err, reply) => {
                console.log("Previous session invalidated");
              });
            }
            // 새 세션 ID를 사용자 ID와 연결
            redisStore.set(
              `user_session:${parsepUid}`,
              sessionId,
              (err, reply) => {
                // 로그인 처리 로직
                console.log(`[${parsepUid}] SessionID Update - ${sessionId}`);
              }
            );
          });

          console.log(`User Login Success! - 200 OK (pUid: ${parsepUid})`);
          // client 전송
          return res.status(200).json({
            message: "User Login Success! - 200 OK",
            refreshToken: token.refreshToken,
            expire,
          });
        }
      }
      // User 계정이 없는 경우 (row값이 없는 경우 실행)
      else {
        console.log(`Non User - 404 Not Found (pUid: ${parsepUid})`);
        return res.status(404).json({ message: "Non User - 404 Not Found" });
      }
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // AI 로그아웃 - 인증 삭제
  getAILogoutHandler: async (req, res) => {
    console.log("AI Logout API 호출");
    // console.log(req.cookies);
    const refreshToken = req.cookies.refreshToken;
    try {
      // refreshToken 있을 경우 - Redis Sid 삭제
      // refreshToken이 없는 상태에선 반드시 로그인을 해야함.
      // 로그인 시 자동으로 Redis SessionID는 갱신되므로 refreshToken이 있는 경우에만 Redis SessionID를 삭제한다.
      if (refreshToken) {
        const decoded = verifyToken("refresh", refreshToken);
        // Redis SessionID 삭제
        redisStore.get(`user_session:${decoded.id}`, (err, oldSessionId) => {
          if (err) {
            console.error("Error fetching old session ID:", err);
            return; // 에러 발생 시 추가 처리 중지
          }
          if (oldSessionId) {
            console.log("oldSessionId Destroy");
            // 기존 세션 무효화
            redisStore.destroy(`user_session:${decoded.id}`, (err) => {
              if (err) {
                console.error(err);
                return;
              }
              console.log("RedisStore Session ID Delete Success!");
            });
          }
        });
      }

      // 세션 삭제
      req.session.destroy((err) => {
        if (err) console.error("세션 삭제 중 에러 발생", err);
      });
      // 쿠키 삭제
      res.clearCookie("connect.sid", {
        sameSite: process.env.DEV_OPS === "local" ? "strict" : "none",
        secure: process.env.DEV_OPS !== "local",
      });
      res.clearCookie("refreshToken", {
        sameSite: process.env.DEV_OPS === "local" ? "strict" : "none",
        secure: process.env.DEV_OPS !== "local",
      });
      res.status(200).json({ message: "Logout Success! - 200 OK" });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // (Middle Ware) AI JWT 토큰 유효성 검사 - 서비스 이용
  vaildateTokenConsulting: async (req, res, next) => {
    // Session data 조회
    const accessToken = req.session.accessToken;
    const refreshToken = req.cookies.refreshToken;
    const sessionId = req.sessionID;

    // User Table && attribut 명시
    const user_table = User_Table_Info.table;
    const user_attribute = User_Table_Info.attribute;

    try {
      // accessToken이 있는 경우 - accessToken은 세션에 저장된 값이기 때문에 비교적 간단한 검사 진행
      if (accessToken) {
        // accessToken Decoding
        const decoded = verifyToken("access", accessToken);
        if (decoded.id) {
          // Redis 중복 로그인 확인
          redisStore.get(`user_session:${decoded.id}`, (err, prevSid) => {
            // Redis 저장된 sid가 있는 경우
            if (prevSid) {
              // 현재 Sid와 Redis Sid가 다른 경우 - 중복 로그인
              if (prevSid !== sessionId) {
                console.log(
                  `Duplicated Session 401 Unauthorized - ${decoded.id}`
                );
                return res
                  .status(401)
                  .json({ message: "Duplicated Session - 401 Unauthorized" });
              }
              // Sid 일치 - 유효성 검증 통과
              console.log(`AccessToken 유효성 검증 통과! - ${decoded.id}`);
              next();
            }
            // Redis에 저장된 Sid가 없는 경우 - 첫 로그인 OR Redis 자동 삭제
            else {
              console.log("Redis Store prevSid 값이 없음");
              // Redis Sid를 현재 Sid로 갱신
              redisStore.set(
                `user_session:${decoded.id}`,
                sessionId,
                (err, reply) => {
                  // 로그인 처리 로직
                  console.log(`AccessToken SessionID Update - ${sessionId}`);
                }
              );
              next();
            }
          });
        }
        // AccessToken에 id 값이 없는 경우 - 유효한(서버 발급) 토큰이 아닌 경우
        else {
          console.log(`Invaild AccessToken`);
          return res.status(400).json({ message: "Invaild AccessToken - 400" });
        }
      }
      // refreshToken만 있는 경우 - User Table 조회
      else if (refreshToken) {
        // refreshToken 복호화
        const decoded = verifyToken("refresh", refreshToken);
        // User Table 조회
        const ebt_data = await user_ai_select(
          user_table,
          user_attribute,
          decoded.id
        );
        // User가 존재할 경우
        if (ebt_data[0]) {
          // Token 재발행 후 세션에 저장
          req.session.accessToken = generateToken({
            id: ebt_data[0].uid,
            email: ebt_data[0].Email,
          }).accessToken;

          // Redis SessionID Update
          redisStore.set(
            `user_session:${ebt_data[0].uid}`,
            sessionId,
            (err, reply) => {
              // 로그인 처리 로직
              // console.log(`refreshToken SessionID Update - ${sessionId}`);
            }
          );
          console.log(`RefreshToken 유효성 검증 통과! - ${decoded.id}`);
          next();
        }
        // User가 없는 경우 - 해킹 시도
        else {
          console.log(`RefreshToken Non User! 400 - ${decoded.id}`);
          return res
            .status(400)
            .json({ message: "RefreshToken Non User! - 400" });
        }
      }
      // Token 미발급 상태 - 로그인 권장
      else {
        console.log("Login Session Expire! - 401");
        return res.status(401).json({ message: "Login Session Expire! - 401" });
      }
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // (Middle Ware) AI Plan 유효성 검사 - 서비스 이용
  vaildatePlan: async (req, res, next) => {
    const accessToken = req.session.accessToken;
    const refreshToken = req.cookies.refreshToken;

    const user_plan_table = Plan_Table_Info["Plan"].table;
    const user_plan_attribute = Plan_Table_Info["Plan"].attribute;

    let parseUid = "",
      decoded;
    try {
      // 0. Token 값을 통한 uid 조회
      if (accessToken) decoded = verifyToken("access", accessToken);
      else if (refreshToken) decoded = verifyToken("refresh", refreshToken);
      else
        return res.status(401).json({ message: "Login Session Expire! - 401" });

      parseUid = decoded.id;
      const today = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");

      // 1. User Redis expiry 조회
      let userExpiryDate = await redisStore.get(
        `user:expiry:${parseUid}`,
        (err, data) => data
      );
      // console.log("userExpiryDate: " + userExpiryDate);

      // 2. User Redis expiry 값이 있는 경우 - 오늘 날짜와 expiry 값 비교
      if (userExpiryDate) {
        // 2-1. 만료되지 않은 경우 - next();
        if (new Date(userExpiryDate) >= new Date(today)) {
          console.log(`Plan 유효성 검증 통과! - ${parseUid}`);
          next();
        }
        // 2-2. 만료된 경우 - 접근 제한 (만료된 유저)
        else {
          console.log(`Expired User 401 - ${parseUid}`);
          return res.status(401).json({ message: "Expired User - 401" });
        }
      }
      // 3. User Redis expiry 값이 없는 경우
      else {
        // 3-0. User_Plan 테이블에 해당 유저가 있는지 조회
        const user_plan_data = await user_ai_select(
          user_plan_table,
          user_plan_attribute,
          parseUid
        );
        // console.log(user_plan_data[0]);
        // 3-1. User Plan이 있는 경우 - Redis expiry 데이터 갱신 후 만료 여부 판단
        if (user_plan_data[0]) {
          const { expirationDate } = user_plan_data[0];
          // Redis expiry 데이터 갱신
          await redisStore.set(
            `user:expiry:${parseUid}`,
            expirationDate,
            (err, reply) => {
              console.log(`User Plan Redis Update - ${parseUid}`);
            }
          );
          // 만료 여부 판단
          if (new Date(expirationDate) >= new Date(today)) {
            console.log(`Plan 유효성 검증 통과! - ${parseUid}`);
            next();
          } else {
            console.log(`Expired User 401 - ${parseUid}`);
            return res.status(401).json({ message: "Expired User - 401" });
          }
        }
        // 3-2. User Plan이 없는 경우 - 접근 제한 (미결제 유저)
        else {
          console.log(`Unpaid User 401 - ${parseUid}`);
          return res.status(401).json({ message: "Unpaid User - 401" });
        }
      }
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // (App) AI RefreshToken 갱신
  postAIRefreshTokenUpdateHandler: async (req, res) => {
    const { LoginData } = req.body;
    console.log(req.body);
    let parseLoginData;
    try {
      // 입력값 파싱
      if (typeof LoginData === "string") {
        parseLoginData = JSON.parse(LoginData);
      } else parseLoginData = LoginData;

      const { pUid, refreshToken } = parseLoginData;
      const sessionId = req.sessionID;

      let parsepUid = pUid;
      let parseRefreshToken = refreshToken;

      // Input 없을 경우
      if (!parsepUid || !parseRefreshToken) {
        return res
          .status(400)
          .json({ message: "Non Input Value - 400 Bad Request" });
      }
      // refreshToken 복호화
      const decoded = verifyToken("refresh", parseRefreshToken);

      // 유효하지 않은 refreshToken 양식일 경우
      if (!decoded) {
        console.log("Invalid token format - 401 UNAUTHORIZED");
        return res.status(401).json({
          message: "Invalid token format - 401 UNAUTHORIZED",
        });
      }

      // decoded가 null이 아니고, 만료된 RefreshToken 복호화 ID와 입력 ID가 같을 경우
      if (decoded.id === parsepUid) {
        // JWT Token 발급 후 세션 저장
        const token = generateToken({
          id: decoded.id,
          email: decoded.email,
        });

        // Session 내부에 accessToken 저장
        req.session.accessToken = token.accessToken;
        // browser Cookie에 refreshToken 저장
        res.cookie("refreshToken", token.refreshToken, {
          maxAge: 3600000,
          httpOnly: true,
          sameSite: process.env.DEV_OPS === "local" ? "strict" : "none",
          secure: process.env.DEV_OPS !== "local",
        });

        const dateObj = new Date();
        const expire = String(dateObj.setHours(dateObj.getHours() + 1));

        console.log("User RefreshToken Update Success! - 200 OK");

        // Redis에서 기존 세션 ID 확인
        redisStore.get(`user_session:${decoded.id}`, (err, oldSessionId) => {
          if (oldSessionId) {
            // 기존 세션 무효화
            redisStore.destroy(`user_session:${decoded.id}`, (err, reply) => {
              console.log("Previous session invalidated");
            });
          }

          // 새 세션 ID를 사용자 ID와 연결
          redisStore.set(
            `user_session:${parsepUid}`,
            sessionId,
            (err, reply) => {
              // 로그인 처리 로직
              console.log(`SessionID Update - ${sessionId}`);
            }
          );
        });

        // client 전송
        res.status(200).json({
          message: "User RefreshToken Update Success! - 200 OK",
          refreshToken: token.refreshToken,
          expire,
        });
      }
      // 만료된 RefreshToken 복호화 ID와 입력 ID가 다를 경우
      else {
        console.log(
          "Uid Does Not Match RefreshToekn Decoding Payload ID - 404 UNAUTHORIZED"
        );
        // client 전송
        res.status(401).json({
          message:
            "Uid Does Not Match RefreshToekn Decoding Payload ID - 401 UNAUTHORIZED",
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
};

const loginController_Regercy = {
  // 쿠키 유효성 검사
  vaildateCookies: (req, res, next) => {
    const { login } = req.cookies;
    if (login) {
      if (req.cookies.login === "true") {
        res.json("Cookie Login Success");
      }
    } else next();
  },
  // 쿠키 로그인
  CookieLoginHandler: (req, res) => {
    const { id, pwd } = req.body;

    if (users.find((user) => user.id === id && user.pwd === pwd)) {
      // 로그인 성공 시 쿠키 관련 설정 추가. 도메인은 자동으로 현재 서버와 동일하게 적용.
      res.cookie("login", "true", {
        maxAge: 100000, // 쿠키 유효기간
        path: "/", // 서버 라우팅 시 세부 경로
        httpOnly: true, // JS의 쿠키 접근 가능 여부 결정
        secure: true, // sameSite를 none으로 설정하려면 필수
        sameSite: "none", // none으로 설정해야 cross-site 처리가 가능.
      });
      res.json("Login Success");
    } else {
      res.json("Login Fail");
    }
  },
  // 쿠키 로그아웃
  CookieLogoutHandler: (req, res) => {
    res.clearCookie("login", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json("Cookie LogOut Success");
  },
  // 세션 유효성 검사
  vaildateSession: (req, res, next) => {
    if (req.session.sessionId) {
      res.json("Session Login Success");
    } else next();
  },
  // 세션 로그인
  sessionLoginHandler: (req, res) => {
    const { id, pwd } = req.body;
    // console.log(id, pwd);
    if (users.find((user) => user.id === id && user.pwd === pwd)) {
      // 로그인 성공 시 세션 아이디 추가
      req.session.sessionId = id;
      req.session.cookie.maxAge = 10000;
      req.session.save(() => {
        res.json({ data: "Login Success" });
      });
    } else {
      res.json({ data: "Login Fail" });
    }
  },
  // 세션 로그아웃
  sessionLogoutHandler: (req, res) => {
    req.session.destroy();
    res.json("Session LogOut Success");
  },
  // 유저 정보 전달. 모든 학생 정보 출력
  getUserHandler: (req, res) => {
    connection.query(`SELECT * FROM user`, (error, rows, fields) => {
      if (error) console.log(error);

      if (rows.length) {
        const data = rows.map((row) => {
          const { user_name, user_number } = row;
          return { user_name, user_number };
        });
        // 오름차순 정렬
        data.sort((a, b) => {
          if (a.user_name < b.user_name) return -1;
          else if (a.user_name > b.user_name) return 1;
          else return 0;
        });

        res.json({ data });
      } else res.json("NonUser");
    });
  },
  // 조건부 선생 정보 전달
  postUsersHandler: (req, res) => {
    const { vrNum } = req.body;
    console.log("postTeacher Request => vrNum: " + vrNum);
    connection.query(
      `select * from teacher 
      inner join user on teacher.vr_number = user.user_vr_number 
      where teacher.vr_number = '${vrNum}'`,
      (error, rows, fields) => {
        if (error) console.log(error);

        if (rows.length) {
          const data = rows.map((row) => {
            const { user_number, user_name } = row;
            return { user_number, user_name };
          });

          res.json({ data });
        } else res.json("NonUser");
      }
    );
  },
  // 조건부 유저 정보 전달
  postUserHandler: (req, res) => {
    const { user_number } = req.body;
    console.log("postUser Request => user_number: " + user_number);

    connection.query(
      `select * from user where user.user_number = '${user_number}'`,
      (error, rows, fields) => {
        if (error) console.log(error);

        if (rows.length) {
          const data = rows.map((row) => {
            const { user_age } = row;
            return { user_age };
          });

          res.json({ data });
        } else res.json("NonUser");
      }
    );
  },
  // 조건부 선생 정보 전달 (vr_number)
  postTeacherHandler: (req, res) => {
    const { teacher_uid } = req.body;
    console.log("postTeacher Request => teacher_uid: " + teacher_uid);

    connection.query(
      `select * from teacher where teacher.teacher_uid = '${teacher_uid}'`,
      (error, rows, fields) => {
        if (error) console.log(error);

        if (rows.length) {
          const data = rows.map((row) => {
            const { vr_number } = row;
            return { vr_number };
          });
          res.json({ data });
        } else res.json("NonUser");
      }
    );
  },
  // AI 중복 로그인 검사 (Regercy)
  vaildateDupleLogin: (req, res, next) => {
    try {
      const sessionId = req.sessionID;

      // Redis에서 기존 세션 ID 확인
      redisStore.get(`user_session:${userId}`, (err, oldSessionId) => {
        if (oldSessionId) {
          // 기존 세션 무효화
          redisStore.del(`sess:${oldSessionId}`, (err, reply) => {
            console.log("Previous session invalidated");
          });
        }
      });

      next();
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // AI JWT 토큰 유효성 검사 - 로그인 (Regercy)
  vaildateTokenAI: async (req, res, next) => {
    console.log("AI JWT 토큰 유효성 검사 API 호출 /login/ai");
    const { LoginData } = req.body;
    // Session data 조회
    const accessToken = req.session.accessToken;
    const refreshToken = req.cookies.refreshToken;

    let parseLoginData;
    try {
      // 입력값 파싱
      if (typeof LoginData === "string") {
        parseLoginData = JSON.parse(LoginData);
      } else parseLoginData = LoginData;

      const { pUid } = parseLoginData;

      let parsepUid = pUid;

      // accessToken이 있는 경우
      if (accessToken) {
        // accessToken Decoding
        const decoded = verifyToken("access", accessToken);
        // DB 계정과 입력 id가 같을 경우 인가
        if (decoded.id === parsepUid) {
          console.log("accessToken Login Success!");
          return res.status(200).json({ message: "AccessToken Login Success" });
        }
        // refreshToken만 있는 경우
      } else if (refreshToken) {
        // refreshToken Decoding
        const decoded = verifyToken("refresh", refreshToken);
        if (decoded.id === parsepUid) {
          console.log("refreshToken Login Success!");
          // accessToken 재발행 후 세션에 저장
          req.session.accessToken = generateToken({
            id: decoded.id,
            email: decoded.email,
          }).accessToken;
          return res
            .status(200)
            .json({ message: "RefreshToken Login Success" });
        }
      }
      next();
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
};

module.exports = {
  loginController,
  loginController_Regercy,
};
