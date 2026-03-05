import { tokenStorage, refreshTokenStorage } from "../shared/utils/storage";

/** Dispatched on window whenever tokens are cleared (e.g. on 401 / refresh failure). */
export const AUTH_CLEARED_EVENT = "auth:cleared";

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (typeof payload.exp !== "number") return false;
    // treat as expired if within 10 s of expiry
    return Date.now() >= (payload.exp - 10) * 1000;
  } catch {
    return true;
  }
}

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
};

function loadInitialAccessToken(): string | null {
  const token = tokenStorage.get();
  if (!token) return null;
  if (isJwtExpired(token)) {
    // Clear stale tokens immediately so ProtectedRoute sees unauthenticated state.
    tokenStorage.clear();
    refreshTokenStorage.clear();
    return null;
  }
  return token;
}

const state: AuthState = {
  accessToken: loadInitialAccessToken(),
  refreshToken: refreshTokenStorage.get(),
};

export const authStore = {
  getAccessToken() {
    return state.accessToken;
  },
  getRefreshToken() {
    return state.refreshToken;
  },
  setTokens(accessToken: string, refreshToken: string) {
    state.accessToken = accessToken;
    state.refreshToken = refreshToken;
    tokenStorage.set(accessToken);
    refreshTokenStorage.set(refreshToken);
  },
  clearTokens() {
    state.accessToken = null;
    state.refreshToken = null;
    tokenStorage.clear();
    refreshTokenStorage.clear();
    // Notify React (AuthProvider) that auth was cleared so it can update state.
    window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
  },
  // kept for back-compat with existing code
  setAccessToken(token: string | null) {
    if (token) {
      state.accessToken = token;
      tokenStorage.set(token);
    } else {
      this.clearTokens();
    }
  },
  isAuthed() {
    return !!state.accessToken;
  },
};
