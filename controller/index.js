// MySQL 접근
const mysql = require("mysql");
const { dbconfig, dbconfig_ai } = require("../DB/database");
// Tips DB 연결
const connection = mysql.createConnection(dbconfig);
connection.connect();
// AI DB 연결
// const connection_AI = mysql.createConnection(dbconfig_ai);
// connection_AI.connect();
// connection.end(); // 언제쓰지?

// const { generateToken, verifyToken } = require("../lib/tokenFnc");
// const { users } = require("../DB/database");

// google OAuth2Client 설정
// const { OAuth2Client } = require("google-auth-library");
// const oAuth2Client = new OAuth2Client(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   process.env.REDIRECT_URL
// );
// const { google } = require("googleapis");

// kakao OAuth 관련
// const axios = require("axios");

// const User_Table_Info = {
//   table: "soyes_ai_User",
//   attribute: {
//     pKey: "uid",
//     attr1: "Email",
//     attr2: "passWard",
//     attr3: "name",
//     attr4: "phoneNumber",
//     attr5: "oauth_type",
//     attr6: "creation_date",
//     attr7: "lastLogin_date",
//   },
// };

// const loginController = {
//   // 쿠키 유효성 검사
//   vaildateCookies: (req, res, next) => {
//     const { login } = req.cookies;
//     if (login) {
//       if (req.cookies.login === "true") {
//         res.json("Cookie Login Success");
//       }
//     } else next();
//   },
//   // 쿠키 로그인
//   CookieLoginHandler: (req, res) => {
//     const { id, pwd } = req.body;

//     if (users.find((user) => user.id === id && user.pwd === pwd)) {
//       // 로그인 성공 시 쿠키 관련 설정 추가. 도메인은 자동으로 현재 서버와 동일하게 적용.
//       res.cookie("login", "true", {
//         maxAge: 100000, // 쿠키 유효기간
//         path: "/", // 서버 라우팅 시 세부 경로
//         httpOnly: true, // JS의 쿠키 접근 가능 여부 결정
//         secure: true, // sameSite를 none으로 설정하려면 필수
//         sameSite: "none", // none으로 설정해야 cross-site 처리가 가능.
//       });
//       res.json("Login Success");
//     } else {
//       res.json("Login Fail");
//     }
//   },
//   // 쿠키 로그아웃
//   CookieLogoutHandler: (req, res) => {
//     res.clearCookie("login", {
//       httpOnly: true,
//       secure: true,
//       sameSite: "none",
//     });
//     res.json("Cookie LogOut Success");
//   },
//   // 세션 유효성 검사
//   vaildateSession: (req, res, next) => {
//     if (req.session.sessionId) {
//       res.json("Session Login Success");
//     } else next();
//   },
//   // 세션 로그인
//   sessionLoginHandler: (req, res) => {
//     const { id, pwd } = req.body;
//     // console.log(id, pwd);
//     if (users.find((user) => user.id === id && user.pwd === pwd)) {
//       // 로그인 성공 시 세션 아이디 추가
//       req.session.sessionId = id;
//       req.session.cookie.maxAge = 10000;
//       req.session.save(() => {
//         res.json({ data: "Login Success" });
//       });
//     } else {
//       res.json({ data: "Login Fail" });
//     }
//   },
//   // 세션 로그아웃
//   sessionLogoutHandler: (req, res) => {
//     req.session.destroy();
//     res.json("Session LogOut Success");
//   },
//   // 토큰 유효성 검사
//   vaildateToken: (req, res, next) => {
//     const accessToken = req.session.accessToken;
//     const refreshToken = req.cookies.refreshToken;
//     // accessToken이 있는 경우
//     if (accessToken) {
//       const decoded = verifyToken("access", accessToken);
//       if (users.find((user) => user.id === decoded.id)) {
//         res.json("AccessToken Login Success");
//       }
//       // refreshToken만 있는 경우
//     } else if (refreshToken) {
//       const decoded = verifyToken("refresh", refreshToken);
//       if (users.find((user) => user.id === decoded.id)) {
//         // accessToken 생성 후 세션에 저장
//         req.session.accessToken = generateToken({
//           id: decoded.id,
//           email: `${decoded.id}@naver.com`,
//         }).accessToken;
//         res.json("RefreshToken Login Success");
//       }
//     } else next();
//   },
//   // 토큰 로그인
//   tokenLoginHandler: (req, res) => {
//     const { id, pwd } = req.body;
//     console.log(id, pwd);
//     // MySQL DB 연동
//     connection.query(
//       `SELECT * FROM teacher WHERE (teacher_uid = '${id}' AND teacher_pwd = '${pwd}')`,
//       (error, rows, fields) => {
//         if (error) console.log(error);
//         // rows : 배열 형식으로 저장된 행 데이터
//         // fields: 열(속성) 데이터

