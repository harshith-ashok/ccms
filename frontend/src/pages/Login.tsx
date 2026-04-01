import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type User = {
  id: number;
  first_name: string;
};
type LoginResponse = {
  message: string;
  access_token: string;
  user: User;
};

function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8120/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data: LoginResponse = await response.json();
      if (!response.ok) throw new Error(data?.message || "Invalid credentials");
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("first_name", data.user.first_name);
      navigate("/dashboard", { replace: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090f] flex items-center justify-center px-4 font-sans">
      {/* Background glow blobs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-400 opacity-[0.04] blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500 opacity-[0.04] blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-2 h-2 rounded-full animate-pulse bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]" />
          <span className="text-xl font-bold tracking-tight text-zinc-100">
            Financer
          </span>
        </div>

        {/* Card */}
        <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
          {/* Glow blob */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-400 opacity-[0.05] blur-[60px] pointer-events-none" />

          <div className="px-8 py-8 relative">
            <h1 className="text-[1.75rem] font-extrabold tracking-tight text-zinc-100 mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-500 font-mono font-light mb-8">
              Sign in to your account
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
                <svg
                  className="w-4 h-4 text-red-400 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  required
                  placeholder="your_username"
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  maxLength={30}
                  className="font-mono w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10 transition-colors duration-150"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  required
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10 transition-colors duration-150"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="hover:cursor-pointer w-full py-2.5 rounded-xl bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_28px_rgba(251,191,36,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-zinc-600">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <p className="text-center text-sm text-zinc-500">
              New to Financer?{" "}
              <Link
                to="/register"
                className="text-amber-400 font-semibold hover:text-amber-300 transition-colors duration-150"
              >
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
