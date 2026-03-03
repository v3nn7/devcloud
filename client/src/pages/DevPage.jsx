import { useEffect, useState } from "react";
import api from "../api/client.js";

export default function DevPage() {
  const [stats, setStats] = useState(null);
  const [containers, setContainers] = useState([]);
  const [gitStatus, setGitStatus] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, containersRes, gitRes] = await Promise.all([
          api.get("/dev/system-stats"),
          api.get("/dev/docker/containers"),
          api.get("/dev/git-status")
        ]);
        setStats(statsRes.data);
        setContainers(containersRes.data.containers || []);
        setGitStatus(gitRes.data.files || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dev data");
      }
    }
    load();
  }, []);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }
  if (!stats) {
    return <p className="text-muted">Loading dev info...</p>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-700 bg-card p-4">
        <h2 className="text-xl font-semibold">System stats</h2>
        <p>Platform: {stats.platform}</p>
        <p>Cores: {stats.cpu.cores}</p>
        <p>Load avg: {stats.cpu.loadAvg?.join(", ")}</p>
        <p>Memory: {(stats.memory.used / 1024 / 1024).toFixed(1)} MB used</p>
      </section>

      <section className="rounded-xl border border-slate-700 bg-card p-4">
        <h2 className="text-xl font-semibold">Docker containers</h2>
        <ul className="list-disc pl-5">
          {containers.map((container) => (
            <li key={container.id}>
              {container.name} - {container.status} ({container.image})
            </li>
          ))}
          {containers.length === 0 ? <li>No containers found.</li> : null}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-700 bg-card p-4">
        <h2 className="text-xl font-semibold">Git status</h2>
        <ul className="list-disc pl-5">
          {gitStatus.map((entry, index) => (
            <li key={index}>{entry.raw}</li>
          ))}
          {gitStatus.length === 0 ? <li>Clean working tree or unavailable.</li> : null}
        </ul>
      </section>
    </div>
  );
}
