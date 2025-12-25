// apps/web/src/pages/SearchPage.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Event, Task } from "../lib/api";
import { eventsApi, taskApi } from "../lib/api";

type ResultType = "event" | "task" | "memo";
type Result = { type: ResultType; dateISO: string; title: string; id: string };

function typeLabel(t: ResultType) {
  if (t === "event") return "일정";
  if (t === "task") return "할일";
  return "메모";
}

export default function SearchPage() {
  const nav = useNavigate();
  const loc = useLocation() as {
    state?: { events?: Event[]; tasks?: Task[]; month?: { y: number; m: number }; range?: { startISO: string; endISO: string } };
  };

  const state = loc.state ?? {};
  const canLocalSearch = !!(state.events?.length || state.tasks?.length);

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  async function runSearch(keyword: string) {
    const k = keyword.trim();
    if (!k) {
      setResults([]);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      // 1) local search
      const local: Result[] = [];
      if (canLocalSearch) {
        for (const e of state.events ?? []) {
          if ((e.title ?? "").toLowerCase().includes(k.toLowerCase())) {
            local.push({ type: "event", id: e.id, title: e.title, dateISO: e.start_at.slice(0, 10) });
          }
        }
        for (const t of state.tasks ?? []) {
          const isMemo = (t.type ?? "") === "MEMO";
          if ((t.title ?? "").toLowerCase().includes(k.toLowerCase())) {
            local.push({ type: isMemo ? "memo" : "task", id: t.id, title: t.title, dateISO: t.due_at.slice(0, 10) });
          }
        }
      }

      // 2) remote search (가능하면)
      // remote search (서버 검색 스펙이 불확실하니, 일단 범위 넓게 가져와서 프론트에서 필터링)
      const [evPage, tkPage] = await Promise.all([
        eventsApi.list({ dateFrom: "1970-01-01", dateTo: "2100-12-31" }),
        taskApi.list({ dateFrom: "1970-01-01", dateTo: "2100-12-31" }),
      ]);

      const evs = evPage.content.filter((e) =>
        (e.title ?? "").toLowerCase().includes(k.toLowerCase())
      );

      const tks = tkPage.content.filter((t) =>
        (t.title ?? "").toLowerCase().includes(k.toLowerCase())
      );


      const remote: Result[] = [
        ...evs.map((e: Event) => ({
          type: "event" as const,
          id: e.id,
          title: e.title,
          dateISO: e.start_at.slice(0, 10),
        })),
        ...tks.map((t: Task) => {
          const isMemo = (t.type ?? "") === "MEMO";
          return {
            type: (isMemo ? "memo" : "task") as ResultType,
            id: t.id,
            title: t.title,
            dateISO: t.due_at.slice(0, 10),
          };
        }),
      ];

      // dedupe (type+id)
      const map = new Map<string, Result>();
      for (const r of [...local, ...remote]) map.set(`${r.type}:${r.id}`, r);

      setResults(Array.from(map.values()));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "검색 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="icon-btn" onClick={() => nav(-1)} aria-label="back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div>
            <div className="topbar-title">검색</div>
          </div>
        </div>
        <div className="topbar-sub">{loading ? "검색 중…" : ""}</div>
      </div>

      <div style={{ padding: "12px 20px" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 12, color: "var(--muted)" }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>

          <input
            className="input"
            placeholder="일정, 할일 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch(q);
            }}
            style={{ paddingLeft: 36, paddingRight: 36 }}
            autoFocus
          />

          {q && (
            <button
              onClick={() => {
                setQ("");
                setResults([]);
                setErr(null);
              }}
              style={{
                position: "absolute",
                right: 8,
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
              }}
              aria-label="clear"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {err ? <div style={{ marginTop: 10, color: "var(--danger)" }}>{err}</div> : null}

        <div style={{ marginTop: 14 }}>
          {results.map((r) => (
            <button
              key={`${r.type}:${r.id}`}
              className="list-row"
              onClick={() => nav(`/app?date=${r.dateISO}`)}
              style={{ width: "100%", textAlign: "left" }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>{typeLabel(r.type)} · {r.dateISO}</div>
              <div style={{ marginTop: 2 }}>{r.title}</div>
            </button>
          ))}
          {!loading && results.length === 0 && q ? <div style={{ opacity: 0.6, padding: "12px 0", textAlign: "center" }}>검색 결과가 없습니다.</div> : null}
        </div>
      </div>
    </div>
  );
}
