// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log("Serwer WebSocket działa na porcie 8080");

let questions = [];
let currentQuestionIndex = 0;
let answers = [];

// Funkcja wysyłająca komunikat do wszystkich graczy
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', ws => {
  console.log('Nowy gracz połączony');

  // Wyślij aktualne pytania i indeks, jeśli gra już trwa
  if (questions.length > 0) {
    ws.send(JSON.stringify({
      type: "SYNC_GAME",
      questions,
      currentQuestionIndex,
      answers
    }));
  }

  ws.on('message', message => {
    const data = JSON.parse(message);

    switch (data.type) {

      // Dodawanie pytania
      case 'addQuestion':
        if (!questions.includes(data.text)) {
          questions.push(data.text);
          broadcast({ type: 'addQuestion', text: data.text });
        }
        break;

      // Start gry
      case 'startGame':
        questions = data.questions;
        currentQuestionIndex = 0;
        answers = [];
        broadcast({ type: 'PHASE_QUESTIONS_END', questions });
        // Wyślij pierwsze pytanie
        broadcast({ type: 'NEW_QUESTION', question: questions[currentQuestionIndex] });
        break;

      // Odpowiedź gracza
      case 'answer':
        answers.push(data.payload);
        broadcast({ type: 'answer', payload: data.payload });
        break;

      // Następne pytanie
      case 'nextQuestion':
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          broadcast({ type: 'NEW_QUESTION', question: questions[currentQuestionIndex] });
        } else {
          broadcast({ type: 'SHOW_RESULTS' });
        }
        break;
    }
  });

  ws.on('close', () => console.log('Gracz rozłączony'));
});
