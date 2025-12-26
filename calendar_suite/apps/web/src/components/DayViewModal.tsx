import { useMemo } from "react";
import type { Event, Task } from "../lib/api";
import { ChipTarget } from "./Calendar/MonthGrid";
import { getDDay } from "../lib/date";

type Props = {
    open: boolean;
    dateISO: string;
    events: Event[];
    tasks: Task[];
    onClose: () => void;
    onCompose: () => void;
    onPickItem: (t: ChipTarget) => void;
};

export default function DayViewModal(props: Props) {
    const { open, dateISO, events, tasks, onClose, onCompose, onPickItem } = props;

    const dayEvents = useMemo(() => {
        return events.filter((e) => e.start_at.slice(0, 10) === dateISO);
    }, [events, dateISO]);

    const dayTasks = useMemo(() => {
        return tasks.filter((t) => t.due_at.slice(0, 10) === dateISO);
    }, [tasks, dateISO]);

    const taskCount = dayTasks.filter(t => t.type !== 'MEMO').length;
    const memoCount = dayTasks.filter(t => t.type === 'MEMO').length;

    if (!open) return null;

    return (
        <div className="sheet-backdrop" onClick={onClose}>
            <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ height: "60vh", display: "flex", flexDirection: "column" }}>
                <div className="sheet-head">
                    <div>
                        <div className="sheet-title">{dateISO}</div>
                        <div className="sheet-sub">{dayEvents.length} 일정 · {taskCount} 할일 · {memoCount} 메모</div>
                    </div>
                    <button className="sheet-x" onClick={onClose}>✕</button>
                </div>

                <div className="sheet-body" style={{ flex: 1, overflowY: "auto", padding: 0 }}>
                    {dayEvents.length === 0 && dayTasks.length === 0 ? (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>🏝️</div>
                            일정이 없습니다.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {dayEvents.map((e) => (
                                <div
                                    key={e.id}
                                    onClick={() => onPickItem({ kind: "event", event: e })}
                                    style={{
                                        padding: "12px 20px",
                                        borderBottom: "1px solid var(--border)",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12
                                    }}
                                >
                                    <div style={{ width: 4, height: 40, background: e.color ?? "var(--primary)", borderRadius: 2 }} />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15 }}>{e.title}</div>
                                        <div style={{ fontSize: 13, color: "var(--muted)" }}>
                                            {e.is_all_day ? "하루 종일" : `${e.start_at.slice(11, 16)} ~ ${e.end_at.slice(11, 16)}`}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {dayTasks.map((t) => {
                                const dDay = t.status !== "COMPLETED" ? getDDay(t.due_at) : null;
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => onPickItem({ kind: (t.type === "MEMO" ? "memo" : "task"), task: t })}
                                        style={{
                                            padding: "12px 20px",
                                            borderBottom: "1px solid var(--border)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12
                                        }}
                                    >
                                        <div style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: "50%",
                                            border: "2px solid var(--muted)",
                                            display: "grid",
                                            placeItems: "center"
                                        }}>
                                            {t.status === "COMPLETED" && <div style={{ width: 10, height: 10, background: "var(--muted)", borderRadius: "50%" }} />}
                                        </div>
                                        <div style={{ flex: 1, textDecoration: t.status === "COMPLETED" ? "line-through" : "none", opacity: t.status === "COMPLETED" ? 0.5 : 1 }}>
                                            <div style={{ fontWeight: 500, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                                                {dDay && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "var(--panel-hover)", padding: "2px 6px", borderRadius: 4 }}>{dDay}</span>}
                                                {t.title}
                                            </div>
                                            {t.description && <div style={{ fontSize: 13, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="sheet-foot">
                    <button className="btn primary" style={{ width: "100%" }} onClick={() => { onClose(); onCompose(); }}>
                        + 새로운 항목 추가
                    </button>
                </div>
            </div>
        </div>
    );
}
