const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let questions = [];
let remaining = [];
let answers = [];

io.on("connection", socket => {
  socket.on("addQuestion", q => {
    if (!questions.includes(q)) {
      questions.push(q);
    }
  });

  socket.on("startGame", () => {
    remaining = [...questions].sort(() => Math.random() - 0.5);
    sendNext();
  });

  socket.on("answer", data => {
    answers.push(data);
    sendNext();
  });

  function sendNext() {
    if (remaining.length === 0) {
      io.emit("end", answers);
      return;
    }
    io.emit("question", remaining.pop());
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running"));
