// apps/web/src/pages/LoginPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../lib/firebase";
import { useAuth } from "../auth/useAuth";

function getErrMsg(err: unknown) {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("auth/email-already-in-use")) return "이미 가입된 이메일입니다.";
    if (msg.includes("auth/invalid-email")) return "이메일 형식이 올바르지 않습니다.";
    if (msg.includes("auth/user-not-found") || msg.includes("auth/invalid-credential")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
    if (msg.includes("auth/weak-password")) return "비밀번호는 6자리 이상이어야 합니다.";
    return msg;
  }
  if (typeof err === "string") return err;
  return "로그인 실패";
}

export default function LoginPage() {
  const nav = useNavigate();
  const { status } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (status === "authed") nav("/app", { replace: true });
  }, [status, nav]);

  const onGoogleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (e) {
      setError(getErrMsg(e));
      setBusy(false);
    }
  };

  const onEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
    } catch (e) {
      setError(getErrMsg(e));
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Calendar</h1>
        <p>로그인하여 일정을 관리하세요.</p>

        <button onClick={onGoogleLogin} disabled={busy} style={{ marginBottom: 20 }}>
          Google로 계속하기
        </button>

        <div style={{ borderTop: "1px solid var(--border)", margin: "20px 0", position: "relative" }}>
          <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "var(--panel)", padding: "0 10px", color: "var(--muted)", fontSize: 12 }}>OR</span>
        </div>

        <form onSubmit={onEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="input"
            placeholder="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={busy}>
            {busy ? "처리 중..." : (isRegister ? "이메일로 회원가입" : "이메일로 로그인")}
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>
            {isRegister ? "이미 계정이 있으신가요?" : "계정이 없으신가요?"}
          </span>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
            style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", marginLeft: 4, width: "auto", padding: 0, display: "inline", fontSize: 13, fontWeight: 600 }}
          >
            {isRegister ? "로그인하기" : "회원가입하기"}
          </button>
        </div>

        {error ? <div className="login-err">{error}</div> : null}
      </div>
    </div>
  );
}
