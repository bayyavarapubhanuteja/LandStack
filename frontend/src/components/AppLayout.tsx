import clsx from "clsx";
import {
  BarChart3, Bot, ChevronsLeft, ChevronsRight, ClipboardList, Database, FileStack, LayoutDashboard, LogOut, Map, Menu,
  Settings, ShieldCheck, User as UserIcon, Users, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";
import ThemeToggle from "./ThemeToggle";

const MAIN = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/explorer", label: "Parcel Explorer", icon: Map },
  { to: "/app/requests", label: "My Requests", icon: ClipboardList },
  { to: "/app/query", label: "AI Land Query", icon: Bot },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
];
const ADMIN = [
  { to: "/app/admin/integrations", label: "Data Integration", icon: Database },
  { to: "/app/admin/parcels", label: "Parcel Management", icon: FileStack },
  { to: "/app/admin/requests", label: "Service Requests", icon: ShieldCheck },
  { to: "/app/admin/users", label: "User Management", icon: Users, adminOnly: true },
];
const ACCOUNT = [
  { to: "/app/profile", label: "Profile", icon: UserIcon },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppLayout() {
  const { user, logout, isStaff, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem("ls-sidebar") === "1"; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);
  useEffect(() => { try { localStorage.setItem("ls-sidebar", collapsed ? "1" : "0"); } catch { /* ignore */ } }, [collapsed]);

  const Item = ({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Map; end?: boolean }) => (
    <NavLink to={to} end={end} title={collapsed ? label : undefined}
      className={({ isActive }) => clsx("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
        isActive ? "bg-navy-700 text-white shadow-sm dark:bg-teal-600" : "text-slate-600 hover:bg-slate-100 hover:text-navy-800 dark:text-slate-300 dark:hover:bg-navy-800 dark:hover:text-white",
        collapsed && "lg:justify-center lg:px-0")}>
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className={clsx(collapsed && "lg:hidden")}>{label}</span>
    </NavLink>
  );
  const Section = ({ title }: { title: string }) => (
    <p className={clsx("px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400", collapsed && "lg:hidden")}>{title}</p>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={clsx("flex h-16 items-center border-b border-slate-200 px-4 dark:border-navy-800", collapsed && "lg:justify-center lg:px-2")}>
        <Logo to="/app" collapsed={collapsed} />
        <button className="btn-ghost ml-auto px-2 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {MAIN.map((i) => <Item key={i.to} {...i} />)}
        {isStaff && <><Section title="Administration" />{ADMIN.filter((i) => !i.adminOnly || isAdmin).map((i) => <Item key={i.to} {...i} />)}</>}
        <Section title="Account" />
        {ACCOUNT.map((i) => <Item key={i.to} {...i} />)}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-navy-800">
        <button onClick={() => setCollapsed((c) => !c)} className="btn-ghost hidden w-full justify-start px-3 lg:flex" aria-label="Toggle sidebar">
          {collapsed ? <ChevronsRight className="mx-auto h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className={clsx("fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all dark:border-navy-800 dark:bg-navy-900 lg:block", collapsed ? "w-[72px]" : "w-64")}>{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[1100] lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-in bg-white dark:bg-navy-900">{sidebar}</aside>
        </div>
      )}
      <div className={clsx("transition-all", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur dark:border-navy-800 dark:bg-navy-900/85 sm:px-6">
          <button className="btn-ghost px-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden text-sm muted md:block">Integrated GIS-based DPI for Land Governance <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">Demo data</span></div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block"><ThemeToggle /></div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-navy-900 dark:text-white">{user?.name}</p>
              <p className="text-xs capitalize muted">{user?.role === "officer" ? "Government Officer" : user?.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">{user?.name?.[0]}</div>
            <button className="btn-ghost px-2" title="Sign out" onClick={() => { logout(); nav("/login"); }}><LogOut className="h-4 w-4" /></button>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
