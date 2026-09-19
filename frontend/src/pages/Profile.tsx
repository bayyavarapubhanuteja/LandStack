import { useState } from "react";
import { toast } from "sonner";
import { Field, PageHeader, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { fmtDate } from "../lib/format";
import type { User } from "../lib/types";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [pwBusy, setPwBusy] = useState(false);
  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { setUser(await api<User>("/api/auth/me", { method: "PATCH", body: { name, phone: phone || null } })); toast.success("Profile updated"); }
    catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwBusy(true);
    try { await api("/api/auth/change-password", { method: "POST", body: pw }); toast.success("Password changed"); setPw({ current_password: "", new_password: "" }); }
    catch (err) { toast.error((err as Error).message); } finally { setPwBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <PageHeader title="Profile" subtitle="Your account details on LandStack." />
      <div className="card flex items-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-2xl font-bold text-white">{user.name[0]}</div>
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Email" value={user.email} />
          <Field label="Role" value={<span className="capitalize">{user.role === "officer" ? "Government Officer" : user.role}</span>} />
          <Field label="Member since" value={fmtDate(user.created_at)} />
          {user.department && <Field label="Department" value={user.department} />}
        </div>
      </div>
      <form onSubmit={save} className="card space-y-4 p-6">
        <p className="font-semibold text-navy-900 dark:text-white">Personal information</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="n">Full name</label><input id="n" className="input" minLength={2} required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label" htmlFor="ph">Mobile</label><input id="ph" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </div>
        <div className="flex justify-end"><button className="btn-primary" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Save changes</button></div>
      </form>
      <form onSubmit={changePw} className="card space-y-4 p-6">
        <p className="font-semibold text-navy-900 dark:text-white">Change password</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="cp">Current password</label><input id="cp" type="password" className="input" required value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></div>
          <div><label className="label" htmlFor="np">New password</label><input id="np" type="password" className="input" required minLength={8} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></div>
        </div>
        <div className="flex justify-end"><button className="btn-outline" disabled={pwBusy}>{pwBusy && <Spinner className="h-4 w-4" />} Update password</button></div>
      </form>
    </div>
  );
}
