import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface Card {
  id: number;
  bank: string;
  card_number: string;
  card_holder: string;
  expires: string;
  credit_limit: number;
  monthly_due: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("http://localhost:8120/cards", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          navigate("/login");
          return;
        }
        const data = await response.json();
        setCards(data);
      } catch (error) {
        console.error("Failed to fetch cards:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [navigate]);

  const totalCredit = cards.reduce(
    (sum, card) => sum + Number(card.credit_limit),
    0,
  );
  const totalDue = cards.reduce(
    (sum, card) => sum + Number(card.monthly_due),
    0,
  );
  const usagePercent =
    totalCredit > 0 ? Math.round((totalDue / totalCredit) * 100) : 0;

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const cardGradients = [
    "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    "linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #1e3a5f 100%)",
    "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #3d2060 100%)",
    "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0e3251 100%)",
  ];

  const cardAccents = ["#e8c97a", "#7ac5e8", "#c97ae8", "#7ae8b8"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: 'Syne', sans-serif;
          background: #09090f;
        }

        .dashboard-root {
          display: flex;
          min-height: 100vh;
          background: #09090f;
          color: #f0ede8;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: #0e0e18;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          padding: 32px 20px;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .sidebar-logo {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #f0ede8;
          margin-bottom: 48px;
          padding-left: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-logo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e8c97a;
        }

        .nav-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          color: rgba(240,237,232,0.3);
          text-transform: uppercase;
          padding: 0 8px;
          margin-bottom: 12px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(240,237,232,0.55);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 4px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: #f0ede8;
        }

        .nav-item.active {
          background: rgba(232,201,122,0.1);
          color: #e8c97a;
        }

        .nav-icon {
          width: 18px;
          height: 18px;
          opacity: 0.7;
        }

        .sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 20px;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,100,100,0.7);
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.2s ease;
          font-family: 'Syne', sans-serif;
        }

        .logout-btn:hover {
          background: rgba(255,80,80,0.08);
          color: #ff6464;
        }

        /* ── MAIN ── */
        .main {
          flex: 1;
          overflow-y: auto;
          padding: 40px 48px;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 40px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #f0ede8;
          line-height: 1;
        }

        .page-subtitle {
          font-size: 13px;
          color: rgba(240,237,232,0.35);
          margin-top: 6px;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
        }

        .header-date {
          font-size: 12px;
          color: rgba(240,237,232,0.3);
          font-family: 'DM Mono', monospace;
          text-align: right;
        }

        /* ── STAT CARDS ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 48px;
        }

        .stat-card {
          background: #0e0e18;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .stat-card:hover {
          border-color: rgba(255,255,255,0.13);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 120px; height: 120px;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0.15;
          pointer-events: none;
        }

        .stat-card.gold::before  { background: #e8c97a; }
        .stat-card.blue::before  { background: #7ac5e8; }
        .stat-card.purple::before { background: #c97ae8; }

        .stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 16px;
        }

        .stat-icon.gold   { background: rgba(232,201,122,0.12); color: #e8c97a; }
        .stat-icon.blue   { background: rgba(122,197,232,0.12); color: #7ac5e8; }
        .stat-icon.purple { background: rgba(201,122,232,0.12); color: #c97ae8; }

        .stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(240,237,232,0.35);
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #f0ede8;
          line-height: 1;
          margin-bottom: 16px;
        }

        .stat-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 500;
        }

        .stat-badge.gold   { background: rgba(232,201,122,0.1); color: #e8c97a; }
        .stat-badge.blue   { background: rgba(122,197,232,0.1); color: #7ac5e8; }
        .stat-badge.neutral { background: rgba(255,255,255,0.06); color: rgba(240,237,232,0.5); }

        /* Progress bar */
        .progress-bar-wrap {
          margin-top: 16px;
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 99px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #7ac5e8, #c97ae8);
          transition: width 1s cubic-bezier(0.4,0,0.2,1);
        }

        /* ── SECTION HEADER ── */
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.3px;
          color: #f0ede8;
        }

        .section-count {
          font-size: 12px;
          font-family: 'DM Mono', monospace;
          color: rgba(240,237,232,0.3);
        }

        /* ── CREDIT CARDS ── */
        .cards-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
        }

        .credit-card-wrap {
          perspective: 1000px;
          cursor: pointer;
        }

        .credit-card {
          width: 340px;
          height: 200px;
          border-radius: 20px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease;
          transform-style: preserve-3d;
        }

        .credit-card:hover {
          transform: translateY(-8px) rotateX(4deg);
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }

        .credit-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top right, rgba(255,255,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .credit-card::after {
          content: '';
          position: absolute;
          bottom: -40px; right: -40px;
          width: 180px; height: 180px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.07);
          pointer-events: none;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .card-bank {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.9);
        }

        .card-chip {
          width: 32px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.2);
          background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
        }

        .card-number {
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          font-weight: 400;
          letter-spacing: 3px;
          color: rgba(255,255,255,0.5);
        }

        .card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .card-field-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 4px;
        }

        .card-field-value {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
        }

        .card-accent-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
        }

        /* Add card button */
        .add-card {
          width: 340px;
          height: 200px;
          border-radius: 20px;
          border: 1px dashed rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .add-card:hover {
          border-color: rgba(232,201,122,0.3);
          background: rgba(232,201,122,0.04);
          transform: translateY(-4px);
        }

        .add-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: rgba(240,237,232,0.4);
          transition: all 0.25s ease;
        }

        .add-card:hover .add-card-icon {
          border-color: rgba(232,201,122,0.4);
          color: #e8c97a;
        }

        .add-card-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,237,232,0.35);
          letter-spacing: 0.3px;
          transition: color 0.25s ease;
        }

        .add-card:hover .add-card-label {
          color: rgba(232,201,122,0.8);
        }

        /* Loading skeleton */
        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 20px;
          width: 340px;
          height: 200px;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="dashboard-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-dot" />
            Financer
          </div>

          <div className="nav-label">Menu</div>

          <a href="/settings" className="nav-item active">
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </a>

          <a href="/add-new" className="nav-item">
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            New Card
          </a>

          <a href="/settings" className="nav-item">
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Transactions
          </a>

          <a href="/settings" className="nav-item">
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            Settings
          </a>

          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={logout}>
              <svg
                style={{ width: 16, height: 16 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-title">Overview</div>
              <div className="page-subtitle">All your cards in one place</div>
            </div>
            <div className="header-date">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          {/* STATS */}
          <div className="stats-grid">
            {/* Active Cards */}
            <div className="stat-card gold">
              <div className="stat-icon gold">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div className="stat-label">Active Cards</div>
              <div className="stat-value">{cards.length}</div>
              <span className="stat-badge gold">↑ {cards.length} linked</span>
            </div>

            {/* Total Credit */}
            <div className="stat-card blue">
              <div className="stat-icon blue">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-label">Total Credit Limit</div>
              <div
                className="stat-value"
                style={{ fontSize: totalCredit > 999999 ? "22px" : "30px" }}
              >
                {formatter.format(totalCredit)}
              </div>
              <div>
                <span className="stat-badge blue">
                  {usagePercent}% utilized
                </span>
                <div className="progress-bar-wrap">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Monthly Due */}
            <div className="stat-card purple">
              <div className="stat-icon purple">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="stat-label">Monthly Due</div>
              <div
                className="stat-value"
                style={{ fontSize: totalDue > 999999 ? "22px" : "30px" }}
              >
                {formatter.format(totalDue)}
              </div>
              <span className="stat-badge neutral">Next due: —</span>
            </div>
          </div>

          {/* CARDS SECTION */}
          <div className="section-header">
            <div className="section-title">Your Cards</div>
            <div className="section-count">
              {cards.length} card{cards.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="cards-grid">
            {loading ? (
              <>
                <div className="skeleton" />
                <div className="skeleton" style={{ opacity: 0.6 }} />
              </>
            ) : (
              cards.map((card, index) => {
                const accent = cardAccents[index % cardAccents.length];
                return (
                  <div
                    key={card.id}
                    className="credit-card-wrap"
                    onClick={() =>
                      setActiveCard(activeCard === card.id ? null : card.id)
                    }
                  >
                    <div
                      className="credit-card"
                      style={{
                        background: cardGradients[index % cardGradients.length],
                      }}
                    >
                      <div className="card-top">
                        <div className="card-bank">{card.bank}</div>
                        <div className="card-chip" />
                      </div>

                      <div className="card-number">{card.card_number}</div>

                      <div className="card-bottom">
                        <div>
                          <div className="card-field-label">Card Holder</div>
                          <div className="card-field-value">
                            {card.card_holder}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="card-field-label">Expires</div>
                          <div className="card-field-value">{card.expires}</div>
                        </div>
                      </div>

                      <div
                        className="card-accent-bar"
                        style={{
                          background: `linear-gradient(90deg, ${accent}44, ${accent})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            {/* Add Card */}
            <a href="/add-new" className="add-card">
              <div className="add-card-icon">+</div>
              <div className="add-card-label">New Card</div>
            </a>
          </div>
        </main>
      </div>
    </>
  );
}
