import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK, WHATSAPP_PREFILL } from "../../data/kembara.js";

export default function WhatsAppCta({ label = "Minta akaun percuma / Ask for a free account", compact = false }) {
  return (
    <div className={`whatsapp-cta ${compact ? "is-compact" : ""}`}>
      <a className="whatsapp-button" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
        <MessageCircle size={18} />
        <span>{label}</span>
      </a>
      {!compact && <p className="whatsapp-hint">{WHATSAPP_PREFILL}</p>}
    </div>
  );
}
