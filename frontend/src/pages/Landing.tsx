import {
  ArrowRight, Bot, Building2, CheckCircle2, ClipboardCheck, Database, FileCheck2, Fingerprint, Layers, Link2, Map, MapPin,
  Network, Receipt, ScrollText, Search, ShieldCheck, Split, Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";

/** Stylised cadastral map for the hero: irregular parcels with one highlighted parcel linked to department records. */
function HeroMap() {
  const parcels = [
    "40,40 150,30 160,120 50,130", "150,30 270,45 265,125 160,120", "270,45 380,35 390,130 265,125",
    "50,130 160,120 170,220 45,230", "160,120 265,125 275,215 170,220", "265,125 390,130 385,225 275,215",
    "45,230 170,220 165,320 55,315", "170,220 275,215 285,310 165,320", "275,215 385,225 380,320 285,310",
  ];
  const links = [
    { x: 455, y: 50, label: "Land Records", icon: ScrollText }, { x: 455, y: 120, label: "Registration", icon: FileCheck2 },
    { x: 455, y: 190, label: "Planning", icon: Building2 }, { x: 455, y: 260, label: "Services & Tax", icon: Receipt },
  ];
  return (
    <div className="card relative overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-navy-900 dark:text-white"><Layers className="h-4 w-4 text-teal-600" /> Cadastral layer · Shamshabad</span>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">Live parcel view</span>
      </div>
      <svg viewBox="0 0 620 350" className="w-full" role="img" aria-label="Parcel map with one parcel linked to department records">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" className="stroke-slate-200 dark:stroke-navy-800" strokeWidth="1" /></pattern>
        </defs>
        <rect width="420" height="350" fill="url(#grid)" />
        <path d="M0 175 Q 120 160 210 180 T 420 170" className="stroke-slate-300 dark:stroke-navy-700" strokeWidth="10" fill="none" />
        {parcels.map((pts, i) => (
          <polygon key={i} points={pts} strokeWidth={i === 4 ? 3 : 1.5}
            className={i === 4 ? "fill-teal-500/40 stroke-navy-800 dark:stroke-teal-300" : "fill-navy-500/10 stroke-navy-400 dark:fill-navy-400/10 dark:stroke-navy-500"} />
        ))}
        {parcels.map((pts, i) => {
          const xy = pts.split(" ").map((p) => p.split(",").map(Number));
          const cx = xy.reduce((a, p) => a + p[0], 0) / 4, cy = xy.reduce((a, p) => a + p[1], 0) / 4;
          return <text key={i} x={cx} y={cy + 4} textAnchor="middle" className={i === 4 ? "fill-navy-900 text-[13px] font-bold dark:fill-white" : "fill-slate-500 text-[10px] font-medium"}>P-{1020 + i}</text>;
        })}
        <circle cx="218" cy="170" r="6" className="fill-navy-800 dark:fill-teal-300" />
        {links.map((l, i) => (
          <g key={l.label}>
            <path d={`M218 170 C 330 170, 360 ${l.y + 18}, ${l.x} ${l.y + 18}`} fill="none" className="stroke-teal-500" strokeWidth="1.8" strokeDasharray="5 5">
              <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.2s" repeatCount="indefinite" />
            </path>
            <rect x={l.x} y={l.y} width="150" height="36" rx="8" className="fill-white stroke-slate-200 dark:fill-navy-900 dark:stroke-navy-700" />
            <circle cx={l.x + 18} cy={l.y + 18} r="10" className="fill-navy-50 dark:fill-navy-800" />
            <text x={l.x + 36} y={l.y + 22} className="fill-navy-900 text-[12px] font-semibold dark:fill-white">{l.label}</text>
            <circle cx={l.x + 138} cy={l.y + 18} r="4" className="fill-emerald-500"><animate attributeName="opacity" values="1;.4;1" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" /></circle>
          </g>
        ))}
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-navy-950"><p className="muted">ULPIN</p><p className="font-mono font-semibold">TS36RR1024••••</p></div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-navy-950"><p className="muted">Land use</p><p className="font-semibold">Residential</p></div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-navy-950"><p className="muted">Status</p><p className="font-semibold text-emerald-600">Verified</p></div>
      </div>
    </div>
  );
}

const PILLARS = [
  { icon: MapPin, t: "Parcel-Centric", d: "Every record — ownership, deeds, zoning, permits, tax — hangs off one parcel identity (ULPIN)." },
  { icon: Map, t: "GIS-Based", d: "The cadastral map is the interface. Find, inspect and verify land spatially, not by file numbers." },
  { icon: Network, t: "Interoperable", d: "Open REST APIs connect Revenue, Registration, Planning, Tax and Utilities systems." },
  { icon: Users, t: "Citizen-Centric", d: "Citizens verify land, request certificates and track services from a single window." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-navy-800 dark:bg-navy-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#problem" className="hover:text-navy-800 dark:hover:text-white">Problem</a>
            <a href="#how" className="hover:text-navy-800 dark:hover:text-white">How it works</a>
            <a href="#architecture" className="hover:text-navy-800 dark:hover:text-white">Architecture</a>
            <a href="#capabilities" className="hover:text-navy-800 dark:hover:text-white">Capabilities</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block"><ThemeToggle /></div>
            <Link to="/login" className="btn-ghost">Sign in</Link>
            <Link to="/register" className="btn-primary hidden sm:inline-flex">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-navy-800 dark:bg-navy-950">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Digital Public Infrastructure for Land Governance
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-navy-900 dark:text-white sm:text-5xl">
              One Parcel. One Identity.<br /><span className="text-teal-600 dark:text-teal-400">One Unified Land Governance Platform.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
              LandStack connects cadastral maps, ULPIN, Record of Rights, registration, land use, zoning, building permissions, encumbrances and citizen services through one parcel-centric GIS platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary px-5 py-2.5 text-base">Explore parcels <ArrowRight className="h-4 w-4" /></Link>
              <a href="#how" className="btn-outline px-5 py-2.5 text-base">See how it works</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm muted">
              {["ULPIN-linked records", "Open REST APIs", "Role-based access"].map((t) => <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-600" />{t}</span>)}
            </div>
          </div>
          <div className="animate-fade-in [animation-delay:150ms]"><HeroMap /></div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">The problem</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 dark:text-white">Land information is fragmented across departments</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Maps sit with survey offices, ownership with revenue, deeds with registration, zoning with planning and tax with municipalities. Each keeps its own identifiers and formats, so no one sees the full picture of a single parcel.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Split, t: "Disconnected silos", d: "Maps, RoR, deeds and permits are not linked to one parcel ID." },
              { icon: ClipboardCheck, t: "Slow verification", d: "Citizens visit multiple offices to confirm title and encumbrances." },
              { icon: Search, t: "Low transparency", d: "Mismatched records enable disputes and fraudulent transactions." },
              { icon: Database, t: "No shared data layer", d: "Departments can't consume each other's data programmatically." },
            ].map((p) => (
              <div key={p.t} className="card p-5">
                <p.icon className="h-5 w-5 text-red-500" />
                <p className="mt-3 font-semibold text-navy-900 dark:text-white">{p.t}</p>
                <p className="mt-1 text-sm muted">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-slate-200 bg-slate-50 py-20 dark:border-navy-800 dark:bg-navy-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 dark:text-white">From map click to verified service in four steps</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { icon: Fingerprint, t: "Identify", d: "Each parcel gets a unique ULPIN linked to its cadastral boundary." },
              { icon: Link2, t: "Integrate", d: "Department datasets are mapped to the ULPIN through standard APIs." },
              { icon: Map, t: "Visualise", d: "The GIS explorer shows the unified record for any parcel on the map." },
              { icon: ClipboardCheck, t: "Serve", d: "Citizens request verifications and certificates; officers act and track." },
            ].map((s, i) => (
              <div key={s.t} className="relative">
                <div className="card h-full p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white dark:bg-teal-600">{i + 1}</span>
                    <s.icon className="h-5 w-5 text-teal-600" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-navy-900 dark:text-white">{s.t}</p>
                  <p className="mt-1 text-sm muted">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">Three-layer architecture</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 dark:text-white">Built like public infrastructure</h2>
        </div>
        <div className="mx-auto mt-12 max-w-4xl space-y-3">
          {[
            { n: "03", t: "Service Layer", d: "Citizen portal, officer workflows, AI land query, analytics dashboards", chips: ["Parcel Explorer", "Citizen Services", "Admin Console", "AI Land Query"], tone: "bg-teal-600" },
            { n: "02", t: "Integration Layer", d: "ULPIN-keyed REST APIs, JWT auth, role-based access, audit logging", chips: ["/api/parcels/{id}", "/ownership", "/registration", "/planning", "/services"], tone: "bg-navy-600" },
            { n: "01", t: "Data Layer", d: "PostgreSQL + PostGIS spatial database with linked departmental records", chips: ["Cadastral geometry", "RoR", "Deeds", "Zoning", "Encumbrances", "Tax"], tone: "bg-navy-900 dark:bg-navy-700" },
          ].map((l) => (
            <div key={l.n} className="card flex flex-col gap-4 overflow-hidden p-0 sm:flex-row">
              <div className={`${l.tone} flex items-center gap-3 px-6 py-4 text-white sm:w-56`}>
                <span className="text-2xl font-bold opacity-60">{l.n}</span><span className="font-semibold">{l.t}</span>
              </div>
              <div className="flex-1 px-6 pb-4 sm:py-4">
                <p className="text-sm muted">{l.d}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{l.chips.map((c) => <span key={c} className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-navy-800">{c}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities + pillars */}
      <section id="capabilities" className="border-y border-slate-200 bg-slate-50 py-20 dark:border-navy-800 dark:bg-navy-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.t} className="card p-6">
                <div className="inline-flex rounded-lg bg-navy-50 p-2.5 text-navy-700 dark:bg-navy-800 dark:text-teal-300"><p.icon className="h-5 w-5" /></div>
                <p className="mt-4 text-lg font-semibold text-navy-900 dark:text-white">{p.t}</p>
                <p className="mt-1 text-sm muted">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Map, t: "GIS Parcel Explorer", d: "Search by Parcel ID or ULPIN, filter, and inspect boundaries with layer controls." },
              { icon: Layers, t: "Unified Parcel View", d: "Ownership, registration, land use, planning, encumbrance and services in one place." },
              { icon: ClipboardCheck, t: "Citizen Services", d: "Ownership verification, EC, land record and permission status with tracking." },
              { icon: ShieldCheck, t: "Officer Workflow", d: "Review requests, verify parcels, and keep a full audit history." },
              { icon: Database, t: "Department Integration", d: "Monitor data feeds from Revenue, Registration, Planning, Tax and Utilities." },
              { icon: Bot, t: "AI Land Query", d: "Ask plain-language questions answered strictly from parcel records." },
            ].map((c) => (
              <div key={c.t} className="flex gap-3 rounded-xl p-4 transition hover:bg-white dark:hover:bg-navy-900">
                <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                <div><p className="font-semibold text-navy-900 dark:text-white">{c.t}</p><p className="text-sm muted">{c.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl bg-navy-900 px-6 py-14 text-center text-white dark:bg-navy-800 sm:px-12">
          <p className="mx-auto max-w-3xl text-2xl font-bold leading-snug sm:text-3xl">
            LandStack transforms fragmented land information into one unified <span className="text-teal-300">parcel-centric digital infrastructure.</span>
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="btn bg-teal-500 px-5 py-2.5 text-base text-navy-950 hover:bg-teal-400">Try the demo <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/register" className="btn border border-white/30 px-5 py-2.5 text-base text-white hover:bg-white/10">Register as citizen</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm muted dark:border-navy-800">
        <p>LandStack · Smart India Hackathon prototype · All parcels, owners and department integrations shown are fictional demo data.</p>
      </footer>
    </div>
  );
}