//         // rows는 테이블의 데이터를 배열 형식 저장
//         // 즉, 배열 메서드를 통해 접근 가능
//         // 아래는 테이블 데이터의 member_name에 접근
//         // console.log(rows.filter((el) => el.member_id === id)[0].member_phone);

//         if (rows.length) {
//           // 토큰을 활용한 쿠키, 세션
//           // const token = generateToken({ id, email: `${id}@naver.com` });
//           // // accessToken 세션에 추가
//           // req.session.accessToken = token.accessToken;
//           // // refreshToken 쿠키에 추가
//           // res.cookie("refreshToken", token.refreshToken, {
//           //   path: "/", // 서버 라우팅 시 세부 경로
//           //   httpOnly: true, // JS의 쿠키 접근 가능 여부 결정
//           //   secure: true, // sameSite를 none으로 설정하려면 필수
//           //   sameSite: "none", // none으로 설정해야 cross-site 처리가 `가능.
//           // });
//           // req.session.save(() => {
//           //   res.json("Login Success");
//           // });
//           res.json({ data: "Login Success" });
//         } else res.json({ data: "Login fail" });
//       }
//     );

//     // DB없이 서버 내장 데이터 사용
//     // if (users.find((el) => el.id === id && el.pwd === pwd)) {
//     //   res.json("Login Success");
//     // } else res.json("Login Fail");
//   },
//   // 토큰 로그아웃
//   tokenLogoutHandler: (req, res) => {
//     // // 세션 삭제
//     // req.session.destroy();

//     // // 쿠키 삭제
//     // res.clearCookie("refreshToken", {
//     //   httpOnly: true,
//     //   secure: true,
//     //   sameSite: "none",
//     // });

//     res.json("Token LogOut Success");
//   },
//   // OAuth URL 발급
//   oauthUrlHandler: (req, res) => {
//     const { oauthType } = req.body;
//     console.log("OAuth URL 발급 API 호출");
//     console.log("type: " + oauthType);

//     // SCOPE 설정. 유저 정보를 어디까지 가져올지 결정
//     const scopeMap = {
//       google: [
//         "https://www.googleapis.com/auth/userinfo.profile", // 기본 프로필
//         "https://www.googleapis.com/auth/userinfo.email", // 이메일
//       ],

//       // 다른 플랫폼의 OAuth 추가 대비
//       kakao: ["https://www.kakaoapis.com/auth/userinfo.profile"],
//       default: [
//         "https://www.googleapis.com/auth/userinfo.profile",
//         "https://www.googleapis.com/auth/userinfo.email",
//       ],
//     };

//     try {
//       if (!oauthType) {
//         res.json({ data: "" });
//         return;
//       }
//       const SCOPES = [...scopeMap[oauthType]];

//       const authUrl = oAuth2Client.generateAuthUrl({
//         access_type: "offline", // 필요한 경우
//         scope: SCOPES,
//       });

//       // console.log(authUrl);

//       res.json({ data: authUrl });
//     } catch (err) {
//       console.error(err);
//       res.json({ data: "Non " });
//     }
//   },
//   // Google OAuth AccessToken 발급
//   oauthGoogleAccessTokenHandler: async (req, res) => {
//     const { code } = req.body;
//     console.log("Google OAuth AccessToken 발급 API 호출");

