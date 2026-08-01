export const LETTER_CASE_SESSION_ROUNDS = 5;

function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function weightedPick(items, weightFor, random = Math.random) {
  if (!items.length) return null;

  const weights = items.map((item) => Math.max(0.1, weightFor(item)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = random() * total;

  for (let index = 0; index < items.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return items[index];
  }

  return items[items.length - 1];
}

export function createLetterCaseStats(letters) {
  return Object.fromEntries(
    letters.map(({ letter }) => [letter, { correct: 0, wrong: 0 }])
  );
}

export function createLetterCaseState(letters) {
  return {
    status: "ready",
    roundNumber: 0,
    totalRounds: LETTER_CASE_SESSION_ROUNDS,
    round: null,
    correct: 0,
    wrong: 0,
    streak: 0,
    letterStats: createLetterCaseStats(letters),
    lastResult: null
  };
}

function roundConfig(roundNumber, random = Math.random) {
  if (roundNumber <= 2) {
    return { direction: "capital-to-small", choiceCount: 3 };
  }

  if (roundNumber <= 4) {
    return { direction: "small-to-capital", choiceCount: 4 };
  }

  return {
    direction: random() > 0.5 ? "capital-to-small" : "small-to-capital",
    choiceCount: 4
  };
}

function targetWeight(item, letterStats = {}) {
  const stats = letterStats[item.letter] || { correct: 0, wrong: 0 };
  const needsPractice = stats.wrong > stats.correct;
  const unseenBonus = stats.correct + stats.wrong === 0 ? 2 : 0;
  return 1 + (stats.wrong * 3) + unseenBonus + (needsPractice ? 2 : 0);
}

export function createLetterCaseRound({
  letters,
  letterStats,
  roundNumber,
  previousLetter = "",
  random = Math.random
}) {
  if (!letters.length) return null;

  const config = roundConfig(roundNumber, random);
  const freshTargets = letters.filter(({ letter }) => letter !== previousLetter);
  const targetPool = freshTargets.length ? freshTargets : letters;
  const target = weightedPick(targetPool, (item) => targetWeight(item, letterStats), random) || letters[0];
  const distractors = shuffle(
    letters.filter(({ letter }) => letter !== target.letter),
    random
  ).slice(0, config.choiceCount - 1);
  const choices = shuffle([target, ...distractors], random);

  return {
    id: `${roundNumber}-${target.letter}-${config.direction}`,
    targetLetter: target.letter,
    targetGlyph: config.direction === "capital-to-small" ? target.letter : target.letter.toLowerCase(),
    answerCase: config.direction === "capital-to-small" ? "small" : "capital",
    direction: config.direction,
    prompt: config.direction === "capital-to-small"
      ? "Cari huruf kecil untuk"
      : "Cari huruf besar untuk",
    choices: choices.map(({ letter }) => letter),
    word: target.word,
    emoji: target.emoji,
    choiceCount: config.choiceCount
  };
}

export function startLetterCaseSession(letters) {
  const baseState = createLetterCaseState(letters);
  const round = createLetterCaseRound({
    letters,
    letterStats: baseState.letterStats,
    roundNumber: 1
  });

  return {
    ...baseState,
    status: "answering",
    roundNumber: 1,
    round
  };
}

export function resolveLetterCaseAnswer(state, answerLetter) {
  if (!state.round || !["answering", "retry"].includes(state.status)) {
    return { state, result: "ignored" };
  }

  const targetLetter = state.round.targetLetter;
  const isCorrect = answerLetter === targetLetter;
  const previousStats = state.letterStats[targetLetter] || { correct: 0, wrong: 0 };
  const letterStats = {
    ...state.letterStats,
    [targetLetter]: {
      correct: previousStats.correct + (isCorrect ? 1 : 0),
      wrong: previousStats.wrong + (isCorrect ? 0 : 1)
    }
  };

  return {
    state: {
      ...state,
      status: isCorrect ? "success" : "retry",
      correct: state.correct + (isCorrect ? 1 : 0),
      wrong: state.wrong + (isCorrect ? 0 : 1),
      streak: isCorrect ? state.streak + 1 : 0,
      letterStats,
      lastResult: {
        type: isCorrect ? "correct" : "retry",
        selectedLetter: answerLetter,
        targetLetter
      }
    },
    result: isCorrect ? "correct" : "retry"
  };
}

export function advanceLetterCaseRound(state, letters) {
  if (state.roundNumber >= state.totalRounds) {
    return {
      ...state,
      status: "complete",
      round: null,
      lastResult: null
    };
  }

  const nextRoundNumber = state.roundNumber + 1;
  const round = createLetterCaseRound({
    letters,
    letterStats: state.letterStats,
    roundNumber: nextRoundNumber,
    previousLetter: state.round?.targetLetter
  });

  return {
    ...state,
    status: "answering",
    roundNumber: nextRoundNumber,
    round,
    lastResult: null
  };
}

export function getLetterMastery(stats = { correct: 0, wrong: 0 }) {
  const attempts = stats.correct + stats.wrong;
  if (!attempts) return "Belum cuba";
  if (stats.correct >= 2 && stats.correct >= stats.wrong * 2) return "Sudah kenal";
  return "Perlu ulang";
}
