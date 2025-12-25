const WebSocket = require('ws');
const http = require('http');

// Tworzymy serwer HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>WebSocket Server is running!</h1>');
});

// Tworzymy serwer WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Nowy gracz połączył się!');
  
  // Wysyłanie wiadomości powitalnej do nowego gracza
  ws.send(JSON.stringify({ message: 'Witaj w grze!' }));

  // Odbieranie wiadomości od gracza
  ws.on('message', (message) => {
    console.log('Otrzymano wiadomość:', message);

    // Rozsyłanie wiadomości do wszystkich połączonych graczy
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Obsługuje zamknięcie połączenia
  ws.on('close', () => {
    console.log('Gracz rozłączył się');
  });
});

// Uruchomienie serwera na porcie 8080
server.listen(8080, () => {
  console.log('Serwer WebSocket działa na porcie 8080');
});
