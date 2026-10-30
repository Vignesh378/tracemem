import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { getApiErrorMessage } from "../api/apiError";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ name, email, password });
      navigate("/login");
    } catch (err) {
      setError(getApiErrorMessage(err, "authentication", "VITE_AUTH_BASE"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Register</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Name</span>
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Email</span>
            <input
              type="email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Password</span>
            <input
              type="password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-zinc-600">
          Already have an account? <Link className="underline" to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}