import clsx from "clsx";
import { Check, Circle, X } from "lucide-react";
import { fmtDateTime } from "../lib/format";
import type { ServiceRequest } from "../lib/types";

const STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "department_verification", label: "Department Verification" },
  { key: "completed", label: "Completed" },
];

export function StepBar({ status }: { status: string }) {
  const idx = status === "rejected" ? -1 : STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center">
            <div className={clsx("flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition",
              i <= idx ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-slate-400 dark:border-navy-700 dark:bg-navy-900")}>
              {i < idx || status === "completed" ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={clsx("mt-1.5 hidden w-24 text-center text-[11px] font-medium sm:block", i <= idx ? "text-teal-700 dark:text-teal-300" : "muted")}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={clsx("mx-1 h-0.5 flex-1 sm:-mt-5", i < idx ? "bg-teal-600" : "bg-slate-200 dark:bg-navy-700")} />}
        </div>
      ))}
    </div>
  );
}

export default function RequestTimeline({ request }: { request: ServiceRequest }) {
  return (
    <ol className="relative ml-3 border-l-2 border-slate-200 dark:border-navy-700">
      {request.timeline.map((t, i) => {
        const last = i === request.timeline.length - 1;
        return (
          <li key={i} className="mb-5 ml-5 last:mb-0">
            <span className={clsx("absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-navy-900",
              t.status === "rejected" ? "bg-red-500" : last ? "bg-teal-600" : "bg-navy-600")}>
              {t.status === "rejected" ? <X className="h-2.5 w-2.5 text-white" /> : <Circle className="h-1.5 w-1.5 fill-white text-white" />}
            </span>
            <p className="text-sm font-semibold text-navy-900 dark:text-white">{t.label}</p>
            <p className="text-xs muted">{fmtDateTime(t.at)} · {t.by}</p>
            {t.note && <p className="mt-1 rounded-md bg-slate-50 px-2.5 py-1.5 text-sm dark:bg-navy-950">{t.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
