import { ExternalLink, History, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ParcelFilters, { EMPTY_FILTERS, applyFilters, type FilterState } from "../../components/ParcelFilters";
import ParcelMap from "../../components/ParcelMap";
import { Empty, ErrorState, Loading, Modal, PageHeader, Spinner, StatusBadge } from "../../components/ui";
import { api } from "../../lib/api";
import { fmtDateTime } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import type { AuditEntry, FeatureCollection, Filters } from "../../lib/types";

export default function ParcelManagement() {
  const { data, error, loading, reload } = useApi<FeatureCollection>("/api/parcels/geojson");
  const { data: meta } = useApi<Filters>("/api/parcels/filters");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<string | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [status, setStatus] = useState("verified");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const features = useMemo(() => applyFilters(data?.features || [], filters), [data, filters]);
  const sel = features.find((f) => f.id === selected) || data?.features.find((f) => f.id === selected);
  const audit = useApi<AuditEntry[]>(selected ? "/api/admin/audit" : null, { entity_id: selected || undefined });

  const verify = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/parcels/${selected}/verification`, { method: "PATCH", body: { status, remarks: remarks || null } });
      toast.success(`${selected} marked ${status}`); setVerifyOpen(false); setRemarks(""); reload(); audit.reload();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  if (error) return <div className="card"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Parcel Management" subtitle="Admin GIS view — filter the registry, verify parcels and review audit history." />
      <div className="card p-4"><ParcelFilters meta={meta} value={filters} onChange={setFilters} /></div>
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="card h-[560px] overflow-hidden">
          {loading ? <Loading /> : <ParcelMap features={features} selectedId={selected} onSelect={setSelected} colorBy="verification" fitKey={JSON.stringify(filters)} />}
        </div>
        <div className="card flex h-[560px] flex-col">
          {!sel ? (
            <div className="flex-1 overflow-y-auto">
              <p className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-navy-800">{features.length} parcels match</p>
              {!features.length ? <Empty title="No parcels match these filters" /> : (
                <table className="w-full text-sm">
                  <tbody>{features.map((f) => (
                    <tr key={f.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-navy-800 dark:hover:bg-navy-800/50" onClick={() => setSelected(f.id)}>
                      <td className="px-4 py-2.5 font-semibold">{f.id}</td><td className="px-2 py-2.5 text-xs muted">{f.properties.village}</td><td className="px-2 py-2.5 text-xs">{f.properties.land_use}</td>
                      <td className="px-4 py-2.5 text-right"><StatusBadge status={f.properties.verification_status} /></td>
                    </tr>))}</tbody>
                </table>
              )}
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 p-4 dark:border-navy-800">
                <div className="flex items-center justify-between">
                  <div><p className="text-xl font-bold text-navy-900 dark:text-white">{sel.id}</p><p className="font-mono text-xs muted">{sel.properties.ulpin}</p></div>
                  <button className="btn-ghost text-xs" onClick={() => setSelected(null)}>← All parcels</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5"><StatusBadge status={sel.properties.verification_status} /><StatusBadge status={sel.properties.ownership_status} /><StatusBadge status={sel.properties.registration_status} /><StatusBadge status={sel.properties.encumbrance_status} /></div>
                <p className="mt-2 text-xs muted">{sel.properties.village}, {sel.properties.district}, {sel.properties.state} · {sel.properties.land_use}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="btn-primary py-1.5" onClick={() => { setStatus(sel.properties.verification_status === "verified" ? "flagged" : "verified"); setVerifyOpen(true); }}><ShieldCheck className="h-4 w-4" /> Verify / flag</button>
                  <Link to={`/app/parcels/${sel.id}`} className="btn-outline py-1.5"><ExternalLink className="h-4 w-4" /> Details</Link>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Audit history</p>
                {audit.loading ? <Loading /> : !audit.data?.length ? <Empty title="No audit entries" text="Actions on this parcel will appear here." /> : (
                  <ol className="space-y-3">{audit.data.map((a) => (
                    <li key={a.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-navy-800">
                      <p className="font-mono text-xs font-semibold">{a.action}</p>
                      {a.details && <p className="mt-0.5">{a.details}</p>}
                      <p className="mt-1 text-xs muted">{a.actor} · {fmtDateTime(a.created_at)}</p>
                    </li>))}</ol>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title={`Update verification — ${selected}`}>
        <div className="space-y-4">
          <div><label className="label">Status</label>
            <div className="grid grid-cols-3 gap-2">{["verified", "pending", "flagged"].map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)} className={`btn-outline capitalize ${status === s ? "border-teal-500 ring-2 ring-teal-500/30" : ""}`}>{s}</button>))}</div>
          </div>
          <div><label className="label" htmlFor="rm">Remarks</label><textarea id="rm" className="input min-h-[80px]" maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Field verification completed; boundary matches RoR." /></div>
          <div className="flex justify-end gap-2"><button className="btn-outline" onClick={() => setVerifyOpen(false)}>Cancel</button><button className="btn-primary" onClick={verify} disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Save</button></div>
        </div>
      </Modal>
    </div>
  );
}
