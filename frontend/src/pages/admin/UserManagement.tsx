import { Users } from "lucide-react";
import { toast } from "sonner";
import { Empty, ErrorState, Loading, PageHeader, StatusBadge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { fmtDate } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import type { User } from "../../lib/types";

export default function UserManagement() {
  const { user: me } = useAuth();
  const { data, error, loading, reload, setData } = useApi<User[]>("/api/admin/users");
  const patch = async (u: User, body: Partial<User>) => {
    try {
      const r = await api<User>(`/api/admin/users/${u.id}`, { method: "PATCH", body });
      setData((d) => d?.map((x) => (x.id === r.id ? r : x)) || null); toast.success(`Updated ${r.name}`);
    } catch (e) { toast.error((e as Error).message); }
  };
  if (loading) return <Loading />;
  if (error || !data) return <div className="card"><ErrorState message={error || ""} onRetry={reload} /></div>;
  return (
    <div className="animate-fade-in">
      <PageHeader title="User Management" subtitle="Assign roles and manage account access." />
      <div className="card overflow-x-auto">
        {!data.length ? <Empty icon={Users} title="No users" /> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide muted dark:border-navy-800"><th className="px-5 py-3 font-medium">User</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Joined</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3" /></tr></thead>
            <tbody>{data.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-navy-800">
                <td className="px-5 py-3"><p className="font-medium text-navy-900 dark:text-white">{u.name}</p><p className="text-xs muted">{u.email}</p></td>
                <td className="px-5 py-3">
                  <select className="input w-40 py-1" value={u.role} disabled={u.id === me?.id} onChange={(e) => patch(u, { role: e.target.value as User["role"] })}>
                    <option value="citizen">Citizen</option><option value="officer">Govt. Officer</option><option value="admin">Admin</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-5 py-3 muted">{fmtDate(u.created_at)}</td>
                <td className="px-5 py-3"><StatusBadge status={u.is_active ? "active" : "offline"} label={u.is_active ? "Active" : "Disabled"} /></td>
                <td className="px-5 py-3 text-right">{u.id !== me?.id && <button className="btn-outline py-1 text-xs" onClick={() => patch(u, { is_active: !u.is_active })}>{u.is_active ? "Disable" : "Enable"}</button>}</td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
