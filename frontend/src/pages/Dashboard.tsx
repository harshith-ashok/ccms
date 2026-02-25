import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("loggedIn");
    navigate("/login");
  };

  return (
    <div>
      <div className="drawer drawer-open">
        <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content p-10">
          <h1 className="text-3xl font-bold">Welcome, {user.first_name}</h1>
          <div className="flex flex-col">
            <div className="stats bg-base-100 border-base-300 border mt-10 w-[25%]">
              <div className="stat">
                <div className="stat-title">Account balance</div>
                <div className="stat-value">$89,400</div>
              </div>
              <div className="stat">
                <div className="stat-title">Current balance</div>
                <div className="stat-value">$89,400</div>
              </div>
            </div>
            <a href="#" className="hover-3d my-12 mx-2 cursor-pointer w-max">
              {/* content */}
              <div className="card w-96 bg-black text-white bg-[radial-gradient(circle_at_bottom_left,#ffffff04_35%,transparent_36%),radial-gradient(circle_at_top_right,#ffffff04_35%,transparent_36%)] bg-size-[4.95em_4.95em]">
                <div className="card-body">
                  <div className="flex justify-between mb-10">
                    <div className="font-bold">BANK OF LATVERIA</div>
                    <div className="text-5xl opacity-10">❁</div>
                  </div>
                  <div className="text-lg mb-4 opacity-40">
                    0210 8820 1150 0222
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs opacity-20">CARD HOLDER</div>
                      <div>VICTOR VON D.</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-20">EXPIRES</div>
                      <div>29/08</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 8 empty divs needed for the 3D effect */}
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </a>
          </div>
        </div>
        <div className="drawer-side">
          <ul className="menu bg-base-200 min-h-full w-80 p-3 flex flex-col">
            <li>
              <a>Dashboard</a>
            </li>

            <li>
              <a>Sidebar Item 2</a>
            </li>

            {/* Push to bottom */}
            <li className="mt-auto text-md">
              <button onClick={logout} className="text-error">
                <i className="bi bi-box-arrow-left"></i> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
