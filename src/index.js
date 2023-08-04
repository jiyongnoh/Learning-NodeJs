"use strict";
const SERVER_URL = "http://localhost:4000";
const END_POINT = "http://localhost:4001";

// 소켓 연결
const socket = io.connect(END_POINT);

// 로그인 계정 저장 변수
let login_id = "";

// room 인원 확인 맵
let roomCounter = {}; // { roomId : int }

// 동물소리 핸들러
const submitHandler = () => {
  const name = document.querySelector("#name").value;
  fetch(`${SERVER_URL}/path/sound/${name}`, {
    headers: {
      "Content-Type": `application/json`,
      "ngrok-skip-browser-warning": "69420",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      document.querySelector("#board").innerHTML = data.sound;
    });
};
// 에러 메세지 핸들러
const errorHandler = (flag) => {
  fetch(`${SERVER_URL}/error/${flag}`, {
    headers: {
      "Content-Type": `application/json`,
      "ngrok-skip-browser-warning": "69420",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      document.querySelector("#board2").innerHTML = data;
    });
};
// 로그인 핸들러
const loginHandler = () => {
  const id = document.querySelector("#id").value;
  const pwd = document.querySelector("#pwd").value;

  fetch(`${SERVER_URL}/login`, {
    method: "POST",
    // content-type을 명시하지 않으면 json 파일인지 인식하지 못함
    headers: {
      "Content-Type": "application/json",
      // Authorization: document.cookies.accessToken,
      "ngrok-skip-browser-warning": "69420",
    },
    // 쿠키 관련 속성
    credentials: "include",
    body: JSON.stringify({
      id,
      pwd,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.querySelector("#board3").innerHTML = data;
      if (data === "Login Success") {
        socket.emit("login", { id });
        login_id = id;
      }
    });
};
// 로그아웃 핸들러
const logoutHandler = () => {
  fetch(`${SERVER_URL}/login/logout`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "69420",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      document.querySelector("#board3").innerHTML = data;
      socket.emit("logout", { id: login_id });
      login_id = "";
    });
};
// 전체 채팅
const msgHandler = () => {
  const msg = document.querySelector("#chat").value;
  // 채팅 메시지가 있을 경우만 실행
  if (msg) {
    const nickname = document.querySelector("#nickname").value;
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    // 소켓 서버에 msg 트리거 발생 및 데이터 전달.
    socket.emit("msg", {
      id: login_id ? login_id : "default",
      nickname,
      msg,
      time,
    });
    // 채팅 메시지 input 초기화
    document.querySelector("#chat").value = "";
  }
};
// 1:1 채팅
const msgHandler2 = () => {
  const msg = document.querySelector("#chat2").value;
  // 채팅 메시지가 있을 경우만 실행
  if (msg) {
    const receiverId = document.querySelector("#receiver").value;
    const nickname = document.querySelector("#nickname2").value;
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    // 소켓 서버에 msg 트리거 발생 및 데이터 전달.
    socket.emit("privateMsg", {
      senderId: login_id ? login_id : "default",
      receiverId,
      nickname: login_id ? nickname : "나",
      msg,
      time,
    });
    // 채팅 메시지 input 초기화
    document.querySelector("#chat2").value = "";
  }
};
// 그룹 채팅
const msgHandler3 = (roomId) => {
  const msg = document.querySelector("#messageInput").value;
  // 채팅 메시지가 있을 경우만 실행
  if (msg) {
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    // 소켓 서버에 msg 트리거 발생 및 데이터 전달.
    socket.emit("groupMsg", {
      roomId,
      nickname: login_id ? login_id : "ㅇㅇ",
      msg,
      time,
    });
    // 채팅 메시지 input 초기화
    document.querySelector("#messageInput").value = "";
  }
};
// 그룹 채팅 키핸들러
const msgKeyHandler3 = (e, roomId) => {
  const msg = document.querySelector("#messageInput").value;
  // 채팅 메시지가 있을 경우만 실행
  if (e.key === "Enter" && msg) {
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    // 소켓 서버에 msg 트리거 발생 및 데이터 전달.
    socket.emit("groupMsg", {
      roomId,
      nickname: login_id ? login_id : "ㅇㅇ",
      msg,
      time,
    });
    // 채팅 메시지 input 초기화
    document.querySelector("#messageInput").value = "";
  }
};
// 방 생성 핸들러
const createRoomHander = () => {
  const roomId = document.querySelector("#roomName").value;
  if (!login_id) alert("Login 하세요");
  else {
    socket.emit("createRoom", { roomId, leaderId: login_id });
    // socket.emit("joinRoom", { roomId });
  }
};
// 방 나가기 핸들러
const leaveRoomHander = (roomId) => {
  socket.emit("leaveRoom", { roomId, count: roomCounter[roomId] });
};
// 새로고침 핸들러
const fixHander = () => {
  roomCounter = {};
  socket.emit("fixRoom");
};

// msg 이벤트 등록. 서버의 msg 트리거 발동 시 실행. (receive)
socket.on("msg", (data) => {
  const { nickname, msg, time } = data;
  const wrapper = document.querySelector(".wrapper");
  // div 엘리먼트 생성
  const $chatting = document.createElement("div");
  // 다른 사용자의 메시지일 경우 색상 변경
  const myName = document.querySelector("#nickname").value;
  if (nickname !== myName) $chatting.style.color = "red";

  // div 엘리먼트에 소켓 서버로부터 받은 메시지 입력
  $chatting.innerText = `${nickname}: ${msg} (${time})`;

  // div 엘리먼트를 wrapper의 자식에 추가
  wrapper.appendChild($chatting);
});

socket.on("privateMsg", (data) => {
  const { senderId, nickname, msg, time } = data;
  const wrapper = document.querySelector(".wrapper2");
  const $chatting = document.createElement("div");
  // 다른 사용자의 메시지일 경우 색상 변경
  if (senderId !== login_id) $chatting.style.color = "red";

  // div 엘리먼트에 소켓 서버로부터 받은 메시지 입력
  $chatting.innerText = `${nickname}: ${msg} (${time})`;

  // div 엘리먼트를 wrapper의 자식에 추가
  wrapper.appendChild($chatting);
});

socket.on("groupMsg", (data) => {
  const { roomId, nickname, msg, time } = data;
  console.log(data.size);
  const wrapper = document.querySelector(".chat-box");

  const $chattingDiv = document.createElement("div");
  $chattingDiv.classList.add("chattingDiv");

  const $chatting = document.createElement("div");
  $chatting.classList.add("message");

  if (nickname !== login_id) {
    $chatting.classList.add("other-message");
    $chattingDiv.style.justifyContent = "left";
  } else {
    $chatting.classList.add("user-message");
    $chattingDiv.style.justifyContent = "right";
  }

  $chatting.innerText = `${nickname}: ${msg} (${time})`;
  $chattingDiv.appendChild($chatting);
  wrapper.appendChild($chattingDiv);
});

socket.on("room", (data) => {
  // room 이벤트 => 방이 갱신될 때 발생

  const roomContainer = document.querySelector(".roomContainer");
  roomContainer.innerHTML = "";
  for (let key of Object.keys(data)) {
    roomCounter[key] = data[key].count; // 방 인원 수 갱신
    console.log(roomCounter);
    const $room = document.createElement("div");
    const $deleteBtn = document.createElement("button");
    $room.innerText = `${key}`;
    $deleteBtn.innerText = "방 삭제";

    $room.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log(roomCounter[key]);
      socket.emit("joinRoom", { roomId: key, count: roomCounter[key] + 1 });
    });

    $deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      socket.emit("deleteRoom", { roomId: key, leaderId: login_id });
    });

    $room.appendChild($deleteBtn);
    roomContainer.appendChild($room);
  }
});

