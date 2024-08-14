// stream 데이터 처리
const stream = require("stream");
// MySQL 접근
const mysql = require("mysql");
const { dbconfig_ai } = require("../DB/database");

// Redis 연결
// const redisStore = require("../DB/redisClient");

// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();

const axios = require("axios");

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.API_TOKEN,
});

const nodemailer = require("nodemailer");
// 구글 권한 관련
const { google } = require("googleapis");

// GCP IAM 서비스 계정 인증
const serviceAccount = {
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  project_id: process.env.GOOGLE_PROJECT_ID,
};

const auth_youtube = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/youtube.force-ssl"],
});

const auth_google_drive = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const youtube = google.youtube({
  version: "v3",
  auth: auth_youtube,
});

const drive = google.drive({ version: "v3", auth: auth_google_drive });

// google drive 파일 전체 조회 메서드
async function listFiles() {
  try {
    const res = await drive.files.list({
      pageSize: 10,
      fields: "nextPageToken, files(id, name)",
    });

    const files = res.data.files;
    if (files.length) {
      console.log("Files:");
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log("No files found.");
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
}
// listFiles();

// google drive 파일 전체 삭제 메서드
async function deleteAllFiles() {
  try {
    // 파일 목록 가져오기
    const res = await drive.files.list({
      pageSize: 1000, // 한 번에 최대 1000개의 파일 가져오기
      fields: "files(id, name)",
    });

    const files = res.data.files;
    if (files.length === 0) {
      console.log("No files found.");
      return;
    }

    // 파일 삭제
    for (const file of files) {
      try {
        await drive.files.delete({ fileId: file.id });
        console.log(`Deleted file: ${file.name} (${file.id})`);
      } catch (error) {
        console.error(
          `Failed to delete file: ${file.name} (${file.id})`,
          error.message
        );
      }
    }

    console.log("All files deleted successfully.");
  } catch (error) {
    console.error("An error occurred while deleting files:", error.message);
  }
}
// deleteAllFiles();

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

// 심리 검사 관련
const {
  persnal_short, // 성격검사 짧은 결과
  persnal_long, // 성격검사 양육 코칭 결과
  ebt_School_Result,
  // ebt_Friend_Result,
  // ebt_Family_Result,
  // ebt_Mood_Result,
  // ebt_Unrest_Result,
  // ebt_Sad_Result,
  // ebt_Health_Result,
  // ebt_Attention_Result,
  // ebt_Movement_Result,
  // ebt_Angry_Result,
  // ebt_Self_Result,
  ebt_Analysis,
} = require("../DB/psy_test");

const {
  base_pupu,
  base_soyes,
  base_lala,
  base_pupu_v2,
} = require("../DB/base_prompt");

// 프롬프트 관련
const {
  persona_prompt_pupu,
  persona_prompt_lala,
  persona_prompt_ubi,
  persona_prompt_soyes,
  adler_prompt,
  gestalt_prompt,
  info_prompt,
  prevChat_prompt,
  solution_prompt,
  solution_prompt2,
  psyResult_prompt,
  common_prompt,
  sentence_division_prompt,
  completions_emotion_prompt,
  test_prompt_20240304,
  test_prompt_20240304_v2,
  test_prompt_20240305_v1,
  no_req_prompt,
  persnal_result_prompt,
  ebt_analysis_prompt,
  ebt_analysis_prompt_v2,
  ebt_analysis_prompt_v3,
  ebt_analysis_prompt_v4,
  ebt_analysis_prompt_v5,
  ebt_analysis_prompt_v6,
  ebt_analysis_prompt_v7,
  pt_analysis_prompt,
  test_prompt_20240402,
  persona_prompt_lala_v2,
  persona_prompt_lala_v3,
  persona_prompt_lala_v4,
  persona_prompt_lala_v5,
  solution_matching_persona_prompt,
  persona_prompt_pupu_v2,
  persona_prompt_pupu_v3,
  persona_prompt_pupu_v4,
} = require("../DB/test_prompt");

// 인지행동 검사 관련
const {
  cb_test_friend,
  cb_test_family,
  cb_test_school,
  cb_test_remain,
} = require("../DB/cognitive_behavior_test");

// 텍스트 감지 관련
const {
  test_result_ment,
  cb_solution_ment,
} = require("../DB/detect_ment_Array");

const {
  cognitive_prompt,
  diary_prompt,
  balance_prompt,
} = require("../DB/solution_prompt");

// Database Table Info
const {
  User_Table_Info,
  EBT_Table_Info,
  PT_Table_Info,
  Consult_Table_Info,
  Ella_Training_Table_Info,
} = require("../DB/database_table_info");

// User 정서행동 2점문항 반환 (String)
const select_soyes_AI_Ebt_Table = async (
  user_table,
  user_attr,
  ebt_Question,
  parsepUid
) => {
  try {
    // console.log(user_table);
    const select_query = `SELECT * FROM ${user_table} WHERE ${user_attr.pKey}='${parsepUid}'`; // Select Query
    const ebt_school_data = await fetchUserData(connection_AI, select_query);
    // console.log(ebt_school_data[0]);
    // ebt_school_data[0]
    //   ? console.log(`${parsepUid} 계정은 존재합니다`)
    //   : console.log(`${parsepUid} 계정은 없습니다`);
    // delete ebt_school_data[0].uid; // uid 속성 삭제
    // Attribute의 값이 2인 요소의 배열 필터링. select 값이 없으면

    const problem_attr_arr = ebt_school_data[0]
      ? Object.keys(ebt_school_data[0])
      : [];

    const problem_attr_nameArr = problem_attr_arr.filter(
      // 속성명이 question을 가지고있고, 해당 속성의 값이 2인 경우 filtering
      (el) => el.includes("question") && ebt_school_data[0][el] === 2
    );
    // console.log(problem_attr_nameArr);

    // 문답 개수에 따른 시나리오 문답 투척
    // Attribute의 값이 2인 요소가 없는 경우
    return problem_attr_nameArr.length === 0
      ? { testResult: "", ebt_school_data }
      : {
          testResult: problem_attr_nameArr
            .map((el) => ebt_Question[el])
            .join("\n"),
          ebt_school_data,
        };
  } catch (err) {
    console.log(err);
    return { testResult: "", ebt_school_data: {} };
  }
};
// TODO# New EBT Table 갱신 후 변경 예정
const select_soyes_AI_Ebt_Result = async (inputTable, parsepUid) => {
  // 동기식 DB 접근 함수 1. Promise 생성 함수
  try {
    const {
      table, // 조회할 EBT table (11개 Class)
      attribute, // table Attribute
      danger_score, // 위험 판단 점수
      caution_score,
      average,
      standard,
    } = inputTable;

    const select_query = `SELECT * FROM ${table} WHERE ${attribute.pKey}='${parsepUid}'`; // Select Query
    const ebt_data = await fetchUserData(connection_AI, select_query);
    // console.log(ebt_data[0]);

    // 검사를 진행하지 않은 경우
    if (!ebt_data[0])
      return {
        testStatus: false,
        scoreSum: 99,
        tScore: 999.99,
        result: "NonTesting",
        content: "검사를 진행하지 않았구나!",
      };

    // 검사 스코어 합 + T점수 계산
    const scoreSum = Object.values(ebt_data[0])
      .filter((el) => typeof el === "number")
      .reduce((acc, cur) => acc + cur);
    const tScore = (((scoreSum - average) / standard) * 10 + 50).toFixed(2);
    // 검사 결과
    const result =
      danger_score <= scoreSum
        ? "경고"
        : caution_score <= scoreSum
        ? "주의"
        : "양호";
    // console.log("scoreSum: " + scoreSum);
    // console.log("tScore: " + tScore);
    // console.log("chat: " + ebt_data[0].chat);

    // danger_score 보다 높으면 "위험", 아니면 "그외" 반환
    return {
      testStatus: true,
      scoreSum,
      tScore: Number(tScore),
      result,
      content: JSON.parse(ebt_data[0].chat).text,
    };
  } catch (err) {
    console.log(err);
    return "Error";
  }
};
// TODO# User 정서행동 결과 분석 반환. 로직 변경 예정
const select_soyes_AI_Ebt_Analyis = async (inputTable, parsepUid) => {
  // 동기식 DB 접근 함수 1. Promise 생성 함수
  try {
    const {
      ebtClass,
      table, // 조회할 EBT table
      attribute, // table Attribute
    } = inputTable;

    const select_query = `SELECT * FROM ${table} WHERE ${attribute.pKey}='${parsepUid}'`; // Select Query
    const ebt_data = await fetchUserData(connection_AI, select_query);
    // console.log(ebt_data[0]);

    // 검사를 진행하지 않은 경우
    if (!ebt_data[0])
      return {
        ebtClass: "NonTesting",
        analyisResult: "NonTesting",
      };
    const analyisResult = JSON.parse(ebt_data[0].chat).text;
    // console.log("chat: " + chat);

    return {
      ebtClass,
      analyisResult,
    };
  } catch (err) {
    console.log(err);
    return {
      analyisResult: "select_soyes_AI_Ebt_Analyis Error",
    };
  }
};
// User 성격 검사 유형 반환 (String)
const select_soyes_AI_Pt_Table = async (user_table, user_attr, parsepUid) => {
  try {
    // console.log(user_table);
    const select_query = `SELECT * FROM ${user_table} WHERE ${user_attr.pKey}='${parsepUid}'`; // Select Query
    const ebt_school_data = await fetchUserData(connection_AI, select_query);
    // console.log(ebt_school_data[0]);

    return ebt_school_data[0] ? ebt_school_data[0].persanl_result : "default";
  } catch (err) {
    console.log(err);
    return "default";
  }
};

// EBT 반영 Class 정의
const EBT_classArr = [
  "School",
  "Friend",
  "Family",
  "Mood",
  "Unrest",
  "Sad",
  "Health",
  "Attention",
  "Movement",
  "Angry",
  "Self",
];

// AI API
const openAIController = {
  // 감정 분석 AI
  postOpenAIEmotionAnalyze: async (req, res) => {
    const { messageArr } = req.body;
    console.log("감정 분석 API /emotion Path 호출");
    // console.log(req.body);
    // console.log(typeof messageArr);

    let parseMessageArr;

    try {
      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      const response = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "너는 감정 판별사야. 앞으로 입력되는 유저 메세지를 긍정/부정/중립 3가지 상태 중 하나로 판단해줘. 대답은 반드시 긍정,부정,중립 3개 중 하나로만 해줘.",
          },
          ...parseMessageArr,
        ],
        model: "gpt-3.5-turbo-0125",
      });

      // console.log(response.choices[0]);

      const message = { message: response.choices[0].message.content };
      res.send(message);
    } catch (err) {
      // console.error(err.error);
      res.send(err);
    }
  },
  // EBT 결과 분석 및 DB 저장 및 메일 전송 API
  postOpenAIPsychologicalAnalysis: async (req, res) => {
    const { EBTData } = req.body; // 클라이언트 한계로 데이터 묶음으로 받기.
    // console.log(EBTData);

    let parseEBTdata,
      parseMessageArr,
      parsingScore,
      parsingType,
      parsepUid,
      yourMailAddr = "",
      myMailAddr = "",
      myMailPwd = "";

    // 테스트 타입 객체. 추후 검사를 늘림에 따라 추가 될 예정
    const testType = {
      School: "학교생활",
      Friend: "또래관계",
      Family: "가족관계",
      Mood: "전반적 기분",
      Unrest: "불안",
      Sad: "우울",
      Health: "신체증상",
      Attention: "주의 집중",
      Movement: "과잉 행동",
      Angry: "분노",
      Self: "자기인식",
      Persnal: "성격검사",
      default: "학교생활",
    };

    try {
      // 파싱. Client JSON 데이터
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { messageArr, type, score, pUid } = parseEBTdata;

      // No type => return
      if (!type) {
        console.log("No type input value - 400");
        return res.status(400).json({ message: "No type input value - 400" });
      }

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.status(400).json({ message: "No pUid input value - 400" });
      }

      // No messageArr => return
      if (!messageArr) {
        console.log("No messageArr input value - 400");
        return res
          .status(400)
          .json({ message: "No messageArr input value - 400" });
      }

      // No score => return
      if (!score) {
        console.log("No score input value - 400");
        return res.status(400).json({ message: "No score input value - 400" });
      }

      // 파싱. Client JSON 데이터
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = messageArr;

      if (typeof score === "string") {
        parsingScore = JSON.parse(score);
      } else parsingScore = score;

      parsingType = type;
      parsepUid = pUid;

      console.log(
        `EBT 테스트 결과 분석 및 메일 전송 API /analysis Path 호출 - pUid:${parsepUid}`
      );

      // T점수 계산
      const scoreSum = parsingScore.reduce((acc, cur) => acc + cur);
      const aver = [parsingType].average;
      const stand = EBT_Table_Info[parsingType].standard;
      const tScore = (((scoreSum - aver) / stand) * 10 + 50).toFixed(2);
      // 검사 결과
      const result =
        EBT_Table_Info[parsingType].danger_score <= scoreSum
          ? "경고"
          : EBT_Table_Info[parsingType].caution_score <= scoreSum
          ? "주의"
          : "양호";
      console.log("tScore: " + tScore);
      console.log("result: " + result);
      const analysisPrompt = [];
      const userPrompt = [];

      // 정서행동 검사 분석가 페르소나 v7 - 0718
      analysisPrompt.push(ebt_analysis_prompt_v7);
      // 분야별 결과 해석 프롬프트
      analysisPrompt.push(ebt_Analysis[parsingType]);
      // 결과 해석 요청 프롬프트
      const ebt_class = testType[parsingType];
      userPrompt.push({
        role: "user",
        content: `
        user의 ${ebt_class} 심리 검사 결과는 '${result}'에 해당한다.
        user의 T점수는 ${tScore}점이다.
        다음 문단은 user의 ${ebt_class} 심리 검사 문항에 대한 응답이다.
        '''
        ${parseMessageArr.map((el) => el.content).join("\n")}
        '''
        위 응답을 기반으로 user의 ${ebt_class}에 대해 해석하라.
        `,
      });

      /*
      const user_table = "soyes_ai_User";
      const user_attr = {
        pKey: "uid",
        attr1: "email",
      };

      const select_query = `SELECT * FROM ${user_table} WHERE ${user_attr.pKey}='${pUid}'`;
      await fetchUserData(connection_AI, select_query);
      console.log("받는사람: " + yourMailAddr);

      yourMailAddr = "soyesnjy@gmail.com"; // dummy email. 받는사람
      
      // 보내는 사람 계정 로그인
      myMailAddr = process.env.ADDR_MAIL; // 보내는 사람 메일 주소
      myMailPwd = process.env.ADDR_PWD; // 구글 계정 2단계 인증 비밀번호

      const transporter = nodemailer.createTransport({
        service: "gmail", // 사용할 이메일 서비스
        // host: "smtp.gmail.com",
        // port: 587,
        // secure: false,
        auth: {
          user: myMailAddr, // 보내는 이메일 주소
          pass: myMailPwd, // 이메일 비밀번호
        },
      });
      */

      // AI 분석
      const response = await openai.chat.completions.create({
        messages: [...analysisPrompt, ...userPrompt],
        model: "gpt-4o", // gpt-4-turbo, gpt-4-0125-preview, gpt-4-1106-preview, gpt-3.5-turbo-1106, gpt-3.5-turbo-instruct(Regercy), ft:gpt-3.5-turbo-1106:personal::8fIksWK3
        temperature: 1,
      });

      const message = { message: response.choices[0].message.content };
      // AI 분석 내용 보기좋게 정리
      const analyzeMsg = message.message.split(". ").join(".\n");
      // client 전송
      res.json({ message: analyzeMsg });

      // 메일 제목 및 내용 + 보내는사람 + 받는사람
      const mailOptions = {
        from: myMailAddr,
        to: yourMailAddr,
        subject: "정서행동 검사 AI 상담 분석 결과입니다",
        text: `${analyzeMsg}`,
        // attachments : 'logo.png' // 이미지 첨부 속성
      };

      // 메일 전송 (비동기)
      // transporter.sendMail(mailOptions, function (error, info) {
      //   if (error) {
      //     console.log("Mail Send Fail!");
      //     res.json("Mail Send Fail!");
      //   } else {
      //     console.log("Mail Send Success!");
      //     console.log(info.envelope);
      //   }
      // });

      // 검사 결과가 갱신 되었기에 정서 결과 세션 삭제
      delete req.session.psy_testResult_promptArr_last;

      /* DB 저장 */
      if (parsingType) {
        /* TODO# New EBT Table SQL 변경 예정 */
        const table = EBT_Table_Info[parsingType].table;
        const attribute = EBT_Table_Info[parsingType].attribute;
        // 오늘 날짜 변환
        const dateObj = new Date();
        const year = dateObj.getFullYear();
        const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
        const day = ("0" + dateObj.getDate()).slice(-2);
        const date = `${year}-${month}-${day}`;

        // soyes_ai_Ebt Table 삽입
        // 1. SELECT TEST (row가 있는지 없는지 검사)
        const select_query = `SELECT * FROM ${table} WHERE ${attribute.pKey}='${parsepUid}'`;
        const ebt_data = await fetchUserData(connection_AI, select_query);

        // 2. UPDATE TEST (row값이 있는 경우 실행)
        if (ebt_data[0]) {
          const update_query = `UPDATE ${table} SET ${Object.values(attribute)
            .filter((el) => el !== "uid")
            .map((el) => {
              return `${el} = ?`;
            })
            .join(", ")} WHERE ${attribute.pKey} = ?`;
          // console.log(update_query);

          const update_value = [
            ...parsingScore,
            JSON.stringify({ ...mailOptions, date }),
            date,
            parsepUid,
          ];

          // console.log(update_value);

          connection_AI.query(
            update_query,
            update_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("AI Analysis Data DB UPDATE Success!");
            }
          );
        }
        // 3. INSERT TEST (row값이 없는 경우 실행)
        else {
          const insert_query = `INSERT INTO ${table} (${Object.values(
            attribute
          ).join(", ")}) VALUES (${Object.values(attribute)
            .map((el) => "?")
            .join(", ")})`;
          // console.log(insert_query);

          const insert_value = [
            parsepUid,
            ...parsingScore,
            JSON.stringify({ ...mailOptions, date }),
            date,
          ];
          // console.log(insert_value);

          connection_AI.query(
            insert_query,
            insert_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("AI Analysis Data DB INSERT Success!");
            }
          );
        }

        // soyes_ai_Ebt_Log Table 삽입
        const table_log = EBT_Table_Info["Log"].table; // 해당 table은 soyes_ai_User table과 외래키로 연결된 상태
        const attribute_log = EBT_Table_Info["Log"].attribute;

        const log_insert_query = `INSERT INTO ${table_log} (${Object.values(
          attribute_log
        ).join(", ")}) VALUES (${Object.values(attribute_log)
          .map((el) => "?")
          .join(", ")})`;
        // console.log(insert_query);

        const log_insert_value = [
          parsepUid,
          date,
          JSON.stringify({ ...mailOptions, date }),
          type,
          tScore,
        ];
        // console.log(insert_value);

        connection_AI.query(log_insert_query, log_insert_value, (err) => {
          if (err) {
            console.log("AI Analysis Data LOG DB INSERT Fail!");
            console.log("Err sqlMessage: " + err.sqlMessage);
          } else console.log("AI Analysis Data LOG DB INSERT Success!");
        });

        // Todo => soyes_ai_Ebt_Result row 저장

        // const ebt_result_table = Consult_Table_Info["Analysis"].table;
        // const ebt_result_attribute = Consult_Table_Info["Analysis"].attribute;

        // // DB에 Row가 없을 경우 INSERT, 있으면 지정한 속성만 UPDATE
        // const duple_query = `INSERT INTO ${ebt_result_table} (${ebt_result_attribute.pKey}, ${ebt_result_attribute.attr1}) VALUES (?, ?) ON DUPLICATE KEY UPDATE
        //   ${ebt_result_attribute.attr1} = VALUES(${ebt_result_attribute.attr1});`;

        // const duple_value = [parsepUid, JSON.stringify(message)];

        // connection_AI.query(duple_query, duple_value, (error, rows, fields) => {
        //   if (error) console.log(error);
        //   else console.log("Ella Consult Analysis UPDATE Success!");
        // });
      }

      /* TODO# 2024-08-12 - new DB 저장 */
      if (false) {
        /* TODO# New EBT Table SQL 변경 예정 */
        const table = "soyes_ai_EBT";

        // soyes_ai_Ebt Table 삽입
        // 1. SELECT TEST (row가 있는지 없는지 검사)
        const select_query = `SELECT * FROM ${table} WHERE uid ='${parsepUid}' LIMIT 1`;
        const ebt_data = await fetchUserData(connection_AI, select_query);

        // 2. UPDATE TEST (row값이 있는 경우 실행)
        if (ebt_data[0]) {
          const update_query = `UPDATE ${table} SET ${Object.values(attribute)
            .filter((el) => el !== "uid")
            .map((el) => {
              return `${el} = ?`;
            })
            .join(", ")} WHERE ${attribute.pKey} = ?`;
          // console.log(update_query);

          const update_value = [
            ...parsingScore,
            JSON.stringify({ ...mailOptions, date }),
            date,
            parsepUid,
          ];

          // console.log(update_value);

          connection_AI.query(
            update_query,
            update_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("AI Analysis Data DB UPDATE Success!");
            }
          );
        }
        // 3. INSERT TEST (row값이 없는 경우 실행)
        else {
          const insert_query = `INSERT INTO ${table} (${Object.values(
            attribute
          ).join(", ")}) VALUES (${Object.values(attribute)
            .map((el) => "?")
            .join(", ")})`;
          // console.log(insert_query);

          const insert_value = [
            parsepUid,
            ...parsingScore,
            JSON.stringify({ ...mailOptions, date }),
            date,
          ];
          // console.log(insert_value);

          connection_AI.query(
            insert_query,
            insert_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("AI Analysis Data DB INSERT Success!");
            }
          );
        }

        // soyes_ai_Ebt_Log Table 삽입
        const table_log = EBT_Table_Info["Log"].table; // 해당 table은 soyes_ai_User table과 외래키로 연결된 상태
        const attribute_log = EBT_Table_Info["Log"].attribute;

        const log_insert_query = `INSERT INTO ${table_log} (${Object.values(
          attribute_log
        ).join(", ")}) VALUES (${Object.values(attribute_log)
          .map((el) => "?")
          .join(", ")})`;
        // console.log(insert_query);

        const log_insert_value = [
          parsepUid,
          date,
          JSON.stringify({ ...mailOptions, date }),
          type,
          tScore,
        ];
        // console.log(insert_value);

        connection_AI.query(log_insert_query, log_insert_value, (err) => {
          if (err) {
            console.log("AI Analysis Data LOG DB INSERT Fail!");
            console.log("Err sqlMessage: " + err.sqlMessage);
          } else console.log("AI Analysis Data LOG DB INSERT Success!");
        });

        // Todo => soyes_ai_Ebt_Result row 저장

        // const ebt_result_table = Consult_Table_Info["Analysis"].table;
        // const ebt_result_attribute = Consult_Table_Info["Analysis"].attribute;

        // // DB에 Row가 없을 경우 INSERT, 있으면 지정한 속성만 UPDATE
        // const duple_query = `INSERT INTO ${ebt_result_table} (${ebt_result_attribute.pKey}, ${ebt_result_attribute.attr1}) VALUES (?, ?) ON DUPLICATE KEY UPDATE
        //   ${ebt_result_attribute.attr1} = VALUES(${ebt_result_attribute.attr1});`;

        // const duple_value = [parsepUid, JSON.stringify(message)];

        // connection_AI.query(duple_query, duple_value, (error, rows, fields) => {
        //   if (error) console.log(error);
        //   else console.log("Ella Consult Analysis UPDATE Success!");
        // });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // PT 결과 분석 및 DB 저장 및 메일 전송 API
  postOpenAIPernalTestAnalysis: async (req, res) => {
    const { PTDataSend } = req.body; // 클라이언트 한계로 데이터 묶음으로 받기.

    let parsePTData,
      parsePTResult,
      yourMailAddr = "";
    try {
      // 파싱. Client JSON 데이터
      if (typeof PTDataSend === "string") {
        parsePTData = JSON.parse(PTDataSend);
      } else parsePTData = PTDataSend;

      const { resultText, pUid } = parsePTData;
      console.log(parsePTData);

      // No type => return
      if (!resultText) {
        console.log("No resultText input value - 400");
        return res.json({ message: "No resultText input value - 400" });
      }

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.json({ message: "No pUid input value - 400" });
      }

      parsepUid = pUid;
      parsePTResult = resultText;

      console.log(
        `PT 테스트 결과 분석 및 메일 전송 API /analysis_pt Path 호출 - pUid: ${parsepUid}`
      );

      const analysisPrompt = [];
      const userPrompt = [];

      // 성격 검사용 프롬프트 구분
      analysisPrompt.push(pt_analysis_prompt);
      userPrompt.push({
        role: "user",
        content: `다음 문단은 아동의 성격검사 결과야.
          '''
          아동의 성격 검사 유형은 ${parsePTResult}입니다.
          ${parsePTResult} 유형은 ${persnal_short[parsePTResult]}
          '''
          아동의 성격검사 결과를 바탕으로 아동의 성격을 장점과 단점으로 나눠서 분석해줘. 분석이 끝나면 단점에 대한 해결 방안을 제시해줘
          `,
      });

      /*
      const user_table = "soyes_ai_User";
      const user_attr = {
        pKey: "uid",
        attr1: "email",
      };

      const select_query = `SELECT * FROM ${user_table} WHERE ${user_attr.pKey}='${pUid}'`;
      await fetchUserData(connection_AI, select_query);
      console.log("받는사람: " + yourMailAddr);

      yourMailAddr = "soyesnjy@gmail.com"; // dummy email. 받는사람
      
      // 보내는 사람 계정 로그인
      myMailAddr = process.env.ADDR_MAIL; // 보내는 사람 메일 주소
      myMailPwd = process.env.ADDR_PWD; // 구글 계정 2단계 인증 비밀번호

      const transporter = nodemailer.createTransport({
        service: "gmail", // 사용할 이메일 서비스
        // host: "smtp.gmail.com",
        // port: 587,
        // secure: false,
        auth: {
          user: myMailAddr, // 보내는 이메일 주소
          pass: myMailPwd, // 이메일 비밀번호
        },
      });
      
      yourMailAddr = "soyesnjy@gmail.com"; // dummy email. 받는사람
      */

      // 보내는 사람 계정 로그인
      const myMailAddr = process.env.ADDR_MAIL; // 보내는 사람 메일 주소
      const myMailPwd = process.env.ADDR_PWD; // 구글 계정 2단계 인증 비밀번호

      const transporter = nodemailer.createTransport({
        service: "gmail", // 사용할 이메일 서비스
        // host: "smtp.gmail.com",
        // port: 587,
        // secure: false,
        auth: {
          user: myMailAddr, // 보내는 이메일 주소
          pass: myMailPwd, // 이메일 비밀번호
        },
      });
      // 메일 관련 세팅 끝

      // AI 분석
      const response = await openai.chat.completions.create({
        messages: [...analysisPrompt, ...userPrompt],
        model: "gpt-4o", // gpt-4-turbo, gpt-4-1106-preview, gpt-3.5-turbo-1106, gpt-3.5-turbo-instruct(Regercy), ft:gpt-3.5-turbo-1106:personal::8fIksWK3
        temperature: 1,
      });

      const message = { message: response.choices[0].message.content };
      // AI 분석 내용 보기좋게 정리
      const analyzeMsg = message.message.split(". ").join(".\n");

      // 메일 제목 및 내용 + 보내는사람 + 받는사람
      const mailOptions = {
        from: myMailAddr,
        to: yourMailAddr,
        subject: "성격 검사 AI 상담 분석 결과입니다",
        text: `${analyzeMsg}`,
        // attachments : 'logo.png' // 이미지 첨부 속성
      };

      /* 메일 전송 봉인
      // 메일 전송 (비동기)
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("Mail Send Fail!");
          res.json("Mail Send Fail!");
        } else {
          console.log("Mail Send Success!");
          console.log(info.envelope);
        }
      });
      */

      // client 전송
      res.json({ message: mailOptions.text });

      /* PT Data DB 저장 */
      const pt_table = PT_Table_Info["Main"].table;
      const pt_attribute = PT_Table_Info["Main"].attribute;

      // 오늘 날짜 변환
      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      const day = ("0" + dateObj.getDate()).slice(-2);
      const date = `${year}-${month}-${day}`;

      // soyes_ai_Pt Table 삽입
      // 1. SELECT TEST (row가 있는지 없는지 검사)
      const select_query = `SELECT * FROM ${pt_table} WHERE ${pt_attribute.pKey}='${parsepUid}'`;
      const ebt_data = await fetchUserData(connection_AI, select_query);

      // 2. UPDATE TEST (row값이 있는 경우 실행)
      if (ebt_data[0]) {
        const update_query = `UPDATE ${pt_table} SET ${Object.values(
          pt_attribute
        )
          .filter((el) => el !== "uid")
          .map((el) => {
            return `${el} = ?`;
          })
          .join(", ")} WHERE ${pt_attribute.pKey} = ?`;
        // console.log(update_query);

        const update_value = [
          date,
          parsePTResult,
          JSON.stringify({ ...mailOptions, date }),
          parsepUid,
        ];

        // console.log(update_value);

        connection_AI.query(
          update_query,
          update_value,
          (error, rows, fields) => {
            if (error) console.log(error);
            else console.log("PT TEST Analysis Data DB UPDATE Success!");
          }
        );
      }
      // 3. INSERT TEST (row값이 없는 경우 실행)
      else {
        const pt_insert_query = `INSERT INTO ${pt_table} (${Object.values(
          pt_attribute
        ).join(", ")}) VALUES (${Object.values(pt_attribute)
          .map((el) => "?")
          .join(", ")})`;
        // console.log(insert_query);

        const pt_insert_value = [
          parsepUid,
          date,
          resultText,
          JSON.stringify({ ...mailOptions, date }),
        ];

        connection_AI.query(
          pt_insert_query,
          pt_insert_value,
          (error, rows, fields) => {
            if (error) console.log(error);
            else console.log("PT TEST Analysis Data DB INSERT Success!");
          }
        );
      }

      /* PT_Log DB 저장 */
      const pt_log_table = PT_Table_Info["Log"].table;
      const pt_log_attribute = PT_Table_Info["Log"].attribute;
      // PT_Log DB 저장
      const pt_insert_query = `INSERT INTO ${pt_log_table} (${Object.values(
        pt_log_attribute
      ).join(", ")}) VALUES (${Object.values(pt_attribute)
        .map((el) => "?")
        .join(", ")})`;
      // console.log(insert_query);

      const pt_insert_value = [
        parsepUid,
        date,
        resultText,
        JSON.stringify({ ...mailOptions, date }),
      ];
      // console.log(insert_value);

      connection_AI.query(pt_insert_query, pt_insert_value, (err) => {
        if (err) {
          console.log("PT Analysis Data DB Save Fail!");
          console.log("Err sqlMessage: " + err.sqlMessage);
        } else console.log("AI Analysis Data LOG DB INSERT Success!");
      });
    } catch (err) {
      console.log(err);
      res.json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // 공감친구 모델 - 푸푸
  postOpenAIConsultingPupu: async (req, res) => {
    const { EBTData } = req.body;

    // console.log("req.sessionID: " + req.sessionID);

    let parseEBTdata, parseMessageArr, parsepUid; // Parsing 변수
    let promptArr = [],
      userPrompt = []; // 삽입 Prompt Array
    // let prevChat_flag = true; // 이전 대화 내역 유무
    // console.log(`accessAuth: ${req.session.accessAuth}`);

    try {
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { messageArr, pUid } = parseEBTdata;

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.json({ message: "No pUid input value - 400" });
      }
      // No type => return
      // if (!type) {
      //   console.log("No type input value - 400");
      //   return res.json({ message: "No type input value - 400" });
      // }
      // No messageArr => return
      if (!messageArr) {
        console.log("No messageArr input value - 400");
        return res.json({ message: "No messageArr input value - 400" });
      }

      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      // pUid default값 설정
      parsepUid = pUid;
      console.log(
        `푸푸 상담 API /consulting_emotion_pupu Path 호출 - pUid: ${parsepUid}`
      );

      // 고정 삽입 프롬프트
      promptArr.push(persona_prompt_pupu_v4); // 푸푸 페르소나 v4
      promptArr.push(info_prompt); // 유저관련 정보

      // const lastUserContent =
      //   parseMessageArr[parseMessageArr.length - 1].content; // 유저 마지막 멘트

      // // 대화 6회 미만 - 심리 상담 프롬프트 삽입
      // if (parseMessageArr.length < 11) {
      //   console.log("심리 상담 프롬프트 삽입");
      //   promptArr.push(EBT_Table_Info[type].consult);
      // }
      // // 대화 6회 - 심리 상담 프롬프트 + 심리 상태 분석 프롬프트 삽입
      // else if (parseMessageArr.length === 11) {
      //   console.log("심리 상담 프롬프트 + 심리 요약 프롬프트 삽입");
      //   promptArr.push(EBT_Table_Info[type].consult);
      //   // 비교 분석용 EBT class 맵
      //   const compareTypeMap = {
      //     School: ["School", "Attention"], // 학업/성적 상담은 School, Attention 분석과 비교하여 해석.
      //     Friend: ["Friend", "Movement"],
      //     Family: ["Family"],
      //     Mood: ["Mood", "Unrest", "Sad", "Angry"],
      //     Health: ["Health"],
      //     Self: ["Self"],
      //   };

      //   let resolvedCompareEbtAnalysis; // EBT 분석을 담을 배열
      //   // compareTypeMap에 맵핑되는 분야의 검사 결과를 DB에서 조회
      //   const compareEbtAnalysis = await compareTypeMap[type].map(
      //     async (ebtClass) => {
      //       return await select_soyes_AI_Ebt_Analyis(
      //         EBT_Table_Info[ebtClass],
      //         parsepUid
      //       );
      //     }
      //   );
      //   // Promise Pending 대기
      //   await Promise.all(compareEbtAnalysis).then((data) => {
      //     resolvedCompareEbtAnalysis = [...data]; // resolve 상태로 반환된 prompt 배열을 psy_testResult_promptArr_last 변수에 복사
      //   });
      //   // userPrompt 명령 추가
      //   userPrompt.push({
      //     role: "user",
      //     content: `아래는 user의 정서행동검사 결과야.
      //     '''
      //     ${resolvedCompareEbtAnalysis.map((data) => {
      //       const { ebtClass, analyisResult } = data;
      //       return `
      //       ${ebtClass}: { ${
      //         analyisResult === "NonTesting"
      //           ? `'정서행동검사 - ${analyisResult}'을 실시하지 않았습니다.`
      //           : analyisResult
      //       }}
      //       `;
      //     })}
      //     '''
      //     지금까지 대화를 기반으로 user의 심리 상태를 3문장으로 요약하고, 위 정서행동검사 결과와 비교하여 2문장으로 해석해줘.
      //       `,
      //   });
      // } else {
      //   console.log(
      //     `심리 솔루션 프롬프트 삽입 - solution:${req.session.solution?.solutionClass}`
      //   );
      //   promptArr.push(EBT_Table_Info[type].solution);
      // }

      // 상시 삽입 프롬프트
      // promptArr.push(completions_emotion_prompt); // 답변 이모션 넘버 확인 프롬프트 삽입

      // console.log(promptArr);

      const response = await openai.chat.completions.create({
        messages: [...promptArr, ...parseMessageArr, ...userPrompt],
        model: "gpt-4o", // gpt-4-turbo, gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      // let emotion = parseInt(response.choices[0].message.content.slice(-1));
      // console.log("emotion: " + emotion);

      const message = {
        message: response.choices[0].message.content,
        emotion: 0,
      };
      // 대화 내역 로그
      // console.log([
      //   ...parseMessageArr,
      //   { role: "assistant", content: response.choices[0].message.content },
      //   // response.choices[0].message.content,
      // ]);

      // 심리 분석 DB 저장
      // if (parseMessageArr.length === 11) {
      //   const table = Consult_Table_Info["Analysis"].table;
      //   const attribute = Consult_Table_Info["Analysis"].attribute;

      //   // DB에 Row가 없을 경우 INSERT, 있으면 지정한 속성만 UPDATE
      //   const duple_query = `INSERT INTO ${table} (${attribute.pKey}, ${attribute.attr1}) VALUES (?, ?) ON DUPLICATE KEY UPDATE
      //     ${attribute.attr1} = VALUES(${attribute.attr1});`;

      //   const duple_value = [parsepUid, JSON.stringify(message)];

      //   connection_AI.query(duple_query, duple_value, (error, rows, fields) => {
      //     if (error) console.log(error);
      //     else console.log("Ella Consult Analysis UPDATE Success!");
      //   });

      //   // 엘라 유저 분석 내용 Session 저장
      //   req.session.ella_analysis = message.message;
      // }

      return res.status(200).json(message);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Server Error - 500 Bad Gateway" + err.message,
        emotion: 0,
      });
    }

    // try {
    //   /* 비인증 || 세션 만료 유저 접근 처리
    //   if (!req.session.accessToken) {
    //     console.log("Unauthorized User Accessed");
    //     return res
    //       .status(401)
    //       .json({ message: "Session Expiration" });
    //   }
    //   */
    //   if (typeof EBTData === "string") {
    //     parseEBTdata = JSON.parse(EBTData);
    //   } else parseEBTdata = EBTData;

    //   const { messageArr, pUid } = parseEBTdata;
    //   // messageArr가 문자열일 경우 json 파싱
    //   if (typeof messageArr === "string") {
    //     parseMessageArr = JSON.parse(messageArr);
    //   } else parseMessageArr = [...messageArr];

    //   // No pUid => return
    //   if (!pUid) {
    //     console.log("No pUid input value - 400");
    //     return res.json({ message: "No pUid input value - 400" });
    //   }

    //   parsepUid = pUid;
    //   console.log(
    //     `푸푸 상담 API /consulting_emotion_pupu Path 호출 - pUid: ${parsepUid}`
    //   );

    //   // 고정 삽입 프롬프트
    //   promptArr.push(persona_prompt_pupu_v2); // 페르소나 프롬프트 삽입
    //   promptArr.push(info_prompt); // 유저 정보 프롬프트 삽입

    //   const lastUserContent =
    //     parseMessageArr[parseMessageArr.length - 1].content; // 유저 마지막 멘트

    //   // NO REQ 질문 처리. 10초 이상 질문이 없을 경우 Client 측에서 'NO REQUEST' 메시지를 담은 요청을 보냄. 그에 대한 처리
    //   if (lastUserContent.includes("NO REQ")) {
    //     console.log("NO REQUEST 전달");

    //     parseMessageArr.push(no_req_prompt);
    //     promptArr.push(sentence_division_prompt);

    //     const response = await openai.chat.completions.create({
    //       messages: [...promptArr, ...parseMessageArr],
    //       model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
    //     });

    //     res.json({
    //       message: response.choices[0].message.content,
    //       emotion: 0,
    //     });

    //     return;
    //   }

    //   // // 유저 성격검사 결과 DB에서 가져오기
    //   // const pt_result = await select_soyes_AI_Pt_Table(
    //   //   PT_Table_Info["Main"].table,
    //   //   PT_Table_Info["Main"].attribute,
    //   //   parsepUid
    //   // );
    //   // console.log(`성격검사 결과: ${pt_result}`);
    //   // // promptArr.push(persnal_result_prompt[pt_result]);
    //   // promptArr.push({
    //   //   role: "system",
    //   //   content: `다음 문단은 'user'의 성격검사 결과입니다.
    //   //   '''
    //   //   ${
    //   //     pt_result !== "default"
    //   //       ? `'user'는 성격검사 결과 ${pt_result} 유형에 해당됩니다. ${pt_result} 유형은 ${persnal_short["IFPE"]}`
    //   //       : "user는 성격검사를 진행하지 않았습니다."
    //   //   }
    //   //   '''
    //   //   'assistant'는 'user'의 성격 유형을 알고있습니다.
    //   //   `,
    //   // });

    //   // if (parseMessageArr.length === 1 && prevChat_flag) {
    //   //   // 이전 대화 프롬프트 삽입
    //   //   console.log("이전 대화 프롬프트 삽입");
    //   //   promptArr.push(prevChat_prompt);
    //   // }

    //   // if (parseMessageArr.length) {
    //   //   // 심리 검사 프롬프트 삽입
    //   //   console.log("심리 검사 프롬프트 삽입");
    //   //   promptArr.push(psy_testResult_prompt);
    //   //   promptArr.push(psyResult_prompt);
    //   //   promptArr.push(solution_prompt);
    //   // }

    //   // if (parseMessageArr.length === 17 || parseMessageArr.length === 19) {
    //   //   // 솔루션 프롬프트 삽입
    //   //   console.log("솔루션 프롬프트 삽입");
    //   //   promptArr.push(solution_prompt);
    //   // }

    //   // 상시 삽입 프롬프트

    //   // promptArr.push(solution_prompt2); // 음악 명상 + 그림 명상 관련 솔루션 프롬프트
    //   // promptArr.push(common_prompt); // 공통 프롬프트 삽입
    //   // promptArr.push(completions_emotion_prompt); // 답변 이모션 넘버 확인 프롬프트 삽입

    //   // console.log(promptArr);

    //   /* Regercy
    //   // 심리팀 Test Prompt. {role: user} 상태로 삽입
    //   parseMessageArr.unshift(test_prompt_20240402);

    //   const response = await openai.chat.completions.create({
    //     messages: [...promptArr, ...parseMessageArr],
    //     model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
    //   });

    //   let emotion = "0";
    //   const message = {
    //     message: response.choices[0].message.content,
    //     emotion,
    //   };
    //   */

    //   const response = await openai.chat.completions.create({
    //     messages: [...promptArr, ...parseMessageArr],
    //     model: "ft:gpt-3.5-turbo-1106:personal::9dYars0I", // gpt-4o, gpt-4-turbo, gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
    //   });

    //   // let emotion = parseInt(response.choices[0].message.content.slice(-1));

    //   const message = {
    //     message: response.choices[0].message.content,
    //     emotion: 1,
    //   };

    //   // Log 출력
    //   // console.log([
    //   //   ...parseMessageArr,
    //   //   { role: "assistant", content: message.message },
    //   // ]);

    //   // Client 반환
    //   res.status(200).json(message);
    // } catch (err) {
    //   console.error(err);
    //   res.json({
    //     message: "Server Error",
    //     emotion: 0,
    //   });
    // }
  },
  // 게임친구 모델 - 우비
  postOpenAIConsultingUbi: async (req, res) => {
    const { EBTData } = req.body;

    // console.log(EBTData);
    let parseEBTdata, parseMessageArr, parsepUid; // Parsing 변수
    let promptArr = []; // 삽입 Prompt Array
    // let prevChat_flag = true; // 이전 대화 내역 유무
    // console.log(messageArr);
    try {
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { messageArr, pUid, game } = parseEBTdata;
      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.json({ message: "No pUid input value - 400" });
      }

      if (!game) {
        console.log("No game input value - 400");
        return res.json({ message: "No game input value - 400" });
      }

      parsepUid = pUid;
      console.log(
        `우비 상담 API /consulting_emotion_ubi Path 호출 - pUid: ${parsepUid}`
      );
      // 고정 삽입 프롬프트
      promptArr.push(persona_prompt_ubi); // 페르소나 프롬프트 삽입
      promptArr.push(info_prompt); // 유저 정보 프롬프트 삽입

      // const lastUserContent =
      //   parseMessageArr[parseMessageArr.length - 1].content; // 유저 마지막 멘트

      // NO REQ 질문 처리. 10초 이상 질문이 없을 경우 Client 측에서 'NO REQUEST' 메시지를 담은 요청을 보냄. 그에 대한 처리
      // if (lastUserContent.includes("NO REQ")) {
      //   console.log("NO REQUEST 전달");

      //   parseMessageArr.push(no_req_prompt);
      //   promptArr.push(sentence_division_prompt);

      //   const response = await openai.chat.completions.create({
      //     messages: [...promptArr, ...parseMessageArr],
      //     model: "gpt-4o", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      //   });

      //   res.json({
      //     message: response.choices[0].message.content,
      //     emotion: 0,
      //   });

      //   return;
      // }

      // 유저 성격검사 결과 DB에서 가져오기
      // const pt_result = await select_soyes_AI_Pt_Table(
      //   PT_Table_Info["Main"].table,
      //   PT_Table_Info["Main"].attribute,
      //   parsepUid
      // );
      // // console.log(pt_result);
      // promptArr.push({
      //   role: "system",
      //   content: `다음 문단은 'user'의 성격검사 결과입니다.
      //   '''
      //   ${
      //     pt_result !== "default"
      //       ? `'user'는 성격검사 결과 ${pt_result} 유형에 해당됩니다. ${pt_result} 유형은 ${persnal_short["IFPE"]}`
      //       : "user는 성격검사를 진행하지 않았습니다."
      //   }
      //   '''
      //   'assistant'는 'user'의 성격 유형을 알고있습니다.
      //   `,
      // });

      // 상시 삽입 프롬프트
      // promptArr.push(solution_prompt); // 학습 관련 솔루션 프롬프트
      // promptArr.push(sentence_division_prompt); // 공통 프롬프트 삽입
      // promptArr.push(completions_emotion_prompt); // 답변 이모션 넘버 확인 프롬프트 삽입

      // console.log(promptArr);

      const response = await openai.chat.completions.create({
        messages: [...promptArr, ...parseMessageArr],
        model: "gpt-4o", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      // let emotion = parseInt(response.choices[0].message.content.slice(-1));
      // console.log(emotion);

      const message = {
        message: response.choices[0].message.content,
        // emotion,
      };
      // console.log([
      //   ...parseMessageArr,
      //   { role: "assistant", content: message.message },
      // ]);
      res.json(message);
    } catch (err) {
      console.error(err);
      res.json({
        message: "Server Error",
        // emotion: 0,
      });
    }
  },
  // 전문상담사 모델 - 소예
  postOpenAIConsultingSoyes: async (req, res) => {
    const { EBTData } = req.body;
    // console.log(EBTData);
    let parseEBTdata, parseMessageArr, parsepUid; // Parsing 변수
    let promptArr = []; // 삽입 Prompt Array
    // let prevChat_flag = true; // 이전 대화 내역 유무

    // 응답에 헤더를 추가하는 메서드
    // res.header("Test_Header", "Success Header");

    try {
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { messageArr, pUid } = parseEBTdata;
      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.json({ message: "No pUid input value - 400" });
      }

      parsepUid = pUid;
      console.log(
        `소예 상담 API /consulting_emotion_soyes Path 호출 - pUid: ${parsepUid}`
      );
      // 고정 삽입 프롬프트
      promptArr.push(persona_prompt_soyes); // 페르소나 프롬프트 삽입
      promptArr.push(info_prompt); // 유저 정보 프롬프트 삽입

      const lastUserContent =
        parseMessageArr[parseMessageArr.length - 1].content; // 유저 마지막 멘트

      // NO REQ 질문 처리. 10초 이상 질문이 없을 경우 Client 측에서 'NO REQUEST' 메시지를 담은 요청을 보냄. 그에 대한 처리
      if (lastUserContent.includes("NO REQ")) {
        console.log("NO REQUEST 전달");
        parseMessageArr.pop(); // 'NO REQUEST 질문 삭제'
        parseMessageArr.push(no_req_prompt);
        promptArr.push(sentence_division_prompt);

        const response = await openai.chat.completions.create({
          messages: [...promptArr, ...parseMessageArr],
          model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
        });

        res.json({
          message: response.choices[0].message.content,
          emotion: 0,
        });

        return;
      }

      /* 프롬프트 삽입 분기 */

      // 심리 검사 결과 프롬프트 상시 삽입
      if (!req.session.psy_testResult_promptArr_last) {
        // 심리 검사 결과 프롬프트 삽입
        console.log("심리 검사 결과 프롬프트 삽입");
        let psy_testResult_promptArr_last = []; // 2점을 획득한 정서행동검사 문항을 저장하는 prompt
        // TODO# EBT Table 갱신 후 변경 예정
        const psy_testResult_promptArr = EBT_classArr.map(async (ebt_class) => {
          const select_Ebt_Result = await select_soyes_AI_Ebt_Table(
            EBT_Table_Info[ebt_class].table, // Table Name
            EBT_Table_Info[ebt_class].attribute,
            EBT_Table_Info[ebt_class].result, // EBT Question 11가지 분야 중 1개 (Table에 따라 결정)
            parsepUid // Uid
          );

          // console.log(select_Ebt_Result);

          const psy_testResult_prompt = {
            role: "system",
            content: `다음에 오는 문단은 user의 ${ebt_class} 관련 심리검사 결과입니다.
  '''
  ${select_Ebt_Result.testResult}
  '''
  위 문단이 비어있다면 ${
    // DB Table의 값 유무에 따라 다른 프롬프트 입력
    !select_Ebt_Result.ebt_school_data[0]
      ? "user는 심리검사를 진행하지 않았습니다."
      : "user의 심리검사 결과는 문제가 없습니다."
  }`,
          };
          // console.log(psy_testResult_prompt);
          return psy_testResult_prompt;
        });
        // map method는 pending 상태의 promise를 반환하므로 Promise.all method를 사용하여 resolve 상태가 되기를 기다려준다.
        await Promise.all(psy_testResult_promptArr).then((prompt) => {
          psy_testResult_promptArr_last = [...prompt]; // resolve 상태로 반환된 prompt 배열을 psy_testResult_promptArr_last 변수에 복사
        });

        // console.log(psy_testResult_promptArr_last);

        promptArr.push(...psy_testResult_promptArr_last);
        promptArr.push(psyResult_prompt);
        // promptArr.push(solution_prompt);

        req.session.psy_testResult_promptArr_last = [
          ...psy_testResult_promptArr_last,
        ];
      } else {
        console.log("세션 저장된 심리 검사 결과 프롬프트 삽입");
        promptArr.push(...req.session.psy_testResult_promptArr_last);
        promptArr.push(psyResult_prompt);
      }

      // 검사 결과 분석 관련 멘트 감지
      let testClass = ""; // 감지 텍스트 저장 변수
      if (
        !req.session.ebt_class &&
        test_result_ment.some((el) => {
          if (lastUserContent.includes(el.text)) {
            testClass = el.class;
            return true;
          } else return false;
        })
      ) {
        console.log(`정서행동검사 결과 - ${testClass} 분석 프롬프트 삽입`);
        // 감지된 분야 선택
        // const random_class = EBT_classArr[class_map[testClass]];
        const random_class = testClass;

        // 심리 결과 분석 프롬프트
        parseMessageArr.push({
          role: "user",
          content: `마지막 질문에 대해 1문장 이내로 답변한 뒤 (이해하지 못했으면 답변하지마), 
          '너의 심리검사 결과를 봤어!'라고 언급하면서 ${random_class} 관련 심리검사 결과를 분석한 아동의 심리 상태를 5문장 이내로 설명해줘.
          만약 심리 검사 결과를 진행하지 않았다면, 잘 모르겠다고 답변해줘.
          . 혹은 ? 같은 특수문자로 끝나는 각 마디 뒤에는 반드시 줄바꿈(\n)을 추가해줘.
          검사 결과가 있다면 답변 마지막에는 '검사 결과에 대해 더 궁금한점이 있니?'를 추가해줘.`,
        });
        promptArr.push({
          role: "system",
          content: `이번 문답은 예외적으로 6문장 이내로 답변을 생성합니다.`,
        });
      }
      // 아무런 분기도 걸리지 않을 경우
      else promptArr.push(sentence_division_prompt);

      /*
      // 답변 횟수 카운트
      if (!req.session.answerCnt || parseMessageArr.length === 1)
        req.session.answerCnt = 1;
      else if (req.session.answerCnt > 9) {
        // 답변 10회 이상 진행 시 세션 파괴
        req.session.destroy();
        res.clearCookie("connect.sid");
      } else req.session.answerCnt++;
      */

      // 상시 삽입 프롬프트
      // promptArr.push(sentence_division_prompt); // 문장 구분 프롬프트 삽입
      promptArr.push(completions_emotion_prompt); // 답변 이모션 넘버 확인 프롬프트 삽입

      // console.log(promptArr);

      const response = await openai.chat.completions.create({
        messages: [...promptArr, ...parseMessageArr],
        model: "gpt-4o", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      let emotion = parseInt(response.choices[0].message.content.slice(-1));
      console.log("emotion: " + emotion);

      const message = {
        message: response.choices[0].message.content.slice(0, -1),
        emotion,
      };
      // console.log([
      //   ...parseMessageArr,
      //   { role: "assistant", content: message.message },
      // ]);

      // 세션 확인 코드
      // console.log(req.session);

      res.json(message);
    } catch (err) {
      console.error(err);
      res.json({
        message: "Server Error",
        emotion: 0,
      });
    }
  },
  // 달력 관련 데이터 반환 (Date 단위)
  postOpenAIMypageCalendarData: async (req, res) => {
    const { EBTData } = req.body;
    let parseEBTdata, parsepUid, parseDate; // Parsing 변수

    try {
      // json 파싱
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { pUid, date } = parseEBTdata;
      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.json({ message: "No pUid input value - 400" });
      }
      // pUid default값 설정
      parsepUid = pUid;
      parseDate = date;

      console.log(
        `달력 데이터 반환 API /openAI/calendar Path 호출 - pUid: ${parsepUid}`
      );

      // DB 조회 => User Table + User EBT Table JOIN 후 관련 데이터 전달
      const user_table = User_Table_Info.table;

      // TODO# EBT Table 갱신 후 변경 예정
      const ebt_log_table = EBT_Table_Info["Log"].table;
      const ebt_log_attribute = EBT_Table_Info["Log"].attribute;

      const pt_log_table = PT_Table_Info["Log"].table;
      const pt_log_attribute = PT_Table_Info["Log"].attribute;
      const consult_log_table = Consult_Table_Info["Log"].table;
      const consult_log_attribute = Consult_Table_Info["Log"].attribute;

      // 1. SELECT USER JOIN EBT_Log
      const select_ebt_join_query = `SELECT ${ebt_log_table}.${ebt_log_attribute.attr2}, ${ebt_log_table}.${ebt_log_attribute.attr3} FROM ${ebt_log_table} WHERE uid = '${parsepUid}' AND created_at LIKE '${parseDate}%' ORDER BY created_at DESC;`;

      const ebt_join_data = await fetchUserData(
        connection_AI,
        select_ebt_join_query
      );
      // console.log(ebt_join_data);

      // 2. SELECT USER PT_Log
      const select_pt_join_query = `SELECT ${pt_log_table}.${pt_log_attribute.attr2}, ${pt_log_table}.${pt_log_attribute.attr3} FROM ${pt_log_table} WHERE uid = '${parsepUid}' AND created_at LIKE '${parseDate}%' ORDER BY created_at DESC;`;

      const pt_join_data = await fetchUserData(
        connection_AI,
        select_pt_join_query
      );

      // 3. SELECT USER Consult_Log
      const select_consult_join_query = `SELECT ${consult_log_table}.${consult_log_attribute.attr1}, ${consult_log_table}.${consult_log_attribute.attr2} FROM ${consult_log_table} WHERE uid = '${parsepUid}' AND created_at LIKE '${parseDate}%' ORDER BY created_at DESC;`;

      const consult_join_data = await fetchUserData(
        connection_AI,
        select_consult_join_query
      );

      // 프론트 데이터값 참조
      // const userInfoArr = [
      //   {
      //     title: '성격검사',
      //     type: 'pt_data',
      //     iconSrc: '/src/Content_IMG/Icon_IMG/Icon_요가명상.png',
      //     playIconSrc: '/src/Content_IMG/Frame_재생버튼.png',
      //   },
      //   {
      //     title: '정서행동검사',
      //     type: 'ebt_data',
      //     iconSrc: '/src/Content_IMG/Icon_IMG/Icon_요가명상.png',
      //     playIconSrc: '/src/Content_IMG/Frame_재생버튼.png',
      //   },
      //   {
      //     title: '심리상담',
      //     type: 'consult_data',
      //     iconSrc: '/src/Content_IMG/Icon_IMG/Icon_요가명상.png',
      //     playIconSrc: '/src/Content_IMG/Frame_재생버튼.png',
      //   },
      //   {
      //     title: '콘텐츠',
      //     type: 'content_data',
      //     iconSrc: '/src/Content_IMG/Icon_IMG/Icon_요가명상.png',
      //     playIconSrc: '/src/Content_IMG/Frame_재생버튼.png',
      //   },
      //   {
      //     title: '엘라상담',
      //     type: 'ella_data',
      //     iconSrc: '/src/Content_IMG/Icon_IMG/Icon_요가명상.png',
      //     playIconSrc: '/src/Content_IMG/Frame_재생버튼.png',
      //   },
      //   {
      //     title: '명상',
      //     type: 'meditation_data',
      //     iconSrc: '/src/Content_IMG/Icon_IMG/Icon_요가명상.png',
      //     playIconSrc: '/src/Content_IMG/Frame_재생버튼.png',
      //   },
      // ];

      res.json({
        ebt_data: ebt_join_data.map((el) => {
          return { ...el, ebt_analysis: JSON.parse(el.ebt_analysis).text };
        }),
        pt_data: pt_join_data.map((el) => {
          return { ...el, pt_analysis: JSON.parse(el.pt_analysis).text };
        }),
        // 값을 파싱해서 사용해야함!
        consult_data: consult_join_data.map((el) => {
          return { ...el };
        }),
      });
    } catch (err) {
      console.error(err);
      res.json({
        data: "Server Error",
      });
    }
  },
  // Clova Voice API 사용
  postClovaVoiceTTS: async (req, res) => {
    console.log("ClovaVoiceTTS API /openAI/tts Path 호출");

    const api_url = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts";

    try {
      const response = await axios.post(api_url, req.body, {
        responseType: "arraybuffer", // Clova 음성 데이터를 arraybuffer로 받음
        headers: {
          "X-NCP-APIGW-API-KEY-ID": process.env.CLOVA_CLIENT_ID,
          "X-NCP-APIGW-API-KEY": process.env.CLOVA_CLIENT_SECRET,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // console.log(response.data);
      // 음성 데이터를 클라이언트로 전송
      res.writeHead(200, {
        "Content-Type": "audio/mp3",
        "Content-Length": response.data.length,
      });

      // JSON 형식이 아니기에 res.json 사용 X
      res.end(response.data);
    } catch (error) {
      console.error(error.message);
      res.status(500).end("Internal Server Error");
    }
  },
  // 상담 로그 저장 API
  postOpenAIConsultingLogSave: async (req, res) => {
    const { EBTData } = req.body; // 클라이언트 한계로 데이터 묶음으로 받기.
    let parseEBTdata, parsepUid;
    try {
      // 파싱. Client JSON 데이터
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { messageArr, avarta, pUid } = parseEBTdata;
      // console.log(parseEBTdata);

      // No pUid => return
      if (!pUid) {
        console.log("Non pUid input value - 404");
        return res.status(404).json({ message: "Non pUid input value - 404" });
      }
      parsepUid = pUid;
      console.log(
        `상담 로그 저장 API /consulting_emotion_log Path 호출 - pUid: ${parsepUid}`
      );
      // 문답 5회 미만일 경우 return
      if (messageArr.length <= 8) {
        console.log(`messageArr Not enough length - pUid: ${parsepUid}`);
        return res
          .status(201)
          .json({ message: "messageArr Not enough length" });
      }

      /* Consult_Log DB 저장 */
      const consult_log_table = Consult_Table_Info["Log"].table;
      const consult_log_attribute = Consult_Table_Info["Log"].attribute;

      // Consult_Log DB 저장
      const consult_insert_query = `INSERT INTO ${consult_log_table} (${Object.values(
        consult_log_attribute
      ).join(", ")}) VALUES (${Object.values(consult_log_attribute)
        .map((el) => "?")
        .join(", ")})`;
      // console.log(consult_insert_query);

      const consult_insert_value = [
        parsepUid,
        avarta,
        JSON.stringify(messageArr),
      ];
      // console.log(consult_insert_value);

      connection_AI.query(consult_insert_query, consult_insert_value, (err) => {
        if (err) {
          console.log("Consulting_Log DB Save Fail!");
          console.log("Err sqlMessage: " + err.sqlMessage);
          res.json({ message: "Consulting_Log DB Save Fail!" });
        } else {
          console.log("Consulting_Log DB Save Success!");
          res.status(200).json({ message: "Consulting_Log DB Save Success!" });
        }
      });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ message: "Consulting_Log DB Save Fail!" + err.message });
    }
  },
  // ClearCookies API
  getClearCookies: (req, res, next) => {
    console.log("ClearCookies API /openAI/clear_cookies Path 호출");
    try {
      res.clearCookie("connect.sid", { path: "/" });
      console.log("ClearCookies Success!");
      // res.json({
      //   data: "Clear Cookies Success!",
      // });
      next();
    } catch (err) {
      console.log(err);
      // res.json({
      //   data: "Clear Cookies Fail!",
      // });
    }
  },
  // User 정서행동 검사 결과 반환
  postOpenAIUserEBTResultData: async (req, res) => {
    const { EBTData } = req.body;
    let parseEBTdata,
      parsepUid,
      // returnObj = {},
      returnArr = [];

    try {
      // json 파싱
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { pUid, contentKey } = parseEBTdata;
      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.status(400).json({ message: "No pUid input value - 400" });
      }
      // pUid default값 설정
      parsepUid = pUid;
      console.log(
        `User 정서행동 검사 결과 반환 API /openAI/ebtresult Path 호출 - pUid: ${parsepUid}`
      );

      /*
      // EBT DB에서 차출 - Obj
      await Promise.all(
        EBT_classArr.map(async (ebt_class) => {
          // 분야별 값 조회
          const select_Ebt_Result = await select_soyes_AI_Ebt_Result(
            EBT_Table_Info[ebt_class],
            parsepUid // Uid
          );
          returnObj[ebt_class] = { ...select_Ebt_Result };
        })
      );
      // console.log(returnObj);
      */

      // TODO# New EBT Table 갱신 후 변경 예정
      const ebtResultArr = EBT_classArr.map(async (ebt_class) => {
        const select_Ebt_Result = await select_soyes_AI_Ebt_Result(
          EBT_Table_Info[ebt_class],
          parsepUid // Uid
        );
        // contentKey 값이 입력되지 않을 경우 analysisResult 속성 삭제
        if (!contentKey) delete select_Ebt_Result.content;
        return { ebt_class, ...select_Ebt_Result };
      });
      // map method는 pending 상태의 promise를 반환하므로 Promise.all method를 사용하여 resolve 상태가 되기를 기다려준다.
      await Promise.all(ebtResultArr).then((result) => {
        returnArr = [...result]; // resolve 상태로 반환된 배열을 returnArr 변수에 복사
      });
      // console.log(returnArr);

      return res.json({
        message: returnArr.sort((a, b) => b.tScore - a.tScore),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server Error - 500",
      });
    }
  },
  // getYoutubeContent API
  getYoutubeContent: async (req, res) => {
    // 영상 식별 번호 파라미터
    const videoId = req.params.id;
    try {
      // 식별 번호 없는 요청 처리
      if (!videoId) return res.status(404).send("Video Number not Input");
      // 영상 리스트 가져오기
      const response = await youtube.videos.list({
        id: videoId,
        part: "snippet,player",
      });
      // 영상 O
      if (response.data.items && response.data.items.length > 0) {
        const videoData = response.data.items[0];
        return res.status(200).json(videoData);
      }
      // 영상 X
      else {
        return res.status(404).send("Video not found");
      }
    } catch (error) {
      console.error("Error fetching video data:", error);
      res.status(500).send("Internal Server Error");
    }
  },
  // 상담 Solution 반환 API
  postOpenAIConsultSolutionData: async (req, res) => {
    const { EBTData } = req.body;
    let parseEBTdata, parseMessageArr, parsepUid, parseType;
    let promptArr = []; // 삽입 Prompt Array
    let userPrompt = []; // 삽입 User Prompt Array

    try {
      // json 파싱
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { pUid, messageArr, type, avarta } = parseEBTdata;
      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.status(400).json({ message: "No pUid input value - 400" });
      }

      if (!type) {
        console.log("No type input value - 400");
        return res.json({ message: "No type input value - 400" });
      }

      parsepUid = pUid;
      parseType = type;
      console.log(
        `User 상담 Solution 반환 API /openAI/solution Path 호출 - pUid: ${parsepUid}`
      );

      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      // # TODO 솔루션 매칭
      promptArr.push(solution_matching_persona_prompt); // 솔루션 페르소나
      userPrompt.push({
        role: "user",
        content: `대화 내용을 기반으로 적절한 컨텐츠를 1단어로 추천해줘`,
      });

      const response = await openai.chat.completions.create({
        messages: [...promptArr, ...parseMessageArr, ...userPrompt],
        model: "gpt-4o", // gpt-4-turbo, gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      /* 
      학업/성적: [cognitive, diary, meditation],
      대인관계: [cognitive, diary, balance, emotion, interpersonal],
      가족관계: [cognitive, diary, balance, interpersonal],
      기분/불안: [cognitive, diary, balance, meditation, emotion],
      신체 증상: [cognitive, diary, meditation, emotion],
      자기이해: [cognitive, diary],
      */

      const solution = response.choices[0].message.content;
      const message = {
        solution,
        solutionIndex: (Math.floor(Math.random() * 700) % 7) + 1, // default Index [1 ~ 7]
      };

      // #### 솔루션 임시 meditation 고정값 ####
      console.log(message.solutionIndex);
      message.solution = "meditation";

      //console.log(message);
      switch (message.solution) {
        case "meditation":
          req.session.solution = {
            solutionClass: "meditation",
            // prompt: cognitive_prompt[parseType],
          };
          break;
        case "cognitive":
          req.session.solution = {
            solutionClass: "cognitive",
            prompt: cognitive_prompt[parseType],
          };
          break;
        case "diary":
          req.session.solution = {
            solutionClass: "diary",
            prompt: diary_prompt,
          };
          break;
        case "balance":
          req.session.solution = {
            solutionClass: "balance",
            prompt: balance_prompt,
          };
          break;
        case "emotion":
          // req.session.solution = {
          //   solutionClass: "emotion",
          //   prompt: emotion_prompt,
          // };
          break;
        case "interpersonal":
          // req.session.solution = {
          //   solutionClass: "interpersonal",
          //   prompt: interpersonal_prompt,
          // };
          break;
        default:
          break;
      }
      // Default Solution - 추후 삭제 예정
      return res.status(200).json(message);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server Error - 500",
      });
    }
  },
  // Google Drive 파일 업로드 API
  postOpenAIGoogleDriveUpload: async (req, res) => {
    try {
      const { name, mimeType, data, pUid } = req.body;
      console.log(`Google Drive 파일 업로드 API 호출 - Uid:${pUid}`);
      const [type, imageBase64] = data.split(",");

      const bufferStream = new stream.PassThrough();
      bufferStream.end(Buffer.from(imageBase64, "base64"));

      const fileMetadata = {
        name,
      };

      const media = {
        mimeType,
        body: bufferStream,
      };

      // 파일 업로드
      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id, webViewLink, webContentLink",
      });

      // 파일을 Public으로 설정
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      // soyesnjy@gmail.com 계정에게 파일 공유 설정 (writer 권한)
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: "writer",
          type: "user",
          emailAddress: "soyesnjy@gmail.com",
        },
        // transferOwnership: true, // role:'owner' 일 경우
      });

      // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
      const updatedFile = await drive.files.get({
        fileId: file.data.id,
        fields: "id, webViewLink, webContentLink",
      });

      // 이미지 URL 생성
      const imageUrl = `https://drive.google.com/uc?export=view&id=${file.data.id}`;

      console.log("File uploaded and shared successfully");
      res.send({
        message: "File uploaded and shared successfully",
        webViewLink: updatedFile.data.webViewLink,
        webContentLink: updatedFile.data.webContentLink,
        imageUrl: imageUrl,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send(error.message);
    }
  },
  // 이미지 인식 API
  postOpenAIAnalysisImg: async (req, res) => {
    try {
      const { name, mimeType, data, pUid } = req.body;
      // data:
      const [type, imageBase64] = data.split(",");

      // 이미지를 OpenAI API로 전송하여 인식 및 텍스트 생성
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "해당 이미지의 유저의 표정을 분석해줘. 유저가 보이지 않는다면 이미지를 설명해줘.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `${type},${imageBase64}`,
                },
              },
            ],
          },
        ],
      });

      res.json({ message: response.choices[0].message.content });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to process the image" });
    }
  },
  // 기분 훈련 저장 API
  postOpenAIMoodDataSave: async (req, res) => {
    const { data } = req.body;
    console.log(data);
    let parseData, parsepUid; // Parsing 변수

    try {
      // json 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const {
        pUid,
        type,
        mood_name,
        mood_cognitive_score,
        mood_todo_list,
        mood_talk_list,
      } = parseData;

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.status(400).json({ message: "No pUid input value - 400" });
      }

      // No type => return
      if (!type) {
        console.log("No type input value - 400");
        return res.status(400).json({ message: "No type input value - 400" });
      }

      // pUid default값 설정
      parsepUid = pUid;

      console.log(
        `기분 훈련 저장 API /openAI/calendar Path 호출 - pUid: ${parsepUid}`
      );

      const table = Ella_Training_Table_Info["Mood"].table;
      const attribute = Ella_Training_Table_Info["Mood"].attribute;

      let update_query, update_value;

      // 1. SELECT User Mood Table Data
      const select_query = `SELECT * FROM ${table} WHERE ${attribute.fKey} = '${parsepUid}' ORDER BY created_at DESC LIMIT 1;`;
      const select_data = await fetchUserData(connection_AI, select_query);

      // console.log(select_data[0]);

      // TODO - Mood Table INSERT || UPDATE

      // 타입별 query, value 삽입
      switch (type) {
        case "first":
          const insert_query = `INSERT INTO ${table} (${attribute.fKey}, ${attribute.attr1}, ${attribute.attr2}, ${attribute.attr3}, ${attribute.attr6}) VALUES (?, ?, ?, ?, ?);`;
          console.log(insert_query);
          const insert_value = [
            parsepUid,
            1,
            mood_name,
            mood_cognitive_score,
            "Ella",
          ];
          console.log(insert_value);
          if (false) {
            connection_AI.query(
              insert_query,
              insert_value,
              (error, rows, fields) => {
                if (error) console.log(error);
                else console.log("Mood First Insert Success!");
              }
            );
          }
          break;
        case "second":
          update_query = `UPDATE ${table} SET ${attribute.attr1} = ?, ${attribute.attr4} = ? WHERE ${attribute.pKey} = ?`;
          console.log(update_query);
          update_value = [
            2,
            JSON.stringify(mood_todo_list),
            select_data[0].mood_idx,
          ];
          console.log(update_value);
          connection_AI.query(
            update_query,
            update_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("Mood Second Update Success!");
            }
          );
          break;
        case "third":
          update_query = `UPDATE ${table} SET ${attribute.attr1} = ?, ${attribute.attr5} = ? WHERE ${attribute.pKey} = ?`;
          console.log(update_query);
          update_value = [
            3,
            JSON.stringify(mood_talk_list),
            select_data[0].mood_idx,
          ];
          console.log(update_value);
          connection_AI.query(
            update_query,
            update_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("Mood Third Update Success!");
            }
          );
          break;
        case "fourth":
          update_query = `UPDATE ${table} SET ${attribute.attr1} = ? WHERE ${attribute.pKey} = ?`;
          console.log(update_query);
          update_value = [4, select_data[0].mood_idx];
          console.log(update_value);
          connection_AI.query(
            update_query,
            update_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("Mood Fourth Update Success!");
            }
          );
          break;
      }
      return res.json({ message: "Mood Data Save Success!" });
    } catch (err) {
      console.error(err);
      res.json({
        message: "Server Error",
      });
    }
  },
  // 기분 훈련 데이터 Load API
  postOpenAIMoodDataLoad: async (req, res) => {
    const { data } = req.body;
    // console.log(data);
    let parseData, parsepUid; // Parsing 변수

    try {
      // json 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const { pUid } = parseData;

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.status(400).json({ message: "No pUid input value - 400" });
      }

      // pUid default값 설정
      parsepUid = pUid;

      console.log(`기분 훈련 Data Load API 호출 - pUid: ${parsepUid}`);

      // TODO - Mood Table Select
      if (false) {
        // Mood Table 명시
        const table = Ella_Training_Table_Info["Mood"].table;
        const attribute = Ella_Training_Table_Info["Mood"].attribute;
        // Mood Table User 조회
        const select_query = `SELECT * FROM ${table} WHERE ${attribute.fKey} = '${parsepUid}' ORDER BY created_at DESC LIMIT 1;`;
        const select_data = await fetchUserData(connection_AI, select_query);
        // case.1 - Row가 없거나 mood_round_idx값이 4일 경우: 기분관리 프로그램을 시작하는 인원. { mood_round_idx: 0, mood_name: "" } 반환
        if (!select_data[0] || select_data[0].mood_round_idx === 4)
          return res.json({ mood_round_idx: 0, mood_name: "" });
        // case.2 - Row가 있을 경우: 기분관리 프로그램을 진행했던 인원. { mood_round_idx: data.mood_round_idx, mood_name: data.mood_name } 반환
        else {
          return res.json({
            mood_round_idx: select_data[0].mood_round_idx,
            mood_name: select_data[0].mood_name,
          });
        }
      }

      // dummy data (임시)
      return res.json({ mood_round_idx: 0, mood_name: "" });
    } catch (err) {
      console.error(err);
      res.json({
        message: "Server Error",
      });
    }
  },
};

