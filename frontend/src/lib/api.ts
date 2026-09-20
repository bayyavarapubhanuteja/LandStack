const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, "") || "";
// Render supplies a bare host (e.g. "landstack-api.onrender.com"); add the scheme when missing.
const BASE = RAW_BASE && !/^https?:\/\//.test(RAW_BASE) ? `https://${RAW_BASE}` : RAW_BASE;
const TOKEN_KEY = "ls-token";

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

export async function api<T>(path: string, opts: { method?: string; body?: unknown; params?: Record<string, string | undefined> } = {}): Promise<T> {
  const qs = opts.params ? new URLSearchParams(Object.entries(opts.params).filter(([, v]) => v) as [string, string][]).toString() : "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ""}`, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  } catch {
    throw new ApiError(0, "Cannot reach the LandStack server. Is the backend running?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const detail = typeof data.detail === "string" ? data.detail : `Request failed (${res.status})`;
    throw new ApiError(res.status, detail);
  }
  return data as T;
}
