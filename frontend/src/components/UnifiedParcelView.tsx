import clsx from "clsx";
import { Building2, FileCheck2, FileText, Map, Receipt, ScrollText } from "lucide-react";
import { pretty } from "../lib/format";
import type { ParcelSummary } from "../lib/types";
import { StatusBadge } from "./ui";

/** Hub-and-spoke diagram: one parcel identity (ULPIN) linking every department's record. */
export default function UnifiedParcelView({ parcel, compact = false }: { parcel: ParcelSummary; compact?: boolean }) {
  const nodes = [
    { icon: Map, title: "Cadastral Map", dept: "Survey & Settlement", value: `${parcel.area_sqm.toLocaleString("en-IN")} m²`, status: parcel.verification_status },
    { icon: ScrollText, title: "Land Records (RoR)", dept: "Revenue Dept.", value: pretty(parcel.ownership_status), status: parcel.ownership_status },
    { icon: FileCheck2, title: "Registration", dept: "Registration & Stamps", value: pretty(parcel.registration_status), status: parcel.registration_status },
    { icon: FileText, title: "Encumbrance", dept: "Registration & Stamps", value: pretty(parcel.encumbrance_status), status: parcel.encumbrance_status },
    { icon: Building2, title: "Planning & Permits", dept: "Town & Country Planning", value: parcel.zone || "—", status: parcel.building_permission },
    { icon: Receipt, title: "Services & Tax", dept: "Municipal / Utilities", value: `Tax ${parcel.tax_status}`, status: parcel.tax_status },
  ];
  return (
    <div className={clsx("relative", compact ? "p-2" : "p-4")}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-[1fr_1fr_auto_1fr_1fr]">
        {/* Center hub on large screens sits in the middle column */}
        <div className="col-span-2 flex items-center justify-center md:col-span-3 lg:col-span-1 lg:col-start-3 lg:row-span-3 lg:row-start-1">
          <div className="relative flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-teal-500/30 bg-navy-800 text-center text-white shadow-lg dark:bg-navy-700">
            <span className="absolute inset-0 animate-ping rounded-full border-2 border-teal-400/30 [animation-duration:3s]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-300">Parcel</span>
            <span className="text-2xl font-bold">{parcel.parcel_id}</span>
            <span className="mt-1 font-mono text-[10px] text-slate-300">ULPIN</span>
            <span className="font-mono text-[11px] font-semibold">{parcel.ulpin}</span>
          </div>
        </div>
        {nodes.map((n, i) => {
          const pos = ["lg:col-start-1 lg:row-start-1", "lg:col-start-2 lg:row-start-2", "lg:col-start-1 lg:row-start-3",
            "lg:col-start-5 lg:row-start-1", "lg:col-start-4 lg:row-start-2", "lg:col-start-5 lg:row-start-3"][i];
          return (
            <div key={n.title} className={clsx("card relative animate-fade-in p-3", pos)} style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-navy-50 p-1.5 text-navy-700 dark:bg-navy-800 dark:text-teal-300"><n.icon className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">{n.title}</p>
                  <p className="truncate text-[11px] muted">{n.dept}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium">{n.value}</span>
                <StatusBadge status={n.status} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs muted">One ULPIN links records from six departmental systems into one parcel-centric view.</p>
    </div>
  );
}
