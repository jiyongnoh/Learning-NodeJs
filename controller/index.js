// MySQL 접근
const mysql = require("mysql");
const { dbconfig, dbconfig_ai } = require("../DB/database");
// Tips DB 연결
const connection = mysql.createConnection(dbconfig);
connection.connect();

// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();

const puppeteer = require("puppeteer");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const PORT = 4000;
const PORT_https = 4040;

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

const reportController = {
  postReportTest_ejs1: async (req, res) => {
    console.log("Test Report API 호출!");
    try {
      // const { scores, interpretations, recipientEmail } = req.body;

      const templatePath = path.join(__dirname, "..", "src", "reportTest2.ejs");
      const htmlContent = await ejs.renderFile(templatePath, {
        reportDate: "2024-09-06",
        name: "노지용",
        age: "51",
        gender: "남",
      });

      // const browser = await puppeteer.launch();
      const browser = await puppeteer.launch({
        headless: true, // 백그라운드 모드로 실행
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // 샌드박스 모드 비활성화
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });
      await browser.close();

      let myMailAddr = process.env.ADDR_MAIL; // 보내는 사람 메일 주소
      let myMailPwd = process.env.ADDR_PWD; // 구글 계정 2단계 인증 비밀번호

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: myMailAddr,
          pass: myMailPwd,
        },
      });

      const mailOptions = {
        from: "soyesnjy@gmail.com",
        to: "soyesnjy@gmail.com",
        subject: "Your Psychology Test Results",
        text: "Please find attached your psychology test results.",
        attachments: [
          {
            filename: "Soyes_Report_Test.pdf",
            content: pdfBuffer,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "PDF sent successfully to " });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Failed to process the request" });
    }
  },
  postReportTest_ejs2: async (req, res) => {
    console.log("Test Report API 호출!");
    try {
      // 데이터 설정
      const data = {
        reportDate: "2024-09-06",
        name: "노지용",
        age: "51",
        gender: "남",
      };

      // 변환할 EJS 파일들의 경로를 배열로 설정
      const ejsFiles = [
        "1.ejs",
        "2.ejs",
        "3.ejs",
        // "reportTest4.ejs",
        // "reportTest5.ejs",
        // "reportTest6.ejs",
        // "reportTest7.ejs",
        // "reportTest8.ejs",
      ];

      // 모든 EJS 파일을 HTML로 렌더링하고 결합
      let combinedHtmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Arial', sans-serif; }
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body>
      `;

      for (const file of ejsFiles) {
        const templatePath = path.join(
          __dirname,
          "..",
          "src",
          "report_final",
          file
        );
        const htmlContent = await ejs.renderFile(templatePath, data);
        combinedHtmlContent += `
          <div class="content-section">
            ${htmlContent}
          </div>
          <div class="page-break"></div>
        `;
      }

      // HTML 닫기 태그 추가
      combinedHtmlContent += `
          </body>
        </html>
      `;

      // Puppeteer 브라우저 실행
      const browser = await puppeteer.launch({
        headless: true, // 백그라운드 모드로 실행
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // 샌드박스 모드 비활성화
      });

      const page = await browser.newPage();

      // 결합된 HTML 콘텐츠를 페이지에 설정
      await page.setContent(combinedHtmlContent, { waitUntil: "networkidle0" });

      // PDF 생성
      const pdfBuffer = await page.pdf({ format: "A4" });

      await browser.close();

      // 이메일 전송 설정
      let myMailAddr = process.env.ADDR_MAIL; // 보내는 사람 메일 주소
      let myMailPwd = process.env.ADDR_PWD; // 구글 계정 2단계 인증 비밀번호

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: myMailAddr,
          pass: myMailPwd,
        },
      });

      const mailOptions = {
        from: "soyesnjy@gmail.com",
        to: "soyesnjy@gmail.com",
        subject: "Your Psychology Test Results",
        text: "Please find attached your psychology test results.",
        attachments: [
          {
            filename: "Soyes_Report_Test.pdf",
            content: pdfBuffer,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "PDF sent successfully" });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Failed to process the request" });
    }
  },
  postReportTest_a: async (req, res) => {
    console.log("Test Report API 호출!");
    try {
      // 데이터 설정
      const dataValue = {
        reportDate: "2024-09-06",
        name: "노지용",
        age: "51",
        gender: "남",
      };

      const dataValue2 = {
        moodData: [1, 1, 1, 1, 1],
        friendData: [2, 2, 2, 2, 2],
        familyData: [3, 3, 3, 3, 3],
        schoolData: [4, 4, 4, 4, 4],
      };

      const dataValue3 = {
        ebtTscores: [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80],
        schoolAnalysis: "학교생활 분석 내용",
        friendAnalysis: "친구관계 분석 내용",
        familyAnalysis: "가족관계 분석 내용",
      };

      // HTML 파일 경로 설정
      const templatePath = path.join(
        __dirname,
        "..",
        "src",
        "report_final",
        "2.html"
      );

      // HTML 파일 읽기
      const htmlContent = await new Promise((resolve, reject) => {
        fs.readFile(templatePath, "utf8", (err, data) => {
          if (err) {
            return reject(err);
          }

          // 보고서 1페이지 데이터 처리
          // let renderedHtml = data
          //   .replace("{{reportDate}}", dataValue.reportDate)
          //   .replace("{{name}}", dataValue.name)
          //   .replace("{{age}}", dataValue.age)
          //   .replace("{{gender}}", dataValue.gender);

          // 보고서 2페이지 데이터 처리
          let renderedHtml = data
            .replace("{{moodData}}", JSON.stringify(dataValue2.moodData))
            .replace("{{friendData}}", JSON.stringify(dataValue2.friendData))
            .replace("{{familyData}}", JSON.stringify(dataValue2.familyData))
            .replace("{{schoolData}}", JSON.stringify(dataValue2.schoolData));

          // 보고서 3페이지 데이터 처리
          // let renderedHtml = data
          //   .replace(
          //     "{{ebtTscores}}",
          //     JSON.stringify(JSON.stringify(dataValue3.ebtTscores))
          //   )
          //   .replace(
          //     "{{schoolAnalysis}}",
          //     JSON.stringify(dataValue3.schoolAnalysis)
          //   )
          //   .replace(
          //     "{{friendAnalysis}}",
          //     JSON.stringify(dataValue3.friendAnalysis)
          //   )
          //   .replace(
          //     "{{familyAnalysis}}",
          //     JSON.stringify(dataValue3.familyAnalysis)
          //   );

          resolve(renderedHtml);
        });
      });

      // Puppeteer 브라우저 실행
      const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // HTML을 페이지에 설정하고 스타일 로드 대기
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      // PDF 생성
      const pdfBuffer = await page.pdf({ format: "A4" });

      // await browser.close();

      // 이메일 전송 설정
      let myMailAddr = process.env.ADDR_MAIL; // 보내는 사람 메일 주소
      let myMailPwd = process.env.ADDR_PWD; // 구글 계정 2단계 인증 비밀번호

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: myMailAddr,
          pass: myMailPwd,
        },
      });

      const mailOptions = {
        from: "soyesnjy@gmail.com",
        to: "soyesnjy@gmail.com",
        subject: "Your Psychology Test Results",
        text: "Please find attached your psychology test results.",
        attachments: [
          {
            filename: "Soyes_Report_Test.pdf",
            content: pdfBuffer,
          },
        ],
      };

      // await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "PDF sent successfully" });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Failed to process the request" });
    }
  },
  postReportTest_b: async (req, res) => {
    try {
      // 데이터 설정
      const dataValue = {
        reportDate: "2024-09-06",
        name: "노지용",
        age: "51",
        gender: "남",
        moodData: [1, 2, 3, 4, 5],
        friendData: [1, 2, 3, 4, 5],
        familyData: [1, 2, 3, 4, 5],
        schoolData: [1, 2, 3, 4, 5],
      };

      // HTML 파일 경로 설정
      const templateFileName = "2.html";
      const templateUrl = `http://localhost:${PORT}/${templateFileName}`;

      // Puppeteer 브라우저 실행
      const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // 3. HTML 파일을 URL로 로드하여 렌더링
      await page.goto(templateUrl, { waitUntil: "networkidle0" });

      // 4. 데이터 삽입을 위한 JavaScript 코드 실행
      await page.evaluate((dataValue) => {
        // document.body.innerHTML = document.body.innerHTML;
        // .replace("{{reportDate}}", dataValue.reportDate)
        // .replace("{{name}}", dataValue.name)
        // .replace("{{age}}", dataValue.age)
        // .replace("{{gender}}", dataValue.gender)

        initializeMoodChart(dataValue.moodData);
        initializeFriendChart(dataValue.friendData);
        initializeFamilyChart(dataValue.familyData);
        initializeSchoolChart(dataValue.schoolData);
      }, dataValue);

      // 5. PDF 생성
      const pdfBuffer = await page.pdf({ format: "A4" });

      // await browser.close();

      // 이메일 전송 설정
      let myMailAddr = process.env.ADDR_MAIL; // 보내는 사람 메일 주소
      let myMailPwd = process.env.ADDR_PWD; // 구글 계정 2단계 인증 비밀번호

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: myMailAddr,
          pass: myMailPwd,
        },
      });

      const mailOptions = {
        from: "soyesnjy@gmail.com",
        to: "soyesnjy@gmail.com",
        subject: "Your Psychology Test Results",
        text: "Please find attached your psychology test results.",
        attachments: [
          {
            filename: "Soyes_Report_Test.pdf",
            content: pdfBuffer,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: "PDF sent successfully" });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Failed to process the request" });
    }
  },
  postReportTest: async (req, res) => {
    console.log("Test Report API 호출!");
    // const { scores, interpretations, recipientEmail } = req.body;
    try {
      const templatePath = path.join(
        __dirname,
        "..",
        "src",
        "report_final",
        "2.ejs"
      );

      const htmlContent = await ejs.renderFile(templatePath, {
        reportDate: "2024-09-06",
        name: "노지용",
        age: "51",
        gender: "남",
        moodData: JSON.stringify([1, 2, 3, 4, 5]),
        friendData: JSON.stringify([1, 2, 3, 4, 5]),
        familyData: JSON.stringify([1, 2, 3, 4, 5]),
        schoolData: JSON.stringify([1, 2, 3, 4, 5]),
      });

      const browser = await puppeteer.launch({
        headless: false, // 백그라운드 모드로 실행
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // 샌드박스 모드 비활성화
      });

      const page = await browser.newPage();

      // await page.emulateMediaType("screen");

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      // 차트나 동적 콘텐츠가 완전히 렌더링될 시간을 확보
      // await new Promise((resolve) => setTimeout(resolve, 1000));

      const pdfBuffer = await page.pdf({ format: "A4" });
      // await browser.close();

      let myMailAddr = process.env.ADDR_MAIL; // 보내는 사람 메일 주소
      let myMailPwd = process.env.ADDR_PWD; // 구글 계정 2단계 인증 비밀번호

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: myMailAddr,
          pass: myMailPwd,
        },
      });

      const mailOptions = {
        from: "soyesnjy@gmail.com",
        to: "soyesnjy@gmail.com",
        subject: "Your Psychology Test Results",
        text: "Please find attached your psychology test results.",
        attachments: [
          {
            filename: "Soyes_Report_Test.pdf",
            content: pdfBuffer,
          },
        ],
      };

      // await transporter.sendMail(mailOptions);

      return res.status(200).json({ message: "PDF sent successfully to " });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Failed to process the request" });
    }
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
  reportController,
};
