// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
const { portOnePaymentController } = require("../controller/portOnePay");

const {
  // postKakaoPayReady,
  // postKakaoPayApprove,
  // postUserExpiration,
  postPortOnePaymentCompleate,
} = portOnePaymentController;

// router.post("/ready", postKakaoPayReady);
// router.post("/approve", postKakaoPayApprove);
// router.post("/expiration", postUserExpiration);
router.post("/compleate", postPortOnePaymentCompleate);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
