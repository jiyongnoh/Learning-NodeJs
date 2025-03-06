// redis 서버 접속
const redisStore = require("../DB/redisClient");
// MySQL 접근
const mysql = require("mysql");
const { dbconfig_ai } = require("../DB/database");
// // Tips DB 연결
// const connection = mysql.createConnection(dbconfig);
// connection.connect();
// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();

const axios = require("axios");
const moment = require("moment-timezone");

// 포트원 관련
const PortOne = require("@portone/server-sdk");
const portone = PortOne.PortOneClient({ secret: process.env.V2_API_SECRET });

// Database Table Info
const { Plan_Table_Info } = require("../DB/database_table_info");

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
// n일 이후의 날짜를 반환하는 메서드
function addDays(
  days,
  date = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss")
) {
  const result = new Date(date);
  if (process.env.DEV_OPS === "local") result.setHours(result.getHours() + 9);
  result.setDate(result.getDate() + days);
  return result;
}

const items = new Map([
  [
    "shoes",
    {
      name: "신발",
      price: 1000,
      currency: "KRW",
    },
  ],
]);

const paymentStore = new Map();

// 포트원측 결제ID와 요청된 결제ID의 일치여부 판단
async function syncPayment(paymentId) {
  if (!paymentStore.has(paymentId)) {
    paymentStore.set(paymentId, {
      status: "PENDING",
    });
  }
  const payment = paymentStore.get(paymentId);
  let actualPayment;
  try {
    actualPayment = await portone.payment.getPayment({ paymentId });
  } catch (err) {
    delete err.headers;
    console.error(err);
    return false;
  }
  if (actualPayment.status === "PAID") {
    // 인증 아이템 확인
    // if (!verifyPayment(actualPayment)) return false;
    if (payment.status === "PAID") return payment;
    payment.status = "PAID";
    console.info("결제 성공");
  } else {
    return false;
  }
  return payment;
}

// 요청된 아이템이 서버에서 인증된 아이템인지 확인
function verifyPayment(payment) {
  if (payment.customData == null) return false;
  const customData = JSON.parse(payment.customData);
  const item = items.get(customData.item);
  if (item == null) return false;
  return (
    payment.orderName === item.name &&
    payment.amount.total === item.price &&
    payment.currency === item.currency
  );
}

