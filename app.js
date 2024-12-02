const https = require("https");
const fs = require("fs");

// 환경 변수 불러오기
require("dotenv").config();

// app은 기본 express() 인스턴스 생성.
const express = require("express");
const session = require("express-session");
const compression = require("compression");
const helmet = require("helmet");
// const redisStore = require("./DB/redisClient");

const app = express();
const PORT = 4000;
const PORT_https = 4040;

// 서버와 동일한 url을 브라우저에 입력하면 src 폴더 내부의 html 파일 실행.
const path = require("path");
// app.use(express.static(path.join(__dirname, "src")));

// cors에러 처리. default는 모든 origin에 대해 허용 -> { origin:'*' } 파라미터 생략 가능.
const cors = require("cors");
app.use(
  cors({
    origin: [
      "https://soyeskids.co.kr:4040",
      "https://soyes-ai-project.vercel.app",
      "https://www.soyeskids.store",
      "http://localhost:3000",
      "http://127.0.0.1",
      // "http://d1rq5xi9hzhyrc.cloudfront.net",
      // "http://soyes.chatbot.s3-website.ap-northeast-2.amazonaws.com",
      // "http://soyes.toy.com.s3-website.ap-northeast-2.amazonaws.com",
    ],
    methods: ["GET", "POST", "OPTION", "DELETE"],
    credentials: true,
  })
);

// BodyParser 추가. post, put 요청의 req.body 구문 해석 기능 제공.
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Report 디렉토리 인지
app.use(express.static(path.join(__dirname, ".", "src", "report_final")));

// cookie-parser 추가.
const cookieParser = require("cookie-parser");
app.use(cookieParser("@earthworm"));

// 세션 설정 - Cross-Site 설정 불가능. (secure 이슈)
app.use(
  session({
    // store: redisStore, // redis 서버에 현재 SID가 key:value 형태로 저장됨
    secret: "@earthworm",
    resave: false,
    saveUninitialized: true,
    cookie: {
      // domain: "soyeskids.co.kr",
      httpOnly: true,
      sameSite: process.env.DEV_OPS === "local" ? "strict" : "none",
      secure: process.env.DEV_OPS !== "local",
      // sameSite: "lax", // 또는 "strict", 로컬 개발 환경에 더 적합
      // secure: false, // 로컬 개발 환경에서는 false로 설정
      maxAge: 100000, // sid 쿠키 수명 100초로 설정
    },
  })
);
// 1. Cross-Site 접근을 허용하기 위해선 { sameSite: "none", secure: true } 설정이 필요.
// 2. express-session 미들웨어는 { secure: true }일 경우 https 에서만 작동함.
// 3. 도메인이 localhost일 경우도 예외없이 https에서만 작동함.
// 4. 현재 서버와 클라이언트 모두 http에서 작동함으로 { secure: true }를 설정할 수 없음.
// 5. 그렇기에 1번의 Cross-Site 접근을 허용할 수 없고 { sameSite: "strict" }으로 적용할 수 밖에 없음.
// 6. { sameSite: "strict" }일 경우 Same-Site 접근만 가능.
// 7. 현재 설정을 적용하여 localhost 도메인에서만 session이 작동함.

// 서버 실행 환경 한국 시간으로 설정
const moment = require("moment-timezone");
console.log(new Date().toString());
// 응답 압축
app.use(compression());

// const responseBodyLogger = (req, res, next) => {
//   const oldSend = res.send;
//   res.send = function (data) {
//     console.log(`Response body: ${data}`);
//     oldSend.apply(res, arguments);
//   };
//   next();
// };
// app.use(responseBodyLogger);

