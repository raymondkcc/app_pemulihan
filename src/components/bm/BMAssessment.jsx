import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, RefreshCcw, XCircle } from "lucide-react";
import { HURUF, VOKAL } from "../../data/bm.js";
import { getActiveStudent } from "../../utils/kembaraStore.js";
import { persistStudentAssessment } from "../../utils/studentAssessments.js";

const QUESTIONS_PER_TEST = 10;

function makeQuestions(items) {
  return Array.from({ length: QUESTIONS_PER_TEST }, (_, index) => items[index % items.length]);
}

function makeOptions(items, target, getKey) {
  const distractors = items.filter((item) => getKey(item) !== getKey(target)).slice(0, 3);
  return [target, ...distractors].sort(() => Math.random() - 0.5);
}

function itemLabel(item) {
  return item.variant ? `${item.label} (${item.variant})` : item.label || item.letter;
}

export default function BMAssessment({ type, onBack, teachingMode = false }) {
  const isLetter = type === "huruf";
  const items = isLetter ? HURUF : VOKAL;
  const questions = useMemo(() => makeQuestions(items), [items]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);

  const target = questions[questionNumber - 1];
  const options = useMemo(() => makeOptions(items, target, (item) => isLetter ? item.letter : item.id), [items, target, isLetter]);
  const targetKey = isLetter ? target.letter : target.id;

  async function chooseAnswer(answer) {
    if (answered || complete || saving) return;
    const answerKey = isLetter ? answer.letter : answer.id;
    const correct = answerKey === targetKey;
    const nextScore = score + (correct ? 1 : 0);
    setSelectedKey(answerKey);
    setAnswered(true);
    setScore(nextScore);
    if (questionNumber < QUESTIONS_PER_TEST) return;
    setComplete(true);
    setSaving(true);
    const student = teachingMode ? null : getActiveStudent();
    await persistStudentAssessment({
      studentId: student?.id,
      subject: "bm",
      skillId: type,
      score: nextScore,
      total: QUESTIONS_PER_TEST
    });
    setSaving(false);
  }

  function nextQuestion() {
    if (complete) {
      setQuestionNumber(1);
      setScore(0);
      setAnswered(false);
      setSelectedKey("");
      setComplete(false);
      return;
    }
    setQuestionNumber((number) => number + 1);
    setAnswered(false);
    setSelectedKey("");
  }

  return (
    <div className="home-content hub-content speech-quiz-content">
      <div className="hub-hero sound-hero">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> <span>{isLetter ? "Huruf" : "Vokal"}</span></button>
        <div className="hub-title-block"><span className="hub-eyebrow"><CheckCircle2 size={15} /> Ujian / {isLetter ? "Huruf" : "Vokal"}</span><h1>{isLetter ? "Padan huruf" : "Kenal vokal"}</h1><p>Jawab 10 soalan. Ujian lulus apabila semua jawapan betul.</p></div>
        <div className="sound-hero-badge"><CheckCircle2 size={18} /><span><strong>{score}</strong> betul</span></div>
      </div>
      <section className="letter-test-section speech-quiz-section" aria-labelledby="bm-assessment-title">
        {complete && <p className="home-notice" role="status">{score === QUESTIONS_PER_TEST ? "Syabas! Ujian lulus." : "Ujian selesai. Cuba semula untuk lulus."} {score}/{QUESTIONS_PER_TEST} betul.</p>}
        <div className="section-heading-row"><div><span className="section-kicker">Ujian / {isLetter ? "Huruf" : "Vokal"}</span><h2 id="bm-assessment-title">Pilih jawapan yang betul</h2><p>Setiap soalan dikira sekali sahaja.</p></div><span className="skill-count">Soalan {questionNumber}/{QUESTIONS_PER_TEST}</span></div>
        <div className="speech-quiz-card bm-assessment-card">
          <span className="speech-quiz-label">{isLetter ? "Cari huruf kecil untuk" : "Pilih vokal yang disebut"}</span>
          <div className="speech-target-syllable">{isLetter ? target.letter : itemLabel(target)}</div>
          <div className="quiz-options bm-assessment-options" aria-label="Pilihan jawapan">
            {options.map((option) => {
              const optionKey = isLetter ? option.letter : option.id;
              const isCorrect = optionKey === targetKey;
              const isSelected = optionKey === selectedKey;
              return <button key={optionKey} className={`quiz-option bm-assessment-option ${isSelected ? (isCorrect ? "is-correct" : "is-wrong") : ""}`} type="button" onClick={() => chooseAnswer(option)} disabled={answered || saving}><strong>{isLetter ? option.letter.toLowerCase() : itemLabel(option)}</strong>{isSelected && (isCorrect ? <CheckCircle2 className="quiz-option-result" size={18} /> : <XCircle className="quiz-option-result" size={18} />)}</button>;
            })}
          </div>
          <p className={`speech-feedback ${answered ? (selectedKey === targetKey ? "correct" : "incorrect") : "idle"}`} role="status">{answered ? (selectedKey === targetKey ? "Betul!" : `Cuba lagi pada soalan seterusnya. Jawapan: ${isLetter ? target.letter.toLowerCase() : itemLabel(target)}.`) : "Pilih satu jawapan."}</p>
          <div className="speech-quiz-actions"><button className="secondary-action" type="button" onClick={nextQuestion} disabled={!answered || saving}><RefreshCcw size={16} /> {complete ? "Ulang ujian" : "Soalan seterusnya"}</button><span className="speech-score">Betul <strong>{score}</strong> / {QUESTIONS_PER_TEST}</span></div>
        </div>
      </section>
    </div>
  );
}
