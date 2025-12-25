// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log("🟢 Serwer WebSocket działa na porcie 8080");

let questions = [];
let currentQuestionIndex = 0;
let answers = [];
let gameStarted = false;

// Funkcja wysyłająca komunikat do wszystkich graczy
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// Funkcja synchronizująca nowego gracza
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

      // Dodawanie pytania (tylko przed startem gry)
      case 'addQuestion':
        if (!gameStarted && !questions.includes(data.text)) {
          questions.push(data.text);
          broadcast({ type: 'addQuestion', text: data.text });
        }
        break;

      // Start gry
      case 'startGame':
        if (!gameStarted && questions.length > 0) {
          gameStarted = true;
          currentQuestionIndex = 0;
          answers = [];
          broadcast({ type: 'PHASE_QUESTIONS_END' });
          broadcast({ type: 'NEW_QUESTION', question: questions[currentQuestionIndex] });
        }
        break;

      // Odpowiedź gracza
      case 'answer':
        if (!gameStarted) return;
        answers.push(data.payload);
        broadcast({ type: 'answer', payload: data.payload });
        break;

      // Następne pytanie (tylko host lub sterujący)
      case 'nextQuestion':
        if (!gameStarted) return;
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          broadcast({ type: 'NEW_QUESTION', question: questions[currentQuestionIndex] });
        } else {
          broadcast({ type: 'SHOW_RESULTS' });
        }
        break;

      // Synchronizacja nowego gracza
      case 'syncRequest':
        syncGame(ws);
        break;
    }
  });

  ws.on('close', () => console.log('Gracz rozłączony'));
});
