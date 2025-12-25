const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

// Serwujemy klienta
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, () => {
  console.log(`🌐 Serwer działa na porcie ${port}`);
});

// WebSocket
const wss = new WebSocket.Server({ server });

let questions = [];
let currentQuestionIndex = 0;
let answers = [];
let gameStarted = false;

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function syncGame(ws) {
  ws.send(JSON.stringify({
    type: 'SYNC_GAME',
    questions,
    currentQuestionIndex,
    answers,
    gameStarted
  }));
}

wss.on('connection', ws => {
  console.log('Nowy gracz połączony');
  syncGame(ws);

  ws.on('message', message => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'addQuestion':
        if (!gameStarted && !questions.includes(data.text)) {
          questions.push(data.text);
          broadcast({ type: 'addQuestion', text: data.text });
        }
        break;

      case 'startGame':
        if (!gameStarted && questions.length > 0) {
          gameStarted = true;
          currentQuestionIndex = 0;
          answers = [];
          broadcast({ type: 'PHASE_QUESTIONS_END' });
          broadcast({ type: 'NEW_QUESTION', question: questions[currentQuestionIndex] });
        }
        break;

      case 'answer':
        if (!gameStarted) return;
        answers.push(data.payload);
        broadcast({ type: 'answer', payload: data.payload });
        break;

      case 'nextQuestion':
        if (!gameStarted) return;
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          broadcast({ type: 'NEW_QUESTION', question: questions[currentQuestionIndex] });
        } else {
          broadcast({ type: 'SHOW_RESULTS' });
        }
        break;

      case 'syncRequest':
        syncGame(ws);
        break;
    }
  });

  ws.on('close', () => console.log('Gracz rozłączony'));
});
