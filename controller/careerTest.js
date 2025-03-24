// MySQL 접근
const mysql = require("mysql");
const { dbconfig_ai } = require("../DB/database");

// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();

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
async function fetchUserData(connection, query, values = []) {
  try {
    return await queryAsync(connection, query, values);
  } catch (error) {
    console.error("DB Error:", error);
    throw error;
  }
}

const portCareerTestController = {
  // Career Test Data Save
  postCareerTestDataSave: async (req, res) => {
    // console.log("Career Test Save API 호출");
    let parseData;
    try {
      const { data } = req.body;

      // 파싱. Client JSON 데이터
      parseData = typeof data === "string" ? JSON.parse(data) : data;

      const {
        pUid,
        gradeType, // String. HIGH or LOW
        careerResult1st, // Int. 1위 직업
        careerResult2nd, // Int. 2위 직업
        careerResult3rd, // Int. 3위 직업
        careertypeA, // Int
        careertypeC, // Int
        careertypeE, // Int
        careertypeI, // Int
        careertypeR, // Int
        careertypeS, // Int
      } = parseData;

      // 필수 항목 체크
      if (!pUid) return res.status(400).json({ message: "Missing uid (pUid)" });

      if (!["HIGH", "LOW"].includes(gradeType)) {
        return res
          .status(400)
          .json({ message: "Invalid gradeType (must be 'HIGH' or 'LOW')" });
      }

      // 저장 쿼리 실행
      const insertQuery = `
        INSERT INTO soyes_ai_CT (
          uid,
          ct_grade_type,
          ct_career_first,
          ct_career_second,
          ct_career_third,
          ct_type_a,
          ct_type_c,
          ct_type_e,
          ct_type_i,
          ct_type_r,
          ct_type_s
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        pUid,
        gradeType,
        careerResult1st,
        careerResult2nd,
        careerResult3rd,
        careertypeA,
        careertypeC,
        careertypeE,
        careertypeI,
        careertypeR,
        careertypeS,
      ];

      await fetchUserData(connection_AI, insertQuery, values);

      return res
        .status(200)
        .json({ message: "Career test data saved successfully" });
    } catch (err) {
      delete err.headers;
      console.error(err);
      return res.status(500).json({
        message: `Server Error : ${err.message}`,
      });
    }
  },
};

module.exports = {
  portCareerTestController,
};