//     try {
//       oAuth2Client.getToken(code, (err, token) => {
//         if (err) return console.error("Error retrieving access token", err);
//         oAuth2Client.setCredentials(token);

//         // 액세스 토큰을 사용하여 API를 호출할 수 있습니다.
//         const oauth2 = google.oauth2({
//           auth: oAuth2Client,
//           version: "v2",
//         });

//         // 유저 정보 GET
//         oauth2.userinfo.get(async (err, response) => {
//           if (err) return console.error(err);
//           // console.log(response.data);

//           const { id, email } = response.data;

//           const table = User_Table_Info.table;
//           const attribute = User_Table_Info.attribute;
//           // 오늘 날짜 변환
//           const dateObj = new Date();
//           const year = dateObj.getFullYear();
//           const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
//           const day = ("0" + dateObj.getDate()).slice(-2);
//           const date = `${year}-${month}-${day}`;

//           // DB 계정 생성 코드 추가 예정
//           // 동기식 DB 접근 함수 1. Promise 생성 함수
//           function queryAsync(connection, query, parameters) {
//             return new Promise((resolve, reject) => {
//               connection.query(query, parameters, (error, results, fields) => {
//                 if (error) {
//                   reject(error);
//                 } else {
//                   resolve(results);
//                 }
//               });
//             });
//           }
//           // 프로미스 resolve 반환값 사용. (User Data return)
//           async function fetchUserData(connection, query) {
//             try {
//               let results = await queryAsync(connection, query, []);
//               // console.log(results[0]);
//               return results;
//             } catch (error) {
//               console.error(error);
//             }
//           }

//           // 1. SELECT USER (row가 있는지 없는지 검사)
//           const select_query = `SELECT * FROM ${table} WHERE ${attribute.pKey}='${response.data.id}'`;
//           const ebt_data = await fetchUserData(connection_AI, select_query);

//           // 2. INSERT USER (row값이 없는 경우 실행)
//           if (!ebt_data[0]) {
//             const insert_query = `INSERT INTO ${table} (${Object.values(
//               attribute
//             ).join(", ")}) VALUES (${Object.values(attribute)
//               .map((el) => "?")
//               .join(", ")})`;
//             // console.log(insert_query);

//             const insert_value = [
//               id,
//               email,
//               null,
//               null,
//               null,
//               "google",
//               date,
//               date,
//             ];
//             // console.log(insert_value);

//             // 계정 생성 쿼리 임시 주석
//             connection_AI.query(
//               insert_query,
//               insert_value,
//               (error, rows, fields) => {
//                 if (error) console.log(error);
//                 else console.log("OAuth User Row DB INSERT Success!");
//               }
//             );
//           } else {
//             // Update LastLoginDate
//             try {
//               const update_query = `UPDATE ${table} SET ${Object.values(
//                 attribute
//               )
//                 .filter((el) => el === "lastLogin_date")
//                 .map((el) => {
//                   return `${el} = ?`;
//                 })
//                 .join(", ")} WHERE ${attribute.pKey} = ?`;
//               // console.log(update_query);

//               const update_value = [date, id];
//               // console.log(update_value);

//               connection_AI.query(update_query, update_value, () => {
//                 console.log("Google OAuth User Data UPDATE Success!");
//               });
//             } catch (err) {
//               console.log("Google OAuth User Data UPDATE Fail!");
//               console.log(err);
//             }
//           }

