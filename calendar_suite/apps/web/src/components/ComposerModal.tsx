// apps/web/src/components/ComposerModal.tsx
import { useState } from "react";
import { eventsApi, taskApi, TaskPriority, TaskStatus } from "../lib/api";

type Mode = "TASK" | "EVENT" | "MEMO";

export default function ComposerModal(props: {
  open: boolean;
  dateISO: string; // YYYY-MM-DD
  defaultCalendarId: string | null;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("TASK");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Time state
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [color, setColor] = useState<string | null>(null);

  if (!props.open) return null;

  const reset = () => {
    setMode("TASK");
    setTitle("");
    setDescription("");
    setErr(null);
    setStartTime("09:00");
    setEndTime("10:00");
    setIsAllDay(false);
    setColor(null);
  };

  const close = () => {
    reset();
    props.onClose();
  };

  const submit = async () => {
    setErr(null);

    if (!props.defaultCalendarId) {
      setErr("캘린더가 없습니다.");
      return;
    }
    if (!title.trim()) {
      setErr("제목을 입력하세요.");
      return;
    }

    if (mode === "EVENT" && !isAllDay && startTime >= endTime) {
      setErr("종료 시간이 시작 시간보다 빨라요!");
      return;
    }

    setBusy(true);
    try {
      if (mode === "EVENT") {
        const startAt = isAllDay
          ? `${props.dateISO}T00:00:00`
          : `${props.dateISO}T${startTime}:00`;

        const endAt = isAllDay
          ? `${props.dateISO}T23:59:59`
          : `${props.dateISO}T${endTime}:00`;

        await eventsApi.create({
          calendar_id: props.defaultCalendarId,
          title: title.trim(),
          description: description.trim() || null,
          start_at: startAt,
          end_at: endAt,
          is_all_day: isAllDay,
          color, // ✅ Pass color
        });
      } else {
        const status: TaskStatus = "PENDING";
        const priority: TaskPriority | null = null;
        const type = mode === "MEMO" ? "MEMO" : null;

        await taskApi.create({
          calendar_id: props.defaultCalendarId,
          title: title.trim(),
          description: description.trim() || null,
          due_at: `${props.dateISO}T00:00:00`,
          status,
          priority,
          type,
        });
      }

      await props.onCreated();
      close();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <div className="sheet-title">새로운 항목</div>
            <div className="sheet-sub">{props.dateISO}</div>
          </div>
          <button className="sheet-x" onClick={close}>✕</button>
        </div>

        <div style={{ padding: "0 20px" }}>
          <div className="segmented-control">
            <button
              className={`segment-btn ${mode === "TASK" ? "active" : ""}`}
              onClick={() => setMode("TASK")}
            >
              ✅ 할일
            </button>
            <button
              className={`segment-btn ${mode === "EVENT" ? "active" : ""}`}
              onClick={() => setMode("EVENT")}
            >
              📅 일정
            </button>
            <button
              className={`segment-btn ${mode === "MEMO" ? "active" : ""}`}
              onClick={() => setMode("MEMO")}
            >
              📝 메모
            </button>
          </div>
        </div>

        <div className="sheet-body">
          <div className="form">
            <div>
              <label className="label">제목</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="무엇을 해야 하나요?"
                autoFocus
              />
            </div>

            {mode === "EVENT" && (
              <>
                <div className="check-row">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                  />
                  <label htmlFor="allDay">하루 종일</label>
                </div>

                {!isAllDay && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label className="label">시작 시간</label>
                      <input
                        type="time"
                        className="input"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">종료 시간</label>
                      <input
                        type="time"
                        className="input"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">색상</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { c: "#ef4444", n: "Red" },
                      { c: "#f97316", n: "Orange" },
                      { c: "#eab308", n: "Yellow" },
                      { c: "#22c55e", n: "Green" },
                      { c: "#3b82f6", n: "Blue" },
                      { c: "#a855f7", n: "Purple" },
                      { c: "#6b7280", n: "Gray" },
                    ].map((sw) => (
                      <button
                        key={sw.c}
                        type="button"
                        onClick={() => setColor(color === sw.c ? null : sw.c)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: sw.c,
                          border: color === sw.c ? "2px solid var(--fg)" : "2px solid transparent",
                          cursor: "pointer",
                          boxShadow: "var(--shadow-sm)",
                        }}
                        aria-label={sw.n}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="label">설명 (선택)</label>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="상세 내용을 입력하세요"
              />
            </div>

            {err && <div className="err">{err}</div>}
          </div>
        </div>

        <div className="sheet-foot">
          <button className="btn" onClick={close} disabled={busy}>취소</button>
          <button className="btn primary" onClick={submit} disabled={busy}>
            {busy ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