const portOnePaymentController = {
  // KakaoPay Ready
  postKakaoPayReady: async (req, res) => {
    console.log("KakaoPay Ready API 호출");
    const { readyData } = req.body;
    let parseInput;
    try {
      // 파싱. Client JSON 데이터
      if (typeof readyData === "string") {
        parseInput = JSON.parse(readyData);
      } else parseInput = readyData;

      // console.log(parseInput);
      // console.log(process.env.KAKAO_PAY_SERCET_KEY);

      const response = await axios.post(
        `https://open-api.kakaopay.com/online/v1/payment/ready`,
        parseInput,
        {
          headers: {
            Authorization: `SECRET_KEY ${process.env.KAKAO_PAY_SERCET_KEY}`,
            "Content-Type": "application/json",
          },
          // withCredentials: true,
        }
      );
      // console.log(response.data);
      req.session.tid = response.data.tid; // 세션에 tid 저장
      return res.json({ data: response.data });
    } catch (err) {
      console.error(err.response.data);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // KakaoPay Approve
  postKakaoPayApprove: async (req, res) => {
    console.log("KakaoPay Approve API 호출");
    const { approveData } = req.body;
    let parseInput, parsepUid;
    try {
      // 파싱. Client JSON 데이터
      if (typeof approveData === "string") {
        parseInput = JSON.parse(approveData);
      } else parseInput = approveData;

      parsepUid = parseInput.partner_user_id;
      // console.log(parseInput);

      // 카카오페이 결제 요청
      const response = await axios.post(
        `https://open-api.kakaopay.com/online/v1/payment/approve`,
        { ...parseInput, tid: req.session.tid },
        {
          headers: {
            Authorization: `SECRET_KEY ${process.env.KAKAO_PAY_SERCET_KEY}`,
            "Content-Type": "application/json",
          },
          // withCredentials: true,
        }
      );

      delete req.session.tid; // 세션 tid 삭제
      // console.log(response.data);
      const { tid, partner_order_id, payment_method_type, amount } =
        response.data;

      // 카카오페이 결제 성공 - DB 만료일 갱신
      if (response.status === 200) {
        console.log(`KakaoPay Approve Success! - ${parsepUid}`);
        res.status(200).json({ message: "KakaoPay Approve Success!" });

        // Plan Info DB에서 partner_order_id를 통한 결제 정보 가져오기
        const plan_info_table = Plan_Table_Info["Info"].table;
        const plan_info_attribute = Plan_Table_Info["Info"].attribute;

        const plan_info_select_query = `SELECT * FROM ${plan_info_table} WHERE ${plan_info_attribute.pKey}=${partner_order_id}`;
        const plan_info_select_data = await fetchUserData(
          connection_AI,
          plan_info_select_query
        );

        // console.log(plan_info_select_data[0]);

        // 현재 결제한 partner_order_id 플랜의 이용권 기간
        const { plan_period } = plan_info_select_data[0];

        /* User Plan DB 처리 */
        // 1. SELECT (User가 있는지 없는지 검사)
        const plan_table = Plan_Table_Info["Plan"].table;
        const plan_attribute = Plan_Table_Info["Plan"].attribute;

        const plan_select_query = `SELECT * FROM ${plan_table} WHERE ${plan_attribute.pKey}='${parsepUid}'`;
        const plan_select_data = await fetchUserData(
          connection_AI,
          plan_select_query
        );

        // 2. UPDATE (User가 있는 경우)
        if (plan_select_data[0]) {
          // expirationDate === User 만료일
          const { expirationDate } = plan_select_data[0];
          const today = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
          let update_expirationDate_value = "";

          // User 만료일이 지난 경우
          if (new Date(expirationDate) < new Date(today)) {
            // 오늘 날짜에서 플랜 기간을 더한 날짜를 갱신 만료일로 설정
            update_expirationDate_value = addDays(plan_period)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");
          }
          // User 만료일이 지나지 않은 경우
          else {
            // 만료일에서 플랜 기간을 더한 날짜를 갱신 만료일로 설정
            update_expirationDate_value = addDays(plan_period, expirationDate)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");
          }

          console.log(
            "update_expirationDate_value: " + update_expirationDate_value
          );

          // User Plan DB에 update_expirationDate_value 만료일 갱신
          const update_query = `UPDATE ${plan_table} SET ${Object.values(
            plan_attribute
          )
            .filter((el) => el !== "uid")
            .map((el) => `${el} = ?`)
            .join(", ")} WHERE ${plan_attribute.pKey} = ?`;
          // console.log(update_query);

          const update_value = [
            update_expirationDate_value,
            "Active", // Active, Expired
            parsepUid,
          ];
          // console.log(update_value);

          connection_AI.query(
            update_query,
            update_value,
            async (error, rows, fields) => {
              if (error) console.log(error);
              else {
                // const key = `user:expiry:${parsepUid}`;
                // Redis expiry 갱신
                await redisStore.set(
                  `user:expiry:${parsepUid}`,
                  update_expirationDate_value,
                  (err, reply) => {
                    // 로그인 처리 로직
                    console.log(`User Plan Redis Update - ${parsepUid}`);
                  }
                );
                console.log("User Plan DB UPDATE Success!");
              }
            }
          );
        }
        // 3. INSERT (User가 없는 경우 실행)
        else {
          // 결제한 적이 없는 User - 오늘 날짜에서 플랜 기간을 더한 날짜를 갱신 만료일로 설정
          let insert_expirationDate_value = addDays(plan_period)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

          console.log(
            "insert_expirationDate_value: " + insert_expirationDate_value
          );

          // User Plan DB에 insert_expirationDate_value 만료일 추가
          const insert_query = `INSERT INTO ${plan_table} (${Object.values(
            plan_attribute
          ).join(", ")}) VALUES (${Object.values(plan_attribute)
            .map(() => "?")
            .join(", ")})`;
          // console.log(insert_query);

          const insert_value = [
            parsepUid,
            insert_expirationDate_value,
            "Active",
          ];
          // console.log(insert_value);

          connection_AI.query(
            insert_query,
            insert_value,
            async (error, rows, fields) => {
              if (error) console.log(error);
              else {
                // Redis expiry 갱신
                await redisStore.set(
                  `user:expiry:${parsepUid}`,
                  insert_expirationDate_value,
                  (err, reply) => {
                    // 로그인 처리 로직
                    console.log(`User Plan Redis Insert - ${parsepUid}`);
                  }
                );
                console.log("User Plan DB INSERT Success!");
              }
            }
          );
        }

        /* Plan Log DB Insert */
        const plan_log_table = Plan_Table_Info["Log"].table;
        const plan_log_attribute = Plan_Table_Info["Log"].attribute;

        // Consult_Log DB 저장
        const plan_log_insert_query = `INSERT INTO ${plan_log_table} (${Object.values(
          plan_log_attribute
        ).join(", ")}) VALUES (${Object.values(plan_log_attribute)
          .map((el) => "?")
          .join(", ")})`;
        // console.log(plan_log_insert_query);

        const plan_log_insert_value = [
          parsepUid,
          Number(partner_order_id),
          `kakao-${payment_method_type}`,
          tid,
          amount.total,
          amount.tax_free,
        ];
        // console.log(plan_log_insert_value);

        connection_AI.query(
          plan_log_insert_query,
          plan_log_insert_value,
          (err) => {
            if (err) console.log("Err sqlMessage: " + err.sqlMessage);
            else console.log("Plan_Log DB Insert Success!");
          }
        );

        // return res.status(200).json({ message: "Payment Sussess! - 200" });
      }
      // 카카오페이 결제 실패
      // return res.status(404).json({ message: "Payment Fail! - 404" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" + err.message });
    }
  },
  // User Expiration Select
  postUserExpiration: async (req, res) => {
    console.log("UserExpiration API 호출");
    const { data } = req.body;
    let parseInput, parsepUid;
    try {
      // 파싱. Client JSON 데이터
      if (typeof data === "string") {
        parseInput = JSON.parse(data);
      } else parseInput = data;

      const { pUid } = parseInput;
      parsepUid = pUid;

      /* User Plan DB 처리 */
      // 1. SELECT (User가 있는지 없는지 검사)
      const plan_table = Plan_Table_Info["Plan"].table;
      const plan_attribute = Plan_Table_Info["Plan"].attribute;

      const plan_select_query = `SELECT ${plan_attribute.attr1} FROM ${plan_table} WHERE ${plan_attribute.pKey}='${parsepUid}'`;
      const plan_select_data = await fetchUserData(
        connection_AI,
        plan_select_query
      );

      // console.log(plan_select_data[0].expirationDate);
      return res
        .status(200)
        .json({ expirationDate: plan_select_data[0].expirationDate });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" + err.message });
    }
  },
  // PortOne Payment Compleate
  postPortOnePaymentCompleate: async (req, res, next) => {
    console.log("PortOne Payment Compleate API 호출");
    let parseData;
    try {
      const { data } = req.body;
      // 파싱. Client JSON 데이터
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      console.log(parseData);

      const { paymentId } = parseData;

      if (typeof paymentId !== "string")
        return res.status(400).send("올바르지 않은 요청입니다.").end();

      const payment = await syncPayment(paymentId);
      if (!payment) return res.status(400).send("결제 동기화에 실패했습니다.");

      // DB 수정 테이블 추가

      return res.status(200).json({
        status: payment.status,
      });
    } catch (err) {
      delete err.headers;
      console.error(err);
      return res.status(500).json({
        message: `Server Error : ${err.message}`,
      });
    }
  },
  // PortOne Payment Webhook
  postPortOnePaymentWebhook: async (req, res, next) => {
    try {
      let webhook;
      try {
        webhook = await PortOne.Webhook.verify(
          process.env.V2_WEBHOOK_SECRET,
          req.body,
          req.headers
        );
      } catch (e) {
        if (e instanceof PortOne.Webhook.WebhookVerificationError)
          return res.status(400).end();
        throw e;
      }
      if ("data" in webhook && "paymentId" in webhook.data)
        await syncPayment(webhook.data.paymentId);
      return res.status(200).end();
    } catch (e) {
      next(e);
    }
  },
};

module.exports = {
  portOnePaymentController,
};
