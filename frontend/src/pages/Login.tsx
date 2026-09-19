import { Eye, EyeOff, Landmark, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import AuthShell from "./AuthShell";

const DEMO = [
  { role: "Citizen", email: "citizen@landstack.demo", password: "Citizen@123", icon: User },
  { role: "Govt. Officer", email: "officer@landstack.demo", password: "Officer@123", icon: Landmark },
  { role: "Administrator", email: "admin@landstack.demo", password: "Admin@123", icon: ShieldCheck },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async (e: string, p: string) => {
    setBusy(true); setError(null);
    try {
      const u = await login(e, p);
      toast.success(`Welcome, ${u.name}`);
      nav((loc.state as { from?: string })?.from || "/app", { replace: true });
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Sign in to LandStack" subtitle="Citizens, government officers and administrators use the same secure sign-in.">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); doLogin(email, password); }}>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} className="input pr-10" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400" onClick={() => setShow((s) => !s)} aria-label="Toggle password">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <button className="btn-primary w-full py-2.5" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Sign in</button>
      </form>
      <p className="mt-4 text-center text-sm muted">New citizen? <Link to="/register" className="font-medium text-teal-700 hover:underline dark:text-teal-400">Create an account</Link></p>

      <div className="mt-8">
        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider muted"><span className="h-px flex-1 bg-slate-200 dark:bg-navy-800" />Demo accounts<span className="h-px flex-1 bg-slate-200 dark:bg-navy-800" /></div>
        <div className="mt-4 grid gap-2">
          {DEMO.map((d) => (
            <button key={d.email} type="button" disabled={busy} onClick={() => { setEmail(d.email); setPassword(d.password); doLogin(d.email, d.password); }}
              className="card flex items-center gap-3 p-3 text-left transition hover:border-teal-400 hover:shadow-md">
              <div className="rounded-lg bg-navy-50 p-2 text-navy-700 dark:bg-navy-800 dark:text-teal-300"><d.icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-navy-900 dark:text-white">{d.role}</p><p className="truncate font-mono text-xs muted">{d.email} · {d.password}</p></div>
              <span className="text-xs font-medium text-teal-700 dark:text-teal-400">Sign in →</span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
