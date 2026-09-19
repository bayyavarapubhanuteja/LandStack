import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import AuthShell from "./AuthShell";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) return setError("Password must be at least 8 characters with letters and numbers");
    if (f.password !== f.confirm) return setError("Passwords do not match");
    setBusy(true); setError(null);
    try {
      await register({ name: f.name, email: f.email, phone: f.phone || undefined, password: f.password });
      toast.success("Account created — welcome to LandStack");
      nav("/app", { replace: true });
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create a citizen account" subtitle="Officer and administrator roles are assigned by the State Land Governance Cell.">
      <form className="space-y-4" onSubmit={submit}>
        <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" required minLength={2} value={f.name} onChange={set("name")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" required value={f.email} onChange={set("email")} /></div>
          <div><label className="label" htmlFor="phone">Mobile (optional)</label><input id="phone" className="input" value={f.phone} onChange={set("phone")} placeholder="98xxxxxxxx" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" className="input" required value={f.password} onChange={set("password")} autoComplete="new-password" /></div>
          <div><label className="label" htmlFor="pw2">Confirm password</label><input id="pw2" type="password" className="input" required value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></div>
        </div>
        <p className="text-xs muted">At least 8 characters, including letters and numbers.</p>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <button className="btn-primary w-full py-2.5" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Create account</button>
      </form>
      <p className="mt-4 text-center text-sm muted">Already registered? <Link to="/login" className="font-medium text-teal-700 hover:underline dark:text-teal-400">Sign in</Link></p>
    </AuthShell>
  );
}
