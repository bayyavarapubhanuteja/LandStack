import clsx from "clsx";
import { Bot, ChevronRight, ClipboardPlus, ExternalLink, Filter, Layers, MapPin, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ParcelFilters, { EMPTY_FILTERS, applyFilters, type FilterState } from "../components/ParcelFilters";
import ParcelMap, { type ColorBy } from "../components/ParcelMap";
import ServiceRequestModal from "../components/ServiceRequestModal";
import { Empty, ErrorState, Field, Loading, Skeleton, StatusBadge } from "../components/ui";
import { LAND_USE_COLOR, fmtDate, inr } from "../lib/format";
import { useApi } from "../lib/useApi";
import type { FeatureCollection, Filters, ParcelDetail } from "../lib/types";

export default function ParcelExplorer() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const { data, error, loading, reload } = useApi<FeatureCollection>("/api/parcels/geojson");
  const { data: meta } = useApi<Filters>("/api/parcels/filters");
  const [query, setQuery] = useState(params.get("q") || "");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [colorBy, setColorBy] = useState<ColorBy>("land_use");
  const selectedId = params.get("parcel");
  const [requestOpen, setRequestOpen] = useState(false);

  const all = data?.features || [];
  const features = useMemo(() => applyFilters(all, filters), [all, filters]);
  const results = useMemo(() => applyFilters(features, EMPTY_FILTERS, query), [features, query]);
  const detail = useApi<ParcelDetail>(selectedId ? `/api/parcels/${selectedId}` : null);

  const select = (id: string | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set("parcel", id); else p.delete("parcel");
    setParams(p, { replace: true });
  };

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase().replace(/^p(\d)/, "p-$1");
    const exact = features.find((f) => f.id.toLowerCase() === q || f.properties.ulpin.toLowerCase() === q);
    if (exact) select(exact.id);
    else if (results.length === 1) select(results[0].id);
  };


  if (error) return <div className="card"><ErrorState message={error} onRetry={reload} /></div>;

  const p = detail.data;
  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col sm:-m-6 lg:flex-row">
      {/* Left: search + results */}
      <aside className="flex max-h-[42vh] shrink-0 flex-col border-b border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r">
        <div className="space-y-3 border-b border-slate-200 p-4 dark:border-navy-800">
          <div>
            <h1 className="text-lg font-bold text-navy-900 dark:text-white">GIS Parcel Explorer</h1>
            <p className="text-xs muted">Search, filter and select parcels on the cadastral map</p>
          </div>
          <form onSubmit={runSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 pr-8" placeholder="Parcel ID, ULPIN or survey no. (e.g. P-1024)" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search parcels" />
            {query && <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400" onClick={() => setQuery("")} aria-label="Clear"><X className="h-4 w-4" /></button>}
          </form>
          <div className="flex gap-2">
            <button className={clsx("btn-outline flex-1 py-1.5 text-xs", showFilters && "border-teal-500 text-teal-700 dark:text-teal-300")} onClick={() => setShowFilters((s) => !s)}>
              <Filter className="h-3.5 w-3.5" /> Filters{Object.values(filters).filter(Boolean).length ? ` (${Object.values(filters).filter(Boolean).length})` : ""}
            </button>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-xs dark:border-navy-700">
              {(["land_use", "verification"] as ColorBy[]).map((c) => (
                <button key={c} onClick={() => setColorBy(c)} className={clsx("rounded-md px-2 py-1 font-medium", colorBy === c ? "bg-navy-700 text-white dark:bg-teal-600" : "muted")}>
                  {c === "land_use" ? "Land use" : "Status"}
                </button>
              ))}
            </div>
          </div>
          {showFilters && <div className="animate-fade-in"><ParcelFilters meta={meta} value={filters} onChange={setFilters} compact /></div>}
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-xs muted"><span>{results.length} parcel{results.length === 1 ? "" : "s"}</span><span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {features.length} on map</span></div>
        <ul className="flex-1 overflow-y-auto px-2 pb-2">
          {loading ? Array.from({ length: 6 }).map((_, i) => <li key={i} className="p-2"><Skeleton className="h-12" /></li>)
            : results.length === 0 ? <Empty icon={MapPin} title="No parcels found" text="Try another Parcel ID or clear filters." />
            : results.map((f) => (
              <li key={f.id}>
                <button onClick={() => select(f.id)} className={clsx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                  f.id === selectedId ? "bg-navy-50 ring-1 ring-navy-200 dark:bg-navy-800 dark:ring-navy-600" : "hover:bg-slate-50 dark:hover:bg-navy-800/60")}>
                  <span className="h-8 w-1.5 rounded-full" style={{ background: LAND_USE_COLOR[f.properties.land_use] }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy-900 dark:text-white">{f.id} <span className="font-normal muted">· {f.properties.village}</span></p>
                    <p className="truncate text-xs muted">{f.properties.land_use} · {f.properties.area_sqm.toLocaleString("en-IN")} m²</p>
                  </div>
                  <StatusBadge status={f.properties.verification_status} />
                </button>
              </li>
            ))}
        </ul>
      </aside>

      {/* Map */}
      <div className="relative min-h-[320px] flex-1">
        {loading ? <Loading label="Loading cadastral layer…" /> : (
          <ParcelMap features={features} selectedId={selectedId} onSelect={select} colorBy={colorBy} fitKey={JSON.stringify(filters)} />
        )}
      </div>

      {/* Right: parcel information panel */}
      {selectedId && (
        <aside className="fixed inset-x-0 bottom-0 z-[900] max-h-[70vh] animate-fade-in overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl dark:border-navy-800 dark:bg-navy-900 lg:static lg:max-h-none lg:w-[380px] lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 dark:border-navy-800 dark:bg-navy-900">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider muted">Parcel information</p>
              <p className="text-xl font-bold text-navy-900 dark:text-white">{selectedId}</p>
            </div>
            <button className="btn-ghost px-2" onClick={() => select(null)} aria-label="Close panel"><X className="h-5 w-5" /></button>
          </div>
          {detail.loading ? <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : detail.error ? <ErrorState message={detail.error} onRetry={detail.reload} />
            : p && (
              <div className="space-y-5 p-5">
                <div className="rounded-lg bg-navy-50 p-3 dark:bg-navy-950">
                  <p className="text-xs font-medium muted">ULPIN (Bhu-Aadhaar)</p>
                  <p className="font-mono text-lg font-bold tracking-wider text-navy-900 dark:text-white">{p.ulpin}</p>
                  <p className="mt-1 text-xs muted">Survey No. {p.survey_no} · {p.village}, {p.district}, {p.state}</p>
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Area" value={<>{p.area_sqm.toLocaleString("en-IN")} m²<span className="block text-xs font-normal muted">{p.area_acres} acres</span></>} />
                  <Field label="Land use" value={<span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: LAND_USE_COLOR[p.land_use] }} />{p.land_use}</span>} />
                  <Field label="Verification" value={<StatusBadge status={p.verification_status} />} />
                  <Field label="Ownership" value={<StatusBadge status={p.ownership_status} />} />
                  <Field label="Registration" value={<StatusBadge status={p.registration_status} />} />
                  <Field label="Encumbrance" value={<StatusBadge status={p.encumbrance_status} />} />
                  <Field label="Building permission" value={<StatusBadge status={p.building_permission} />} />
                  <Field label="Zone" value={p.zone} />
                </dl>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-navy-800">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide muted">Property tax & services</p>
                  <div className="flex items-center justify-between text-sm"><span>Tax ({p.services.property_tax.assessment_no})</span><StatusBadge status={p.tax_status} /></div>
                  <div className="mt-1 flex justify-between text-xs muted"><span>Due {inr(p.tax_due)}</span><span>Last paid {fmtDate(p.services.property_tax.last_paid)}</span></div>
                  <div className="mt-2 flex justify-between text-xs"><span className="muted">Water</span><span>{p.services.utilities.water}</span></div>
                  <div className="flex justify-between text-xs"><span className="muted">Electricity</span><span>{p.services.utilities.electricity}</span></div>
                </div>
                <div className="grid gap-2">
                  <Link to={`/app/parcels/${p.parcel_id}`} className="btn-primary"><ExternalLink className="h-4 w-4" /> Unified parcel details</Link>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn-outline" onClick={() => setRequestOpen(true)}><ClipboardPlus className="h-4 w-4" /> Request service</button>
                    <button className="btn-outline" onClick={() => nav(`/app/query?parcel=${p.parcel_id}`)}><Bot className="h-4 w-4" /> Ask AI</button>
                  </div>
                </div>
                <p className="flex items-center gap-1 text-[11px] muted"><ChevronRight className="h-3 w-3" /> Ownership details are masked for privacy.</p>
              </div>
            )}
        </aside>
      )}
      <ServiceRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} parcelId={selectedId || undefined} />
    </div>
  );
}