//           res.json({ data: response.data });
//         });
//       });
//     } catch (err) {
//       console.error(err);
//       res.json({ data: "Fail" });
//     }
//   },
//   // Kakao OAuth AccessToken 발급
//   oauthKakaoAccessTokenHandler: async (req, res) => {
//     const { code } = req.body;
//     console.log("Kakao OAuth AccessToken 발급 API 호출");
//     // 현재 카카오 소셜 로그인은 사업자등록을 해두지 않았기에 닉네임 정보만 가져올 수 있습니다.
//     try {
//       // POST 요청으로 액세스 토큰 요청
//       const tokenResponse = await axios.post(
//         "https://kauth.kakao.com/oauth/token",
//         null,
//         {
//           params: {
//             grant_type: "authorization_code",
//             client_id: process.env.KAKAO_REST_API_KEY, // 카카오 개발자 콘솔에서 발급받은 REST API 키
//             redirect_uri: `${process.env.REDIRECT_URL}?type=kakao`, // 카카오 개발자 콘솔에 등록한 리디렉션 URI
//             code: code, // 클라이언트로부터 받은 권한 코드
//           },
//           headers: {
//             "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
//           },
//         }
//       );

//       const response = await axios.get("https://kapi.kakao.com/v2/user/me", {
//         headers: {
//           Authorization: `Bearer ${tokenResponse.data.access_token}`,
//           "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
//         },
//       });

//       // 성공적으로 사용자 정보를 받아옴
//       // console.log(response.data);

//       // DB 계정 생성 파트
//       const { id } = response.data;
//       const { email } = response.data.kakao_account;

//       const table = User_Table_Info.table;
//       const attribute = User_Table_Info.attribute;
//       // 오늘 날짜 변환
//       const dateObj = new Date();
//       const year = dateObj.getFullYear();
//       const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
//       const day = ("0" + dateObj.getDate()).slice(-2);
//       const date = `${year}-${month}-${day}`;

//       // DB 계정 생성 코드 추가 예정
//       // 동기식 DB 접근 함수 1. Promise 생성 함수
//       function queryAsync(connection, query, parameters) {
//         return new Promise((resolve, reject) => {
//           connection.query(query, parameters, (error, results, fields) => {
//             if (error) {
//               reject(error);
//             } else {
//               resolve(results);
//             }
//           });
//         });
//       }
//       // 프로미스 resolve 반환값 사용. (User Data return)
//       async function fetchUserData(connection, query) {
//         try {
//           let results = await queryAsync(connection, query, []);
//           // console.log(results[0]);
//           return results;
//         } catch (error) {
//           console.error(error);
//         }
//       }

//       // 1. SELECT USER (row가 있는지 없는지 검사)
//       const select_query = `SELECT * FROM ${table} WHERE ${attribute.pKey}='${response.data.id}'`;
//       const ebt_data = await fetchUserData(connection_AI, select_query);

//       // 2. INSERT USER (row값이 없는 경우 실행)
//       if (!ebt_data[0]) {
//         const insert_query = `INSERT INTO ${table} (${Object.values(
//           attribute
//         ).join(", ")}) VALUES (${Object.values(attribute)
//           .map((el) => "?")
//           .join(", ")})`;
//         // console.log(insert_query);

//         const insert_value = [id, email, null, null, null, "kakao", date, date];
//         // console.log(insert_value);

//         // 계정 생성 쿼리 임시 주석
//         connection_AI.query(
//           insert_query,
//           insert_value,
//           (error, rows, fields) => {
//             if (error) console.log(error);
//             else console.log("Kakao OAuth User Row DB INSERT Success!");
//           }
//         );
//       } else {
//         // Update LastLoginDate
//         try {
//           const update_query = `UPDATE ${table} SET ${Object.values(attribute)
//             .filter((el) => el === "lastLogin_date")
//             .map((el) => {
//               return `${el} = ?`;
//             })
//             .join(", ")} WHERE ${attribute.pKey} = ?`;
//           // console.log(update_query);

//           const update_value = [date, id];
//           // console.log(update_value);

//           connection_AI.query(update_query, update_value, () => {
//             console.log("KaKao OAuth User Data UPDATE Success!");
//           });
//         } catch (err) {
//           console.log("KaKao OAuth User Data UPDATE Fail!");
//           console.log(err);
//         }
//       }

//       // 클라이언트에 사용자 정보 응답
//       res.json({ data: response.data });
//     } catch (err) {
//       console.error(err);
//       res.json({ data: "Fail" });
//     }
//   },
//   // 유저 정보 전달. 모든 학생 정보 출력
//   getUserHandler: (req, res) => {
//     connection.query(`SELECT * FROM user`, (error, rows, fields) => {
//       if (error) console.log(error);

