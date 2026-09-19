import { CheckCircle2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { SERVICE_LABEL } from "../lib/format";
import type { ServiceRequest, ServiceType } from "../lib/types";
import { Modal, Spinner } from "./ui";

export default function ServiceRequestModal({ open, onClose, parcelId, initialService = "ownership_verification", onCreated }:
  { open: boolean; onClose: () => void; parcelId?: string; initialService?: ServiceType; onCreated?: (r: ServiceRequest) => void }) {
  const [pid, setPid] = useState(parcelId || "");
  const [service, setService] = useState<ServiceType>(initialService);
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    if (open) { setPid(parcelId || ""); setService(initialService); setPurpose(""); setError(null); setCreated(null); }
  }, [open, parcelId, initialService]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = pid.trim().toUpperCase();
    if (!/^P-\d{3,6}$/.test(id)) return setError("Enter a valid Parcel ID, e.g. P-1024");
    if (purpose.trim().length < 5) return setError("Please describe the purpose (at least 5 characters)");
    setBusy(true); setError(null);
    try {
      const r = await api<ServiceRequest>("/api/requests", { method: "POST", body: { parcel_id: id, service_type: service, purpose } });
      setCreated(r); onCreated?.(r);
      toast.success(`Request ${r.request_id} submitted`);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={created ? "Request submitted" : "New citizen service request"}>
      {created ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-teal-600" />
          <p className="mt-3 text-sm muted">Your request ID</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-bold text-navy-900 dark:text-white">{created.request_id}</span>
            <button className="btn-ghost px-2" title="Copy" onClick={() => { navigator.clipboard?.writeText(created.request_id); toast.success("Copied"); }}><Copy className="h-4 w-4" /></button>
          </div>
          <p className="mt-3 text-sm muted">{SERVICE_LABEL[created.service_type]} for <b>{created.parcel_id}</b> has been routed to <b>{created.department}</b>.</p>
          <div className="mt-6 flex justify-center gap-2">
            <button className="btn-outline" onClick={onClose}>Close</button>
            <Link to={`/app/requests?id=${created.request_id}`} className="btn-primary" onClick={onClose}>Track request</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="svc">Service</label>
            <select id="svc" className="input" value={service} onChange={(e) => setService(e.target.value as ServiceType)}>
              {Object.entries(SERVICE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pid">Parcel ID</label>
            <input id="pid" className="input font-mono" value={pid} onChange={(e) => setPid(e.target.value)} placeholder="P-1024" disabled={!!parcelId} />
          </div>
          <div>
            <label className="label" htmlFor="purpose">Purpose</label>
            <textarea id="purpose" className="input min-h-[90px]" maxLength={500} value={purpose} onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Verification required for home loan application" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Submit request</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
