import React, { createContext, useContext, useMemo, useState } from "react";
import { authStore } from "../../auth/authStore";

type AuthContextValue = {
  isAuthed: boolean;
  accessToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(authStore.getAccessToken());

  const setTokens = (access: string, refresh: string) => {
    authStore.setTokens(access, refresh);
    setAccessTokenState(access);
  };

  const logout = () => {
    authStore.clearTokens();
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
