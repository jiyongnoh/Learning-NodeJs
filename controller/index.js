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

// MySQL 접근
// const mysql = require("mysql");
// const { dbconfig } = require("../DB/database");
// const connection = mysql.createConnection(dbconfig);
// connection.connect();
// connection.end(); // 언제쓰지?

const { users } = require("../DB/database");

const { generateToken, verifyToken } = require("../controller/tokenFnc");
const loginController = {
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

    if (users.find((user) => user.id === id && user.pwd === pwd)) {
      // 로그인 성공 시 세션 아이디 추가
      req.session.sessionId = id;
      req.session.cookie.maxAge = 10000;
      req.session.save(() => {
        res.json("Login Success");
      });
    } else {
      res.json("Login Fail");
    }
  },
  // 세션 로그아웃
  sessionLogoutHandler: (req, res) => {
    req.session.destroy();
    res.json("Session LogOut Success");
  },
  // 토큰 유효성 검사
  vaildateToken: (req, res, next) => {
    const accessToken = req.session.accessToken;
    const refreshToken = req.cookies.refreshToken;
    // accessToken이 있는 경우
    if (accessToken) {
      const decoded = verifyToken("access", accessToken);
      if (users.find((user) => user.id === decoded.id)) {
        res.json("AccessToken Login Success");
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
        res.json("RefreshToken Login Success");
      }
    } else next();
  },
  // 토큰 로그인
  tokenLoginHandler: (req, res) => {
    const { id, pwd } = req.body;

    // MySQL DB 연동
    // connection.query(
    //   `SELECT * FROM member WHERE (member_id = '${id}' AND member_password = '${pwd}')`,
    //   (error, rows, fields) => {
    //     if (error) throw error;
    //     // rows : 배열 형식으로 저장된 행 데이터
    //     // fields: 열(속성) 데이터

    //     // rows는 테이블의 데이터를 배열 형식 저장
    //     // 즉, 배열 메서드를 통해 접근 가능
    //     // 아래는 테이블 데이터의 member_name에 접근
    //     console.log(rows.filter((el) => el.member_id === id)[0].member_phone);

    //     if (rows.length) {
    //       // 토큰을 활용한 쿠키, 세션
    //       // const token = generateToken({ id, email: `${id}@naver.com` });
    //       // // accessToken 세션에 추가
    //       // req.session.accessToken = token.accessToken;
    //       // // refreshToken 쿠키에 추가
    //       // res.cookie("refreshToken", token.refreshToken, {
    //       //   path: "/", // 서버 라우팅 시 세부 경로
    //       //   httpOnly: true, // JS의 쿠키 접근 가능 여부 결정
    //       //   secure: true, // sameSite를 none으로 설정하려면 필수
    //       //   sameSite: "none", // none으로 설정해야 cross-site 처리가 `가능.
    //       // });
    //       // req.session.save(() => {
    //       //   res.json("Login Success");
    //       // });

    //       res.json("Login Success");
    //     } else res.json("Login Fail");
    //   }
    // );

    if (users.find((el) => el.id === id && el.pwd === pwd)) {
      res.json("Login Success");
    } else res.json("Login Fail");
  },
  // 토큰 로그아웃
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
};

module.exports = {
  pathController,
  errController,
  loginController,
};
