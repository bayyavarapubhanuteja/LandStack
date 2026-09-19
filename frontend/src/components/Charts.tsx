import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../context/ThemeContext";
import { LAND_USE_COLOR, VERIFY_COLOR, pretty } from "../lib/format";
import type { NameValue } from "../lib/types";
import { Empty } from "./ui";

const SERIES = ["#24478a", "#16a992", "#5479c2", "#d97706", "#7c3aed", "#0e6d61", "#dc2626"];
const colorFor = (name: string, i: number) => LAND_USE_COLOR[name] || VERIFY_COLOR[name] || SERIES[i % SERIES.length];

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="card animate-fade-in p-5">
      <p className="font-semibold text-navy-900 dark:text-white">{title}</p>
      {subtitle && <p className="text-xs muted">{subtitle}</p>}
      <div className="mt-4 h-64">{children}</div>
    </div>
  );
}

function useTooltipStyle() {
  const dark = useTheme().resolved === "dark";
  return {
    contentStyle: { background: dark ? "#0f1f40" : "#fff", border: `1px solid ${dark ? "#1c3870" : "#e2e8f0"}`, borderRadius: 8, fontSize: 12 },
    itemStyle: { color: dark ? "#e2e8f0" : "#0f1f40" }, axis: dark ? "#94a3b8" : "#64748b", grid: dark ? "#152a55" : "#eef2f7",
  };
}

export function Donut({ data }: { data: NameValue[] }) {
  const t = useTooltipStyle();
  const total = data.reduce((a, d) => a + d.value, 0);
  if (!total) return <Empty title="No data yet" />;
  return (
    <div className="flex h-full items-center gap-4">
      <ResponsiveContainer width="55%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="none">
            {data.map((d, i) => <Cell key={d.name} fill={colorFor(d.name, i)} />)}
          </Pie>
          <Tooltip contentStyle={t.contentStyle} itemStyle={t.itemStyle} formatter={(v: number, n: string) => [v, pretty(n)]} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5 text-xs">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorFor(d.name, i) }} /><span className="flex-1 truncate">{pretty(d.name)}</span><span className="font-semibold">{d.value}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function Bars({ data, horizontal, unit = "", color }: { data: NameValue[]; horizontal?: boolean; unit?: string; color?: string }) {
  const t = useTooltipStyle();
  if (!data.length || data.every((d) => !d.value)) return <Empty title="No data yet" />;
  const rows = data.map((d) => ({ ...d, label: pretty(d.name) }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 10 : -10, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid stroke={t.grid} horizontal={!horizontal} vertical={!!horizontal} />
        {horizontal ? <>
          <XAxis type="number" tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} unit={unit} domain={unit === "%" ? [0, 100] : undefined} />
          <YAxis type="category" dataKey="label" width={120} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        </> : <>
          <XAxis dataKey="label" tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} height={40} tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 13) + "…" : v)} />
          <YAxis allowDecimals={false} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        </>}
        <Tooltip cursor={{ fill: t.grid }} contentStyle={t.contentStyle} itemStyle={t.itemStyle} formatter={(v: number) => [`${v}${unit}`, "Value"]} />
        <Bar dataKey="value" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36}>
          {rows.map((d, i) => <Cell key={d.name} fill={color || colorFor(d.name, i)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