socket.on("room2", (data) => {
  // room 이벤트 => 방이 갱신될 때 발생

  const roomContainer = document.querySelector(".roomContainer");
  roomContainer.innerHTML = "";
  for (let value of Object.values(data)) {
    const { roomId, leader, count } = value;
    roomCounter[roomId] = count; // 방 인원 수 갱신

    const $room = document.createElement("div");
    $room.className = "room";
    $room.innerText = `${roomId} (${count}/2)`;

    $room.addEventListener("click", (e) => {
      e.stopPropagation();
      const chatContainer = document.querySelector(".chatContainer");
      if (!chatContainer.innerHTML) {
        socket.emit("joinRoom", { roomId, count: roomCounter[roomId] });
      }
    });

    roomContainer.appendChild($room);
  }
});

socket.on("joinRoom", (data) => {
  const { roomId } = data;
  roomCounter[roomId] = data.count; // 인원 수 갱신
  const chatContainer = document.querySelector(".chatContainer");

  chatContainer.innerHTML = `
    <div class="chat-container">
      <div class="chat-box" id="chatBox">
        <h3 id='roomName2'>${roomId}</h3>
      </div>
      <div class="input-box">
        <input
          type="text"
          id="messageInput"
          placeholder="메시지를 입력하세요..."
          onkeypress="msgKeyHandler3(event, '${roomId}')"
        />
        <button id="sendButton" onclick="msgHandler3('${roomId}')">전송</button>
        <button onclick="leaveRoomHander('${roomId}')">나가기</button>
      </div>
    </div>
  `;
});

socket.on("leaveRoom", () => {
  const chatContainer = document.querySelector(".chatContainer");

  chatContainer.innerHTML = ``;
});

socket.on("rejectCreateRoom", () => {
  alert("이미 방을 만든 유저입니다");
});

socket.on("rejectDeleteRoom", () => {
  alert("방장만 삭제 가능합니다");
});

socket.on("rejectJoinRoom", () => {
  alert("인원이 가득 찼어요ㅠ");
});
