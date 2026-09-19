import clsx from "clsx";
import { ArrowLeft, Bot, Building2, ClipboardPlus, FileCheck2, FileText, Info, LayoutGrid, Lock, Receipt, ScrollText, Trees } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ParcelMap from "../components/ParcelMap";
import ServiceRequestModal from "../components/ServiceRequestModal";
import UnifiedParcelView from "../components/UnifiedParcelView";
import { Empty, ErrorState, Field, Loading, StatusBadge } from "../components/ui";
import { LAND_USE_COLOR, fmtDate, inr, pretty } from "../lib/format";
import { useApi } from "../lib/useApi";
import type { Feature, ParcelDetail, ServiceType } from "../lib/types";

const TABS = [
  { k: "overview", label: "Overview", icon: LayoutGrid }, { k: "ownership", label: "Ownership", icon: ScrollText },
  { k: "registration", label: "Registration", icon: FileCheck2 }, { k: "landuse", label: "Land Use", icon: Trees },
  { k: "planning", label: "Planning", icon: Building2 }, { k: "encumbrance", label: "Encumbrance", icon: FileText },
  { k: "services", label: "Services", icon: Receipt },
] as const;
type Tab = (typeof TABS)[number]["k"];

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide muted dark:border-navy-800">{head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-navy-800/60">{r.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2.5">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function ParcelDetails() {
  const { parcelId = "" } = useParams();
  const nav = useNavigate();
  const { data: p, error, loading, reload } = useApi<ParcelDetail>(`/api/parcels/${parcelId}`);
  const [tab, setTab] = useState<Tab>("overview");
  const [svc, setSvc] = useState<ServiceType | null>(null);

  if (loading) return <Loading label="Assembling unified parcel record…" />;
  if (error || !p) return <div className="card"><ErrorState message={error || "Parcel not found"} onRetry={reload} /></div>;

  const feature: Feature = { type: "Feature", id: p.parcel_id, geometry: p.geometry, properties: p };
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to={`/app/explorer?parcel=${p.parcel_id}`} className="mb-2 inline-flex items-center gap-1 text-sm muted hover:text-navy-700 dark:hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to map</Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="h-page">Parcel {p.parcel_id}</h1>
            <StatusBadge status={p.verification_status} />
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium dark:bg-navy-800"><span className="h-2 w-2 rounded-full" style={{ background: LAND_USE_COLOR[p.land_use] }} />{p.land_use}</span>
          </div>
          <p className="mt-1 text-sm muted">ULPIN <span className="font-mono font-semibold text-navy-900 dark:text-white">{p.ulpin}</span> · Survey No. {p.survey_no} · {p.village}, {p.district}, {p.state}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={() => nav(`/app/query?parcel=${p.parcel_id}`)}><Bot className="h-4 w-4" /> Ask AI</button>
          <button className="btn-primary" onClick={() => setSvc("ownership_verification")}><ClipboardPlus className="h-4 w-4" /> Request service</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="flex min-w-max border-b border-slate-200 px-2 dark:border-navy-800">
          {TABS.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={clsx("flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition",
              tab === t.k ? "border-teal-600 text-navy-900 dark:text-white" : "border-transparent muted hover:text-navy-700 dark:hover:text-white")}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="h-[340px] overflow-hidden rounded-lg border border-slate-200 dark:border-navy-800"><ParcelMap features={[feature]} selectedId={p.parcel_id} showLegend={false} /></div>
                <dl className="grid grid-cols-2 content-start gap-5">
                  <Field label="Area" value={`${p.area_sqm.toLocaleString("en-IN")} m² (${p.area_acres} ac)`} />
                  <Field label="Land use" value={p.land_use} />
                  <Field label="Ownership" value={<StatusBadge status={p.ownership_status} />} />
                  <Field label="Registration" value={<StatusBadge status={p.registration_status} />} />
                  <Field label="Encumbrance" value={<StatusBadge status={p.encumbrance_status} />} />
                  <Field label="Building permission" value={<StatusBadge status={p.building_permission} />} />
                  <Field label="Zone" value={p.zone} />
                  <Field label="Property tax" value={<StatusBadge status={p.tax_status} />} />
                  <Field label="Centroid" mono value={`${p.centroid[0].toFixed(5)}, ${p.centroid[1].toFixed(5)}`} />
                  <Field label="Last updated" value={fmtDate(p.updated_at)} />
                </dl>
              </div>
              <div>
                <h2 className="mb-1 text-lg font-semibold text-navy-900 dark:text-white">Unified Parcel View</h2>
                <p className="text-sm muted">How this parcel's ULPIN connects records across departments.</p>
                <UnifiedParcelView parcel={p} />
              </div>
            </div>
          )}
          {tab === "ownership" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3"><span className="text-sm">Title status</span><StatusBadge status={p.ownership.status} />
                <span className="ml-auto flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"><Lock className="h-3.5 w-3.5" /> Owner names masked (demo privacy)</span></div>
              {p.ownership.records.length ? (
                <Table head={["Holder", "Type", "Share", "RoR No.", "Khata", "Mutation", "Acquired", "Current"]}
                  rows={p.ownership.records.map((o) => [<span className="font-mono">{o.owner_name}</span>, pretty(o.owner_type), `${o.share_pct}%`, <span className="font-mono text-xs">{o.ror_number}</span>, o.khata_no,
                    <StatusBadge status={o.mutation_status} />, fmtDate(o.acquired_on), o.is_current ? <StatusBadge status="active" label="Current" /> : <span className="text-xs muted">Previous</span>])} />
              ) : <Empty title="No ownership records" />}
            </div>
          )}
          {tab === "registration" && (p.registration.records.length ? (
            <Table head={["Document No.", "Deed", "SRO", "Registered", "Market value", "Stamp duty", "Status"]}
              rows={p.registration.records.map((r) => [<span className="font-mono">{r.document_no}</span>, r.deed_type, r.sro_office, fmtDate(r.registered_on), inr(r.market_value), inr(r.stamp_duty), <StatusBadge status={r.status} />])} />
          ) : <Empty icon={FileCheck2} title="No registration record available" text="This parcel has no registered deeds in the Registration department dataset." />)}
          {tab === "landuse" && (
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Category" value={p.land_use_detail.category} />
              <Field label="Sub-category" value={p.land_use_detail.sub_category} />
              <Field label="Classification source" value={p.land_use_detail.classification_source} />
              <Field label="Conversion status" value={pretty(p.land_use_detail.conversion_status)} />
              <Field label="Classified on" value={fmtDate(p.land_use_detail.classified_on)} />
            </dl>
          )}
          {tab === "planning" && (p.planning.available ? (
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Zone" value={p.planning.zone} />
              <Field label="Master plan" value={p.planning.master_plan} />
              <Field label="Permissible FSI" value={p.planning.fsi} />
              <Field label="Max height" value={`${p.planning.max_height_m} m`} />
              <Field label="Setback" value={`${p.planning.setback_m} m`} />
              <Field label="Building permission" value={<StatusBadge status={p.planning.building_permission_status!} />} />
              <Field label="Permit No." mono value={p.planning.permit_no || "—"} />
              <Field label="Permit date" value={fmtDate(p.planning.permit_date)} />
            </dl>
          ) : <Empty icon={Building2} title="Planning information unavailable" />)}
          {tab === "encumbrance" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3"><span className="text-sm">Current status</span><StatusBadge status={p.encumbrance.status} /></div>
              {p.encumbrance.records.length ? (
                <Table head={["Type", "Holder / Authority", "Amount", "From", "To", "Status"]}
                  rows={p.encumbrance.records.map((e) => [pretty(e.type), e.holder, inr(e.amount), fmtDate(e.start_date), fmtDate(e.end_date), <StatusBadge status={e.status} />])} />
              ) : <Empty icon={FileText} title="No encumbrances recorded" text="No mortgages, liens, leases or court cases on record." />}
              <button className="btn-outline" onClick={() => setSvc("encumbrance_certificate")}><ClipboardPlus className="h-4 w-4" /> Request Encumbrance Certificate</button>
            </div>
          )}
          {tab === "services" && (
            <div className="space-y-6">
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Tax assessment No." mono value={p.services.property_tax.assessment_no} />
                <Field label="Tax status" value={<StatusBadge status={p.services.property_tax.status} />} />
                <Field label="Outstanding" value={inr(p.services.property_tax.due_amount)} />
                <Field label="Last paid" value={fmtDate(p.services.property_tax.last_paid)} />
                <Field label="Water connection" value={p.services.utilities.water} />
                <Field label="Electricity" value={p.services.utilities.electricity} />
              </dl>
              <div>
                <p className="mb-2 text-sm font-semibold text-navy-900 dark:text-white">Citizen services for this parcel</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {([["ownership_verification", "Ownership Verification"], ["land_record_request", "Land Record Request"], ["encumbrance_certificate", "Encumbrance Certificate"],
                    ["land_use_information", "Land Use Information"], ["building_permission_status", "Building Permission Status"]] as [ServiceType, string][]).map(([k, l]) => (
                    <button key={k} className="card p-3 text-left text-sm font-medium transition hover:border-teal-400" onClick={() => setSvc(k)}>{l}<span className="mt-1 block text-xs font-normal text-teal-700 dark:text-teal-400">Apply →</span></button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-xs muted"><Info className="h-3.5 w-3.5" /> Data served by <span className="font-mono">/api/parcels/{p.parcel_id}</span> and its sub-resources. All records are fictional.</p>
      <ServiceRequestModal open={!!svc} onClose={() => setSvc(null)} parcelId={p.parcel_id} initialService={svc || "ownership_verification"} />
    </div>
  );
}
