import clsx from "clsx";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "../context/ThemeContext";

const OPTS: { v: Theme; icon: typeof Sun; label: string }[] = [
  { v: "light", icon: Sun, label: "Light" }, { v: "dark", icon: Moon, label: "Dark" }, { v: "system", icon: Monitor, label: "System" },
];

export default function ThemeToggle({ withLabels = false }: { withLabels?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-navy-700 dark:bg-navy-950" role="radiogroup" aria-label="Theme">
      {OPTS.map(({ v, icon: Icon, label }) => (
        <button key={v} role="radio" aria-checked={theme === v} title={label} onClick={() => setTheme(v)}
          className={clsx("flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition",
            theme === v ? "bg-white text-navy-800 shadow-sm dark:bg-navy-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400")}>
          <Icon className="h-3.5 w-3.5" />{withLabels && label}
        </button>
      ))}
    </div>
  );
}