//       if (rows.length) {
//         const data = rows.map((row) => {
//           const { user_name, user_number } = row;
//           return { user_name, user_number };
//         });
//         // 오름차순 정렬
//         data.sort((a, b) => {
//           if (a.user_name < b.user_name) return -1;
//           else if (a.user_name > b.user_name) return 1;
//           else return 0;
//         });

//         res.json({ data });
//       } else res.json("NonUser");
//     });
//   },
//   // 조건부 선생 정보 전달
//   postUsersHandler: (req, res) => {
//     const { vrNum } = req.body;
//     console.log("postTeacher Request => vrNum: " + vrNum);
//     connection.query(
//       `select * from teacher
//       inner join user on teacher.vr_number = user.user_vr_number
//       where teacher.vr_number = '${vrNum}'`,
//       (error, rows, fields) => {
//         if (error) console.log(error);

//         if (rows.length) {
//           const data = rows.map((row) => {
//             const { user_number, user_name } = row;
//             return { user_number, user_name };
//           });

//           res.json({ data });
//         } else res.json("NonUser");
//       }
//     );
//   },
//   // 조건부 유저 정보 전달
//   postUserHandler: (req, res) => {
//     const { user_number } = req.body;
//     console.log("postUser Request => user_number: " + user_number);

//     connection.query(
//       `select * from user where user.user_number = '${user_number}'`,
//       (error, rows, fields) => {
//         if (error) console.log(error);

//         if (rows.length) {
//           const data = rows.map((row) => {
//             const { user_age } = row;
//             return { user_age };
//           });

//           res.json({ data });
//         } else res.json("NonUser");
//       }
//     );
//   },
//   // 조건부 선생 정보 전달 (vr_number)
//   postTeacherHandler: (req, res) => {
//     const { teacher_uid } = req.body;
//     console.log("postTeacher Request => teacher_uid: " + teacher_uid);

//     connection.query(
//       `select * from teacher where teacher.teacher_uid = '${teacher_uid}'`,
//       (error, rows, fields) => {
//         if (error) console.log(error);

//         if (rows.length) {
//           const data = rows.map((row) => {
//             const { vr_number } = row;
//             return { vr_number };
//           });
//           res.json({ data });
//         } else res.json("NonUser");
//       }
//     );
//   },
// };

// const signupController = {
//   dupleCheckHandler: (req, res) => {
//     const { id, vrNum, type } = req.body;

//     // MySQL DB 연동
//     if (type === "id") {
//       connection.query(
//         `SELECT * FROM teacher WHERE (teacher_uid = '${id}')`,
//         (error, rows, fields) => {
//           if (error) console.log(error);
//           if (rows.length) {
//             res.json({ data: "Fail" });
//           } else res.json({ data: "Success" });
//         }
//       );
//     } else {
//       connection.query(
//         `SELECT * FROM teacher WHERE (vr_number = '${vrNum}')`,
//         (error, rows, fields) => {
//           if (error) console.log(error);
//           if (rows.length) {
//             res.json({ data: "Fail" });
//           } else res.json({ data: "Success" });
//         }
//       );
//     }
//   },
//   signupHandler: (req, res) => {
//     const { id, pwd, name, age, email, vrNum } = req.body;
//     // 서버측 2중 보안
//     if (!id || !pwd || !vrNum) res.json({ data: "Fail" });
//     // MySQL DB 연동
//     connection.query(
//       `INSERT INTO teacher VALUES ('${vrNum}', '${id}', '${pwd}')`,
//       (error) => {
//         if (error) {
//           console.log(error);
//           res.json({ data: "Fail" });
//         } else res.json({ data: "Success" });
//       }
//     );
//   },
// };

