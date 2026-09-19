import { ArrowRight, Bot, CheckCircle2, ClipboardList, FileSearch, FileText, Layers, Map, ShieldCheck, Workflow } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bars, ChartCard, Donut } from "../components/Charts";
import ServiceRequestModal from "../components/ServiceRequestModal";
import { Empty, ErrorState, PageHeader, Skeleton, Stat, StatusBadge } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { SERVICE_LABEL, fmtDateTime } from "../lib/format";
import { useApi } from "../lib/useApi";
import type { ServiceRequest, ServiceType, Summary } from "../lib/types";

const SERVICES: { k: ServiceType; icon: typeof Map; d: string }[] = [
  { k: "ownership_verification", icon: ShieldCheck, d: "Confirm title & RoR" },
  { k: "land_record_request", icon: FileText, d: "Certified RoR copy" },
  { k: "encumbrance_certificate", icon: FileSearch, d: "Mortgages & liens" },
  { k: "land_use_information", icon: Layers, d: "Classification & conversion" },
  { k: "building_permission_status", icon: CheckCircle2, d: "Permit & zoning status" },
];

export default function Dashboard() {
  const { user, isStaff } = useAuth();
  const nav = useNavigate();
  const { data: s, error, loading, reload } = useApi<Summary>("/api/analytics/summary");
  const reqs = useApi<ServiceRequest[]>(isStaff ? "/api/admin/requests" : "/api/requests/mine");
  const [svc, setSvc] = useState<ServiceType | null>(null);

  if (error) return <div className="card"><ErrorState message={error} onRetry={reload} /></div>;
  const recent = (reqs.data || []).slice(0, 5);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={`Welcome, ${user?.name.split(" ")[0]}`}
        subtitle={isStaff ? "Administrative overview of the parcel registry and citizen service pipeline." : "Find your land on the map, verify records and track your service requests."}
        actions={<Link to="/app/explorer" className="btn-primary"><Map className="h-4 w-4" /> Open Parcel Explorer</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !s ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px]" />) : <>
          <Stat icon={Layers} label="Total Parcels" value={s.total_parcels} hint={`${s.total_area_acres} acres mapped`} />
          <Stat icon={CheckCircle2} tone="green" label="Verified Parcels" value={s.verified_parcels} hint={`${Math.round((s.verified_parcels / s.total_parcels) * 100)}% of registry`} />
          <Stat icon={ClipboardList} tone="amber" label={isStaff ? "Pending Requests" : "My Open Requests"} value={s.pending_requests} hint={`${s.completed_requests} completed`} />
          <Stat icon={Workflow} tone="teal" label="Active Services" value={s.active_services} hint="Citizen services online" />
        </>}
      </div>

      {!isStaff && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between"><p className="font-semibold text-navy-900 dark:text-white">Citizen services</p><Link to="/app/query" className="flex items-center gap-1 text-sm font-medium text-teal-700 dark:text-teal-400"><Bot className="h-4 w-4" /> Ask AI Land Query</Link></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICES.map((x) => (
              <button key={x.k} onClick={() => setSvc(x.k)} className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-400 hover:shadow-card dark:border-navy-800">
                <x.icon className="h-5 w-5 text-teal-600" />
                <p className="mt-3 text-sm font-semibold text-navy-900 dark:text-white">{SERVICE_LABEL[x.k]}</p>
                <p className="text-xs muted">{x.d}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {isStaff && s && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Land use distribution"><Donut data={s.land_use_distribution} /></ChartCard>
          <ChartCard title="Service requests"><Bars horizontal data={s.service_requests.map((d) => ({ ...d, name: SERVICE_LABEL[d.name] || d.name }))} /></ChartCard>
          <ChartCard title="Parcel verification"><Donut data={s.verification} /></ChartCard>
          <ChartCard title="Department data coverage" subtitle="Mock integrations"><Bars horizontal unit="%" data={s.department_coverage} color="#16a992" /></ChartCard>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-navy-800">
          <p className="font-semibold text-navy-900 dark:text-white">{isStaff ? "Latest service requests" : "My recent requests"}</p>
          <Link to={isStaff ? "/app/admin/requests" : "/app/requests"} className="flex items-center gap-1 text-sm font-medium text-teal-700 dark:text-teal-400">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {reqs.loading ? <div className="space-y-2 p-5"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          : !recent.length ? <Empty icon={ClipboardList} title="No requests yet" text="Select a parcel on the map to apply for a service." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide muted"><th className="px-5 py-2 font-medium">Request</th><th className="px-5 py-2 font-medium">Service</th><th className="px-5 py-2 font-medium">Parcel</th>{isStaff && <th className="px-5 py-2 font-medium">Applicant</th>}<th className="px-5 py-2 font-medium">Updated</th><th className="px-5 py-2 font-medium">Status</th></tr></thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.request_id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-navy-800 dark:hover:bg-navy-800/50"
                      onClick={() => nav(isStaff ? `/app/admin/requests?id=${r.request_id}` : `/app/requests?id=${r.request_id}`)}>
                      <td className="whitespace-nowrap px-5 py-3 font-mono font-medium">{r.request_id}</td>
                      <td className="whitespace-nowrap px-5 py-3">{SERVICE_LABEL[r.service_type]}</td>
                      <td className="px-5 py-3">{r.parcel_id}</td>
                      {isStaff && <td className="whitespace-nowrap px-5 py-3">{r.applicant?.name}</td>}
                      <td className="whitespace-nowrap px-5 py-3 muted">{fmtDateTime(r.updated_at)}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      <ServiceRequestModal open={!!svc} onClose={() => setSvc(null)} initialService={svc || "ownership_verification"} onCreated={() => reqs.reload()} />
    </div>
  );
}
