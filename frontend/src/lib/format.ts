export const pretty = (s?: string | null) => (s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—");
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const fmtDateTime = (s?: string | null) =>
  s ? new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z").toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
export const inr = (n?: number | null) => (n == null ? "—" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`);
export const num = (n: number) => n.toLocaleString("en-IN");

export const SERVICE_LABEL: Record<string, string> = {
  ownership_verification: "Ownership Verification",
  land_record_request: "Land Record Request",
  encumbrance_certificate: "Encumbrance Certificate",
  land_use_information: "Land Use Information",
  building_permission_status: "Building Permission Status",
};

export const LAND_USE_COLOR: Record<string, string> = {
  Residential: "#345ca8",
  Agricultural: "#16a34a",
  Commercial: "#d97706",
  Industrial: "#7c3aed",
  "Mixed Use": "#0d8877",
  "Public/Semi-Public": "#dc2626",
  "Recreational/Open Space": "#65a30d",
};
export const VERIFY_COLOR: Record<string, string> = { verified: "#16a992", pending: "#d97706", flagged: "#dc2626" };