const pathController = {
  default: (req, res) => {
    res.send("path1 default access");
  },
  first: (req, res) => {
    res.send("path1 first access");
  },
  second: (req, res) => {
    res.send("path1 second access");
  },
  // parameter 사용법
  params: (req, res) => {
    const p = req.params;
    // { key(:변수명): value(요청 입력값) }
    res.send(p);
  },
  // query 사용법
  query: (req, res) => {
    const q = req.query;
    // { key:value, key2:value2 }
    res.send(q);
  },
  post: (req, res) => {
    const b = req.body;
    res.send(b);
  },
  // 동물 울음소리 반환 메서드
  sound: (req, res) => {
    const { name } = req.params;
    // name 값에 따라 반환값 분기
    switch (name) {
      case "cat": {
        res.json({ sound: "야옹" });
        break;
      }
      case "dog": {
        res.json({ sound: "멍멍" });
        break;
      }
      default:
        res.json({ sound: "동물이 아닙니다" });
    }
  },
};

const errController = {
  logErrors: (err, req, res, next) => {
    console.error(err.stack);
    // next(err)은 오류 처리 핸들러를 제외한 나머지 모든 핸들러를 건너뛴다.
    // 단, next('route')는 예외.
    next(err);
  },
  clientErrorHandler: (err, req, res, next) => {
    // req.xhr: 요청이 ajax 호출로 시작되었다면 true를 반환.
    if (req.xhr) {
      res.status(500).send({ error: "Something failed!" });
    } else {
      next(err);
    }
  },
  univErrorHandler: (err, req, res, next) => {
    res.status(500);
    res.render("error", { error: err });
  },
  // controller 콜백함수를 받아 try,catch 문으로 next(err)를 실행하는 함수를 반환하는 메서드
  nextErrHandler: (controller) => (req, res, next) => {
    try {
      controller(req, res, next);
    } catch (err) {
      next(err); // 모든 라우터를 건너뛰고 오류 처리 함수로 이동
    }
  },
  // 에러 메세지 반환 메서드
  errMessageHandler: (err, req, res, next) => {
    res.status(400).json(err.message); // 발생된 에러 메세지 반환
  },
};

// 검사 관련 핸들러
const emotinalBehaviorController = {
  putEmotinalResultHandler: (req, res) => {
    const {
      uid,
      gradeType,
      levelResult,
      typeSchoolMaladjustment,
      typePeerRelationshipProblems,
      typeFamilyRelations,
      typeOverallMood,
      typeAnxious,
      typeDepressed,
      typePhysicalSymptoms,
      typeAttention,
      typeHyperactivity,
      typeAngerAggression,
      typeSelfAwareness,
    } = req.body;
    // 해당 uid의 검사 결과가 있는지 확인
    connection.query(
      `select * from emotinalBehavior where uid = '${uid}'`,
      (error, rows, fields) => {
        if (error) console.log(error);
        // 결과가 있는 경우 Update
        if (rows.length) {
          const updateData = {
            gradeType,
            lastDate: new Date().toISOString().slice(0, 19).replace("T", " "),
            levelResult,
            typeSchoolMaladjustment,
            typePeerRelationshipProblems,
            typeFamilyRelations,
            typeOverallMood,
            typeAnxious,
            typeDepressed,
            typePhysicalSymptoms,
            typeAttention,
            typeHyperactivity,
            typeAngerAggression,
            typeSelfAwareness,
          };
          const keys = Object.keys(updateData);

          connection.query(
            `UPDATE emotinalBehavior SET ${keys
              .map((key) => {
                return `${key}='${updateData[key]}'`;
              })
              .join(", ")} WHERE uid='${uid}'`,
            (error) => {
              if (error) console.log(error);
              else res.json({ data: "Success" });
            }
          );
        }
        // 결과가 없는 경우 Insert
        else {
          const insertData = [
            uid,
            gradeType,
            new Date().toISOString().slice(0, 19).replace("T", " "),
            levelResult,
            typeSchoolMaladjustment,
            typePeerRelationshipProblems,
            typeFamilyRelations,
            typeOverallMood,
            typeAnxious,
            typeDepressed,
            typePhysicalSymptoms,
            typeAttention,
            typeHyperactivity,
            typeAngerAggression,
            typeSelfAwareness,
          ];
          connection.query(
            `INSERT INTO emotinalBehavior VALUES (${insertData
              .map((value) => `'${value}'`)
              .join(", ")})`,
            (error) => {
              if (error) console.log(error);
              else res.json({ data: "Success" });
            }
          );
        }
      }
    );
  },
  postEmotinalResultHandler: (req, res) => {
    const { uid } = req.body;

    connection.query(
      `select * from emotinalBehavior where uid = '${uid}'`,
      (error, rows, fields) => {
        if (error) console.log(error);

        if (rows.length) {
          const data = rows.map((row) => row);
          res.json({ data });
        } else res.json("NonUser");
      }
    );
  },
};

