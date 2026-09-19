import clsx from "clsx";
import { ClipboardList, Plus, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RequestTimeline, { StepBar } from "../components/RequestTimeline";
import ServiceRequestModal from "../components/ServiceRequestModal";
import { Empty, ErrorState, Field, PageHeader, Skeleton, StatusBadge } from "../components/ui";
import { api } from "../lib/api";
import { SERVICE_LABEL, fmtDateTime } from "../lib/format";
import { useApi } from "../lib/useApi";
import type { ServiceRequest } from "../lib/types";

export default function MyRequests() {
  const [params, setParams] = useSearchParams();
  const { data, error, loading, reload } = useApi<ServiceRequest[]>("/api/requests/mine");
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState("");
  const [tracked, setTracked] = useState<ServiceRequest | null>(null);
  const [trackErr, setTrackErr] = useState<string | null>(null);
  const selectedId = params.get("id");
  const selected = tracked?.request_id === selectedId ? tracked : data?.find((r) => r.request_id === selectedId) || null;

  // Poll so citizens see officer updates without refreshing
  useEffect(() => { const t = setInterval(reload, 15000); return () => clearInterval(t); }, [reload]);
  useEffect(() => { if (!selectedId && data?.length) setParams({ id: data[0].request_id }, { replace: true }); }, [data, selectedId, setParams]);

  const doTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!track.trim()) return;
    setTrackErr(null);
    try { const r = await api<ServiceRequest>(`/api/requests/${track.trim().toUpperCase()}`); setTracked(r); setParams({ id: r.request_id }); }
    catch (err) { setTrackErr((err as Error).message); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Requests" subtitle="Apply for citizen land services and track their progress."
        actions={<><button className="btn-outline" onClick={reload}><RefreshCw className="h-4 w-4" /> Refresh</button><button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New request</button></>} />
      <form onSubmit={doTrack} className="card mb-6 flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
        <label htmlFor="track" className="text-sm font-medium">Track by Request ID</label>
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="track" className="input pl-9 font-mono" placeholder="LS-2026-000006" value={track} onChange={(e) => setTrack(e.target.value)} /></div>
        <button className="btn-teal">Track</button>
        {trackErr && <p className="text-sm text-red-600">{trackErr}</p>}
      </form>

      {error ? <div className="card"><ErrorState message={error} onRetry={reload} /></div> : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="card divide-y divide-slate-100 dark:divide-navy-800">
            {loading && !data ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-12" /></div>)
              : !data?.length ? <Empty icon={ClipboardList} title="No requests yet" text="Open a parcel on the map and apply for a service, or start one here." action={<button className="btn-primary" onClick={() => setOpen(true)}>Create request</button>} />
              : data.map((r) => (
                <button key={r.request_id} onClick={() => setParams({ id: r.request_id })} className={clsx("block w-full p-4 text-left transition hover:bg-slate-50 dark:hover:bg-navy-800/50", r.request_id === selectedId && "bg-navy-50/70 dark:bg-navy-800/70")}>
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-sm font-semibold text-navy-900 dark:text-white">{r.request_id}</span><StatusBadge status={r.status} /></div>
                  <p className="mt-1 text-sm">{SERVICE_LABEL[r.service_type]} · <span className="font-medium">{r.parcel_id}</span></p>
                  <p className="text-xs muted">Updated {fmtDateTime(r.updated_at)}</p>
                </button>
              ))}
          </div>
          <div className="card p-6">
            {!selected ? <Empty title="Select a request" text="Choose a request to see its status timeline." /> : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-xs uppercase tracking-wide muted">Request</p><p className="font-mono text-xl font-bold text-navy-900 dark:text-white">{selected.request_id}</p></div>
                  <StatusBadge status={selected.status} />
                </div>
                <StepBar status={selected.status} />
                {selected.status === "rejected" && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">This request was rejected. {selected.officer_remarks}</p>}
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Service" value={SERVICE_LABEL[selected.service_type]} />
                  <Field label="Parcel" value={<Link className="text-teal-700 hover:underline dark:text-teal-400" to={`/app/parcels/${selected.parcel_id}`}>{selected.parcel_id}</Link>} />
                  <Field label="Department" value={selected.department} />
                  <Field label="Submitted" value={fmtDateTime(selected.created_at)} />
                  <div className="col-span-2"><Field label="Purpose" value={selected.purpose} /></div>
                  {selected.officer_remarks && <div className="col-span-2"><Field label="Officer remarks" value={selected.officer_remarks} /></div>}
                </dl>
                <div><p className="mb-3 text-sm font-semibold text-navy-900 dark:text-white">Timeline</p><RequestTimeline request={selected} /></div>
              </div>
            )}
          </div>
        </div>
      )}
      <ServiceRequestModal open={open} onClose={() => setOpen(false)} onCreated={(r) => { reload(); setParams({ id: r.request_id }); }} />
    </div>
  );
}
