// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
// const { openAIController } = require("../controller/index");
const {
  openAIController,
  ellaMoodController,
  // openAIController_Regercy, // 레거시 코드
} = require("../controller/openAI");

const { loginController } = require("../controller/login");

const {
  postOpenAIEmotionAnalyze,
  postOpenAIPsychologicalAnalysis,
  postOpenAIConsultingPupu,
  postOpenAIConsultingUbi,
  postOpenAIConsultingSoyes,
  postOpenAIMypageCalendarData,
  postOpenAIMypageData,
  postClovaVoiceTTS,
  postOpenAIPernalTestAnalysis,
  getClearCookies,
  postOpenAIConsultingLogSave,
  postOpenAIUserEBTResultData,
  getYoutubeContent,
  postOpenAIConsultSolutionData,
  postOpenAIGoogleDriveUpload,
  postOpenAIAnalysisImg,
} = openAIController;

// 엘라 Mood 훈련 Controler
const {
  postOpenAIEllaMoodTraning,
  postOpenAIMoodDataSave,
  postOpenAIMoodDataLoad,
} = ellaMoodController;

// 토큰 유효성 검사 미들웨어
const { vaildateTokenConsulting, vaildatePlan } = loginController;

router.get("/", (req, res) => {
  res.send("Welcome to the GPT API");
});

// 감정 분석
router.post("/emotion", postOpenAIEmotionAnalyze);
// EBT 결과 분석
router.post("/analysis", postOpenAIPsychologicalAnalysis);
// PT 결과 분석
router.post("/analysis_pt", postOpenAIPernalTestAnalysis);

// 공감친구 모델 - 푸푸
router.post(
  "/consulting_emotion_pupu",
  // vaildateTokenConsulting,
  // vaildatePlan,
  postOpenAIConsultingPupu
);
// 공부친구 모델 - 우비
router.post("/consulting_emotion_ubi", postOpenAIConsultingUbi);

// (Regercy) 정서멘토 모델 - 엘라
// router.post("/consulting_emotion_lala", postOpenAIConsultingLala);

// 전문상담사 모델 - 소예
router.post("/consulting_emotion_soyes", postOpenAIConsultingSoyes);
// 상담 내역 저장
router.post("/consulting_emotion_log", postOpenAIConsultingLogSave);

// 기분훈련 모델 - 엘라
router.post("/training_mood_ella", postOpenAIEllaMoodTraning);
// 기분훈련 데이터 Save
router.post("/training_mood_ella/save", postOpenAIMoodDataSave);
// 기분훈련 데이터 Load
router.post("/training_mood_ella/load", postOpenAIMoodDataLoad);

// 달력 데이터 반환
router.post("/calendar", postOpenAIMypageCalendarData);
// 마이페이지 데이터 반환
router.post("/mypage", postOpenAIMypageData);
// User EBT 데이터 반환
router.post("/ebtresult", postOpenAIUserEBTResultData);
// 상담 solution 반환
router.post("/solution", postOpenAIConsultSolutionData);

// Clova Voice Data 반환
router.post("/tts", postClovaVoiceTTS);
// Youtube Video 반환
router.get("/youtube/:id", getYoutubeContent);
// 쿠키 삭제
router.get("/clear_cookies", getClearCookies);
// 이미지 업로드 (Google Drive)
router.post("/upload", postOpenAIGoogleDriveUpload);
// AI 이미지 분석
router.post("/analysis_img", postOpenAIAnalysisImg);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
