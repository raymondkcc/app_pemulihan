import { useEffect, useState } from "react";
import { Check, Download, LoaderCircle, Printer, QrCode, ShieldCheck, X } from "lucide-react";
import QRCode from "qrcode";
import { createStudentQrCode } from "../../utils/kembaraStore.js";

export default function StudentQrDialog({ student, onClose }) {
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await createStudentQrCode(student.id);
        if (cancelled) return;
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (!result.token) {
          setError("Kod login murid tidak tersedia. Jana semula profil murid.");
          return;
        }
        const url = `${window.location.origin}/murid?qr=${encodeURIComponent(result.token)}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 720,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#19384a", light: "#ffffff" }
        });
        if (cancelled) return;
        setImage(dataUrl);
      } catch (error) {
        if (cancelled) return;
        console.error("Student QR generation failed", error);
        setError("QR tidak dapat dijana. Cuba lagi.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [student.id]);

  async function download() {
    if (!image) return;
    const qrImage = new Image();
    qrImage.src = image;
    await new Promise((resolve) => {
      qrImage.onload = resolve;
      qrImage.onerror = resolve;
    });
    if (!qrImage.naturalWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 930;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(qrImage, 0, 0, 720, 720);
    context.fillStyle = "#64727b";
    context.font = "700 20px Arial, sans-serif";
    context.fillText("Nama murid / Student name", 30, 770);
    context.fillStyle = "#19384a";
    context.font = "700 34px Arial, sans-serif";
    context.fillText(String(student.nickname || "Murid"), 30, 812);
    context.fillStyle = "#64727b";
    context.font = "700 20px Arial, sans-serif";
    context.fillText("Kod login sebenar / Actual login code", 30, 858);
    context.fillStyle = "#19384a";
    context.font = "700 30px Arial, sans-serif";
    context.fillText(String(student.studentCode || "-"), 30, 898);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `kembara-${student.nickname || "murid"}-qr.png`;
    link.click();
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(student.studentCode || "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="student-qr-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="student-qr-dialog" role="dialog" aria-modal="true" aria-labelledby="student-qr-title">
        <div className="student-qr-heading">
          <div><span className="section-kicker"><ShieldCheck size={14} /> {image ? "QR kod login" : error ? "QR tidak tersedia" : "Menjana QR kod"}</span><h2 id="student-qr-title">Kad masuk murid</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup"><X size={19} /></button>
        </div>
        {busy && <div className="student-qr-loading"><LoaderCircle className="spin" size={28} /><span>Menjana QR kod...</span></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {image && <>
          <div className="student-qr-print-card">
            <img className="student-qr-image" src={image} alt={`QR log masuk ${student.nickname}`} />
            <div className="student-qr-label"><span>Nama murid / Student name</span><strong>{student.nickname}</strong></div>
            <div className="student-qr-label"><span>Kod login sebenar / Actual login code</span><strong>{student.studentCode || "-"}</strong></div>
          </div>
          <p className="student-qr-meta">Imbas QR untuk memilih murid. Murid masih perlu memasukkan dua gambar password sebelum bermain.</p>
          <div className="student-qr-actions">
            <button className="student-qr-action" type="button" onClick={download}><Download size={16} /> Muat turun</button>
            <button className="student-qr-action" type="button" onClick={() => window.print()}><Printer size={16} /> Cetak</button>
            <button className="student-qr-action" type="button" onClick={copyCode}>{copied ? <Check size={16} /> : <QrCode size={16} />} {copied ? "Disalin" : "Salin kod"}</button>
          </div>
        </>}
      </section>
    </div>
  );
}
