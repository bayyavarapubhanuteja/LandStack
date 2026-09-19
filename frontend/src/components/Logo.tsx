import { Link } from "react-router-dom";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" className="fill-navy-800 dark:fill-teal-600" />
      <path d="M8 11l8-4 8 4-8 4z" className="fill-teal-400 dark:fill-white" />
      <path d="M8 16l8 4 8-4M8 21l8 4 8-4" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ to = "/", collapsed = false }: { to?: string; collapsed?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <LogoMark />
      {!collapsed && (
        <div className="leading-tight">
          <span className="block text-lg font-bold tracking-tight text-navy-900 dark:text-white">LandStack</span>
          <span className="block text-[10px] font-medium uppercase tracking-widest text-teal-700 dark:text-teal-400">Land Governance DPI</span>
        </div>
      )}
    </Link>
  );
}
