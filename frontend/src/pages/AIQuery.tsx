import clsx from "clsx";
import { Bot, Database, Info, Send, User } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader, Spinner } from "../components/ui";
import { api } from "../lib/api";
import type { QueryAnswer } from "../lib/types";

interface Msg { role: "user" | "bot"; text: string; meta?: QueryAnswer }

/** Render **bold** segments from the answer text safely (no HTML injection). */
function Rich({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/g).map((s, i) => s.startsWith("**") ? <b key={i} className="text-navy-900 dark:text-white">{s.slice(2, -2)}</b> : <Fragment key={i}>{s}</Fragment>)}</>;
}

export default function AIQuery() {
  const [params] = useSearchParams();
  const pid = params.get("parcel") || "P-1024";
  const suggestions = [`What is the land use of parcel ${pid}?`, `Is parcel ${pid} registered?`, `Does ${pid} have any encumbrance?`,
    `What is the building permission status of ${pid}?`, `Who owns ${pid}?`, `What is the zoning of ${pid}?`];
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: "Hello! Ask me about any parcel by its **Parcel ID** or **ULPIN**. I answer only from LandStack's parcel records and will tell you when information isn't available." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  // Braces matter: scrollIntoView may return a Promise, which React would try to call as a cleanup.
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]); setInput(""); setBusy(true);
    try {
      const r = await api<QueryAnswer>("/api/query", { method: "POST", body: { question: q } });
      setMsgs((m) => [...m, { role: "bot", text: r.answer, meta: r }]);
    } catch (e) { setMsgs((m) => [...m, { role: "bot", text: `Sorry — ${(e as Error).message}` }]); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <PageHeader title="AI Land Query" subtitle="Ask plain-language questions about a parcel. Answers are retrieved only from the LandStack dataset." />
      <div className="card flex h-[calc(100vh-15rem)] min-h-[420px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.map((m, i) => (
            <div key={i} className={clsx("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.role === "bot" ? "bg-teal-600 text-white" : "bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-slate-200")}>
                {m.role === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className={clsx("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.role === "bot" ? "rounded-tl-sm bg-slate-100 dark:bg-navy-800" : "rounded-tr-sm bg-navy-700 text-white dark:bg-teal-700")}>
                <Rich text={m.text} />
                {m.meta?.found && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-2 text-[11px] muted dark:border-navy-700">
                    <Database className="h-3 w-3" /> Sources: {m.meta.sources.map((s) => <span key={s} className="rounded bg-white px-1.5 font-mono dark:bg-navy-950">{s}</span>)}
                    <Link to={`/app/parcels/${m.meta.parcel_id}`} className="ml-auto font-medium text-teal-700 hover:underline dark:text-teal-400">Open {m.meta.parcel_id} →</Link>
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 pl-11 text-sm muted"><Spinner className="h-4 w-4" /> Looking up records…</div>}
          <div ref={end} />
        </div>
        <div className="border-t border-slate-200 p-4 dark:border-navy-800">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => <button key={s} onClick={() => ask(s)} disabled={busy} className="rounded-full border border-slate-200 px-3 py-1 text-xs transition hover:border-teal-400 hover:text-teal-700 dark:border-navy-700 dark:hover:text-teal-300">{s}</button>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
            <input className="input" placeholder={`e.g. Is parcel ${pid} registered?`} value={input} maxLength={300} onChange={(e) => setInput(e.target.value)} aria-label="Question" />
            <button className="btn-primary" disabled={busy || !input.trim()}><Send className="h-4 w-4" /><span className="hidden sm:inline">Ask</span></button>
          </form>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs muted"><Info className="h-3.5 w-3.5" /> Retrieval-based assistant: it reads parcel, ownership, registration, planning and encumbrance tables — it does not generate facts.</p>
    </div>
  );
}
