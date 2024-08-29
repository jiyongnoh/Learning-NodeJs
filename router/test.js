// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
const {
  emotinalBehaviorController,
  personalityController,
  careerController,
  reportController,
} = require("../controller/index");

const { putEmotinalResultHandler, postEmotinalResultHandler } =
  emotinalBehaviorController;
const { putPersonalResultHandler, postPersonalResultHandler } =
  personalityController;
const { putCareerResultHandler, postCareerResultHandler } = careerController;

const { postReportTest } = reportController;

// Emotinal 결과 삽입(PUT)
router.post("/putEmotinalResult", putEmotinalResultHandler);
// Emotinal 결과 확인 (SELETE)
router.post("/postEmotinalResult", postEmotinalResultHandler);

// Personal 결과 삽입(PUT)
router.post("/putPersonalResult", putPersonalResultHandler);
// Personal 결과 확인 (SELETE)
router.post("/postPersonalResult", postPersonalResultHandler);

// Career 결과 삽입(PUT)
router.post("/putCareerResult", putCareerResultHandler);
// Career 결과 확인 (SELETE)
router.post("/postCareerResult", postCareerResultHandler);

router.get("/report", postReportTest);
// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
