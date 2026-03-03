import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const response = await api.post(endpoint, { email, password, role });
      login(response.data, response.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Request failed");
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-700 bg-card p-6">
      <h1 className="mb-4 text-2xl font-semibold">DevCloud Access</h1>
      <div className="mb-4 flex gap-2 text-sm">
        <button
          type="button"
          className={`rounded-lg px-3 py-1 ${mode === "login" ? "bg-accent text-black" : "border border-slate-600"}`}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1 ${mode === "register" ? "bg-accent text-black" : "border border-slate-600"}`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>
      <form className="space-y-3" onSubmit={submit}>
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
        />
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
        />
        {mode === "register" ? (
          <select
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="viewer">Viewer</option>
            <option value="dev">Dev</option>
            <option value="admin">Admin</option>
          </select>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-accent px-3 py-2 font-semibold text-black"
        >
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <p className="mt-4 text-xs text-muted">
        Backend expects JWT auth and role-based access. Use local account for test.
      </p>
    </div>
  );
}
