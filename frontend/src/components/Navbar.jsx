import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";

export default function Navbar() {
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    navigate("/login");
  };

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          TraceMem
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-700">
          <Link to="/" className="hover:text-zinc-900">Analysis</Link>
          <Link to="/login" className="hover:text-zinc-900">Login</Link>
          <Link to="/register" className="hover:text-zinc-900">Register</Link>
          <button
            onClick={onLogout}
            className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}