import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, LockKeyhole, Minus, Plus, RotateCcw, Star, Trophy, XCircle } from "lucide-react";
import { completeMathStage, getMathProgress, isMathStageUnlocked } from "../../utils/mathProgress.js";
import { getActiveStudent } from "../../utils/kembaraStore.js";

const LEVELS = [
  { id: "easy", title: "Mudah", number: "01", range: "hingga 10", color: "yellow" },
  { id: "medium", title: "Sederhana", number: "02", range: "hingga 20", color: "blue" },
  { id: "challenge", title: "Cabaran", number: "03", range: "hingga 100", color: "coral" }
];

const STAGES = [
  { id: "learn", title: "Belajar", short: "Konsep", Icon: BookOpen, color: "learn" },
  { id: "main", title: "Main", short: "Latihan", Icon: Star, color: "main" },
  { id: "test", title: "Ujian", short: "Luluskan", Icon: Trophy, color: "test" }
];

const OPERATION_COPY = {
  tambah: { title: "Tambah", symbol: "+", verb: "gabungkan", concept: "Tambah bermaksud menggabungkan dua kumpulan.", color: "coral", examples: [{ left: 2, right: 3, answer: 5 }, { left: 4, right: 1, answer: 5 }, { left: 5, right: 2, answer: 7 }] },
  tolak: { title: "Tolak", symbol: "−", verb: "ambil", concept: "Tolak bermaksud mengambil sebahagian daripada satu kumpulan.", color: "mint", examples: [{ left: 5, right: 2, answer: 3 }, { left: 7, right: 3, answer: 4 }, { left: 9, right: 4, answer: 5 }] }
};

function makeQuestion(operation, level, index) {
  const max = level === "easy" ? 10 : level === "medium" ? 20 : 100;
  const offset = index * 3 + (operation === "tolak" ? 2 : 1);
  if (operation === "tambah") {
    const left = level === "easy" ? (offset % 6) + 1 : level === "medium" ? (offset % 12) + 4 : (offset % 45) + 18;
    const right = Math.min(max - left, level === "easy" ? (index % 4) + 1 : level === "medium" ? (index % 7) + 2 : (index % 25) + 8);
    return { left, right, answer: left + right };
  }
  const left = level === "easy" ? (offset % 5) + 5 : level === "medium" ? (offset % 11) + 10 : (offset % 45) + 45;
  const right = Math.min(left - 1, level === "easy" ? (index % 3) + 1 : level === "medium" ? (index % 6) + 2 : (index % 21) + 6);
  return { left, right, answer: left - right };
}

function answerOptions(question, operation, level, index) {
  const spread = level === "easy" ? 2 : level === "medium" ? 4 : 8;
  const wrongA = Math.max(0, question.answer + (operation === "tambah" ? -spread : spread));
  const wrongB = question.answer + (index % 2 === 0 ? 1 : -1) * (spread + 1);
  return [...new Set([question.answer, wrongA, wrongB])].sort((a, b) => a - b);
}

function OperationMark({ operation, size = 28 }) {
  return operation === "tambah" ? <Plus size={size} strokeWidth={3.2} /> : <Minus size={size} strokeWidth={3.2} />;
}

