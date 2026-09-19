import { Code2, Palette, ShieldCheck } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { PageHeader } from "../components/ui";

const ENDPOINTS = [
  "GET /api/parcels/{parcelId}", "GET /api/parcels/{parcelId}/ownership", "GET /api/parcels/{parcelId}/registration",
  "GET /api/parcels/{parcelId}/land-use", "GET /api/parcels/{parcelId}/planning", "GET /api/parcels/{parcelId}/encumbrance",
  "GET /api/parcels/{parcelId}/services", "GET /api/parcels/geojson", "POST /api/requests", "GET /api/requests/{requestId}", "POST /api/query",
];

export default function Settings() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <PageHeader title="Settings" subtitle="Personalise LandStack and review platform information." />
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <Palette className="h-5 w-5 text-teal-600" />
        <div className="flex-1"><p className="font-semibold text-navy-900 dark:text-white">Appearance</p><p className="text-sm muted">Light, dark, or follow your system setting.</p></div>
        <ThemeToggle withLabels />
      </div>
      <div className="card p-6">
        <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-teal-600" /><p className="font-semibold text-navy-900 dark:text-white">Privacy & security</p></div>
        <ul className="mt-3 list-disc space-y-1 pl-10 text-sm muted">
          <li>Sessions use signed JWT tokens that expire automatically.</li>
          <li>Passwords are stored as bcrypt hashes.</li>
          <li>Owner names are masked in all parcel responses.</li>
          <li>Every login, request and verification action is recorded in the audit log.</li>
        </ul>
      </div>
      <div className="card p-6">
        <div className="flex items-center gap-3"><Code2 className="h-5 w-5 text-teal-600" /><p className="font-semibold text-navy-900 dark:text-white">Open REST APIs</p></div>
        <p className="mt-1 text-sm muted">Interoperable, ULPIN-keyed endpoints (JWT bearer auth). Interactive docs at <a className="font-mono text-teal-700 hover:underline dark:text-teal-400" href="http://localhost:8000/docs" target="_blank" rel="noreferrer">/docs</a>.</p>
        <ul className="mt-3 grid gap-1 font-mono text-xs">{ENDPOINTS.map((e) => <li key={e} className="rounded bg-slate-50 px-2 py-1 dark:bg-navy-950">{e}</li>)}</ul>
      </div>
    </div>
  );
}
