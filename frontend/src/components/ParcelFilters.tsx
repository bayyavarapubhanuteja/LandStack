import { RotateCcw } from "lucide-react";
import type { Feature, Filters } from "../lib/types";

export interface FilterState { state: string; district: string; village: string; land_use: string; verification: string }
export const EMPTY_FILTERS: FilterState = { state: "", district: "", village: "", land_use: "", verification: "" };

export function applyFilters(features: Feature[], f: FilterState, q = "") {
  const needle = q.trim().toLowerCase();
  return features.filter(({ properties: p }) =>
    (!f.state || p.state === f.state) && (!f.district || p.district === f.district) && (!f.village || p.village === f.village) &&
    (!f.land_use || p.land_use === f.land_use) && (!f.verification || p.verification_status === f.verification) &&
    (!needle || [p.parcel_id, p.ulpin, p.survey_no, p.village].some((v) => v.toLowerCase().includes(needle)) ||
      p.parcel_id.replace("-", "").toLowerCase() === needle.replace("-", "")));
}

export default function ParcelFilters({ meta, value, onChange, compact }: { meta: Filters | null; value: FilterState; onChange: (f: FilterState) => void; compact?: boolean }) {
  const h = meta?.hierarchy || [];
  const uniq = (xs: string[]) => [...new Set(xs)].sort();
  const states = uniq(h.map((x) => x.state));
  const districts = uniq(h.filter((x) => !value.state || x.state === value.state).map((x) => x.district));
  const villages = uniq(h.filter((x) => (!value.state || x.state === value.state) && (!value.district || x.district === value.district)).map((x) => x.village));
  const active = Object.values(value).some(Boolean);
  const sel = (k: keyof FilterState, label: string, opts: string[], reset: Partial<FilterState> = {}) => (
    <div>
      <label className="mb-1 block text-xs font-medium muted">{label}</label>
      <select className="input py-1.5" value={value[k]} onChange={(e) => onChange({ ...value, ...reset, [k]: e.target.value })}>
        <option value="">All</option>
        {opts.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    </div>
  );
  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "grid gap-3 sm:grid-cols-3 lg:grid-cols-6"}>
      {sel("state", "State", states, { district: "", village: "" })}
      {sel("district", "District", districts, { village: "" })}
      {sel("village", "Village / City", villages)}
      {sel("land_use", "Land use", meta?.land_uses || [])}
      {sel("verification", "Verification", meta?.verification || [])}
      <div className="flex items-end">
        <button className="btn-outline w-full py-1.5" disabled={!active} onClick={() => onChange(EMPTY_FILTERS)}><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
      </div>
    </div>
  );
}
