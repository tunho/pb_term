// apps/web/src/components/DetailModal.tsx
import { useState } from "react";
import { eventsApi, taskApi } from "../lib/api";
import { fireConfetti } from "../lib/confetti";
import { formatApiError } from "../lib/error";
import type { ChipTarget } from "./Calendar/MonthGrid";
import type { Event, Task } from "../lib/api";

type UpdatedPayload =
  | { kind: "event"; event: Event }
  | { kind: "task" | "memo"; task: Task };

type DeletedPayload = { kind: "event" | "task" | "memo"; id: string };

type Props = {
  open: boolean;
  target: ChipTarget | null;
  onClose: () => void;
  onUpdated: (payload: UpdatedPayload) => void;
  onDeleted: (payload: DeletedPayload) => void;
};

export default function DetailModal(props: Props) {
  const { open, target, onClose } = props;

  // ✅ null-safe
  const tgt = target;

  // ---- UI state ----
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Editing state (currently unused in view-only mode)
  /*
  const [title, setTitle] = useState(initialTitle);
  const [desc, setDesc] = useState(initialDesc);
  const [allDay, setAllDay] = useState(initialAllDay);
  const [startAt, setStartAt] = useState(initialStartISO);
  const [endAt, setEndAt] = useState(initialEndISO);
  const [dueAt, setDueAt] = useState(initialDueISO);

  async function onSave() {
    // ... implementation ...
  }
  */

  async function onDelete() {
    if (!tgt) return;
    const ok = window.confirm("정말 삭제할까요?");
    if (!ok) return;

    setSaving(true);
    setErr(null);

    try {
      if (tgt.kind === "event") {
        await eventsApi.remove(tgt.event.id);
        props.onDeleted({ kind: "event", id: tgt.event.id });
        onClose();
        return;
      }

      await taskApi.remove(tgt.task.id);
      props.onDeleted({ kind: tgt.kind, id: tgt.task.id });
      onClose();
    } catch (e) {
      const fe = formatApiError(e);
      setErr(fe.body ?? fe.title);
    } finally {
      setSaving(false);
    }
  }

  async function onToggleComplete() {
    if (!tgt) return;
    if (tgt.kind !== "task") return;

    setSaving(true);
    setErr(null);

    try {
      const next = tgt.task.status !== "COMPLETED";
      const updated = await taskApi.toggleComplete(tgt.task.id, next);
      if (next) fireConfetti();
      props.onUpdated({ kind: "task", task: updated });
      onClose();
    } catch (e) {
      const fe = formatApiError(e);
      setErr(fe.body ?? fe.title);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  // ⚠️ 아래 렌더는 예시(너 원래 UI로 바꿔도 됨)
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 16 }}>
          {err ? <div className="sheet-error">{err}</div> : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{tgt?.kind === "event" ? tgt.event.title : tgt?.task.title}</div>
              <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>
                {tgt?.kind === "event"
                  ? `${tgt.event.start_at.slice(0, 16).replace("T", " ")} ~ ${tgt.event.end_at.slice(0, 16).replace("T", " ")}`
                  : `마감: ${tgt?.task.due_at.slice(0, 10)}`
                }
              </div>
            </div>

            {(tgt?.kind === "event" ? tgt.event.description : tgt?.task.description) && (
              <div style={{ background: "var(--panel-hover)", padding: 12, borderRadius: "var(--radius-md)", fontSize: 14, whiteSpace: "pre-wrap" }}>
                {tgt?.kind === "event" ? tgt.event.description : tgt?.task.description}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              {tgt?.kind === "task" && (
                <button
                  className={`btn ${tgt.task.status === "COMPLETED" ? "" : "primary"}`}
                  onClick={onToggleComplete}
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {tgt.task.status === "COMPLETED" ? "미완료로 변경" : "완료하기"}
                </button>
              )}

              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (!tgt) return;
                  const title = tgt.kind === 'event' ? tgt.event.title : tgt.task.title;
                  const time = tgt.kind === 'event'
                    ? `${tgt.event.start_at} ~ ${tgt.event.end_at}`
                    : `Due: ${tgt.task.due_at}`;
                  const desc = (tgt.kind === 'event' ? tgt.event.description : tgt.task.description) ?? '';
                  const text = `[${title}]\n${time}\n${desc}`;
                  navigator.clipboard.writeText(text);
                  alert("일정 내용이 복사되었습니다.");
                }}
                style={{ flex: 1 }}
              >
                복사
              </button>

              <button className="btn danger" onClick={onDelete} disabled={saving} style={{ flex: 1 }}>
                삭제
              </button>
            </div>

            <button className="btn" onClick={onClose} disabled={saving}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