const ellaMoodController = {
  // 훈련 트레이너 - 엘라 (New)
  postOpenAIEllaMoodTraning: async (req, res) => {
    const { data } = req.body;
    // console.log(data);
    let parseData,
      parseMessageArr = [],
      parsepUid; // Parsing 변수
    let promptArr = []; // 삽입 Prompt Array

    try {
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const {
        messageArr,
        pUid,
        code,
        mood_situation,
        mood_thought,
        mood_todo_list,
        mood_talk_list,
      } = parseData;

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.json({ message: "No pUid input value - 400" });
      }
      // No type => return
      if (!code) {
        console.log("No code input value - 400");
        return res.json({ message: "No type input value - 400" });
      }
      // No type => return
      if (!messageArr) {
        console.log("No messageArr input value - 400");
        return res.json({ message: "No messageArr input value - 400" });
      }

      // pUid default값 설정
      parsepUid = pUid;
      console.log(`엘라 훈련 API 호출 - pUid: ${parsepUid}`);

      promptArr.push(persona_prompt_lala_v5); // 엘라 페르소나

      // code 매칭 프롬프트 삽입
      switch (code) {
        case "emotion":
          promptArr.push({
            role: "system",
            content: `유저가 마지막으로 한 말에 공감하되, 절대 질문으로 문장을 끝내지 않는다.`,
          });
          parseMessageArr = [...messageArr];
          break;
        case "situation":
          promptArr.push({
            role: "system",
            content: `아래 문장에 기초하여 유저에게 상황을 바꿀 방법을 생각해보게 한다.
            '''
            ${mood_situation}
            '''
            예시: '~할 때 ~를 만난다고 했어. 이 상황을 바꿀 방법이 있을까?'
            `,
          });
          parseMessageArr = [...messageArr];
          break;
        case "solution":
          promptArr.push({
            role: "system",
            content: `user가 잘 말하면 격려해준다. user가 말하지 않은 해결 방법을 하나 말해준다. 초등학교 6학년이 할 수 있는 방법이어야 한다.
            예시: '~해보면 어떨까?'
            `,
          });
          parseMessageArr = [...messageArr];
          break;
        case "thought":
          promptArr.push({
            role: "system",
            content: `아래 문장에 기초해서 다른 관점을 생각해보도록 한다.
            '''
            ${mood_thought}
            '''
            예시: '그건 정말 그래. 그런데 다르게도 생각해볼 수 있을까?'`,
          });
          parseMessageArr = [...messageArr];
          break;
        case "another":
          promptArr.push({
            role: "system",
            content: `User응답에 반응한 뒤 상황을 다른 관점으로는 어떻게 볼 수 있는지를 한 가지 제시한다. 
            "~해보는 것도 좋을 것 같아" `,
          });
          parseMessageArr = [...messageArr];
          break;
        case "listing":
          promptArr.push({
            role: "system",
            content: `아래 3개의 문장은 유저가 작성한 Todo List이다. 
보기좋게 다듬어서 목록 형식으로 나열한다. 
Todo List가 아니라고 판단되면 제외한다.
'''
1. ${mood_todo_list[0]}
2. ${mood_todo_list[1]}
3. ${mood_todo_list[2]}
'''
반드시 목록 형식으로 작성되어야 한다.`,
          });

          break;
        case "talking":
          promptArr.push({
            role: "system",
            content: `아래 3개의 문장은 유저가 mood_name에게 하고싶은 말이다.
보기좋게 다듬어서 목록 형식으로 나열한다.
'''
1. ${mood_talk_list[0]}
2. ${mood_talk_list[1]}
3. ${mood_talk_list[2]}
'''
반드시 목록 형식으로 작성되어야 한다.`,
          });
          break;
      }

      // console.log(promptArr);

      const response = await openai.chat.completions.create({
        messages: [...promptArr, ...parseMessageArr],
        model: "gpt-4o", // gpt-4-turbo, gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      const message = {
        message: response.choices[0].message.content,
      };

      return res.status(200).json(message);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Server Error - 500 Bad Gateway" + err.message,
      });
    }
  },
  // 기분 훈련 저장 API
  postOpenAIMoodDataSave: async (req, res) => {
    const { data } = req.body;
    // console.log(data);
    let parseData, parsepUid; // Parsing 변수

    try {
      // json 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const {
        pUid,
        type,
        mood_name,
        mood_cognitive_score,
        mood_todo_list,
        mood_talk_list,
      } = parseData;

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.status(400).json({ message: "No pUid input value - 400" });
      }

      // No type => return
      if (!type) {
        console.log("No type input value - 400");
        return res.status(400).json({ message: "No type input value - 400" });
      }

      // pUid default값 설정
      parsepUid = pUid;

      console.log(
        `기분 훈련 저장 API /openAI/calendar Path 호출 - pUid: ${parsepUid}`
      );

      const table = Ella_Training_Table_Info["Mood"].table;
      const attribute = Ella_Training_Table_Info["Mood"].attribute;

      let update_query, update_value;

      // 1. SELECT User Mood Table Data
      const select_query = `SELECT * FROM ${table} WHERE ${attribute.fKey} = '${parsepUid}' ORDER BY created_at DESC LIMIT 1;`;
      const select_data = await fetchUserData(connection_AI, select_query);

      // console.log(select_data[0]);

      // TODO - Mood Table INSERT || UPDATE

      // 타입별 query, value 삽입
      switch (type) {
        case "first":
          const insert_query = `INSERT INTO ${table} (${attribute.fKey}, ${attribute.attr1}, ${attribute.attr2}, ${attribute.attr3}, ${attribute.attr6}) VALUES (?, ?, ?, ?, ?);`;
          // console.log(insert_query);
          const insert_value = [
            parsepUid,
            1,
            mood_name,
            mood_cognitive_score,
            "Ella",
          ];
          // console.log(insert_value);
          // LOCK - 2024.08.19 이후 해제 (1회기 Insert Query)
          if (false) {
            connection_AI.query(
              insert_query,
              insert_value,
              (error, rows, fields) => {
                if (error) console.log(error);
                else console.log("Mood First Insert Success!");
              }
            );
          }
          break;
        case "second":
          update_query = `UPDATE ${table} SET ${attribute.attr1} = ?, ${attribute.attr4} = ? WHERE ${attribute.pKey} = ?`;
          // console.log(update_query);
          update_value = [
            2,
            JSON.stringify(mood_todo_list),
            select_data[0].mood_idx,
          ];
          // console.log(update_value);
          connection_AI.query(
            update_query,
            update_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("Mood Second Update Success!");
            }
          );
          break;
        case "third":
          update_query = `UPDATE ${table} SET ${attribute.attr1} = ?, ${attribute.attr5} = ? WHERE ${attribute.pKey} = ?`;
          // console.log(update_query);
          update_value = [
            3,
            JSON.stringify(mood_talk_list),
            select_data[0].mood_idx,
          ];
          // console.log(update_value);
          connection_AI.query(
            update_query,
            update_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("Mood Third Update Success!");
            }
          );
          break;
        case "fourth":
          update_query = `UPDATE ${table} SET ${attribute.attr1} = ? WHERE ${attribute.pKey} = ?`;
          // console.log(update_query);
          update_value = [4, select_data[0].mood_idx];
          // console.log(update_value);
          connection_AI.query(
            update_query,
            update_value,
            (error, rows, fields) => {
              if (error) console.log(error);
              else console.log("Mood Fourth Update Success!");
            }
          );
          break;
      }
      return res.json({ message: "Mood Data Save Success!" });
    } catch (err) {
      console.error(err);
      res.json({
        message: "Server Error",
      });
    }
  },
  // 기분 훈련 데이터 Load API
  postOpenAIMoodDataLoad: async (req, res) => {
    const { data } = req.body;
    // console.log(data);
    let parseData, parsepUid; // Parsing 변수

    try {
      // json 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const { pUid } = parseData;

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.status(400).json({ message: "No pUid input value - 400" });
      }

      // pUid default값 설정
      parsepUid = pUid;

      console.log(`기분 훈련 Data Load API 호출 - pUid: ${parsepUid}`);

      // LOCK - 2024.08.19 이후 해제 (Mood Table Select)
      if (false) {
        // Mood Table 명시
        const table = Ella_Training_Table_Info["Mood"].table;
        const attribute = Ella_Training_Table_Info["Mood"].attribute;
        // Mood Table User 조회
        const select_query = `SELECT * FROM ${table} WHERE ${attribute.fKey} = '${parsepUid}' ORDER BY created_at DESC LIMIT 1;`;
        const select_data = await fetchUserData(connection_AI, select_query);
        // case.1 - Row가 없거나 mood_round_idx값이 4일 경우: 기분관리 프로그램을 시작하는 인원. { mood_round_idx: 0, mood_name: "" } 반환
        if (!select_data[0] || select_data[0].mood_round_idx === 4)
          return res.json({ mood_round_idx: 0, mood_name: "" });
        // case.2 - Row가 있을 경우: 기분관리 프로그램을 진행했던 인원. { mood_round_idx: data.mood_round_idx, mood_name: data.mood_name } 반환
        else {
          return res.json({
            mood_round_idx: select_data[0].mood_round_idx,
            mood_name: select_data[0].mood_name,
          });
        }
      }
      // dummy data (임시)
      res.json({ mood_round_idx: 0, mood_name: "" });
    } catch (err) {
      console.error(err);
      res.json({
        message: "Server Error",
      });
    }
  },
};

