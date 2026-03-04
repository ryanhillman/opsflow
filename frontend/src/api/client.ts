import { ApiError } from "./errors";
import { authStore } from "../auth/authStore";

type Json = Record<string, any>;

let refreshInFlight: Promise<void> | null = null;

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function doRefresh() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = authStore.getRefreshToken();
      if (!refreshToken) {
        authStore.clearTokens();
        throw new ApiError("No refresh token available", 401, null);
      }

      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        authStore.clearTokens();
        throw new ApiError("Refresh failed", res.status, await parseJsonSafe(res));
      }

      const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
      if (!data?.accessToken || !data?.refreshToken) {
        authStore.clearTokens();
        throw new ApiError("Refresh response missing tokens", 500, data);
      }
      authStore.setTokens(data.accessToken, data.refreshToken);
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(
  path: string,
  opts: RequestInit & { json?: Json } = {}
): Promise<T> {
  const headers = new Headers(opts.headers);

  let body = opts.body;
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.json);
  }

  const token = authStore.getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...opts, headers, body });

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return (await parseJsonSafe(res)) as T;
  }

  if (res.status === 401) {
    try {
      await doRefresh();
    } catch {
      throw new ApiError("Unauthorized", 401);
    }

    const retryHeaders = new Headers(opts.headers);
    const newToken = authStore.getAccessToken();
    if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`);
    if (opts.json !== undefined) retryHeaders.set("Content-Type", "application/json");

    const retryRes = await fetch(path, { ...opts, headers: retryHeaders, body });

    if (retryRes.ok) {
      if (retryRes.status === 204) return undefined as T;
      return (await parseJsonSafe(retryRes)) as T;
    }

    throw new ApiError("Request failed after refresh", retryRes.status, await parseJsonSafe(retryRes));
  }

  throw new ApiError("Request failed", res.status, await parseJsonSafe(res));
}

export const api = {
  get<T>(path: string) {
    return request<T>(path, { method: "GET" });
  },
  post<T>(path: string, json?: Json) {
    return request<T>(path, { method: "POST", json });
  },
  put<T>(path: string, json?: Json) {
    return request<T>(path, { method: "PUT", json });
  },
  delete<T>(path: string) {
    return request<T>(path, { method: "DELETE" });
  },
};
