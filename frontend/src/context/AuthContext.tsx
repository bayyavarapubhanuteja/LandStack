import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "../lib/api";
import type { User } from "../lib/types";

interface AuthCtx {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<User>;
  logout: () => void; setUser: (u: User) => void; isStaff: boolean; isAdmin: boolean;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) { setLoading(false); return; }
    api<User>("/api/auth/me").then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, [logout]);

  const handle = (r: { token: string; user: User }) => { tokenStore.set(r.token); setUser(r.user); return r.user; };
  const login = async (email: string, password: string) => handle(await api("/api/auth/login", { method: "POST", body: { email, password } }));
  const register = async (data: { name: string; email: string; phone?: string; password: string }) =>
    handle(await api("/api/auth/register", { method: "POST", body: data }));

  const isStaff = !!user && user.role !== "citizen";
  return <Ctx.Provider value={{ user, loading, login, register, logout, setUser, isStaff, isAdmin: user?.role === "admin" }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
};
