import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-card border-b border-slate-700">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link to="/" className="text-xl font-bold text-accent">
          DevCloud
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{user.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-600 px-3 py-1 text-sm hover:border-accent"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
