import { ArrowRight, ChevronRight, Languages } from "lucide-react";
import LearningTiles from "./LearningTiles.jsx";

export default function SubjectCard({ title, english, description, type, color, onClick }) {
  return (
    <button className={`subject-card subject-card-${color}`} type="button" onClick={onClick}>
      <span className="subject-card-topline">
        <span className="subject-card-label"><Languages size={15} /> {english}</span>
        <ArrowRight size={21} aria-hidden="true" />
      </span>
      <LearningTiles type={type} />
      <span className="subject-card-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className="subject-card-action">Pilih subjek <ChevronRight size={16} /></span>
    </button>
  );
}
