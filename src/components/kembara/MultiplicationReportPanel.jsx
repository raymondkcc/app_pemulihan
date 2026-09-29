import { BarChart3, X } from "lucide-react";
import { FACTS, factAccuracy, factCategory, normaliseProgress } from "../../games/multiplicationZombie/multiplicationFacts.js";

export default function MultiplicationReportPanel({ student, rows, busy, onClose }) {
  const stored = Object.fromEntries(rows.map((row) => [row.key, row]));
  const progress = normaliseProgress(stored);
  const report = FACTS.map((fact) => {
    const stat = progress[fact.key];
    const category = factCategory(stat);
    return { fact, stat, category, accuracy: factAccuracy(stat) };
  }).sort((left, right) => {
    const rank = { weak: 0, new: 1, mastered: 2 };
    if (rank[left.category] !== rank[right.category]) return rank[left.category] - rank[right.category];
    if (left.accuracy !== right.accuracy) return left.accuracy - right.accuracy;
    if (left.stat.wrong !== right.stat.wrong) return right.stat.wrong - left.stat.wrong;
    return left.stat.attempts - right.stat.attempts;
  });
  const attempted = report.filter(({ stat }) => stat.attempts > 0);
  const needsHelp = report.filter(({ category }) => category === "weak").length;
  const insufficient = report.filter(({ stat }) => stat.attempts < 3).length;
  const mastered = report.filter(({ category }) => category === "mastered").length;
  const recentMisses = report.filter(({ stat }) => stat.lastResult === "wrong").slice(0, 5);

  return (
    <section className="dashboard-section multiplication-report" aria-labelledby="multiplication-report-title">
      <div className="section-heading-row">
        <div><span className="section-kicker">Analisis darab / Multiplication analysis</span><h2 id="multiplication-report-title">{student.nickname}</h2></div>
        <button type="button" className="report-close-button" onClick={onClose} aria-label="Tutup analisis"><X size={17} /> Tutup</button>
      </div>
      {busy ? <p className="report-empty-state">Memuatkan analisis fakta...</p> : (
        <>
          <div className="multiplication-report-summary">
            <article><strong>{needsHelp}</strong><span>Perlu bantuan</span></article>
            <article><strong>{insufficient}</strong><span>Kurang latihan</span></article>
            <article><strong>{mastered}</strong><span>Sudah kukuh</span></article>
            <article><strong>{attempted.length}/81</strong><span>Fakta dicuba</span></article>
          </div>
          {recentMisses.length > 0 && (
            <div className="report-callout"><strong>Baru tersilap / Recently missed</strong><span>{recentMisses.map(({ fact }) => `${fact.first} × ${fact.second}`).join("  ·  ")}</span></div>
          )}
          {!rows.length && <p className="report-empty-state">Belum ada rekod latihan darab. Minta murid lengkapkan satu sesi dahulu.</p>}
          <div className="multiplication-report-table" role="table" aria-label={`Analisis darab ${student.nickname}`}>
            <div className="multiplication-report-row multiplication-report-header" role="row"><span>Fakta</span><span>Cubaan</span><span>Betul</span><span>Salah</span><span>Tepat</span><span>Status</span></div>
            {report.map(({ fact, stat, category, accuracy }) => (
              <div className="multiplication-report-row" role="row" key={fact.key}>
                <strong>{fact.first} × {fact.second} = {fact.answer}</strong>
                <span>{stat.attempts}</span>
                <span>{stat.correct}</span>
                <span>{stat.wrong}</span>
                <span>{stat.attempts ? `${Math.round(accuracy * 100)}%` : "—"}</span>
                <span className={`report-status report-status-${category}`}>{category === "weak" ? "Perlu bantuan" : category === "mastered" ? "Sudah kukuh" : "Terus berlatih"}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
