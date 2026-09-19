import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" }>({ theme: "system", setTheme: () => {}, resolved: "light" });

const read = (): Theme => { try { return (localStorage.getItem("ls-theme") as Theme) || "system"; } catch { return "system"; } };

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(read);
  const [systemDark, setSystemDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const fn = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  useEffect(() => { document.documentElement.classList.toggle("dark", resolved === "dark"); }, [resolved]);

  const setTheme = (t: Theme) => { setThemeState(t); try { localStorage.setItem("ls-theme", t); } catch { /* ignore */ } };
  return <Ctx.Provider value={{ theme, setTheme, resolved }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
