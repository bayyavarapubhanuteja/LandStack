import clsx from "clsx";
import { AlertTriangle, Inbox, Loader2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { pretty } from "../lib/format";

const TONES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30",
  red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/30",
  blue: "bg-navy-50 text-navy-700 ring-navy-600/20 dark:bg-navy-500/15 dark:text-navy-200 dark:ring-navy-400/30",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/30",
  gray: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30",
};
const STATUS_TONE: Record<string, string> = {
  verified: "green", clear: "green", clear_title: "green", registered: "green", approved: "green", paid: "green", completed: "green", connected: "green", released: "gray", active: "amber",
  pending: "amber", mutation_pending: "amber", due: "amber", under_review: "blue", submitted: "gray", department_verification: "teal", degraded: "amber", not_applied: "gray",
  flagged: "red", disputed: "red", encumbered: "amber", unregistered: "red", overdue: "red", rejected: "red", offline: "red", unrecorded: "gray",
};

export function Badge({ tone = "gray", children, className }: { tone?: string; children: ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", TONES[tone], className)}>{children}</span>;
}
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge tone={STATUS_TONE[status] || "gray"}>{label || pretty(status)}</Badge>;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("animate-spin", className || "h-5 w-5")} />;
}
export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-16 text-sm muted"><Spinner /> {label}</div>;
}
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-slate-200 dark:bg-navy-800", className)} />;
}
export function Empty({ icon: Icon = Inbox, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3 dark:bg-navy-800"><Icon className="h-6 w-6 text-slate-400" /></div>
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="mb-3 rounded-full bg-red-50 p-3 dark:bg-red-500/10"><AlertTriangle className="h-6 w-6 text-red-500" /></div>
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm muted">{message}</p>
      {onRetry && <button className="btn-outline mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Stat({ icon: Icon, label, value, hint, tone = "navy" }: { icon: LucideIcon; label: string; value: ReactNode; hint?: string; tone?: "navy" | "teal" | "amber" | "green" }) {
  const t = { navy: "bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-navy-200", teal: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300", amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300", green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" }[tone];
  return (
    <div className="card animate-fade-in p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-navy-900 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs muted">{hint}</p>}
        </div>
        <div className={clsx("rounded-lg p-2.5", t)}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="h-page">{title}</h1>
        {subtitle && <p className="mt-1 text-sm muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide muted">{label}</dt>
      <dd className={clsx("mt-1 text-sm font-medium text-slate-800 dark:text-slate-100", mono && "font-mono")}>{value ?? "—"}</dd>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-navy-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className={clsx("card max-h-[92vh] w-full animate-fade-in overflow-y-auto rounded-b-none p-6 sm:rounded-xl", wide ? "sm:max-w-2xl" : "sm:max-w-lg")} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white">{title}</h2>
          <button className="btn-ghost -mr-2 px-2" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