const personalityController = {
  putPersonalResultHandler: (req, res) => {
    const {
      uid,
      gradeType,
      tendencyCP,
      tendencyER,
      tendencyOF,
      tendencySI,
      indexSI,
      indexCP,
      indexER,
      indexOF,
    } = req.body;

    // 해당 uid의 검사 결과가 있는지 확인
    connection.query(
      `select * from personality where uid = '${uid}'`,
      (error, rows, fields) => {
        if (error) console.log(error);
        // 결과가 있는 경우 Update
        if (rows.length) {
          const updateData = {
            uid,
            gradeType,
            tendencyCP,
            tendencyER,
            tendencyOF,
            tendencySI,
            lastDate: new Date().toISOString().slice(0, 19).replace("T", " "),
            indexSI,
            indexCP,
            indexER,
            indexOF,
          };
          const keys = Object.keys(updateData);

          connection.query(
            `UPDATE personality SET ${keys
              .map((key) => {
                return `${key}='${updateData[key]}'`;
              })
              .join(", ")} WHERE uid='${uid}'`,
            (error) => {
              if (error) console.log(error);
              else res.json({ data: "Success" });
            }
          );
        }
        // 결과가 없는 경우 Insert
        else {
          const insertData = [
            uid,
            gradeType,
            tendencyCP,
            tendencyER,
            tendencyOF,
            tendencySI,
            new Date().toISOString().slice(0, 19).replace("T", " "),
            indexSI,
            indexCP,
            indexER,
            indexOF,
          ];
          connection.query(
            `INSERT INTO personality VALUES (${insertData
              .map((value) => `'${value}'`)
              .join(", ")})`,
            (error) => {
              if (error) console.log(error);
              else res.json({ data: "Success" });
            }
          );
        }
      }
    );
  },
  postPersonalResultHandler: (req, res) => {
    const { uid } = req.body;

    connection.query(
      `select * from personality where uid = '${uid}'`,
      (error, rows, fields) => {
        if (error) console.log(error);

        if (rows.length) {
          const data = rows.map((row) => row);
          // 유형 합치기
          const tendencyType =
            data[0].tendencySI +
            data[0].tendencyOF +
            data[0].tendencyCP +
            data[0].tendencyER;

          // 합친 유형 삽입
          data[0].tendencyType = tendencyType;

          res.json({ data });
        } else res.json("NonUser");
      }
    );
  },
};

