export const OPERATION_META = {
  addition: {
    id: "addition",
    label: "Addition",
    operator: "+",
    prompt: "Help your pet collect the right treats.",
    route: "/pet-feeding-addition"
  },
  subtraction: {
    id: "subtraction",
    label: "Subtraction",
    operator: "-",
    prompt: "Help your pet share the right treats.",
    route: "/pet-feeding-subtraction"
  }
};

export const DIFFICULTIES = [
  {
    id: "within-10",
    label: "Within 10",
    detail: "A calm start",
    max: 10,
    healthDrain: 0.7,
    wrongDamage: 7,
    correctHeal: 4,
    color: "mint"
  },
  {
    id: "within-15",
    label: "Within 15",
    detail: "A little more stretch",
    max: 15,
    healthDrain: 1.45,
    wrongDamage: 10,
    correctHeal: 3,
    color: "amber"
  },
  {
    id: "within-18",
    label: "Within 18",
    detail: "Quick thinking",
    max: 18,
    healthDrain: 2.3,
    wrongDamage: 14,
    correctHeal: 2,
    color: "coral"
  }
];

export const GAME_MODES = [
  {
    id: "practice",
    label: "Practice",
    detail: "No clock. Keep caring for your pet.",
    duration: null,
    icon: "practice"
  },
  {
    id: "test",
    label: "Test mode",
    detail: "60 seconds to collect as many treats as you can.",
    duration: 60,
    icon: "test"
  },
  {
    id: "speedrun",
    label: "Speedrun",
    detail: "30 seconds. Questions grow as you score.",
    duration: 30,
    icon: "speedrun"
  }
];

export const PETS = [
  {
    id: "cat",
    name: "Milo",
    species: "Cat",
    color: "#e77b5d",
    accent: "#f6c26b",
    note: "Curious and quick"
  },
  {
    id: "bunny",
    name: "Pip",
    species: "Bunny",
    color: "#d8a84e",
    accent: "#f8df8a",
    note: "Gentle and bright"
  },
  {
    id: "puppy",
    name: "Scout",
    species: "Puppy",
    color: "#5a9e9d",
    accent: "#d5e7d5",
    note: "Brave and loyal"
  }
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function difficultyFor(id) {
  return DIFFICULTIES.find((difficulty) => difficulty.id === id) || DIFFICULTIES[0];
}

function modeFor(id) {
  return GAME_MODES.find((mode) => mode.id === id) || GAME_MODES[0];
}

function getQuestionMax(difficultyId, modeId, score) {
  const difficulty = difficultyFor(difficultyId);
  if (modeId !== "speedrun") return difficulty.max;
  return Math.min(24, difficulty.max + Math.floor(score / 3) * 2);
}

function makeOptions(answer, max) {
  const candidates = new Set([answer]);
  for (let distance = 1; distance <= 8 && candidates.size < 4; distance += 1) {
    if (answer - distance >= 0) candidates.add(answer - distance);
    if (answer + distance <= max) candidates.add(answer + distance);
  }
  while (candidates.size < 4) candidates.add(randomInt(0, max));
  const distractors = [...candidates].filter((candidate) => candidate !== answer);
  return shuffle([answer, ...shuffle(distractors).slice(0, 3)]);
}

export function createQuestion(operation, difficultyId, modeId, score = 0, previousKey = "") {
  const max = getQuestionMax(difficultyId, modeId, score);
  let first = 1;
  let second = 1;
  let answer = 2;
  let key = "";

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (operation === "addition") {
      first = randomInt(1, Math.max(1, max - 1));
      second = randomInt(1, Math.max(1, max - first));
      answer = first + second;
    } else {
      first = randomInt(2, Math.max(2, max));
      second = randomInt(1, Math.max(1, first - 1));
      answer = first - second;
    }

    key = `${first}${operation === "addition" ? "+" : "-"}${second}`;
    if (key !== previousKey) break;
  }

  return {
    id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key,
    first,
    second,
    operator: operation === "addition" ? "+" : "-",
    answer,
    options: makeOptions(answer, max)
  };
}

function nextEventId(state) {
  return state.eventId + 1;
}

function getWinnerId(players) {
  if (players.length < 2) return null;
  const alivePlayers = players.filter((player) => player.health > 0);
  if (alivePlayers.length === 1) return alivePlayers[0].id;
  const highestScore = Math.max(...players.map((player) => player.score));
  const leaders = players.filter((player) => player.score === highestScore);
  return leaders.length === 1 ? leaders[0].id : null;
}

