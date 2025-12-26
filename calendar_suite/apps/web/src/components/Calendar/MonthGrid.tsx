// apps/web/src/components/Calendar/MonthGrid.tsx
import type { Event, Task } from "../../lib/api";
import { getHoliday } from "../../lib/date";

export type ChipTarget =
  | { kind: "event"; event: Event }
  | { kind: "task"; task: Task }
  | { kind: "memo"; task: Task };

type Props = {
  rows: { date: Date; inMonth: boolean }[][];
  events: Event[];
  tasks: Task[];
  selectedISO: string;
  onPickDate: (iso: string) => void;
  onPickItem?: (t: ChipTarget) => void; // ✅ 추가
};

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}


export default function MonthGrid(props: Props) {
  const { rows, events, tasks, selectedISO, onPickDate, onPickItem } = props;

  return (
    <div className="month-grid">
      {rows.map((week, wi) => (
        <div key={wi} className="week-row">
          {week.map((cell, di) => {
            const dateISO = isoDate(cell.date);
            const dayEvents = events.filter((e) => e.start_at.slice(0, 10) === dateISO);
            const dayTasks = tasks.filter((t) => t.due_at.slice(0, 10) === dateISO);

            const holidayName = getHoliday(cell.date);
            const isHoliday = !!holidayName;
            const isSunday = cell.date.getDay() === 0;

            return (
              <div
                key={di}
                className={["day-cell", cell.inMonth ? "in" : "out", dateISO === selectedISO ? "selected" : ""].join(" ")}
                onClick={() => onPickDate(dateISO)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="day-num" style={{ color: isHoliday || isSunday ? "var(--danger)" : undefined }}>
                    {cell.date.getDate()}
                  </div>
                  {holidayName && (
                    <div style={{ fontSize: 10, color: "var(--danger)", fontWeight: 600, marginTop: 2, marginRight: 2 }}>
                      {holidayName}
                    </div>
                  )}
                </div>

                <div className="chips">
                  {dayEvents.map((e) => (
                    <button
                      key={e.id}
                      className="chip chip-event"
                      style={e.color ? { backgroundColor: e.color, color: "#fff" } : undefined}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onPickItem?.({ kind: "event", event: e });
                      }}
                    >
                      {e.title}
                    </button>
                  ))}

                  {dayTasks.map((t) => {
                    const kind = (t.type ?? "").toUpperCase() === "MEMO" ? "memo" : "task";
                    const isDone = t.status === "COMPLETED";

                    return (
                      <button
                        key={t.id}
                        className={["chip", kind === "memo" ? "chip-memo-text" : "chip-task-check", isDone ? "done" : ""].join(" ")}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onPickItem?.({ kind, task: t } as ChipTarget);
                        }}
                      >
                        {kind === "task" && (
                          <span style={{ marginRight: 4, fontSize: "1.1em", lineHeight: 1 }}>
                            {isDone ? "☑" : "☐"}
                          </span>
                        )}
                        <span style={{ textDecoration: isDone ? "line-through" : "none" }}>{t.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