// Helmet을 사용하여 Content Security Policy(CSP) 설정
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'"],
//         styleSrc: ["'self'"],
//         imgSrc: ["'self'", "https://drive.google.com"],
//         mediaSrc: [
//           "'self'",
//           "https://drive.google.com",
//           "https://drive.usercontent.google.com",
//         ],
//         connectSrc: ["'self'"],
//         frameSrc: ["'self'", "https://drive.google.com"],
//       },
//     },
//   })
// );
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://drive.google.com"],
      mediaSrc: [
        "'self'",
        "https://drive.google.com",
        "https://drive.googleusercontent.com",
      ],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.get("/", (req, res) => {
  // jenkins 배포용 주석3
  res.status(200).json({ text: "Hello World!" });
});

// Tips, AI 공통
// path 경로 라우팅
const pathRouter = require("./router/path");
app.use("/path", pathRouter);
// error 경로 라우팅
const errorRouter = require("./router/error");
app.use("/error", errorRouter);
// login 경로 라우팅
const loginRouter = require("./router/login");
app.use("/login", loginRouter);
// signup 경로 라우팅
const signupRouter = require("./router/signup");
app.use("/signup", signupRouter);
// directory 경로 라우팅
const directoryRouter = require("./router/directory");
app.use("/directory", directoryRouter);

// Tips
// 채팅 웹소켓 서버 라우팅
const chatRouter = require("./router/chat");
app.use(chatRouter);
// 유니티 채팅 웹소켓 서버 라우팅
const unityChatRouter = require("./router/unityChat");
app.use(unityChatRouter);
// 유니티 채팅 웹소켓 서버 라우팅2
const unityChatRouter2 = require("./router/unityChat2");
app.use(unityChatRouter2);
// 유니티 채팅 웹소켓 서버 라우팅3
const unityChatRouter3 = require("./router/unityChat3");
app.use(unityChatRouter3);
// 유니티 채팅 웹소켓 서버 라우팅4
const unityChatRouter4 = require("./router/unityChat4");
app.use(unityChatRouter4);
// 유니티 채팅 웹소켓 서버 라우팅5
const unityChatRouter5 = require("./router/unityChat5");
app.use(unityChatRouter5);
// test 경로 라우팅
const testRouter = require("./router/test");
app.use("/test", testRouter);
// agoraToken 경로 라우팅
const agoraTokenRouter = require("./router/agoraToken");
app.use("/agoraToken", agoraTokenRouter);

// AI
// openAI 경로 라우팅
const openAIRouter = require("./router/openAI");
app.use("/openAI", openAIRouter);
const reviewRouter = require("./router/review");
app.use("/review", reviewRouter);
const kakaoPayRouter = require("./router/kakaoPay");
app.use("/kakaopay", kakaoPayRouter);

// MailTest 경로 라우팅
// const mailTestRouter = require("./router/mailTest");
// app.use("/mailtest", mailTestRouter);

// 에러 처리는 일반적인 미들웨어 함수와 동일하게 적용 가능하다.
// const { errController } = require("./controller/index");
// app.use(errController.logErrors);
// app.use(errController.clientErrorHandler);
// app.use(errController.univErrorHandler);

// app.listen(PORT, () => console.log(`🚀 HTTP Server is starting on ${PORT}`));

console.log("Soyes 종합 서버 Start");
// https 보안 파일이 있을 경우
if (
  fs.existsSync("/etc/letsencrypt/live/soyeskids.co.kr/fullchain.pem") &&
  fs.existsSync("/etc/letsencrypt/live/soyeskids.co.kr/privkey.pem")
) {
  const httpsOptions = {
    ca: fs.readFileSync("/etc/letsencrypt/live/soyeskids.co.kr/fullchain.pem"),
    key: fs.readFileSync("/etc/letsencrypt/live/soyeskids.co.kr/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/soyeskids.co.kr/cert.pem"),
  };

  https.createServer(httpsOptions, app).listen(PORT_https, () => {
    console.log(`🚀 HTTPs Server is starting on ${PORT_https}`);
  });
}
// https 보안 파일이 없을 경우
else {
  app.listen(PORT, () => console.log(`🚀 HTTP Server is starting on ${PORT}`));
}
