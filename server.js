const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const QUESTIONS = [
  {
    q: "¿Por qué se celebra el Día de la Constitución Nacional el 1 de mayo?",
    options: [
      "Porque ese día se produjo la Revolución de Mayo.",
      "Porque en esa fecha de 1853 se sancionó y aprobó el texto original en Santa Fe.",
      "Porque conmemora la victoria en la Batalla de Caseros.",
      "Porque fue el día en que se firmó el Acuerdo de San Nicolás."
    ],
    correct: 1
  },
  {
    q: "¿Qué acuerdo importante firmaron las provincias tras la Batalla de Caseros en 1852?",
    options: [
      "El Pacto de San José de Flores.",
      "El Tratado del Pilar.",
      "El Acuerdo de San Nicolás.",
      "El Acuerdo de Buenos Aires."
    ],
    correct: 2
  },
  {
    q: "Según la Constitución, ¿en qué tres ramas se divide el poder para evitar abusos?",
    options: [
      "Poder Nacional, Provincial y Municipal.",
      "Poder Presidencial, Sindical y Militar.",
      "Poder Unitario y Federal.",
      "Poder Ejecutivo, Legislativo y Judicial."
    ],
    correct: 3
  },
  {
    q: "¿Qué ocurre en un país sin Constitución (Arbitrariedad)?",
    options: [
      "Genera inestabilidad y autoritarismo, dejando a los ciudadanos desprotegidos.",
      "Se garantizan reglas claras para la economía.",
      "Los ciudadanos obtienen libertad absoluta para hacer lo que quieran.",
      "El Estado protege más a los trabajadores."
    ],
    correct: 0
  },
  {
    q: "¿A partir de qué evento histórico surge la conmemoración del Día del Trabajador?",
    options: [
      "El inicio de la Revolución Industrial en Inglaterra.",
      "La creación del primer sindicato en Buenos Aires.",
      "Un acuerdo firmado en el Congreso Nacional.",
      "La Revuelta de Haymarket, reclamando la jornada de 8 horas."
    ],
    correct: 3
  },
  {
    q: "¿En qué año se celebró por primera vez el Día del Trabajador en Argentina?",
    options: [
      "En 1810.",
      "En 1890.",
      "En 1853.",
      "En 1945."
    ],
    correct: 1
  },
  {
    q: "Antes de los derechos laborales, ¿cómo eran las jornadas de trabajo?",
    options: [
      "De 12 a 16 horas diarias, sin descansos.",
      "De exactamente 8 horas, pero sin fines de semana libres.",
      "De 10 horas con una pausa garantizada para almorzar.",
      "A voluntad del trabajador según lo que quisiera cobrar."
    ],
    correct: 0
  },
  {
    q: "¿Cuáles son los tres derechos laborales básicos mencionados?",
    options: [
      "Aguinaldo, Vacaciones de invierno, Comedor gratuito.",
      "Derecho a huelga, Salario doble en feriados, Transporte gratis.",
      "Remuneración justa, Jornada limitada y descansos, Protección y seguridad social.",
      "Jornada de 6 horas, Obra social, Bonos mensuales."
    ],
    correct: 2
  },
  {
    q: "¿Qué es el 'Aguinaldo'?",
    options: [
      "El pago adicional que se recibe por hacer horas extras.",
      "Un premio económico solo para los mejores empleados del año.",
      "La indemnización que te pagan si te despiden sin causa.",
      "Un pago extra que se divide en dos cuotas (junio y diciembre)."
    ],
    correct: 3
  },
  {
    q: "¿Cuál es la función principal de los sindicatos en la actualidad?",
    options: [
      "Defender y mejorar las condiciones laborales y los derechos de los trabajadores.",
      "Contratar nuevos empleados para las fábricas y empresas.",
      "Decidir el salario de los trabajadores sin consultar al empleador.",
      "Organizar únicamente las protestas y marchas del 1 de mayo."
    ],
    correct: 0
  }
];

const QUESTION_TIME = 15; // seconds

const rooms = {};

function generateCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function calcPoints(timeLeft, rank) {
  // rank 0 = first to answer correctly
  const basePoints = Math.max(100, Math.round((timeLeft / QUESTION_TIME) * 900) + 100);
  const rankBonus = Math.max(0, 200 - rank * 50);
  return basePoints + rankBonus;
}

