// apps/web/src/auth/AuthProvider.tsx
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";
import { themeStorage, type ThemeMode } from "../lib/storage";
import type { AuthStatus, ServerUser } from "./types";
import { AuthContext } from "./AuthContext";
import { applyTheme } from "../lib/theme";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [me, setMe] = useState<ServerUser | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => themeStorage.get());

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user: any | null) => {
      if (user) {
        setMe({
          id: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? "User",
          role: "USER",
          photoURL: user.photoURL,
        });
        setStatus("authed");
      } else {
        setMe(null);
        setStatus("guest");
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch {
      // ignore
    }
  };

  const refreshMe = async () => {
    // No-op for firebase direct auth, handled by onAuthStateChanged
  };

  const value = useMemo(
    () => ({ status, me, themeMode, setThemeMode, refreshMe, logout }),
    [status, me, themeMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
