import { useEffect, useState } from "react";
import { subscribeRateLimit } from "../../utils/rateLimit.js";

export default function RateLimitToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    return subscribeRateLimit((next) => {
      setToast(next);
      window.clearTimeout(window.__kembaraToastTimer);
      window.__kembaraToastTimer = window.setTimeout(() => setToast(null), 2200);
    });
  }, []);

  if (!toast) return null;

  return (
    <div className={`rate-toast rate-toast-${toast.audience}`} role="status">
      <strong>{toast.bm}</strong>
      <span>{toast.en}</span>
    </div>
  );
}
