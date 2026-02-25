import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type User = {
  id: number;
  first_name: string;
};

function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data: User[] = await response.json();

      console.log("API response:", data);

      if (Array.isArray(data) && data.length > 0) {
        const user = data[0];

        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("user", JSON.stringify(user));

        navigate("/dashboard", { replace: true });
      } else {
        alert("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Server error or invalid login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen justify-center items-center">
      <div className="card card-border shadow-lg bg-base-100 w-96">
        <form className="card-body flex gap-5" onSubmit={handleLogin}>
          <h2 className="text-3xl text-center font-bold">Login</h2>

          <label className="input validator w-full">
            <input
              type="text"
              value={username}
              required
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={30}
            />
          </label>

          <label className="input validator w-full">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              minLength={8}
            />
          </label>

          <button
            className="btn btn-outline btn-primary w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center">
            New?{" "}
            <Link to="/register" className="text-primary links">
              Register Now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;