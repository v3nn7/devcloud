import { useEffect, useState } from "react";
import api from "../api/client.js";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/overview")
      .then((response) => setData(response.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load dashboard"));
  }, []);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }
  if (!data) {
    return <p className="text-muted">Loading dashboard...</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section className="rounded-xl border border-slate-700 bg-card p-4">
        <h3 className="text-lg font-semibold">Storage</h3>
        <p className="mt-2 text-2xl">{(data.storage.usedBytes / 1024 / 1024).toFixed(1)} MB</p>
      </section>
      <section className="rounded-xl border border-slate-700 bg-card p-4">
        <h3 className="text-lg font-semibold">Active sessions</h3>
        <p className="mt-2 text-2xl">{data.activeSessions}</p>
      </section>
      <section className="rounded-xl border border-slate-700 bg-card p-4">
        <h3 className="text-lg font-semibold">CPU</h3>
        <p className="mt-2 text-2xl">{data.system.cpu.cores} cores</p>
        <p className="mt-1 text-sm text-muted">Load: {data.system.cpu.loadAvg[0].toFixed(2)}</p>
      </section>
      <section className="rounded-xl border border-slate-700 bg-card p-4 md:col-span-3">
        <h3 className="text-lg font-semibold">Memory</h3>
        <p className="mt-2">
          {(data.system.memory.used / 1024 / 1024).toFixed(1)} MB /{" "}
          {(data.system.memory.total / 1024 / 1024).toFixed(1)} MB
        </p>
      </section>
    </div>
  );
}
