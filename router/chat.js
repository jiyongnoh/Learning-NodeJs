const express = require("express");
const http = require("http");

const router = express.Router();
const server = http.createServer(router);
const socketIO = require("socket.io");
const port = 4001;
const io = socketIO(server, {
  // 소켓 서버 cors 처리. 소켓 서버도 서버이므로 따로 cors 처리를 해야함.
  cors: { origin: "*" },
});

// DB 호출
// const mysql = require("mysql");
// const { dbconfig } = require("../DB/database");
// const connection = mysql.createConnection(dbconfig);
// connection.connect();

// 로그인 관련 정보 저장
const login_ids = {}; // { clientId : socketId }
let rooms = {
  "1번방": { roomId: "1번방", leader: "leader01", count: 0 },
  "2번방": { roomId: "2번방", leader: "leader02", count: 0 },
  "3번방": { roomId: "3번방", leader: "leader03", count: 0 },
  "4번방": { roomId: "4번방", leader: "leader04", count: 0 },
  "5번방": { roomId: "5번방", leader: "leader05", count: 0 },
};

// 소켓 연결 이벤트. 연결 발생 시 콜백 실행
io.on("connection", (socket) => {
  console.log("연결 완료");
  // 고정 룸 5개 생성
  io.emit("room2", rooms);
  // login 이벤트
  socket.on("login", (data) => {
    // 현재 접속한 클라이언트의 id와 해당 소켓의 id를 저장
    login_ids[data.id] = socket.id;
    socket.login_id = data.id;
    console.log(login_ids);
  });
  // logout 이벤트
  socket.on("logout", (data) => {
    // 현재 접속한 클라이언트의 id에 해당하는 socketId를 삭제
    delete login_ids[data.id];
    console.log(login_ids);
  });
  // room 생성
  socket.on("createRoom", (data) => {
    console.log("createRoom", data); // data = { roomId, leaderId }
    const { roomId, leaderId } = data;
    if (!leaderId) {
      console.log("Login 해주세요");
    }
    // 방을 만든 적이 없는 경우
    else if (!Object.values(rooms).find((id) => id === leaderId)) {
      socket.join(roomId); // 방 생성
      rooms[roomId] = { leader: leaderId, count: 1 };

      io.emit("room", rooms);
      socket.emit("joinRoom", data);
    } else socket.emit("rejectCreateRoom");
  });
  // room 삭제
  socket.on("deleteRoom", (data) => {
    console.log("deleteRoom", data); // data = { roomId, leaderId }
    const { roomId, leaderId } = data;

    // 방장인 경우
    if (rooms[roomId].leader === leaderId) {
      socket.leave(roomId); // 방 떠나기
      delete rooms[roomId]; // 방 삭제

      io.to(data.roomId).leaveAll;
      io.emit("leaveRoom", data);
      io.emit("room", rooms);
    } else socket.emit("rejectDeleteRoom");
  });
  // room 참가
  socket.on("joinRoom", (data) => {
    const { roomId, count } = data;
    rooms[roomId].count = count;
    console.log(socket.size);
    if (rooms[roomId].count < 2) {
      rooms[roomId].count++;

      console.log("joinRoom", rooms[roomId]);

      socket.join(roomId);
      socket.emit("joinRoom", data);
      io.emit("room2", rooms);
    } else socket.emit("rejectJoinRoom");
  });
  // room 나가기
  socket.on("leaveRoom", (data) => {
    const { roomId, count } = data;
    rooms[roomId].count = count; // room 인원 수 갱신
    if (rooms[roomId].count >= 0) {
      rooms[roomId].count--;

      console.log("leaveRoom", rooms[roomId]);

      socket.leave(roomId);
      socket.emit("leaveRoom");
      io.emit("room2", rooms);
    }
  });
  // 전체 메세지 처리
  socket.on("msg", (data) => {
    // 소켓에 연결된 모든 client에게 msg 트리거를 발생시키고 data를 전달.
    io.emit("msg", data);
  });
  // 1:1 메세지 처리
  socket.on("privateMsg", (data) => {
    // 1:1 메세지 전송
    const receiverSocketId = login_ids[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("privateMsg", data); // 상대에게 보내기
    } else {
      console.log("Null ReceiverId");
    }
    socket.emit("privateMsg", data); // 나한테 보내기
  });
  // room 메세지 처리
  socket.on("groupMsg", (data) => {
    console.log("groupMsg", data); // data = { roomId, nickname, date, msg}

    const { roomId, nickname, date, msg } = data;

    // 그룹 채팅 전송
    io.to(data.roomId).compress(true).emit("groupMsg", data);

    // 그룹 채팅 DB에 저장
    // connection.query(
    //   `INSERT INTO chatting VALUES (NULL, '${
    //     nickname !== "ㅇㅇ" ? nickname : "NULL"
    //   }', '${msg}', '2023-08-03', '${roomId}')`,
    //   (error) => {
    //     if (error) throw console.log(error.message);
    //     console.log("DB 저장 성공");
    //   }
    // );
  });
  // 새로고침 처리
  socket.on("fixRoom", () => {
    rooms = {
      "1번방": { roomId: "1번방", leader: "leader01", count: 0 },
      "2번방": { roomId: "2번방", leader: "leader02", count: 0 },
      "3번방": { roomId: "3번방", leader: "leader03", count: 0 },
      "4번방": { roomId: "4번방", leader: "leader04", count: 0 },
      "5번방": { roomId: "5번방", leader: "leader05", count: 0 },
    };
    Object.values(rooms).forEach((room) => {
      const { roomId } = room;
      socket.leave(roomId);
    });
    socket.emit("leaveRoom");
    console.log(rooms);
    io.emit("room2", rooms);
  });
});

// 소켓 서버 실행. (app.js의 app과 다른 서버이므로 따로 실행해야한다)
server.listen(port, () => {
  console.log(`Socket server listening on port ${port}`);
});

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
