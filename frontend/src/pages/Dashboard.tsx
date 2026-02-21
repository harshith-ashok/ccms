import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("loggedIn");
    navigate("/login");
  };

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <button className="btn btn-error mt-4" onClick={logout}>
        Logout
      </button>
    </div>
  );
}