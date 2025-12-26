// apps/web/src/pages/CalendarPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SideDrawer from "../components/SideDrawer";
import ComposerModal from "../components/ComposerModal";
import MonthGrid, { ChipTarget } from "../components/Calendar/MonthGrid";
import PeriodBars from "../components/Calendar/PeriodBars";
import DetailModal from "../components/DetailModal";
import DayViewModal from "../components/DayViewModal";
import { calendarsApi, eventsApi, taskApi } from "../lib/api";
import type { Event, Task } from "../lib/api";
import { buildMonthGrid, isoDate, monthTitle } from "../lib/date";


type Calendar = { id: string; name?: string | null };

type LoadState = "idle" | "loading" | "ready" | "error";

export default function CalendarPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const now = new Date();
  const [ym, setYm] = useState<{ y: number; m: number }>({ y: now.getFullYear(), m: now.getMonth() + 1 });

  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [enabledCalIds, setEnabledCalIds] = useState<Record<string, boolean>>({});

  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const { rows } = useMemo(() => buildMonthGrid(ym.y, ym.m), [ym.y, ym.m]);
  const range = useMemo(() => {
    const start = rows[0][0].date;
    const end = rows[5][6].date;
    return { startISO: isoDate(start), endISO: isoDate(end) };
  }, [rows]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [dayViewOpen, setDayViewOpen] = useState(false); // ✅ 추가
  const [pickedISO, setPickedISO] = useState<string>(() => isoDate(new Date()));

  // ✅ detail modal state (에러났던 setDetailTarget 사용)
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<ChipTarget | null>(null);

  // /app?date=YYYY-MM-DD 로 들어오면 해당 날짜/월로 이동
  useEffect(() => {
    const iso = sp.get("date");
    if (!iso || iso.length < 10) return;
    const y = Number(iso.slice(0, 4));
    const m = Number(iso.slice(5, 7));
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return;
    setYm({ y, m });
    setPickedISO(iso.slice(0, 10));
  }, [sp]);

  const enabledIds = useMemo(() => {
    const ids = calendars.map((c) => c.id);
    if (!ids.length) return [];
    const anyEnabled = Object.keys(enabledCalIds).length > 0;
    if (!anyEnabled) return ids;
    return ids.filter((id) => enabledCalIds[id] ?? true);
  }, [calendars, enabledCalIds]);

  const defaultCalendarId = enabledIds[0] ?? calendars[0]?.id ?? null;

  const onPrev = () => {
    setYm((p) => {
      const m = p.m - 1;
      if (m <= 0) return { y: p.y - 1, m: 12 };
      return { y: p.y, m };
    });
  };
  const onNext = () => {
    setYm((p) => {
      const m = p.m + 1;
      if (m >= 13) return { y: p.y + 1, m: 1 };
      return { y: p.y, m };
    });
  };

  const onToday = () => {
    const n = new Date();
    setYm({ y: n.getFullYear(), m: n.getMonth() + 1 });
    setPickedISO(isoDate(n));
  };

  const loadCalendars = async () => {
    const res = await calendarsApi.list();
    setCalendars(res);
    setEnabledCalIds((prev) => {
      if (Object.keys(prev).length) return prev;
      const next: Record<string, boolean> = {};
      for (const c of res) next[c.id] = true;
      return next;
    });
  };

  const loadMonthData = async () => {
    if (!calendars.length) return;

    setState("loading");
    setError(null);

    try {
      // ✅ 만약 사용자가 모든 캘린더를 껐다면(enabledIds가 빈 배열), API 호출을 하지 않고 빈 결과를 보여줌
      // 단, 초기 로딩 시(enabledCalIds가 비어있을 때)는 enabledIds가 전체 캘린더를 반환하므로 이 로직은 안전함.
      // 문제는 "사용자가 명시적으로 다 껐을 때"임.
      // enabledIds 계산 로직: anyEnabled가 false면 전체 반환.
      // 즉, enabledIds가 빈 배열이라는 것은 "하나라도 켜진게 있는데 필터링 결과가 없다"는 뜻이 아니라,
      // "anyEnabled가 true인데(즉 뭔가 조작했는데) 다 false다"라는 뜻임.
      // 따라서 enabledIds가 비어있으면 그냥 빈 배열로 처리해야 함.

      const ids = enabledIds;
      if (ids.length === 0) {
        setEvents([]);
        setTasks([]);
        setState("ready");
        return;
      }

      const [evs, tks] = await Promise.all([
        Promise.all(
          ids.map((id) =>
            eventsApi.list({
              calendarId: id,
              dateFrom: range.startISO, // YYYY-MM-DD
              dateTo: range.endISO,     // YYYY-MM-DD
            })
          )
        ).then((pages) => pages.flatMap((p) => p.content)),
        Promise.all(
          ids.map((id) =>
            taskApi.list({
              calendarId: id,
              dateFrom: range.startISO,
              dateTo: range.endISO
            })
          )
        ).then((pages) => pages.flatMap((p) => p.content)),
      ]);

      setEvents(evs);
      setTasks(tks);
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
      setState("error");
    }
  };

  useEffect(() => {
    void loadCalendars();
  }, []);

  useEffect(() => {
    if (!calendars.length) return;
    void loadMonthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym.y, ym.m, range.startISO, range.endISO, JSON.stringify(enabledIds), calendars.length]);

  const onToggleCalendar = (id: string, enabled: boolean) => {
    setEnabledCalIds((prev) => ({ ...prev, [id]: enabled }));
  };

  // ✅ optimistic handlers (에러났던 unused 제거 + DetailModal payload 시그니처 맞춤)
  const optimisticUpdate = (payload: { kind: "event"; event: Event } | { kind: "task" | "memo"; task: Task }) => {
    if (payload.kind === "event") {
      setEvents((prev) => prev.map((e) => (e.id === payload.event.id ? payload.event : e)));
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === payload.task.id ? payload.task : t)));
  };

  const optimisticDelete = (payload: { kind: "event" | "task" | "memo"; id: string }) => {
    if (payload.kind === "event") {
      setEvents((prev) => prev.filter((e) => e.id !== payload.id));
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== payload.id));
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="icon-btn" onClick={() => setDrawerOpen(true)} aria-label="menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div>
            <div className="topbar-title">{monthTitle(ym.y, ym.m)}</div>
            <div className="topbar-sub">
              <button className="icon-btn" onClick={onPrev} aria-label="prev month">
                ←
              </button>
              <button className="icon-btn" onClick={onNext} aria-label="next month">
                →
              </button>
              <button className="btn btn-secondary" onClick={onToday} style={{ padding: "0 12px", height: 36, fontSize: 13 }}>
                오늘
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {state === "loading" && <div style={{ fontSize: 12, color: "var(--muted)" }}>로딩중...</div>}
          <button
            className="icon-btn"
            onClick={() => nav("/app/search", { state: { events, tasks, month: ym, range } })}
            aria-label="search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="weekdays">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={d} className={["weekday", i === 0 ? "sun" : ""].join(" ")}>
            {d}
          </div>
        ))}
      </div>

      <div className="month-wrap">
        <PeriodBars rows={rows} events={events} />

        <MonthGrid
          rows={rows}
          events={events}
          tasks={tasks}
          selectedISO={pickedISO}
          onPickDate={(iso) => {
            setPickedISO(iso);
            setDayViewOpen(true);
          }}
          onPickItem={(t) => {
            // Item click also opens DayView for that date
            const date = t.kind === "event" ? t.event.start_at : t.task.due_at;
            setPickedISO(date.slice(0, 10));
            setDayViewOpen(true);
          }}
        />

        {error ? <div style={{ padding: "10px 12px", color: "var(--danger)" }}>{error}</div> : null}
      </div>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        calendars={calendars}
        enabledCalendarIds={enabledCalIds}
        onToggleCalendar={onToggleCalendar}
      />

      <ComposerModal
        open={composerOpen}
        dateISO={pickedISO}
        defaultCalendarId={defaultCalendarId}
        onClose={() => setComposerOpen(false)}
        onCreated={() => void loadMonthData()}
      />

      <DayViewModal
        open={dayViewOpen}
        dateISO={pickedISO}
        events={events}
        tasks={tasks}
        onClose={() => setDayViewOpen(false)}
        onCompose={() => setComposerOpen(true)}
        onPickItem={(t) => {
          setDetailTarget(t);
          setDetailOpen(true);
        }}
      />

      <DetailModal
        open={detailOpen}
        target={detailTarget}
        onClose={() => setDetailOpen(false)}
        onUpdated={(payload) => optimisticUpdate(payload)}
        onDeleted={(payload) => optimisticDelete(payload)}
      />
    </div>
  );
}
