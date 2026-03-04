import { tokenStorage, refreshTokenStorage } from "../shared/utils/storage";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
};

const state: AuthState = {
  accessToken: tokenStorage.get(),
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
