import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authStore, AUTH_CLEARED_EVENT } from "../../auth/authStore";

type AuthContextValue = {
  isAuthed: boolean;
  accessToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(authStore.getAccessToken());

  // Keep React state in sync when authStore.clearTokens() is called outside React
  // (e.g. from the api client after a failed token refresh).
  useEffect(() => {
    const handle = () => setAccessTokenState(null);
    window.addEventListener(AUTH_CLEARED_EVENT, handle);
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, handle);
  }, []);

  const setTokens = (access: string, refresh: string) => {
    authStore.setTokens(access, refresh);
    setAccessTokenState(access);
  };

  const logout = () => {
    authStore.clearTokens(); // also dispatches AUTH_CLEARED_EVENT, harmless double-set
    setAccessTokenState(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthed: !!accessToken, accessToken, setTokens, logout }),
    [accessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