function makePlayer(id, label, petId, operation, difficultyId, modeId) {
  return {
    id,
    label,
    petId,
    health: 100,
    score: 0,
    treats: 0,
    correct: 0,
    wrong: 0,
    lockoutTicks: 0,
    feedback: null,
    question: createQuestion(operation, difficultyId, modeId)
  };
}

export function createSession({ operation, difficultyId, modeId, twoPlayer, petIds }) {
  const mode = modeFor(modeId);
  const players = [
    makePlayer("player-1", "Player 1", petIds[0], operation, difficultyId, modeId)
  ];

  if (twoPlayer) {
    players.push(makePlayer("player-2", "Player 2", petIds[1], operation, difficultyId, modeId));
  }

  return {
    phase: "playing",
    operation,
    difficultyId,
    modeId,
    twoPlayer,
    timeRemaining: mode.duration,
    elapsed: 0,
    eventId: 0,
    gameOverReason: null,
    winnerId: null,
    players
  };
}

export function answerSession(state, playerId, selectedAnswer) {
  if (!state || state.phase !== "playing") return { state, result: "inactive" };

  const currentPlayer = state.players.find((player) => player.id === playerId);
  if (!currentPlayer || currentPlayer.lockoutTicks > 0) return { state, result: "locked" };

  const difficulty = difficultyFor(state.difficultyId);
  const isCorrect = selectedAnswer === currentPlayer.question.answer;
  const token = nextEventId(state);
  const nextPlayer = {
    ...currentPlayer,
    feedback: {
      type: isCorrect ? "correct" : "wrong",
      token,
      selectedAnswer,
      correctAnswer: currentPlayer.question.answer
    },
    health: isCorrect
      ? Math.min(100, currentPlayer.health + difficulty.correctHeal)
      : Math.max(0, currentPlayer.health - difficulty.wrongDamage),
    score: isCorrect ? currentPlayer.score + 1 : currentPlayer.score,
    treats: isCorrect ? currentPlayer.treats + 1 : currentPlayer.treats,
    correct: isCorrect ? currentPlayer.correct + 1 : currentPlayer.correct,
    wrong: isCorrect ? currentPlayer.wrong : currentPlayer.wrong + 1,
    lockoutTicks: isCorrect ? 0 : 2,
    question: isCorrect
      ? createQuestion(state.operation, state.difficultyId, state.modeId, currentPlayer.score + 1, currentPlayer.question.key)
      : currentPlayer.question
  };

  const players = state.players.map((player) => player.id === playerId ? nextPlayer : player);
  const playerFainted = nextPlayer.health <= 0;
  const nextState = {
    ...state,
    eventId: token,
    players,
    phase: playerFainted ? "gameover" : state.phase,
    gameOverReason: playerFainted ? "health" : state.gameOverReason,
    winnerId: playerFainted ? getWinnerId(players) : state.winnerId
  };

  return { state: nextState, result: isCorrect ? "correct" : "wrong", token };
}

export function advanceAfterWrong(state, playerId, token) {
  if (!state || state.phase !== "playing") return state;
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player || !player.feedback || player.feedback.token !== token || player.feedback.type !== "wrong") return state;

  const nextPlayer = {
    ...player,
    lockoutTicks: 0,
    feedback: null,
    question: createQuestion(state.operation, state.difficultyId, state.modeId, player.score, player.question.key)
  };

  return {
    ...state,
    players: state.players.map((entry) => entry.id === playerId ? nextPlayer : entry)
  };
}

export function tickSession(state) {
  if (!state || state.phase !== "playing") return state;

  const difficulty = difficultyFor(state.difficultyId);
  const nextTime = state.timeRemaining === null ? null : Math.max(0, state.timeRemaining - 1);
  const players = state.players.map((player) => ({
    ...player,
    health: Math.max(0, player.health - difficulty.healthDrain),
    lockoutTicks: Math.max(0, player.lockoutTicks - 1)
  }));
  const fainted = players.some((player) => player.health <= 0);
  const timedOut = nextTime !== null && nextTime <= 0;

  if (fainted || timedOut) {
    return {
      ...state,
      phase: "gameover",
      timeRemaining: nextTime,
      elapsed: state.elapsed + 1,
      players,
      gameOverReason: fainted ? "health" : "time",
      winnerId: fainted ? getWinnerId(players) : getWinnerId(players)
    };
  }

  return {
    ...state,
    timeRemaining: nextTime,
    elapsed: state.elapsed + 1,
    players
  };
}

export function getDifficulty(id) {
  return difficultyFor(id);
}

export function getMode(id) {
  return modeFor(id);
}

export function getPet(id) {
  return PETS.find((pet) => pet.id === id) || PETS[0];
}

export function formatTime(seconds) {
  if (seconds === null) return "No clock";
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}