function MathMap({ operation, progress, onSelectStage, onChangeOperation, onBack }) {
  const copy = OPERATION_COPY[operation];
  return (
    <div className="math-journey-page">
      <header className="math-journey-hero">
        <button className="math-journey-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Matematik</button>
        <div className="math-journey-hero-copy">
          <span className="math-journey-eyebrow"><OperationMark operation={operation} size={16} /> Peta operasi</span>
          <h1>Jalan {copy.title}</h1>
          <p>Belajar sedikit demi sedikit. Luluskan setiap checkpoint untuk membuka jalan seterusnya.</p>
        </div>
        <div className={`math-journey-symbol math-journey-symbol-${copy.color}`} aria-hidden="true"><OperationMark operation={operation} size={62} /><span>{copy.title}</span></div>
      </header>

      <div className="math-operation-tabs" role="tablist" aria-label="Pilih operasi">
        {Object.entries(OPERATION_COPY).map(([id, item]) => <button key={id} className={operation === id ? `is-selected tab-${item.color}` : ""} type="button" role="tab" aria-selected={operation === id} onClick={() => onChangeOperation(id)}><OperationMark operation={id} size={18} /><span>{item.title}</span></button>)}
      </div>

      <main className="math-map-shell">
        <div className="math-map-heading"><div><span className="math-map-kicker">Peta hadapan / Level 01</span><h2>Pilih checkpoint</h2></div><span className="math-map-note"><CheckCircle2 size={16} /> Belajar → Main → Ujian</span></div>
        <div className="math-level-path">
          {LEVELS.map((level, levelIndex) => {
            const levelUnlocked = levelIndex === 0 || Boolean(progress.levels[LEVELS[levelIndex - 1].id]?.test);
            return (
              <section className={`math-level-card math-level-${level.color} ${levelUnlocked ? "is-unlocked" : "is-locked"}`} key={level.id}>
                <div className="math-level-card-head"><span className="math-level-number">{level.number}</span><div><span className="math-level-label">Level {level.number}</span><h3>{level.title}</h3><p>{level.range}</p></div>{levelUnlocked ? <span className="math-level-open"><Star size={14} fill="currentColor" /> terbuka</span> : <LockKeyhole className="math-level-lock" size={19} />}</div>
                <div className="math-level-track" aria-label={`Checkpoint ${level.title}`}>
                  {STAGES.map((stage, stageIndex) => {
                    const complete = Boolean(progress.levels[level.id]?.[stage.id]);
                    const unlocked = levelUnlocked && isMathStageUnlocked(progress, level.id, stage.id);
                    const Icon = complete ? Check : stage.Icon;
                    return <button className={`math-stage-node math-stage-${stage.color} ${complete ? "is-complete" : ""} ${unlocked ? "is-open" : "is-locked"}`} type="button" key={stage.id} disabled={!unlocked} onClick={() => onSelectStage(level.id, stage.id)}><span className="math-stage-icon"><Icon size={18} strokeWidth={2.8} /></span><span className="math-stage-copy"><strong>{stage.title}</strong><small>{complete ? "Selesai" : stage.short}</small></span>{stageIndex < STAGES.length - 1 && <span className={`math-stage-line ${progress.levels[level.id]?.[stage.id] ? "is-filled" : ""}`} aria-hidden="true" />}</button>;
                  })}
                </div>
                {!levelUnlocked && <div className="math-level-requirement"><LockKeyhole size={14} /> Luluskan Ujian level sebelumnya</div>}
              </section>
            );
          })}
        </div>
        <div className="math-map-footer"><span><OperationMark operation={operation} size={16} /> {copy.concept}</span><span>{Object.values(progress.levels).filter((level) => level.test).length}/3 level selesai</span></div>
      </main>
    </div>
  );
}