io.on('connection', (socket) => {
  // HOST creates a room
  socket.on('create_room', async (cb) => {
    const code = generateCode();
    rooms[code] = {
      host: socket.id,
      players: {},
      state: 'lobby',
      currentQ: -1,
      questionTimer: null,
      answersThisRound: 0,
      rankThisRound: 0,
      questionStart: 0,
    };
    socket.join(code);
    socket.roomCode = code;

    // Generate QR
    const url = `${socket.handshake.headers.origin || 'http://localhost:3000'}/?join=${code}`;
    const qr = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#1a1a2e', light: '#f0f0f0' } });

    cb({ code, qr, url });
  });

  // PLAYER joins a room
  socket.on('join_room', ({ code, name, character }, cb) => {
    const room = rooms[code];
    if (!room) return cb({ error: 'Sala no encontrada. Verificá el código.' });
    if (room.state !== 'lobby') return cb({ error: 'El juego ya comenzó. Esperá la próxima partida.' });
    if (Object.keys(room.players).length >= 8) return cb({ error: 'La sala está llena (máx. 8 jugadores).' });

    const nameTaken = Object.values(room.players).some(p => p.name.toLowerCase() === name.toLowerCase());
    if (nameTaken) return cb({ error: 'Ese nombre ya está en uso. Elegí otro.' });

    room.players[socket.id] = { name, character, score: 0, answers: [] };
    socket.join(code);
    socket.roomCode = code;
    socket.playerName = name;

    const playerList = Object.values(room.players).map(p => ({ name: p.name, character: p.character }));
    io.to(code).emit('player_joined', { players: playerList });
    cb({ ok: true });
  });

  // HOST starts game
  socket.on('start_game', () => {
    const room = rooms[socket.roomCode];
    if (!room || room.host !== socket.id) return;
    if (Object.keys(room.players).length < 1) return;

    room.state = 'playing';
    room.currentQ = -1;
    sendNextQuestion(socket.roomCode);
  });

  // PLAYER answers
  socket.on('answer', ({ answerIndex }) => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room || room.state !== 'question') return;

    const player = room.players[socket.id];
    if (!player) return;

    // Already answered?
    const lastAnswer = player.answers[player.answers.length - 1];
    if (lastAnswer && lastAnswer.q === room.currentQ) return;

    const timeLeft = Math.max(0, QUESTION_TIME - (Date.now() - room.questionStart) / 1000);
    const correct = answerIndex === QUESTIONS[room.currentQ].correct;
    let points = 0;

    if (correct) {
      points = calcPoints(timeLeft, room.rankThisRound);
      room.rankThisRound++;
      player.score += points;
    }

    player.answers.push({ q: room.currentQ, answer: answerIndex, correct, points });
    room.answersThisRound++;

    // Send feedback to THIS player
    socket.emit('answer_result', {
      correct,
      points,
      correctIndex: QUESTIONS[room.currentQ].correct,
      totalScore: player.score
    });

    // If all answered, advance early
    if (room.answersThisRound >= Object.keys(room.players).length) {
      clearTimeout(room.questionTimer);
      showResults(code);
    }
  });

  socket.on('disconnect', () => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;
    const room = rooms[code];

    if (room.host === socket.id) {
      io.to(code).emit('host_left');
      clearTimeout(room.questionTimer);
      delete rooms[code];
    } else {
      delete room.players[socket.id];
      const playerList = Object.values(room.players).map(p => ({ name: p.name, character: p.character }));
      io.to(code).emit('player_joined', { players: playerList });
    }
  });
});

function sendNextQuestion(code) {
  const room = rooms[code];
  if (!room) return;

  room.currentQ++;

  if (room.currentQ >= QUESTIONS.length) {
    // Game over
    room.state = 'finished';
    const leaderboard = Object.values(room.players)
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ rank: i + 1, name: p.name, character: p.character, score: p.score }));

    io.to(code).emit('game_over', { leaderboard });
    return;
  }

  const q = QUESTIONS[room.currentQ];
  room.state = 'question';
  room.answersThisRound = 0;
  room.rankThisRound = 0;
  room.questionStart = Date.now();

  io.to(code).emit('new_question', {
    questionIndex: room.currentQ,
    total: QUESTIONS.length,
    question: q.q,
    options: q.options,
    timeLimit: QUESTION_TIME
  });

  room.questionTimer = setTimeout(() => showResults(code), QUESTION_TIME * 1000);
}

function showResults(code) {
  const room = rooms[code];
  if (!room) return;

  room.state = 'results';
  const q = QUESTIONS[room.currentQ];
  const leaderboard = Object.values(room.players)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i + 1, name: p.name, character: p.character, score: p.score }));

  io.to(code).emit('round_results', {
    correctIndex: q.correct,
    correctAnswer: q.options[q.correct],
    leaderboard,
    questionIndex: room.currentQ,
    total: QUESTIONS.length
  });

  // Next question after 5 seconds
  setTimeout(() => sendNextQuestion(code), 5000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Quiz server corriendo en http://0.0.0.0:${PORT}`);
});
