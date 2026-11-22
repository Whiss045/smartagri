import { useState, type SyntheticEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { errorMessage } from "../constants/labels";
import { useAuth } from "../hooks/auth.hook";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />; // already logged in

  async function submit(e: SyntheticEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      // On the login route a 401 means wrong credentials, not an expired session
      setError(
        err instanceof ApiError && err.status === 401
          ? "اسم المستخدم أو كلمة المرور غير صحيحة"
          : errorMessage(err),
      );
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form
        onSubmit={submit}
        style={{
          background: "var(--surface)",
          padding: 24,
          borderRadius: 12,
          width: "min(360px, 100%)",
          textAlign: "start",
        }}
      >
        <h1 style={{ marginBottom: 16 }}>🌴 سمارت أغري</h1>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <label className="field">
          <span>اسم المستخدم</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label className="field">
          <span>كلمة المرور</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button
          className="btn btn--primary"
          style={{ width: "100%" }}
          disabled={busy}
        >
          {busy ? "…" : "دخول"}
        </button>
      </form>
    </div>
  );
}
