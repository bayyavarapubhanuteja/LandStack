import type { ReactNode } from "react";
import { Logo } from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-10 text-white lg:flex">
        <svg className="absolute inset-0 h-full w-full opacity-[0.15]" aria-hidden>
          <defs><pattern id="cad" width="120" height="100" patternUnits="userSpaceOnUse"><path d="M0 10 L60 0 L120 12 M60 0 L65 100 M0 55 L65 48 L120 60" fill="none" stroke="#6bdec5" strokeWidth="1.2" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#cad)" />
        </svg>
        <div className="relative [&_span]:!text-white"><Logo /></div>
        <div className="relative">
          <p className="text-3xl font-bold leading-tight">One Parcel. One Identity.<br /><span className="text-teal-300">One Unified Land Governance Platform.</span></p>
          <p className="mt-4 max-w-md text-slate-300">Cadastral maps, land records, registration, planning and citizen services — connected through a single parcel identity.</p>
        </div>
        <p className="relative text-xs text-slate-400">Demo environment · fictional data only</p>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6"><div className="lg:hidden"><Logo /></div><div className="ml-auto"><ThemeToggle /></div></div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-md animate-fade-in">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">{title}</h1>
            <p className="mt-1 text-sm muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