function Lesson({ operation, level, onComplete, onBack }) {
  const copy = OPERATION_COPY[operation];
  const [exampleIndex, setExampleIndex] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const [checkScore, setCheckScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [checkComplete, setCheckComplete] = useState(false);
  const checkQuestions = useMemo(() => Array.from({ length: 3 }, (_, index) => makeQuestion(operation, level, index + 1)), [operation, level]);
  const example = copy.examples[exampleIndex % copy.examples.length];
  const checkQuestion = checkQuestions[checkIndex];
  const checkOptions = answerOptions(checkQuestion, operation, level, checkIndex + 1);
  const checkPassed = checkScore >= 2;
  const dots = Array.from({ length: example.left }, (_, index) => <span key={`l-${index}`} className="math-dot math-dot-left" />);
  const rightDots = Array.from({ length: example.right }, (_, index) => <span key={`r-${index}`} className="math-dot math-dot-right" />);

  function chooseCheckAnswer(answer) {
    if (selectedAnswer !== null || checkComplete) return;
    const nextScore = checkScore + (answer === checkQuestion.answer ? 1 : 0);
    setSelectedAnswer(answer);
    setCheckScore(nextScore);
    if (checkIndex === checkQuestions.length - 1) setCheckComplete(true);
  }

  function nextCheckQuestion() {
    if (checkComplete) {
      if (checkPassed) onComplete();
      else {
        setCheckIndex(0);
        setCheckScore(0);
        setSelectedAnswer(null);
        setCheckComplete(false);
      }
      return;
    }
    setCheckIndex((index) => index + 1);
    setSelectedAnswer(null);
  }

  return (
    <div className="math-activity-page math-lesson-page">
      <ActivityTopbar operation={operation} level={level} stage="Belajar" onBack={onBack} />
      <main className="math-activity-content">
        <div className="math-activity-intro"><span className="math-activity-kicker">Konsep asas</span><h1>{copy.title}: {copy.verb} kumpulan</h1><p>{copy.concept}</p></div>
        <section className={`math-concept-board concept-${copy.color}`} aria-label={`Contoh ${copy.title}`}>
          <div className="math-concept-equation"><strong>{example.left}</strong><span><OperationMark operation={operation} size={30} /></span><strong>{example.right}</strong><span>=</span><strong className="math-concept-answer">{example.answer}</strong></div>
          <div className="math-dot-groups"><div className="math-dot-group">{dots}</div><OperationMark operation={operation} size={26} /><div className="math-dot-group">{rightDots}</div><span className="math-dot-total">{example.answer} semuanya</span></div>
          <p>{operation === "tambah" ? `${example.left} digabung dengan ${example.right} menjadi ${example.answer}.` : `${example.left} ambil ${example.right}, tinggal ${example.answer}.`}</p>
        </section>
        <div className="math-lesson-controls"><button className="math-secondary-button" type="button" onClick={() => setExampleIndex((index) => index + 1)}><RotateCcw size={16} /> Contoh lain</button></div>
        <section className={`math-lesson-check ${checkComplete ? "is-finished" : ""}`} aria-live="polite">
          {checkComplete ? <div className="math-lesson-result"><span className={`math-result-icon ${checkPassed ? "is-pass" : "is-retry"}`}>{checkPassed ? <CheckCircle2 size={30} /> : <RotateCcw size={30} />}</span><h2>{checkPassed ? "Konsep sudah faham" : "Mari cuba semula"}</h2><p>{checkScore}/3 betul. {checkPassed ? "Sekarang latihan boleh dibuka." : "Jawab sekurang-kurangnya 2 daripada 3 soalan."}</p><button className="math-primary-button" type="button" onClick={nextCheckQuestion}>{checkPassed ? "Ke Main" : "Ulang semakan"} <ArrowRight size={17} /></button></div> : <><div className="math-lesson-check-heading"><span className="math-activity-kicker">Semakan konsep</span><span>{checkIndex + 1}/3</span></div><div className="math-lesson-question">{checkQuestion.left} <OperationMark operation={operation} size={25} /> {checkQuestion.right} <span>= ?</span></div><div className="math-answer-options">{checkOptions.map((answer) => <button key={answer} type="button" className={`math-answer-option ${selectedAnswer !== null ? answer === checkQuestion.answer ? "is-correct" : answer === selectedAnswer ? "is-wrong" : "" : ""}`} onClick={() => chooseCheckAnswer(answer)} disabled={selectedAnswer !== null}>{answer}{selectedAnswer !== null && answer === checkQuestion.answer && <CheckCircle2 size={17} />}{selectedAnswer === answer && answer !== checkQuestion.answer && <XCircle size={17} />}</button>)}</div><p className={`math-answer-feedback ${selectedAnswer === null ? "is-idle" : selectedAnswer === checkQuestion.answer ? "is-correct" : "is-wrong"}`}>{selectedAnswer === null ? "Pilih jawapan untuk semak kefahaman." : selectedAnswer === checkQuestion.answer ? "Betul!" : `Jawapan ialah ${checkQuestion.answer}.`}</p><button className="math-next-button" type="button" disabled={selectedAnswer === null} onClick={nextCheckQuestion}>{checkIndex === checkQuestions.length - 1 ? "Lihat keputusan" : "Soalan seterusnya"} <ArrowRight size={17} /></button></>}
        </section>
      </main>
    </div>
  );
}

function ActivityTopbar({ operation, level, stage, onBack }) {
  const copy = OPERATION_COPY[operation];
  return <header className="math-activity-topbar"><button className="math-activity-back" type="button" onClick={onBack}><ArrowLeft size={17} /> Peta {copy.title}</button><span className="math-activity-breadcrumb"><OperationMark operation={operation} size={15} /> Level {LEVELS.find((item) => item.id === level)?.number} · {stage}</span></header>;
}

function Practice({ operation, level, stage, onComplete, onBack }) {
  const questions = useMemo(() => Array.from({ length: 5 }, (_, index) => makeQuestion(operation, level, index)), [operation, level]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [complete, setComplete] = useState(false);
  const question = questions[questionIndex];
  const options = answerOptions(question, operation, level, questionIndex);
  const pass = score >= 4;

  function chooseAnswer(answer) {
    if (selected !== null || complete) return;
    const nextScore = score + (answer === question.answer ? 1 : 0);
    setSelected(answer);
    setScore(nextScore);
    if (questionIndex === questions.length - 1) setComplete(true);
  }

  function nextQuestion() {
    if (complete) {
      if (pass) onComplete();
      else { setQuestionIndex(0); setScore(0); setSelected(null); setComplete(false); }
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelected(null);
  }

  return <div className="math-activity-page math-quiz-page"><ActivityTopbar operation={operation} level={level} stage={stage === "test" ? "Ujian" : "Main"} onBack={onBack} /><main className="math-activity-content"><div className="math-activity-intro math-quiz-intro"><span className="math-activity-kicker">{stage === "test" ? "Tunjukkan penguasaan" : "Latihan pantas"}</span><h1>{stage === "test" ? "Ujian level" : "Jom kira"}</h1><p>{stage === "test" ? "Jawab sekurang-kurangnya 4 daripada 5 soalan untuk lulus." : "Pilih jawapan yang betul. Cuba sampai yakin."}</p><div className="math-quiz-score"><span>Soalan {Math.min(questionIndex + 1, questions.length)}/{questions.length}</span><strong>{score} betul</strong></div></div><section className={`math-question-card ${complete ? "is-finished" : ""}`} aria-live="polite">{complete ? <QuizResult pass={pass} score={score} stage={stage} onAction={nextQuestion} /> : <><div className="math-question-progress"><span style={{ width: `${(questionIndex / questions.length) * 100}%` }} /></div><span className="math-question-label">Cari jawapan</span><div className="math-large-question">{question.left} <OperationMark operation={operation} size={34} /> {question.right} <span>= ?</span></div><div className="math-answer-options">{options.map((answer) => <button key={answer} type="button" className={`math-answer-option ${selected !== null ? answer === question.answer ? "is-correct" : answer === selected ? "is-wrong" : "" : ""}`} onClick={() => chooseAnswer(answer)} disabled={selected !== null}>{answer}{selected !== null && answer === question.answer && <CheckCircle2 size={18} />}{selected === answer && answer !== question.answer && <XCircle size={18} />}</button>)}</div><p className={`math-answer-feedback ${selected === null ? "is-idle" : selected === question.answer ? "is-correct" : "is-wrong"}`}>{selected === null ? "Pilih satu jawapan." : selected === question.answer ? "Betul!" : `Cuba lagi nanti. Jawapan ialah ${question.answer}.`}</p><button className="math-next-button" type="button" disabled={selected === null} onClick={nextQuestion}>{questionIndex === questions.length - 1 ? "Lihat keputusan" : "Soalan seterusnya"} <ArrowRight size={17} /></button></>}</section></main></div>;
}

function QuizResult({ pass, score, stage, onAction }) {
  return <div className="math-quiz-result"><span className={`math-result-icon ${pass ? "is-pass" : "is-retry"}`}>{pass ? <Trophy size={32} /> : <RotateCcw size={32} />}</span><span className="math-activity-kicker">{pass ? "Syabas!" : "Belum lagi"}</span><h2>{pass ? "Checkpoint lulus" : "Cuba sekali lagi"}</h2><p>{pass ? `${score}/5 betul. ${stage === "test" ? "Level seterusnya sudah terbuka." : "Teruskan ke checkpoint seterusnya."}` : `${score}/5 betul. Dapatkan sekurang-kurangnya 4/5 untuk lulus.`}</p><button className="math-primary-button" type="button" onClick={onAction}>{pass ? "Teruskan" : "Ulang"} <ArrowRight size={17} /></button></div>;
}

export default function MathLearningJourney({ operation = "tambah", initialLevel = "easy", initialStage = null, onBack }) {
  const student = getActiveStudent();
  const studentId = student?.id || "guest";
  const [currentOperation, setCurrentOperation] = useState(operation);
  const [progress, setProgress] = useState(() => getMathProgress(studentId, operation));
  const [activity, setActivity] = useState(initialStage && initialLevel ? { level: initialLevel, stage: initialStage } : null);

  function goMap(nextOperation = currentOperation) {
    setActivity(null);
    setCurrentOperation(nextOperation);
    setProgress(getMathProgress(studentId, nextOperation));
  }

  function completeStage(level, stage) {
    const next = completeMathStage(studentId, currentOperation, level, stage);
    setProgress(next);
    if (stage === "learn") setActivity({ level, stage: "main" });
    else if (stage === "main") setActivity({ level, stage: "test" });
    else setActivity(null);
  }

  if (activity) {
    const unlocked = isMathStageUnlocked(progress, activity.level, activity.stage);
    if (!unlocked) return <MathMap operation={currentOperation} progress={progress} onSelectStage={(level, stage) => setActivity({ level, stage })} onChangeOperation={goMap} onBack={onBack} />;
    if (activity.stage === "learn") return <Lesson operation={currentOperation} level={activity.level} onComplete={() => completeStage(activity.level, "learn")} onBack={() => goMap()} />;
    return <Practice operation={currentOperation} level={activity.level} stage={activity.stage} onComplete={() => completeStage(activity.level, activity.stage)} onBack={() => goMap()} />;
  }
  return <MathMap operation={currentOperation} progress={progress} onSelectStage={(level, stage) => setActivity({ level, stage })} onChangeOperation={goMap} onBack={onBack} />;
}
