export function formatStudentCode(value) {
  const normalised = String(value || "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const compact = normalised.replace(/-/g, "");
  if (/^[A-Z]{2}\d{2}/.test(compact)) {
    return compact.length > 4 ? `${compact.slice(0, 4)}-${compact.slice(4)}` : compact;
  }
  return normalised;
}
