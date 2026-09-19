import clsx from "clsx";
import { ClipboardList, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import RequestTimeline, { StepBar } from "../../components/RequestTimeline";
import { Empty, ErrorState, Field, PageHeader, Skeleton, Spinner, StatusBadge } from "../../components/ui";
import { api } from "../../lib/api";
import { SERVICE_LABEL, fmtDateTime, pretty } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import type { RequestStatus, ServiceRequest } from "../../lib/types";

const NEXT: Record<RequestStatus, RequestStatus | null> = { submitted: "under_review", under_review: "department_verification", department_verification: "completed", completed: null, rejected: null };
const FILTERS = ["", "submitted", "under_review", "department_verification", "completed", "rejected"];

export default function AdminRequests() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState("");
  const { data, error, loading, reload, setData } = useApi<ServiceRequest[]>("/api/admin/requests", { status: status || undefined });
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const sel = data?.find((r) => r.request_id === params.get("id")) || null;

  const update = async (to: RequestStatus) => {
    if (!sel) return;
    if (to === "rejected" && !remarks.trim()) return toast.error("Add remarks explaining the rejection");
    setBusy(to);
    try {
      const r = await api<ServiceRequest>(`/api/admin/requests/${sel.request_id}`, { method: "PATCH", body: { status: to, remarks: remarks || null } });
      setData((d) => d?.map((x) => (x.request_id === r.request_id ? r : x)) || null);
      setRemarks(""); toast.success(`${r.request_id} → ${pretty(to)}`);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Service Requests" subtitle="Review citizen requests and move them through the verification workflow." actions={<button className="btn-outline" onClick={reload}><RefreshCw className="h-4 w-4" /> Refresh</button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => <button key={f} onClick={() => setStatus(f)} className={clsx("rounded-full px-3 py-1 text-xs font-medium transition", status === f ? "bg-navy-700 text-white dark:bg-teal-600" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-navy-900 dark:text-slate-300 dark:ring-navy-700")}>{f ? pretty(f) : "All"}</button>)}
      </div>
      {error ? <div className="card"><ErrorState message={error} onRetry={reload} /></div> : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="card overflow-x-auto">
            {loading && !data ? <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
              : !data?.length ? <Empty icon={ClipboardList} title="No requests" text="No requests match this filter." />
              : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide muted dark:border-navy-800"><th className="px-4 py-3 font-medium">Request</th><th className="px-4 py-3 font-medium">Service</th><th className="px-4 py-3 font-medium">Parcel</th><th className="px-4 py-3 font-medium">Applicant</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
                  <tbody>{data.map((r) => (
                    <tr key={r.request_id} onClick={() => setParams({ id: r.request_id })} className={clsx("cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-navy-800 dark:hover:bg-navy-800/50", sel?.request_id === r.request_id && "bg-navy-50/70 dark:bg-navy-800/70")}>
                      <td className="whitespace-nowrap px-4 py-3"><p className="font-mono font-semibold">{r.request_id}</p><p className="text-xs muted">{fmtDateTime(r.created_at)}</p></td>
                      <td className="whitespace-nowrap px-4 py-3">{SERVICE_LABEL[r.service_type]}</td>
                      <td className="px-4 py-3">{r.parcel_id}</td>
                      <td className="whitespace-nowrap px-4 py-3">{r.applicant?.name}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    </tr>))}</tbody>
                </table>
              )}
          </div>
          <div className="card p-6">
            {!sel ? <Empty title="Select a request to review" /> : (
              <div className="space-y-5">
                <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-wide muted">Reviewing</p><p className="font-mono text-xl font-bold text-navy-900 dark:text-white">{sel.request_id}</p></div><StatusBadge status={sel.status} /></div>
                <StepBar status={sel.status} />
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Service" value={SERVICE_LABEL[sel.service_type]} />
                  <Field label="Parcel" value={<Link className="text-teal-700 hover:underline dark:text-teal-400" to={`/app/parcels/${sel.parcel_id}`}>{sel.parcel_id}</Link>} />
                  <Field label="Applicant" value={<>{sel.applicant?.name}<span className="block text-xs font-normal muted">{sel.applicant?.email}</span></>} />
                  <Field label="Department" value={sel.department} />
                  <div className="col-span-2"><Field label="Purpose" value={sel.purpose} /></div>
                </dl>
                {NEXT[sel.status] ? (
                  <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-navy-800">
                    <label className="label" htmlFor="rm">Officer remarks</label>
                    <textarea id="rm" className="input min-h-[70px]" maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. RoR and cadastral boundary cross-verified." />
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-teal" disabled={!!busy} onClick={() => update(NEXT[sel.status]!)}>{busy === NEXT[sel.status] && <Spinner className="h-4 w-4" />} Move to {pretty(NEXT[sel.status])}</button>
                      <button className="btn-outline text-red-600" disabled={!!busy} onClick={() => update("rejected")}>{busy === "rejected" && <Spinner className="h-4 w-4" />} Reject</button>
                    </div>
                  </div>
                ) : <p className="rounded-lg bg-slate-50 p-3 text-sm muted dark:bg-navy-950">This request is closed.</p>}
                <div><p className="mb-3 text-sm font-semibold">Timeline</p><RequestTimeline request={sel} /></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
