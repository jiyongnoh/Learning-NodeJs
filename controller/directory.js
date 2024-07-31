const stream = require("stream");
// MySQL 접근
const mysql = require("mysql");
const { dbconfig_ai } = require("../DB/database");

// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();

const { Review_Table_Info } = require("../DB/database_table_info");

// 구글 권한 관련
const { google } = require("googleapis");

// google OAuth2Client 설정

// GCP IAM 서비스 계정 인증
const serviceAccount = {
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  project_id: process.env.GOOGLE_PROJECT_ID,
};

const auth_google_drive = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

// const userToImpersonate = "soyesnjy@gmail.com"; // 드라이브 접근을 허용한 사용자의 이메일
// const auth_google_drive = new google.auth.JWT(
//   serviceAccount.client_email,
//   null,
//   serviceAccount.private_key,
//   ["https://www.googleapis.com/auth/drive"],
//   userToImpersonate // 특정 사용자 대리 설정
// );

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

const directoryController = {
  // Directory READ
  getDirectoryDataRead: async (req, res) => {
    console.log("Directory READ API 호출");

    try {
      const directories = await fetchUserData(
        connection_AI,
        "SELECT * FROM directories"
      );
      const tracks = await fetchUserData(connection_AI, "SELECT * FROM tracks");
      // console.log({ directories, tracks }); // 로그
      return res.status(200).json({ directories, tracks });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  // Directory CREATE
  postDirectoryDataCreate: async (req, res) => {
    console.log(
      `Directory CREATE (Google Drive 음원 파일/디렉토리 업로드 API 호출)`
    );
    let parseData;
    try {
      const { data } = req.body;
      // json 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;
      // console.log(parseData);

      // file 생성인 경우
      if (parseData.type === "file") {
        const { trackName, mimeType, trackData, directoryId } = parseData;
        const [type, audioBase64] = trackData.split(",");

        const bufferStream = new stream.PassThrough();
        bufferStream.end(Buffer.from(audioBase64, "base64"));

        const fileMetadata = {
          name: trackName,
          // parents: ["1Uh3IItyYkTOW-t4qzT_8zpn2G9bp9nhC"], // 공유 폴더 ID를 입력하세요.
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
        // const updatedFile = await drive.files.get({
        //   fileId: file.data.id,
        //   fields: "id, webViewLink, webContentLink",
        // });

        // const fileUrl = ` https://lh3.googleusercontent.com/d/${file.data.id}`;
        // const fileUrl = `https://drive.google.com/uc?export=open&id=${file.data.id}`;
        // const fileUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media&key=${API_KEY}`;
        // const fileUrl = updatedFile.data.webViewLink;
        // const fileUrl = updatedFile.data.webContentLink;

        const fileUrl = `https://drive.google.com/file/d/${file.data.id}/preview`;

        connection_AI.query(
          "INSERT INTO directories (name, parent_id, type) VALUES (?, ?, ?)",
          [trackName, directoryId, "file"],
          (error, results) => {
            if (error) {
              console.error("Database error:", error);
              return res.status(500).json({ message: "Database error" });
            }
            const fileId = results.insertId;

            connection_AI.query(
              "INSERT INTO tracks (directory_id, url, title) VALUES (?, ?, ?)",
              [fileId, fileUrl, trackName],
              (error) => {
                if (error) {
                  console.error("Database error:", error);
                  return res.status(500).json({ message: "Database error" });
                }
                return res.status(200).json({
                  id: fileId,
                  name: trackName,
                  parent_id: directoryId,
                  type: "file",
                  url: fileUrl,
                });
              }
            );
          }
        );
      }
      // Directory 생성인 경우
      else if (parseData.type === "directory") {
        const { directoryName, directoryId, type } = parseData;

        connection_AI.query(
          "INSERT INTO directories (name, parent_id, type) VALUES (?, ?, ?)",
          [directoryName, directoryId || null, type],
          (error, results) => {
            if (error) {
              console.error("Database error:", error);
              return res.status(500).json({ message: "Database error" });
            }
            const directoryId = results.insertId;
            return res.status(200).json({
              id: directoryId,
              name: directoryName,
              parent_id: directoryId,
              type: "directory",
            });
          }
        );
      }
    } catch (error) {
      console.log(error);
      res.status(500).send(error.message);
    }
  },
  // Directory UPDATE
  postDirectoryDataUpdate: (req, res) => {
    console.log("ReviewData UPDATE API 호출");
    const { ReviewData } = req.body;
    let parseReviewData, parseEnteyID, parseContent;
    try {
      // 파싱. Client JSON 데이터
      if (typeof ReviewData === "string") {
        parseReviewData = JSON.parse(ReviewData);
      } else parseReviewData = ReviewData;

      const { content, entry_id } = parseReviewData;
      parseEnteyID = entry_id;
      parseContent = content;

      // 오늘 날짜 변환
      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      const day = ("0" + dateObj.getDate()).slice(-2);
      const date = `${year}-${month}-${day}`;

      // Review 테이블 및 속성 명시
      const review_table = Review_Table_Info.table;
      const review_attribute = Review_Table_Info.attribute;
      const review_pKey = "entry_id";

      // Query 명시. (Review 존재 확인용 Select Query)
      const review_select_query = `SELECT ${review_pKey} FROM ${review_table} WHERE ${review_pKey} = ${parseEnteyID}`;

      // Select Query
      connection_AI.query(review_select_query, [], (err, data) => {
        if (err) {
          console.log("Review_Log DB Select Fail!");
          console.log("Err sqlMessage: " + err.sqlMessage);
        } else {
          // entry_id에 해당되는 Review가 있을 경우
          if (data[0]) {
            // Review 갱신용 Update Query
            const review_update_query = `UPDATE ${review_table} SET ${review_attribute.attr2} = ? WHERE ${review_pKey} = ?`;
            const review_update_value = [parseContent, parseEnteyID];
            // Update Query
            connection_AI.query(
              review_update_query,
              review_update_value,
              (err) => {
                if (err) {
                  console.log("Review_Log DB Update Fail!");
                  console.log("Err sqlMessage: " + err.sqlMessage);
                } else {
                  console.log("Review_Log DB Update Success!");
                  res
                    .status(200)
                    .json({ message: "Review_Log DB Update Success!" });
                }
              }
            );
          }
          // entry_id에 해당되는 Review가 없을 경우
          else {
            console.log("Review_Log DB Non Review!");
            res.status(400).json({ message: "Review_Log DB Non Review!" });
          }
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // Directory DELETE
  deleteDirectoryDataDelete: (req, res) => {
    console.log("ReviewData DELETE API 호출");
    const { id } = req.params;

    try {
      const review_table = Review_Table_Info.table;
      const delete_query = `DELETE FROM ${review_table} WHERE entry_id = ?`;

      connection_AI.query(delete_query, [id], (err) => {
        if (err) {
          console.log("Review_Log DB Delete Fail!");
          console.log("Err sqlMessage: " + err.sqlMessage);
          res.json({ message: "Err sqlMessage: " + err.sqlMessage });
        } else {
          console.log("Review_Log DB Delete Success!");
          res.status(200).json({ message: "Review_Log DB Delete Success!" });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
};

module.exports = {
  directoryController,
};
