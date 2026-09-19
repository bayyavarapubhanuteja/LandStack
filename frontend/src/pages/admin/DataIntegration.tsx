import { AlertTriangle, Database, RefreshCw, Server } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState, Loading, PageHeader, Spinner, StatusBadge } from "../../components/ui";
import { api } from "../../lib/api";
import { fmtDateTime, num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import type { Integration } from "../../lib/types";

export default function DataIntegration() {
  const { data, error, loading, reload } = useApi<Integration[]>("/api/admin/integrations");
  const [syncing, setSyncing] = useState<string | null>(null);

  const sync = async (code: string) => {
    setSyncing(code);
    try { await api(`/api/admin/integrations/${code}/sync`, { method: "POST" }); toast.success("Sync completed (simulated)"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setSyncing(null); reload(); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Department Data Integration" subtitle="Departmental datasets linked to parcels via ULPIN." />
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p><b>Mock / demo integrations.</b> These connectors are simulated for demonstration. They are not connected to any real government system; record counts and sync times are illustrative.</p>
      </div>
      {loading ? <Loading /> : error || !data ? <div className="card"><ErrorState message={error || ""} onRetry={reload} /></div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((d) => (
            <div key={d.code} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-navy-50 p-2.5 text-navy-700 dark:bg-navy-800 dark:text-teal-300"><Database className="h-5 w-5" /></div>
                <div className="flex gap-1.5"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase dark:bg-navy-800">Mock</span><StatusBadge status={d.status} /></div>
              </div>
              <p className="mt-3 font-semibold text-navy-900 dark:text-white">{d.name}</p>
              <p className="text-sm muted">{d.dataset}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs muted">Records</dt><dd className="font-semibold">{num(d.record_count)}</dd></div>
                <div><dt className="text-xs muted">Parcel coverage</dt><dd className="font-semibold">{d.coverage_pct}%</dd></div>
                <div className="col-span-2"><dt className="text-xs muted">Last synchronisation</dt><dd className="font-medium">{fmtDateTime(d.last_sync)}</dd></div>
              </dl>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800"><div className="h-full rounded-full bg-teal-500" style={{ width: `${d.coverage_pct}%` }} /></div>
              <p className="mt-3 flex items-center gap-1.5 font-mono text-xs muted"><Server className="h-3.5 w-3.5" />{d.api_endpoint}</p>
              <button className="btn-outline mt-4" onClick={() => sync(d.code)} disabled={!!syncing}>
                {syncing === d.code ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />} Sync now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
