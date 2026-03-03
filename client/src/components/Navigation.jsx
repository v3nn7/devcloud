import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navigation() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <nav className="border-b border-slate-800 bg-card/70">
      <div className="mx-auto flex max-w-6xl gap-4 p-3 text-sm">
        <Link to="/dashboard" className="hover:text-accent">
          Dashboard
        </Link>
        <Link to="/files" className="hover:text-accent">
          Files
        </Link>
        {(user.role === "admin" || user.role === "dev") && (
          <Link to="/dev" className="hover:text-accent">
            Dev
          </Link>
        )}
      </div>
    </nav>
  );
}
