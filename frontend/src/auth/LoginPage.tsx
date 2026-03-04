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
      setError(err?.message ?? "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="loginWrap">
      <div className="loginCard card">
        <div className="cardHeader" style={{ textAlign: "center", paddingBottom: 20 }}>
          <div style={{ fontWeight: 750, fontSize: 20, letterSpacing: "-0.3px" }}>OpsFlow</div>
          <div className="subtle" style={{ marginTop: 4 }}>Sign in to your workspace</div>
        </div>

        <div className="cardBody">
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <label>
              <div className="subtle" style={{ marginBottom: 6 }}>Email</div>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                required
              />
            </label>

            <label>
              <div className="subtle" style={{ marginBottom: 6 }}>Password</div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn"
              disabled={isLoading}
              style={{ width: "100%", marginTop: 2 }}
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="subtle" style={{ marginTop: 20, textAlign: "center", fontSize: 12 }}>
            Dev workspace · Org {DEV_ORG_ID.slice(0, 8)}…
          </div>
        </div>
      </div>
    </div>
  );
}
