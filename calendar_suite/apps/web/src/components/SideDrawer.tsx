// apps/web/src/components/SideDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import { getStoredThemeMode, setStoredThemeMode, applyTheme, ThemeMode } from "../lib/theme";
import { tokenStorage } from "../lib/storage";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";

type Calendar = { id: string; name?: string | null };

function readEnabledCalendarIds(): Record<string, boolean> {
  try {
    const s = localStorage.getItem("enabledCalendarIds");
    if (!s) return {};
    const parsed = JSON.parse(s) as unknown;
    if (parsed && typeof parsed === "object") return parsed as Record<string, boolean>;
  } catch {
    // ignore
  }
  return {};
}

export default function SideDrawer(props: {
  open: boolean;
  onClose: () => void;
  calendars: Calendar[];
  enabledCalendarIds: Record<string, boolean>;
  onToggleCalendar: (id: string, enabled: boolean) => void;
}) {
  const { open, onClose, calendars, enabledCalendarIds, onToggleCalendar } = props;

  const [theme, setTheme] = useState<ThemeMode>(() => getStoredThemeMode());
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (u: any | null) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const enabledIds = useMemo(() => {
    const any = Object.keys(enabledCalendarIds).length > 0;
    if (!any) return calendars.map((c) => c.id);
    return calendars.map((c) => c.id).filter((id) => enabledCalendarIds[id] ?? true);
  }, [calendars, enabledCalendarIds]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{ fontWeight: 700, fontSize: 18 }}>설정</div>
          <button className="icon-btn" onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="profile"
                style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid var(--border)" }}
              />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--panel-hover)", display: "grid", placeItems: "center" }}>
                👤
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.displayName ?? "사용자"}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              className="btn btn-danger"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={async () => {
                const ok = window.confirm("로그아웃 할까요?");
                if (!ok) return;
                try {
                  await signOut(getAuth());
                } finally {
                  tokenStorage.clear?.();
                  location.href = "/";
                }
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <div className="drawer-section">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--muted)" }}>테마 설정</div>
          <div className="segmented-control">
            {(["auto", "light", "dark"] as ThemeMode[]).map((m) => (
              <button
                key={m}
                className={`segment-btn ${theme === m ? "active" : ""}`}
                onClick={() => {
                  setTheme(m);
                  setStoredThemeMode(m);
                  applyTheme(m);
                }}
              >
                {m === "auto" ? "자동" : m === "light" ? "라이트" : "다크"}
              </button>
            ))}
          </div>
        </div>

        {calendars.length > 1 && (
          <div className="drawer-section">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--muted)" }}>표시할 캘린더</div>
            <div style={{ display: "grid", gap: 8 }}>
              {calendars.map((c) => {
                const checked = enabledIds.includes(c.id);
                return (
                  <label key={c.id} className="check-row" style={{ padding: "8px 0", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        onToggleCalendar(c.id, e.target.checked);
                        const next = { ...readEnabledCalendarIds(), [c.id]: e.target.checked };
                        localStorage.setItem("enabledCalendarIds", JSON.stringify(next));
                      }}
                      style={{ width: 18, height: 18, marginRight: 10 }}
                    />
                    <span style={{ fontSize: 14 }}>{c.name ?? c.id}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
