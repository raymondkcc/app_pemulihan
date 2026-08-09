import { ArrowLeft, Download, FileSpreadsheet, Home, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

export const NAMELIST_FIELDS = [
  { id: "enName", label: "EN name", key: "enName" },
  { id: "cnName", label: "CN name", key: "cnName" },
  { id: "loginId", label: "ID log masuk", key: "loginId" },
  { id: "role", label: "Role", key: "role" }
];

export const DEFAULT_TEACHER_NAMELIST = [
  { enName: "Aina Tan", cnName: "陈美玲", loginId: "aina.tan", role: "Teacher" },
  { enName: "Bryan Lim", cnName: "林俊杰", loginId: "bryan.lim", role: "Teacher" },
  { enName: "Chloe Wong", cnName: "黄思妍", loginId: "chloe.wong", role: "Admin" },
  { enName: "Nur Aisyah", cnName: "努尔艾莎", loginId: "nur.aisyah", role: "Teacher" }
];

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function createNamelistCsv(rows, selectedFieldIds) {
  const fields = NAMELIST_FIELDS.filter((field) => selectedFieldIds.includes(field.id));
  const header = fields.map((field) => escapeCsvValue(field.label)).join(",");
  const body = rows.map((row) => fields.map((field) => escapeCsvValue(row[field.key])).join(","));
  return [header, ...body].join("\r\n");
}

function formatDownloadDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export default function TeacherNamelist({ rows = DEFAULT_TEACHER_NAMELIST }) {
  const allFieldIds = NAMELIST_FIELDS.map((field) => field.id);
  const [selectedFieldIds, setSelectedFieldIds] = useState(allFieldIds);
  const [downloadStatus, setDownloadStatus] = useState("");
  const allFieldsSelected = selectedFieldIds.length === allFieldIds.length;

  function toggleField(fieldId) {
    setSelectedFieldIds((current) => current.includes(fieldId)
      ? current.filter((id) => id !== fieldId)
      : [...current, fieldId]);
    setDownloadStatus("");
  }

  function selectAllFields() {
    setSelectedFieldIds(allFieldIds);
    setDownloadStatus("");
  }

  function clearFields() {
    setSelectedFieldIds([]);
    setDownloadStatus("");
  }

  function downloadNamelist() {
    if (!selectedFieldIds.length || !rows.length) return;

    const csv = createNamelistCsv(rows, selectedFieldIds);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `teacher-namelist-${formatDownloadDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setDownloadStatus(`Downloaded ${rows.length} names with ${selectedFieldIds.length} fields.`);
  }

  return (
    <main className="teacher-page">
      <header className="teacher-topbar">
        <a className="teacher-brand" href="/" aria-label="Back to learning space">
          <span className="brand-tile brand-tile-a">A</span>
          <span className="brand-tile brand-tile-one">1</span>
          <span className="brand-tile brand-tile-star"><Users size={13} /></span>
          <span className="brand-name">Bijak <em>teacher</em></span>
        </a>
        <div className="teacher-topbar-actions">
          <span className="teacher-account"><ShieldCheck size={15} /> Admin</span>
          <a className="teacher-home-link" href="/" title="Back to learning space"><Home size={15} /> <span>Learning space</span></a>
        </div>
      </header>

      <div className="teacher-main">
        <a className="teacher-back-link" href="/" title="Back to learning space"><ArrowLeft size={16} /> Learning space</a>

        <section className="teacher-hero" aria-labelledby="teacher-page-title">
          <div>
            <span className="teacher-eyebrow"><Users size={15} /> Teacher workspace <span>/ Namelist</span></span>
            <h1 id="teacher-page-title">Teacher namelist</h1>
            <p>Keep account details ready for the next class.</p>
          </div>
          <div className="teacher-count" aria-label={`${rows.length} accounts`}>
            <strong>{rows.length}</strong>
            <span>accounts</span>
          </div>
        </section>

        <section className="namelist-section" aria-labelledby="namelist-title">
          <div className="namelist-section-heading">
            <div>
              <span className="teacher-section-kicker">Directory</span>
              <h2 id="namelist-title">Names</h2>
            </div>
            <span className="namelist-count">{rows.length} accounts</span>
          </div>

          <div className="export-panel" aria-labelledby="export-panel-title">
            <div className="export-panel-heading">
              <div className="export-panel-title-wrap">
                <span className="export-panel-icon"><FileSpreadsheet size={21} /></span>
                <div>
                  <h3 id="export-panel-title">Download data</h3>
                  <p>Choose the columns for your CSV file.</p>
                </div>
              </div>
              <span className="selected-field-count">{selectedFieldIds.length} / {allFieldIds.length} fields</span>
            </div>

            <fieldset className="export-fields">
              <legend>Select fields</legend>
              <div className="export-field-actions">
                <button type="button" className="export-text-button" onClick={selectAllFields} disabled={allFieldsSelected}>Select all</button>
                <button type="button" className="export-text-button" onClick={clearFields} disabled={!selectedFieldIds.length}>Clear</button>
              </div>
              <div className="export-field-grid">
                {NAMELIST_FIELDS.map((field) => (
                  <label className={`export-field ${selectedFieldIds.includes(field.id) ? "is-selected" : ""}`} key={field.id}>
                    <input
                      type="checkbox"
                      checked={selectedFieldIds.includes(field.id)}
                      onChange={() => toggleField(field.id)}
                    />
                    <span className="export-field-check" aria-hidden="true" />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="export-panel-footer">
              <p className={`export-status ${downloadStatus ? "is-complete" : ""}`} role="status" aria-live="polite">
                {downloadStatus || (selectedFieldIds.length ? `${selectedFieldIds.length} fields ready to download.` : "Select at least one field to download.")}
              </p>
              <button className="teacher-download-button" type="button" onClick={downloadNamelist} disabled={!selectedFieldIds.length || !rows.length}>
                <Download size={17} /> Download CSV
              </button>
            </div>
          </div>

          <div className="namelist-table-wrap">
            <table className="namelist-table">
              <thead>
                <tr>
                  {NAMELIST_FIELDS.map((field) => <th scope="col" key={field.id}>{field.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.loginId}>
                    <td className="namelist-name-cell">{row.enName}</td>
                    <td className="namelist-cn-cell">{row.cnName}</td>
                    <td><code>{row.loginId}</code></td>
                    <td><span className={`role-badge role-${row.role.toLowerCase()}`}>{row.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