const careerController = {
  putCareerResultHandler: (req, res) => {
    const {
      uid,
      gradeType,
      interest1st,
      interest2nd,
      interest3rd,
      lastDate,
      typeA,
      typeC,
      typeE,
      typeI,
      typeR,
      typeS,
    } = req.body;

    // 해당 uid의 검사 결과가 있는지 확인
    connection.query(
      `select * from career where uid = '${uid}'`,
      (error, rows, fields) => {
        if (error) console.log(error);
        // 결과가 있는 경우 Update
        if (rows.length) {
          const updateData = {
            uid,
            gradeType,
            interest1st,
            interest2nd,
            interest3rd,
            lastDate: new Date().toISOString().slice(0, 19).replace("T", " "),
            typeA,
            typeC,
            typeE,
            typeI,
            typeR,
            typeS,
          };
          const keys = Object.keys(updateData);

          connection.query(
            `UPDATE career SET ${keys
              .map((key) => {
                return `${key}='${updateData[key]}'`;
              })
              .join(", ")} WHERE uid='${uid}'`,
            (error) => {
              if (error) console.log(error);
              else res.json({ data: "Success" });
            }
          );
        }
        // 결과가 없는 경우 Insert
        else {
          const insertData = [
            uid,
            gradeType,
            interest1st,
            interest2nd,
            interest3rd,
            new Date().toISOString().slice(0, 19).replace("T", " "),
            typeA,
            typeC,
            typeE,
            typeI,
            typeR,
            typeS,
          ];
          connection.query(
            `INSERT INTO career VALUES (${insertData
              .map((value) => `'${value}'`)
              .join(", ")})`,
            (error) => {
              if (error) console.log(error);
              else res.json({ data: "Success" });
            }
          );
        }
      }
    );
  },
  postCareerResultHandler: (req, res) => {
    const { uid } = req.body;

    connection.query(
      `select * from career where uid = '${uid}'`,
      (error, rows, fields) => {
        if (error) console.log(error);

        if (rows.length) {
          const data = rows.map((row) => row);
          res.json({ data });
        } else res.json("NonUser");
      }
    );
  },
};

// agora token 관련 핸들러
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const agoraTokenController = {
  agoraTokenHandler: (req, res) => {
    const { uid, channelName } = req.body;
    // 고정 상담방 채널명
    const chNameArr = ["Room1", "Room2", "Room3", "Room4", "Room5"];

    console.log("uid: " + uid);
    console.log("channelName: " + channelName);

    // channelName은 5개 고정. 없는 채널명이 들어올 경우 non channel 반환
    if (chNameArr.indexOf(channelName) === -1)
      return res.status(500).json({ error: "Non Channel_Name" });

    connection.query(
      `SELECT * FROM consulting_channel WHERE channelName = '${channelName}'`,
      (error, rows, fields) => {
        if (error) {
          console.log(error);
          return res.status(400).json({ error: "channel is required" });
        }
        // 채널에 맞는 토큰이 있고 만료시간이 지나지 않은 경우
        if (
          rows[0].token &&
          Math.floor(Date.now() / 1000) < rows[0].expireTime
        ) {
          return res.json({ token: rows[0].token });
        }
        // 채널에 맞는 토큰이 없거나 만료시간이 지난 경우
        else {
          // 토큰 생성 후 DB에 저장하고 토큰 값 반환
          const APP_ID = "c7389fb8096e4187b4e7abef5cb9e6e2";
          const APP_CERTIFICATE = "b0f0e0a1646b415ca1eaaa7625800c63";

          const role = RtcRole.PUBLISHER;
          let expireTime = 3600 * 23;

          res.header("Access-Control-Allow-Origin", "*");
          res.header(
            "Cache-Control",
            "private",
            "no-cache",
            "no-store",
            "must-revalidate"
          );
          res.header("Pragma", "no-cache");
          res.header("Expires", "-1");

          // 채널 이름이 없으면 return. 즉, 서버 개발자가 DB에 채널 이름을 따로 넣어주아야함
          if (!channelName)
            return res.status(500).json({ error: "channel is required" });

          expireTime = parseInt(expireTime, 10);
          const currentTime = Math.floor(Date.now() / 1000);
          const privllegeExpireTime = currentTime + expireTime;

          const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privllegeExpireTime
          );
          console.log("ExpireTime: " + privllegeExpireTime);
          console.log("token: " + token);
          // DB에 삽입
          connection.query(
            `UPDATE consulting_channel SET token = '${token}', expireTime = '${privllegeExpireTime}' WHERE channelName = '${channelName}'`,
            (error) => {
              if (error) {
                console.log(error);
                return res.json({ data: "Fail" });
              } else return res.json({ token });
            }
          );
        }
      }
    );
  },
};

// jenkins 테스트용 주석

module.exports = {
  pathController,
  errController,
  // loginController,
  // signupController,
  emotinalBehaviorController,
  personalityController,
  careerController,
  agoraTokenController,
};
