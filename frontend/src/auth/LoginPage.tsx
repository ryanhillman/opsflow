import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../app/providers/AuthProvider";

const DEV_ORG_ID = "00000000-0000-0000-0000-000000000001";

export function LoginPage() {
  const nav = useNavigate();
  const { setTokens } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        "/api/v1/auth/login",
        { email, password, orgId: DEV_ORG_ID }
      );

      setTokens(res.accessToken, res.refreshToken);
      nav("/app/incidents");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>
      <p style={{ color: "#555" }}>Sign in to OpsFlow</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          <div style={{ fontSize: 12, marginBottom: 6 }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />
        </label>

        <label>
          <div style={{ fontSize: 12, marginBottom: 6 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />
        </label>

        {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid #222",
            background: isLoading ? "#f2f2f2" : "#222",
            color: isLoading ? "#222" : "white",
            cursor: isLoading ? "default" : "pointer",
          }}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
