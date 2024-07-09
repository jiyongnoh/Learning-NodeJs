// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
// const { loginController } = require("../controller/index");
const {
  loginController,
  loginController_Regercy,
} = require("../controller/login");

const {
  // 토큰
  vaildateToken,
  tokenLoginHandler,
  tokenLogoutHandler,
  // OAuth
  oauthUrlHandler,
  oauthKakaoUrlHandler,
  oauthGoogleAccessTokenHandler,
  oauthKakaoAccessTokenHandler,
  // AI 일반 로그인
  postAILoginHandler,
  getAILogoutHandler,
  postAIRefreshTokenUpdateHandler,
} = loginController;

const {
  // 쿠키
  vaildateCookies,
  CookieLoginHandler,
  CookieLogoutHandler,
  // 세션
  vaildateSession,
  sessionLoginHandler,
  sessionLogoutHandler,
  // 유저 정보
  getUserHandler,
  postUsersHandler,
  postUserHandler,
  postTeacherHandler,
} = loginController_Regercy;

// 쿠키
// router.post("/", vaildateCookies, CookieLoginHandler);
// router.get("/logout", CookieLogoutHandler);

// 세션
router.post("/", vaildateSession, sessionLoginHandler);
router.get("/logout", sessionLogoutHandler);

// 토큰
// router.post("/", tokenLoginHandler);
// router.get("/logout", tokenLogoutHandler);

// 유저 정보 반환
router.get("/getUser", getUserHandler);
// 조건부 선생 정보 반환
router.post("/postUsers", postUsersHandler);
// 조건부 유저 정보 반환
router.post("/postUser", postUserHandler);
// 조건부 선생 정보 반환
router.post("/postTeacher");

// AI 일반 로그인
router.post("/ai", postAILoginHandler);
// AI 일반 로그아웃
router.get("/ai/logout", getAILogoutHandler);
// AI RefreshToken 갱신
router.post("/ai/updatetoken", postAIRefreshTokenUpdateHandler);
// OAuth_url 발급
router.get("/oauth_url", oauthUrlHandler);
// Kakao OAuth_url 발급
router.get("/oauth_url/kakao", oauthKakaoUrlHandler);
// Google OAuth AccessToken 발급
router.post("/oauth_token/google", oauthGoogleAccessTokenHandler);
// Kakao OAuth AccessToken 발급
router.post("/oauth_token/kakao", oauthKakaoAccessTokenHandler);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