const openAIController_Regercy = {
  // (Regercy) 자율 상담 AI
  postOpenAIChattingNew: async (req, res) => {
    const { messageArr } = req.body;
    console.log("자율 상담 API /message Path 호출");
    let parseMessageArr;

    try {
      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      const user_name = "예나";

      // parseMessageArr.push({
      //   role: "user",
      //   content: `문제 해결이 아닌 공감 위주의 답변을 30자 이내로 작성하되, 종종 해결책을 제시해줘`,
      // });

      const response = await openai.chat.completions.create({
        messages: [
          base_pupu,
          {
            role: "system",
            content: `user의 이름은 '${user_name}'입니다`,
          },
          ...parseMessageArr,
        ],
        model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
        // temperature: 0.2,
      });
      // gpt-4-turbo 모델은 OpenAI 유료고객(Plus 결제 회원) 대상으로 사용 권한 지급
      // console.log(response.choices[0]);

      const message = { message: response.choices[0].message.content };
      console.log([
        ...parseMessageArr,
        { role: "assistant", content: message.message },
      ]);
      res.json(message);
    } catch (err) {
      console.error(err.error);
      res.json(err);
    }
  },
  // (Regercy) 테스트 결과 기반 상담 AI. 성격 검사
  postOpenAIPersnalTestResultConsulting: async (req, res) => {
    const { messageArr, testResult } = req.body;
    console.log("성격 검사 반영 API /consulting_persnal Path 호출");

    let parseMessageArr,
      parseTestResult = {};
    // console.log(messageArr);

    // messageArr가 문자열일 경우 json 파싱
    if (typeof messageArr === "string") {
      parseMessageArr = JSON.parse(messageArr);
    } else parseMessageArr = [...messageArr];

    if (typeof testResult === "string") {
      parseTestResult = JSON.parse(messageArr);
    } else if (!testResult) {
      // default 검사 결과
      parseTestResult.persnal = "IFPE";
    } else parseTestResult.persnal = testResult;

    // console.log(persnal_short[parseTestResult.persnal]);

    try {
      const response = await openai.chat.completions.create({
        temperature: 1,
        messages: [
          base_pupu,
          // 성격검사결과 반영 Prompt
          {
            role: "system",
            content: `
              user의 성격은 ${persnal_short[parseTestResult.persnal]}
              assistant는 user의 성격을 이미 알고 있습니다. 유저의 성격을 반영하여 대화를 진행해주세요.
              다음 문단은 user의 성격검사 결과에 따른 전문가의 양육 코칭 소견입니다. 
              '''
              ${persnal_long[parseTestResult.persnal]}
              '''
              해당 소견을 참조하여 답변을 생성해주세요.
              `,
          },
          ...parseMessageArr,
        ],
        model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-1106, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      // console.log(response.choices[0]);

      const message = { message: response.choices[0].message.content };
      res.send(message);
    } catch (err) {
      // console.error(err.error);
      res.send(err);
    }
  },
  // (Regercy) 테스트 결과 기반 상담 AI. 정서행동 검사 - 학교생활 V1
  postOpenAIEmotionTestResultConsulting: async (req, res) => {
    const { messageArr } = req.body;
    // console.log("anxiety_depression");
    console.log("정서행동 검사 반영 상담 API /consulting_emotion Path 호출");
    // console.log(messageArr);

    let parseMessageArr,
      parseTestResult = {};

    parseTestResult.emotional_behavior = {
      adjust_school: 8,
      peer_relationship: -1,
      family_relationship: -1,
      overall_mood: -1,
      unrest: -1,
      depressed: -1,
      physical_symptoms: 7,
      focus: -1,
      hyperactivity: -1,
      aggression: -1,
      self_awareness: -1,
    };

    // console.log(JSON.stringify(parseTestResult.emotional_behavior));

    try {
      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      const response = await openai.chat.completions.create({
        messages: [
          // Base Prompt
          base_pupu,
          // 정서행동결과 반영 Prompt
          // {
          //   role: "user",
          //   content: `
          //   다음에 오는 문단은 아동의 정서행동검사의 척도에 대한 설명입니다.
          //   '''
          //   ${behavioral_rating_scale}
          //   '''
          //   다음에 오는 문단은 아동의 정서행동검사 척도에 대한 기준입니다.
          //   score 값에 따라 위험/주의/경고 3가지 기준으로 나뉘어집니다.
          //   '''
          //   ${behavioral_rating_standard}
          //   '''
          //   다음에 오는 문단은 아동의 정서행동검사 결과입니다.
          //   객체의 각 변수값을 score에 대입합니다. 값이 -1일 경우 무시합니다.
          //   '''
          //   ${JSON.stringify(parseTestResult.emotional_behavior)}
          //   '''
          //   해당 결과를 반영하여 답변을 생성해주세요.
          //   `,
          // },
          ...parseMessageArr,
        ],
        model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-1106, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      // console.log(response.choices[0]);

      const message = { message: response.choices[0].message.content };
      console.log([
        ...parseMessageArr,
        { role: "assistant", content: message.message },
      ]);
      res.send(message);
    } catch (err) {
      // console.error(err.error);
      res.send(err);
    }
  },
  // (Regercy) 테스트 결과 기반 상담 AI. 정서행동 검사 - 학교생활 V2
  postOpenAIEmotionTestResultConsultingV2: async (req, res) => {
    const { messageArr, pUid } = req.body;
    console.log(
      "정서행동 검사- 학교생활 V2 반영 상담 API /consulting_emotion_v2 Path 호출"
    );
    let parseMessageArr, parsepUid; // Parsing 변수
    let test_prompt_content; // 심리 검사 결과 문장 저장 변수

    try {
      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      // pUid default값 설정
      parsepUid = pUid ? pUid : "njy95";
      // console.log(parsepUid);

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

      const user_table = "soyes_ai_Ebt_School"; // DB Table Name
      const user_attr = {
        pKey: "uid",
        // attr1: "",
      }; // DB Table Attribue

      const select_query = `SELECT * FROM ${user_table} WHERE ${user_attr.pKey}='${parsepUid}'`; // Select Query
      const ebt_school_data = await fetchUserData(connection_AI, select_query);

      // console.log(ebt_school_data[0]);
      delete ebt_school_data[0].uid; // uid 속성 삭제
      // Attribute의 값이 2인 요소의 배열 필터링
      const problem_attr_arr = Object.keys(ebt_school_data[0]);
      const problem_attr_nameArr = problem_attr_arr.filter(
        (el) => el.includes("question") && ebt_school_data[0][el] === 2
      );

      // 문답 개수에 따른 시나리오 문답 투척
      // Attribute의 값이 0인 요소가 없는 경우
      if (problem_attr_nameArr.length === 0) {
        test_prompt_content = "";

        console.log(test_prompt_content);
      } else {
        // 점수가 0인 값들 중 랜덤 문항 도출
        // const random_index = Math.floor(
        //   Math.random() * problem_attr_nameArr.length
        // );
        // // console.log(random_index);
        // const random_question = problem_attr_nameArr[random_index];
        // const selected_question = ebt_Question[random_question];
        // console.log(selected_question);

        test_prompt_content = problem_attr_nameArr
          .map((el) => ebt_School_Result[el])
          .join(" ");

        console.log(test_prompt_content);
      }

      /* 개발자 의도 질문 - N번째 문답에 대한 답변을 개발자가 임의로 지정 */

      // 유저 첫 질문 답변 - 정서행동검사 실시했음을 언급
      if (parseMessageArr.length === 1 && test_prompt_content) {
        parseMessageArr.push({
          role: "user",
          content: `마지막 질문에 대해 답변한 뒤, 내가 정서행동검사를 실시했음을 언급해줘. 해결책은 제시하지 말아줘.`,
        });
      }
      // 유저 네번째 질문 답변 - 정서행동검사 솔루션 제공
      if (parseMessageArr.length === 5 && test_prompt_content) {
        parseMessageArr.push({
          role: "user",
          content: `마지막 질문에 대해 답변한 뒤, 심리 검사 결과에 대한 해결책을 자연스럽게 추천해줘. 해결책을 이미 추천했다면 다른 해결책을 추천해줘.`,
        });
      }

      const response = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `다음에 오는 문단은 user의 정서행동검사 결과입니다.
              '''
              ${test_prompt_content}
              '''
              위 문단에 아무 내용이 없다면 user의 심리 상태는 문제가 없습니다.
              `,
          },
          base_pupu,
          ...parseMessageArr,
        ],
        model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
        // temperature: 1.2,
      });
      // gpt-4-turbo 모델은 OpenAI 유료고객(Plus 결제 회원) 대상으로 사용 권한 지급
      // console.log(response.choices[0]);

      const message = { message: response.choices[0].message.content };
      console.log([
        ...parseMessageArr,
        { role: "assistant", content: message.message },
      ]);
      res.json(message);
    } catch (err) {
      console.error(err.error);
      res.json(err);
    }
  },
  // (Regercy) 테스트 결과 기반 상담 AI. 정서행동, 성격검사, 진로검사 - V1 (박사님 프롬프트)
  postOpenAITestResultConsultingV1: async (req, res) => {
    const { EBTData } = req.body;

    console.log("Test 결과 반영 검사- V1 상담 API /consulting_lala Path 호출");
    let parseEBTdata, parseMessageArr, parsepUid; // Parsing 변수
    let promptArr = []; // 삽입 Prompt Array
    // let prevChat_flag = true; // 이전 대화 내역 유무

    // EBT 반영 Class 정의
    // const EBT_classArr = ["School", "Friend", "Family"];
    // const EBT_ObjArr = {
    //   School: { table: "soyes_ai_Ebt_School", result: ebt_School_Result },
    //   Friend: { table: "soyes_ai_Ebt_Friend", result: ebt_Friend_Result },
    //   Family: { table: "soyes_ai_Ebt_Family", result: ebt_Family_Result },
    // };

    try {
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { messageArr, pUid } = parseEBTdata;

      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      // pUid default값 설정
      parsepUid = pUid ? pUid : "njy95";
      // console.log(parsepUid);

      // 고정 삽입 프롬프트
      // promptArr.push(persona_prompt_lala2); // 페르소나 프롬프트 삽입
      // promptArr.push(info_prompt); // 유저 정보 프롬프트 삽입

      // 박사님 프롬프트 삽입
      if (parsepUid.includes("20240304_v2")) {
        console.log("test_prompt_20240304_v2 삽입");
        promptArr.push(test_prompt_20240304_v2);
      } else if (parsepUid.includes("20240305_v1")) {
        console.log("test_prompt_20240305_v1 삽입");
        promptArr.push(test_prompt_20240305_v1);
      } else {
        console.log("test_prompt_20240304 삽입");
        promptArr.push(test_prompt_20240304);
      }

      // let psy_testResult_promptArr_last = []; // 2점을 획득한 정서행동검사 문항을 저장하는 prompt

      // 해당 계정의 모든 정서행동검사 결과 DB에서 차출
      //     const psy_testResult_promptArr = EBT_classArr.map(async (ebt_class) => {
      //       const select_Ebt_School_result = await select_soyes_AI_Ebt_Table(
      //         EBT_ObjArr[ebt_class].table, // Table Name
      //         {
      //           pKey: "uid",
      //         }, // primary Key Name
      //         EBT_ObjArr[ebt_class].result, // EBT Question 11가지 분야 중 1개 (Table에 따라 결정)
      //         parsepUid // Uid
      //       );

      //       // console.log(select_Ebt_School_result);

      //       const psy_testResult_prompt = {
      //         role: "system",
      //         content: `다음에 오는 문단은 user의 ${ebt_class} 관련 심리검사 결과입니다.
      // '''
      // ${select_Ebt_School_result.testResult}
      // '''
      // 위 문단이 비어있다면 ${
      //   // DB Table의 값 유무에 따라 다른 프롬프트 입력
      //   !select_Ebt_School_result.ebt_school_data[0]
      //     ? "user는 심리검사를 진행하지 않았습니다."
      //     : "user의 심리검사 결과는 문제가 없습니다."
      // }`,
      //       };
      //       // console.log(psy_testResult_prompt);
      //       return psy_testResult_prompt;
      //     });

      //     // map method는 pending 상태의 promise를 반환하므로 Promise.all method를 사용하여 resolve 상태가 되기를 기다려준다.
      //     await Promise.all(psy_testResult_promptArr).then((prompt) => {
      //       psy_testResult_promptArr_last = [...prompt]; // resolve 상태로 반환된 prompt 배열을 psy_testResult_promptArr_last 변수에 복사
      //     });

      // console.log(psy_testResult_promptArr_last);

      /* 개발자 의도 질문 - N번째 문답에 대한 답변을 개발자가 임의로 지정 */

      // if (parseMessageArr.length) {
      //   // 심리 검사 결과 프롬프트 삽입
      //   console.log("심리 검사 결과 프롬프트 삽입");
      //   promptArr.push(...psy_testResult_promptArr_last);
      //   promptArr.push(psyResult_prompt);
      //   promptArr.push(solution_prompt);
      // }

      // if (parseMessageArr.length === 1) {
      //   // 고정 답변1 프롬프트 삽입
      //   console.log("고정 답변1 프롬프트 삽입");

      //   const random_class =
      //     EBT_classArr[Math.floor(Math.random() * EBT_classArr.length)];
      //   console.log(random_class);
      //   parseMessageArr.push({
      //     role: "user",
      //     content: `마지막 질문에 대해 1문장 이내로 답변한 뒤 (이해하지 못했으면 답변하지마), '너의 심리검사 결과를 봤어!'라고 언급하면서 ${random_class} 관련 심리검사 결과를 5문장 이내로 설명해줘. 이후 '검사 결과에 대해 더 궁금한점이 있니?'를 추가해줘.`,
      //   });
      //   promptArr.push({
      //     role: "system",
      //     content: `이번 문답은 예외적으로 6문장 이내로 답변을 생성합니다.`,
      //   });
      // }

      // if (parseMessageArr.length === 17 || parseMessageArr.length === 19) {
      //   // 솔루션 프롬프트 삽입
      //   console.log("솔루션 프롬프트 삽입");
      //   promptArr.push(solution_prompt);
      // }

      // 상시 삽입 프롬프트
      // promptArr.push(common_prompt); // 공통 프롬프트 삽입
      promptArr.push(completions_emotion_prompt); // 답변 이모션 넘버 확인 프롬프트 삽입

      // console.log(promptArr);

      const response = await openai.chat.completions.create({
        messages: [...promptArr, ...parseMessageArr],
        model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      let emotion = parseInt(response.choices[0].message.content.slice(-1));
      // console.log(emotion);

      const message = {
        message: response.choices[0].message.content.slice(0, -1),
        emotion,
      };
      console.log([
        ...parseMessageArr,
        { role: "assistant", content: message.message },
      ]);
      res.json(message);
    } catch (err) {
      console.error(err);
      res.json({
        message: "Server Error",
        emotion: 0,
      });
    }
  },
  // (Regercy) 정서멘토 모델 - 엘라
  postOpenAIConsultingLala_v1: async (req, res) => {
    const { EBTData } = req.body;
    // console.log(EBTData);
    let parseEBTdata, parseMessageArr, parsepUid; // Parsing 변수
    let promptArr = []; // 삽입 Prompt Array
    let testClass = "",
      testClass_cb = "";
    // let prevChat_flag = true; // 이전 대화 내역 유무

    // 응답에 헤더를 추가하는 메서드
    // res.header("Test_Header", "Success Header");
    // console.log(req.session.accessToken);

    try {
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { messageArr, pUid } = parseEBTdata;
      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.json({ message: "No pUid input value - 400" });
      }

      // pUid default값 설정
      parsepUid = pUid;
      console.log(
        `엘라 상담 API /consulting_emotion_lala Path 호출 - pUid: ${parsepUid}`
      );

      // 고정 삽입 프롬프트
      promptArr.push(persona_prompt_lala_v4); // 엘라 페르소나
      promptArr.push(info_prompt); // 유저관련 정보

      const lastUserContent =
        parseMessageArr[parseMessageArr.length - 1].content; // 유저 마지막 멘트

      // NO REQ 질문 처리. 10초 이상 질문이 없을 경우 Client 측에서 'NO REQUEST' 메시지를 담은 요청을 보냄. 그에 대한 처리
      if (lastUserContent.includes("NO REQ")) {
        console.log("NO REQUEST 전달");
        parseMessageArr.pop(); // 'NO REQUEST 질문 삭제'
        parseMessageArr.push(no_req_prompt);
        promptArr.push(sentence_division_prompt);

        const response = await openai.chat.completions.create({
          messages: [...promptArr, ...parseMessageArr],
          model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
        });

        res.json({
          message: response.choices[0].message.content,
          emotion: 0,
        });

        return;
      }

      /* 프롬프트 삽입 분기 */

      /* 심리 검사 결과 프롬프트 상시 삽입 */
      // 세션에 psy_testResult_promptArr_last 값이 없는 경우
      if (!req.session.psy_testResult_promptArr_last) {
        console.log("심리 검사 결과 프롬프트 삽입");
        let psy_testResult_promptArr_last = []; // 2점을 획득한 정서행동검사 문항을 저장하는 prompt

        // 해당 계정의 모든 정서행동검사 결과를 DB에서 차출
        const psy_testResult_promptArr = EBT_classArr.map(async (ebt_class) => {
          const select_Ebt_Result = await select_soyes_AI_Ebt_Table(
            EBT_Table_Info[ebt_class].table, // Table Name
            EBT_Table_Info[ebt_class].attribute,
            EBT_Table_Info[ebt_class].result, // EBT Question 11가지 분야 중 1개 (Table에 따라 결정)
            parsepUid // Uid
          );

          // console.log(select_Ebt_Result);

          const psy_testResult_prompt = {
            role: "system",
            content: `다음에 오는 문단은 user의 ${ebt_class} 관련 심리검사 결과입니다.
            '''
            ${select_Ebt_Result.testResult}
            '''
            위 문단이 비어있다면 ${
              // DB Table의 값 유무에 따라 다른 프롬프트 입력
              !select_Ebt_Result.ebt_school_data[0]
                ? "user는 심리검사를 진행하지 않았습니다."
                : "user의 심리검사 결과는 문제가 없습니다."
            }`,
          };
          // console.log(psy_testResult_prompt);
          return psy_testResult_prompt;
        });
        // map method는 pending 상태의 promise를 반환하므로 Promise.all method를 사용하여 resolve 상태가 되기를 기다려준다.
        await Promise.all(psy_testResult_promptArr).then((prompt) => {
          psy_testResult_promptArr_last = [...prompt]; // resolve 상태로 반환된 prompt 배열을 psy_testResult_promptArr_last 변수에 복사
        });

        // console.log(psy_testResult_promptArr_last);
        promptArr.push(...psy_testResult_promptArr_last);
        // DB 접근 최소화를 위해 세션에 psy_testResult_promptArr_last 값 저장
        req.session.psy_testResult_promptArr_last = [
          ...psy_testResult_promptArr_last,
        ];
      }
      // 세션에 psy_testResult_promptArr_last 값이 있는 경우
      else {
        console.log("세션 저장된 심리 검사 결과 프롬프트 삽입");
        promptArr.push(...req.session.psy_testResult_promptArr_last);
      }

      // 음악 명상 + 그림 명상 관련 솔루션 프롬프트
      promptArr.push(solution_prompt2);

      /* 검사 결과 분석 관련 멘트 감지 */
      if (
        test_result_ment.some((el) => {
          if (lastUserContent.includes(el.text)) {
            testClass = el.class; // 검사 분야 저장
            return true;
          } else return false;
        })
      ) {
        console.log(`정서행동검사 결과 - ${testClass} 분석 프롬프트 삽입`);
        // 감지된 분야 선택
        // const random_class = EBT_classArr[class_map[testClass]];
        const random_class = testClass;

        // 심리 결과 분석 프롬프트
        parseMessageArr.push({
          role: "user",
          content: `마지막 질문에 대해 1문장 이내로 답변한 뒤 (이해하지 못했으면 답변하지마), 
          '너의 심리검사 결과를 봤어!'라고 언급하면서 ${random_class} 관련 심리검사 결과를 분석한 아동의 심리 상태를 5문장 이내로 설명해줘.
          만약 심리 검사 결과를 진행하지 않았다면, 잘 모르겠다고 답변해줘.
          . 혹은 ? 같은 특수문자로 끝나는 각 마디 뒤에는 반드시 줄바꿈(\n)을 추가해줘.
          검사 결과가 있다면 답변 마지막에는 '검사 결과에 대해 더 궁금한점이 있니?'를 추가해줘.`,
        });
        promptArr.push({
          role: "system",
          content: `이번 문답은 예외적으로 6문장 이내로 답변을 생성합니다.`,
        });
        // 검사 분야 세션 추가. 해당 세션동안 검사 결과 분석은 1회만 진행되도록 세션 데이터 설정.
        req.session.ebt_class = random_class;
      }
      /* 인지행동 관련 멘트 감지 */
      // 인지행동 세션 데이터가 없고, 인지행동 검사 관련 멘트 감지
      else if (
        !req.session.cb_class &&
        cb_solution_ment.some((el) => {
          if (lastUserContent.includes(el.text)) {
            testClass_cb = el.class; // 인지 분야 저장
            return true;
          } else return false;
        })
      ) {
        // 고정 답변3 프롬프트 삽입 - 인지행동 치료 문제
        console.log("인지행동 치료 프롬프트 삽입");
        let cb_testArr;

        // 인지행동 문항 맵핑
        const cb_class_map = {
          school: cb_test_school,
          friend: cb_test_family,
          family: cb_test_friend,
          etc: cb_test_remain,
        };

        // 감지된 인지행동 문제 분야 선택
        cb_testArr = cb_class_map[testClass_cb];
        req.session.cb_class = testClass_cb;

        // 랜덤 문항 1개 선택
        const random_cb_index = Math.floor(Math.random() * cb_testArr.length);
        const random_cb_question = cb_testArr[random_cb_index];
        req.session.cb_question = random_cb_question;

        // console.log(random_cb_question);

        // 인지행동 문제 프롬프트
        parseMessageArr.push({
          role: "user",
          content: `마지막 질문에 대해 1문장 이내로 답변한 뒤 (이해하지 못했으면 답변하지마), 
          이후 '그 전에 우리 상황극 한 번 하자!' 라고 말한 뒤 다음 문단에 오는 인지행동 검사를 문제와 문항으로 나누어 user에게 제시해줘.

          ${random_cb_question.question}

          문항 앞에는 '1) 2) 3) 4)'같이 번호를 붙이고 점수는 제거해줘.
          답변 마지막에 '넌 이 상황에서 어떻게 할거야? 번호로 알려줘!'를 추가해줘.
          `,
        });
        promptArr.push({
          role: "system",
          content: `이번 문답은 예외적으로 8문장 이내로 답변을 생성합니다.`,
        });
      }
      /* 인지행동 세션 돌입 */
      // 인지행동 세션 데이터가 있는 경우
      else if (req.session.cb_class) {
        // 정답을 골랐을 경우
        if (lastUserContent.includes(req.session.cb_question.answer)) {
          console.log("인지행동 검사 정답 선택");
          parseMessageArr.push({
            role: "user",
            content: `'올바른 답을 골랐구나! 대단해!'를 말한 뒤 ${req.session.cb_question.answer}번 문항에 대한 견해를 2문장 이내로 답변해줘.`,
          });

          // 인지행동 관련 데이터 초기화
          delete req.session.cb_class;
          delete req.session.cb_question;
          delete req.session.cb_wrongCnt;
        }
        // 오답을 고를 경우
        else {
          console.log("인지행동 검사 오답 선택");
          // 오답 횟수 카운트
          if (!req.session.cb_wrongCnt) req.session.cb_wrongCnt = 1;
          else req.session.cb_wrongCnt++;

          // 오답 횟수 4회 미만
          if (req.session.cb_wrongCnt < 4) {
            parseMessageArr.push({
              role: "user",
              content: `'user'가 고른 문항에 대한 견해를 2문장 이내로 답변한 뒤, 마지막에는 '그치만 다시 한 번 생각해봐!' 를 추가해줘.
              (만약 문항을 고르지 않았다면 1문장 이내로 문제에 집중해달라고 'user'에게 부탁해줘. 이 때는 '그치만 다시 한 번 생각해봐!'를 추가하지마.)`,
            });
          }
          // 오답 횟수 4회 이상
          else {
            console.log("인지행동 검사 오답 4회 이상 선택 -> 정답 알려주기");
            parseMessageArr.push({
              role: "user",
              content: `'올바른 답은 ${req.session.cb_question.answer}번이였어!' 를 말한 뒤 마지막 ${req.session.cb_question.answer}번 문항에 대한 견해를 2문장 이내로 답변해줘.`,
            });

            // 인지행동 관련 데이터 초기화
            delete req.session.cb_class;
            delete req.session.cb_question;
            delete req.session.cb_wrongCnt;
          }
        }
      } else promptArr.push(sentence_division_prompt);

      /*
      // 답변 횟수 카운트
      if (!req.session.answerCnt || parseMessageArr.length === 1)
        req.session.answerCnt = 1;
      else if (req.session.answerCnt > 9) {
        // 답변 10회 이상 진행 시 세션 파괴
        req.session.destroy();
        res.clearCookie("connect.sid");
      } else req.session.answerCnt++;
      */

      // 상시 삽입 프롬프트
      promptArr.push(completions_emotion_prompt); // 답변 이모션 넘버 확인 프롬프트 삽입

      // console.log(promptArr);

      const response = await openai.chat.completions.create({
        messages: [...promptArr, ...parseMessageArr],
        model: "gpt-4-turbo", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      let emotion = parseInt(response.choices[0].message.content.slice(-1));
      console.log("emotion: " + emotion);

      const message = {
        message: response.choices[0].message.content.slice(0, -1),
        emotion,
      };
      // 대화 내역 로그
      console.log([
        ...parseMessageArr,
        { role: "assistant", content: message.message },
      ]);

      // 세션 확인 코드
      // console.log(req.session);

      res.status(200).json(message);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server Error - 500",
        emotion: 0,
      });
    }
  },
  // (Regercy) 정서멘토 모델 - 엘라
  postOpenAIConsultingLala_v2: async (req, res) => {
    const { EBTData } = req.body;
    // console.log(EBTData);
    let parseEBTdata, parseMessageArr, parsepUid; // Parsing 변수
    let promptArr = []; // 삽입 Prompt Array
    let userPrompt = []; // 삽입 User Prompt Array
    // let testClass = "",
    //   testClass_cb = "";

    try {
      if (typeof EBTData === "string") {
        parseEBTdata = JSON.parse(EBTData);
      } else parseEBTdata = EBTData;

      const { messageArr, pUid, type } = parseEBTdata;

      // No pUid => return
      if (!pUid) {
        console.log("No pUid input value - 400");
        return res.json({ message: "No pUid input value - 400" });
      }
      // No type => return
      if (!type) {
        console.log("No type input value - 400");
        return res.json({ message: "No type input value - 400" });
      }
      // No type => return
      if (!messageArr) {
        console.log("No messageArr input value - 400");
        return res.json({ message: "No messageArr input value - 400" });
      }

      // messageArr가 문자열일 경우 json 파싱
      if (typeof messageArr === "string") {
        parseMessageArr = JSON.parse(messageArr);
      } else parseMessageArr = [...messageArr];

      // pUid default값 설정
      parsepUid = pUid;
      console.log(
        `엘라 상담 API /consulting_emotion_lala Path 호출 - pUid: ${parsepUid}`
      );

      // 고정 삽입 프롬프트
      promptArr.push(persona_prompt_lala_v5); // 엘라 페르소나
      promptArr.push(info_prompt); // 유저관련 정보

      // const lastUserContent =
      //   parseMessageArr[parseMessageArr.length - 1].content; // 유저 마지막 멘트

      // NO REQ 질문 처리. 10초 이상 질문이 없을 경우 Client 측에서 'NO REQUEST' 메시지를 담은 요청을 보냄. 그에 대한 처리
      // if (lastUserContent.includes("NO REQ")) {
      //   console.log("NO REQUEST 전달");
      //   parseMessageArr.pop(); // 'NO REQUEST 질문 삭제'
      //   parseMessageArr.push(no_req_prompt);
      //   promptArr.push(sentence_division_prompt);

      //   const response = await openai.chat.completions.create({
      //     messages: [...promptArr, ...parseMessageArr],
      //     model: "gpt-4-0125-preview", // gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      //   });

      //   res.json({
      //     message: response.choices[0].message.content,
      //     emotion: 0,
      //   });

      //   return;
      // }

      // 대화 6회 미만 - 심리 상담 프롬프트 삽입
      if (parseMessageArr.length < 11) {
        console.log("심리 상담 프롬프트 삽입");
        promptArr.push(EBT_Table_Info[type].consult);
      }
      // 대화 6회 - 심리 상담 프롬프트 + 심리 상태 분석 프롬프트 삽입
      else if ((parseMessageArr.length + 1) % 12 === 0) {
        console.log("심리 상담 프롬프트 + 심리 요약 프롬프트 삽입");
        promptArr.push(EBT_Table_Info[type].consult);
        // 비교 분석용 EBT class 맵
        const compareTypeMap = {
          School: ["School", "Attention"], // 학업/성적 상담은 School, Attention 분석과 비교하여 해석.
          Friend: ["Friend", "Movement"],
          Family: ["Family"],
          Mood: ["Mood", "Unrest", "Sad", "Angry"],
          Health: ["Health"],
          Self: ["Self"],
        };

        let resolvedCompareEbtAnalysis; // EBT 분석을 담을 배열

        // TODO# select_soyes_AI_Ebt_Analyis 갱신 후 매개변수 조정 예정
        const compareEbtAnalysis = await compareTypeMap[type].map(
          async (ebtClass) => {
            return await select_soyes_AI_Ebt_Analyis(
              EBT_Table_Info[ebtClass],
              parsepUid
            );
          }
        );
        // Promise Pending 대기
        await Promise.all(compareEbtAnalysis).then((data) => {
          resolvedCompareEbtAnalysis = [...data]; // resolve 상태로 반환된 prompt 배열을 psy_testResult_promptArr_last 변수에 복사
        });
        // userPrompt 명령 추가
        userPrompt.push({
          role: "user",
          content: `아래는 user의 정서행동검사 결과야.
          '''
          ${resolvedCompareEbtAnalysis.map((data) => {
            const { ebtClass, analyisResult } = data;
            return `
            ${ebtClass}: { ${
              analyisResult === "NonTesting"
                ? `'정서행동검사 - ${analyisResult}'을 실시하지 않았습니다.`
                : analyisResult
            }}
            `;
          })}
          '''
          지금까지 대화를 기반으로 user의 심리 상태를 3문장으로 요약하고, 위 정서행동검사 결과와 비교하여 2문장으로 해석해줘.
            `,
        });
      }
      // 대화 7회 - 더미 데이터 반환 (7회마다)
      else if ((parseMessageArr.length + 1) % 14 === 0) {
        console.log("더미 데이터 반환 (클라이언트의 솔루션 획득 시점)");
        const message = {
          message: "Dummy Message",
          emotion: 0,
        };
        return res.status(200).json(message);
      }
      // 대화 8회 초과 - 심리 솔루션 프롬프트 삽입 || 기본 상담 프롬프트 삽입
      else {
        console.log(
          `심리 솔루션 프롬프트 삽입 - solution:${req.session.solution?.solutionClass}`
        );
        // 유저 마지막 멘트
        const lastUserContent =
          parseMessageArr[parseMessageArr.length - 1].content;
        // console.log(lastUserContent);

        // 컨텐츠 실시 여부 선택 세션 - 9*n회 문답에서 실시
        if (
          lastUserContent.includes("false") ||
          lastUserContent.includes("true")
        ) {
          // 컨텐츠를 실시할 경우
          if (lastUserContent.includes("true")) {
            let message = {
              message: "좋아! 그럼 명상에 집중해보자!",
              emotion: 0,
            };
            // 컨텐츠 종류에 따른 고정 멘트 반환
            switch (req.session?.solution?.solutionClass) {
              // 명상
              case "meditation":
                console.log(`명상 고정 멘트 반환`);
                message.message = "좋아! 그럼 명상에 집중해보자!";
                delete req.session.solution;
                return res.status(200).json(message);
              // 인지행동
              case "cognitive":
                console.log(`인지행동 고정 멘트 반환`);
                message.message = "좋아! 그럼 문제에 집중해보자!";
                delete req.session.solution;
                return res.status(200).json(message);
              // 디폴트(명상)
              default:
                console.log(`디폴트 멘트 반환`);
                message.message = "좋아! 그럼 디폴트에 집중해보자!";
                delete req.session.solution;
                return res.status(200).json(message);
            }
          }
          // 컨텐츠를 안할 경우 - 솔루션 세션 삭제
          else delete req.session.solution;
        }
        // 세션에 솔루션 관련 프롬프트가 있는 경우는 삽입
        if (req.session.solution?.prompt)
          promptArr.push(req.session.solution.prompt);

        // 8회 이후의 답변은 막아두기
        // req.session.solution
        //   ? promptArr.push(req.session.solution.prompt)
        //   : promptArr.push(EBT_Table_Info[type].solution);

        // 솔루션 세션이 아닌 경우 기본 상담 프롬프트 삽입
        promptArr.push(EBT_Table_Info[type].consult);
      }

      /* 
      // 검사 결과 분석 관련 멘트 감지
      if (
        test_result_ment.some((el) => {
          if (lastUserContent.includes(el.text)) {
            testClass = el.class; // 검사 분야 저장
            return true;
          } else return false;
        })
      ) {
        console.log(`정서행동검사 결과 - ${testClass} 분석 프롬프트 삽입`);
        // 감지된 분야 선택
        // const random_class = EBT_classArr[class_map[testClass]];
        const random_class = testClass;

        // 심리 결과 분석 프롬프트
        parseMessageArr.push({
          role: "user",
          content: `마지막 질문에 대해 1문장 이내로 답변한 뒤 (이해하지 못했으면 답변하지마), 
          '너의 심리검사 결과를 봤어!'라고 언급하면서 ${random_class} 관련 심리검사 결과를 분석한 아동의 심리 상태를 5문장 이내로 설명해줘.
          만약 심리 검사 결과를 진행하지 않았다면, 잘 모르겠다고 답변해줘.
          . 혹은 ? 같은 특수문자로 끝나는 각 마디 뒤에는 반드시 줄바꿈(\n)을 추가해줘.
          검사 결과가 있다면 답변 마지막에는 '검사 결과에 대해 더 궁금한점이 있니?'를 추가해줘.`,
        });
        promptArr.push({
          role: "system",
          content: `이번 문답은 예외적으로 6문장 이내로 답변을 생성합니다.`,
        });
        // 검사 분야 세션 추가. 해당 세션동안 검사 결과 분석은 1회만 진행되도록 세션 데이터 설정.
        req.session.ebt_class = random_class;
      }
      // 인지행동 관련 멘트 감지
      // 인지행동 세션 데이터가 없고, 인지행동 검사 관련 멘트 감지
      else if (
        !req.session.cb_class &&
        cb_solution_ment.some((el) => {
          if (lastUserContent.includes(el.text)) {
            testClass_cb = el.class; // 인지 분야 저장
            return true;
          } else return false;
        })
      ) {
        // 고정 답변3 프롬프트 삽입 - 인지행동 치료 문제
        console.log("인지행동 치료 프롬프트 삽입");
        let cb_testArr;

        // 인지행동 문항 맵핑
        const cb_class_map = {
          school: cb_test_school,
          friend: cb_test_family,
          family: cb_test_friend,
          etc: cb_test_remain,
        };

        // 감지된 인지행동 문제 분야 선택
        cb_testArr = cb_class_map[testClass_cb];
        req.session.cb_class = testClass_cb;

        // 랜덤 문항 1개 선택
        const random_cb_index = Math.floor(Math.random() * cb_testArr.length);
        const random_cb_question = cb_testArr[random_cb_index];
        req.session.cb_question = random_cb_question;

        // console.log(random_cb_question);

        // 인지행동 문제 프롬프트
        parseMessageArr.push({
          role: "user",
          content: `마지막 질문에 대해 1문장 이내로 답변한 뒤 (이해하지 못했으면 답변하지마), 
          이후 '그 전에 우리 상황극 한 번 하자!' 라고 말한 뒤 다음 문단에 오는 인지행동 검사를 문제와 문항으로 나누어 user에게 제시해줘.

          ${random_cb_question.question}

          문항 앞에는 '1) 2) 3) 4)'같이 번호를 붙이고 점수는 제거해줘.
          답변 마지막에 '넌 이 상황에서 어떻게 할거야? 번호로 알려줘!'를 추가해줘.
          `,
        });
        promptArr.push({
          role: "system",
          content: `이번 문답은 예외적으로 8문장 이내로 답변을 생성합니다.`,
        });
      }
      // 인지행동 세션 돌입
      // 인지행동 세션 데이터가 있는 경우
      else if (req.session.cb_class) {
        // 정답을 골랐을 경우
        if (lastUserContent.includes(req.session.cb_question.answer)) {
          console.log("인지행동 검사 정답 선택");
          parseMessageArr.push({
            role: "user",
            content: `'올바른 답을 골랐구나! 대단해!'를 말한 뒤 ${req.session.cb_question.answer}번 문항에 대한 견해를 2문장 이내로 답변해줘.`,
          });

          // 인지행동 관련 데이터 초기화
          delete req.session.cb_class;
          delete req.session.cb_question;
          delete req.session.cb_wrongCnt;
        }
        // 오답을 고를 경우
        else {
          console.log("인지행동 검사 오답 선택");
          // 오답 횟수 카운트
          if (!req.session.cb_wrongCnt) req.session.cb_wrongCnt = 1;
          else req.session.cb_wrongCnt++;

          // 오답 횟수 4회 미만
          if (req.session.cb_wrongCnt < 4) {
            parseMessageArr.push({
              role: "user",
              content: `'user'가 고른 문항에 대한 견해를 2문장 이내로 답변한 뒤, 마지막에는 '그치만 다시 한 번 생각해봐!' 를 추가해줘.
              (만약 문항을 고르지 않았다면 1문장 이내로 문제에 집중해달라고 'user'에게 부탁해줘. 이 때는 '그치만 다시 한 번 생각해봐!'를 추가하지마.)`,
            });
          }
          // 오답 횟수 4회 이상
          else {
            console.log("인지행동 검사 오답 4회 이상 선택 -> 정답 알려주기");
            parseMessageArr.push({
              role: "user",
              content: `'올바른 답은 ${req.session.cb_question.answer}번이였어!' 를 말한 뒤 마지막 ${req.session.cb_question.answer}번 문항에 대한 견해를 2문장 이내로 답변해줘.`,
            });

            // 인지행동 관련 데이터 초기화
            delete req.session.cb_class;
            delete req.session.cb_question;
            delete req.session.cb_wrongCnt;
          }
        }
      } else promptArr.push(sentence_division_prompt);
      */

      // 상시 삽입 프롬프트
      // promptArr.push(completions_emotion_prompt); // 답변 이모션 넘버 확인 프롬프트 삽입

      // console.log(promptArr);

      const response = await openai.chat.completions.create({
        messages: [...promptArr, ...parseMessageArr, ...userPrompt],
        model: "gpt-4o", // gpt-4-turbo, gpt-4-0125-preview, gpt-3.5-turbo-0125, ft:gpt-3.5-turbo-1106:personal::8fIksWK3
      });

      // let emotion = parseInt(response.choices[0].message.content.slice(-1));
      // console.log("emotion: " + emotion);

      const message = {
        message: response.choices[0].message.content,
        emotion: 0,
      };
      // 대화 내역 로그
      // console.log([
      //   ...parseMessageArr,
      //   { role: "assistant", content: response.choices[0].message.content },
      //   // response.choices[0].message.content,
      // ]);

      // 엘라 심리 분석 DB 저장
      if (parseMessageArr.length === 11) {
        const table = Consult_Table_Info["Analysis"].table;
        const attribute = Consult_Table_Info["Analysis"].attribute;

        // DB에 Row가 없을 경우 INSERT, 있으면 지정한 속성만 UPDATE
        const duple_query = `INSERT INTO ${table} (${attribute.pKey}, ${attribute.attr1}) VALUES (?, ?) ON DUPLICATE KEY UPDATE
          ${attribute.attr1} = VALUES(${attribute.attr1});`;

        const duple_value = [parsepUid, JSON.stringify(message)];

        connection_AI.query(duple_query, duple_value, (error, rows, fields) => {
          if (error) console.log(error);
          else console.log("Ella Consult Analysis UPDATE Success!");
        });

        // 엘라 유저 분석 내용 Session 저장
        req.session.ella_analysis = message.message;
      }
      return res.status(200).json(message);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Server Error - 500 Bad Gateway" + err.message,
        emotion: 0,
      });
    }
  },
};

module.exports = {
  openAIController,
  ellaMoodController,
  // openAIController_Regercy,
};
