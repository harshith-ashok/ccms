/* eslint-disable @typescript-eslint/no-explicit-any */
// npm install react-chartjs-2 chart.js   (if not already installed)
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Card {
  id: number;
  bank: string;
  card_number: string;
  card_holder: string;
  expires: string;
  credit_limit: number;
  monthly_due: number;
}

interface Transaction {
  id: number;
  type: "debit" | "credit";
  amount: number;
  description: string;
  category: string;
  transaction_date: string;
  bank: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTHS[d.getMonth()],
    };
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  Shopping: "#f59e0b",
  Food: "#10b981",
  Travel: "#3b82f6",
  Bills: "#8b5cf6",
  Entertainment: "#ec4899",
  Payment: "#14b8a6",
  Other: "#6b7280",
};

const FALLBACK_COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#6b7280",
  "#f97316",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const firstName = localStorage.getItem("first_name");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Cards
    fetch("http://localhost:8120/cards", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setCards)
      .catch(() => navigate("/login"))
      .finally(() => setLoadingCards(false));

    // Transactions
    fetch("http://localhost:8120/transactions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const totalCredit = cards.reduce((s, c) => s + Number(c.credit_limit), 0);
  const totalDue = cards.reduce((s, c) => s + Number(c.monthly_due), 0);
  const usagePercent =
    totalCredit > 0 ? Math.round((totalDue / totalCredit) * 100) : 0;

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const spentThisMonth = transactions
    .filter(
      (t) =>
        t.type === "debit" && getMonthKey(t.transaction_date) === thisMonthKey,
    )
    .reduce((s, t) => s + Number(t.amount), 0);

  // Per-card utilisation: sum debits for each card's bank this month
  const spentPerBank: Record<string, number> = {};
  transactions
    .filter(
      (t) =>
        t.type === "debit" && getMonthKey(t.transaction_date) === thisMonthKey,
    )
    .forEach((t) => {
      spentPerBank[t.bank] = (spentPerBank[t.bank] ?? 0) + Number(t.amount);
    });

  // Last 5 transactions
  const lastFive = transactions.slice(0, 5);

  // ── Pie: category breakdown (debits) ──────────────────────────────────────

  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "debit")
    .forEach((t) => {
      categoryTotals[t.category] =
        (categoryTotals[t.category] ?? 0) + Number(t.amount);
    });

  const pieLabels = Object.keys(categoryTotals);
  const pieValues = Object.values(categoryTotals);
  const pieColors = pieLabels.map(
    (l, i) => CATEGORY_COLORS[l] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  );

  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieValues,
        backgroundColor: pieColors.map((c) => c + "cc"),
        borderColor: pieColors,
        borderWidth: 1,
        hoverOffset: 6,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${formatter.format(ctx.raw)}`,
        },
        backgroundColor: "#0e0e18",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        titleColor: "#a1a1aa",
        bodyColor: "#f4f4f5",
        padding: 10,
      },
    },
  } as const;

  // ── Line: credit vs debit per month ───────────────────────────────────────

  const last6 = getLast6Months();

  const creditByMonth: Record<string, number> = {};
  const debitByMonth: Record<string, number> = {};
  transactions.forEach((t) => {
    const k = getMonthKey(t.transaction_date);
    if (t.type === "credit")
      creditByMonth[k] = (creditByMonth[k] ?? 0) + Number(t.amount);
    else debitByMonth[k] = (debitByMonth[k] ?? 0) + Number(t.amount);
  });

  const lineData = {
    labels: last6.map((m) => m.label),
    datasets: [
      {
        label: "Credit",
        data: last6.map((m) => creditByMonth[m.key] ?? 0),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.08)",
        pointBackgroundColor: "#10b981",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Debit",
        data: last6.map((m) => debitByMonth[m.key] ?? 0),
        borderColor: "#f87171",
        backgroundColor: "rgba(248,113,113,0.08)",
        pointBackgroundColor: "#f87171",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ` ${ctx.dataset.label}: ${formatter.format(ctx.raw)}`,
        },
        backgroundColor: "#0e0e18",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        titleColor: "#a1a1aa",
        bodyColor: "#f4f4f5",
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#52525b", font: { size: 11, family: "monospace" } },
        border: { color: "transparent" },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#52525b",
          font: { size: 11, family: "monospace" },
          callback: (v: any) =>
            "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v),
        },
        border: { color: "transparent" },
      },
    },
  } as const;

  // ── Card styles ────────────────────────────────────────────────────────────

  const cardGradients = [
    "from-slate-900 via-[#16213e] to-[#0f3460]",
    "from-slate-900 via-[#1b2838] to-[#1e3a5f]",
    "from-[#1a0a2e] via-[#2d1b4e] to-[#3d2060]",
    "from-[#0a1628] via-[#0d2137] to-[#0e3251]",
  ];
  const cardAccents = [
    "from-yellow-400/20 to-yellow-400",
    "from-sky-400/20 to-sky-400",
    "from-violet-400/20 to-violet-400",
    "from-teal-400/20 to-teal-400",
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[#09090f] text-zinc-100 font-sans">
      {/* ── SIDEBAR ── */}
      <aside className="w-60 shrink-0 flex flex-col bg-[#0e0e18] border-r border-white/[0.06] px-5 py-8 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-2 mb-12">
          <div className="w-2 h-2 rounded-full animate-pulse bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]" />
          <span className="text-lg font-bold tracking-tight">Financer</span>
        </div>

        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-600 px-2 mb-3">
          Menu
        </p>

        <nav className="flex flex-col gap-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-amber-400/10 text-amber-400"
          >
            <svg
              className="w-[18px] h-[18px] shrink-0"
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
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-100 transition-colors duration-150"
          >
            <svg
              className="w-[18px] h-[18px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Reports
          </Link>
          <Link
            to="/add-new"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-100 transition-colors duration-150"
          >
            <svg
              className="w-[18px] h-[18px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            New Card
          </Link>
          <Link
            to="/transactions"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-100 transition-colors duration-150"
          >
            <svg
              className="w-[18px] h-[18px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
            Transactions
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-100 transition-colors duration-150"
          >
            <svg
              className="w-[18px] h-[18px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Settings
          </Link>
        </nav>

        <div className="mt-auto pt-5 border-t border-white/[0.06]">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors duration-150 w-full text-left"
          >
            <svg
              className="w-[18px] h-[18px] shrink-0"
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

      {/* ── MAIN ── */}
      <main className="flex-1 px-12 py-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-[2rem] font-extrabold tracking-tight leading-none text-zinc-100">
              👋 Hello, {firstName}
            </h1>
            <p className="text-sm uppercase text-zinc-500 mt-1.5 font-mono font-light">
              All your cards in one place
            </p>
          </div>
          <span className="text-xs text-zinc-600 font-mono">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* ── TOP STAT CARDS ── */}
        <div className="grid grid-cols-4 gap-5 mb-10">
          {/* Active Cards */}
          <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-6 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-amber-400 opacity-10 blur-[50px] pointer-events-none" />
            <div className="w-8 h-8 rounded-[10px] bg-amber-400/10 flex items-center justify-center mb-4">
              <svg
                className="w-4 h-4 text-amber-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-1">
              Active Cards
            </p>
            <p className="text-3xl font-extrabold tracking-tight text-zinc-100 leading-none mb-3">
              {cards.length}
            </p>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400">
              {cards.length} linked
            </span>
          </div>

          {/* Total Credit */}
          <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-6 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-sky-400 opacity-10 blur-[50px] pointer-events-none" />
            <div className="w-8 h-8 rounded-[10px] bg-sky-400/10 flex items-center justify-center mb-4">
              <svg
                className="w-4 h-4 text-sky-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-1">
              Total Credit
            </p>
            <p className="text-2xl font-extrabold tracking-tight text-zinc-100 leading-none mb-2">
              {formatter.format(totalCredit)}
            </p>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-sky-400/10 text-sky-400">
              {usagePercent}% utilized
            </span>
            <div className="mt-2 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-[width] duration-700"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {/* Min Due */}
          <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-6 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-violet-400 opacity-10 blur-[50px] pointer-events-none" />
            <div className="w-8 h-8 rounded-[10px] bg-violet-400/10 flex items-center justify-center mb-4">
              <svg
                className="w-4 h-4 text-violet-400"
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
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-1">
              Min. Due
            </p>
            <p className="text-2xl font-extrabold tracking-tight text-zinc-100 leading-none mb-2">
              {formatter.format(totalDue)}
            </p>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/[0.06] text-zinc-500">
              across {cards.length} card{cards.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Spent This Month */}
          <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-6 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-rose-400 opacity-10 blur-[50px] pointer-events-none" />
            <div className="w-8 h-8 rounded-[10px] bg-rose-400/10 flex items-center justify-center mb-4">
              <svg
                className="w-4 h-4 text-rose-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19,12 12,19 5,12" />
              </svg>
            </div>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-1">
              Spent This Month
            </p>
            <p className="text-2xl font-extrabold tracking-tight text-zinc-100 leading-none mb-2">
              {formatter.format(spentThisMonth)}
            </p>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-rose-400/10 text-rose-400">
              {MONTHS[now.getMonth()]} {now.getFullYear()}
            </span>
          </div>
        </div>

        {/* ── CREDIT CARDS ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">
            Your Cards
          </h2>
          <span className="text-xs font-mono text-zinc-600">
            {cards.length} card{cards.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-wrap gap-6 mb-10">
          {loadingCards ? (
            <>
              <div className="w-[320px] h-[190px] rounded-[20px] bg-white/[0.04] animate-pulse" />
              <div className="w-[320px] h-[190px] rounded-[20px] bg-white/[0.04] animate-pulse opacity-60" />
            </>
          ) : (
            cards.map((card, index) => {
              // Per-card utilisation
              const spent = spentPerBank[card.bank] ?? 0;
              const limit = Number(card.credit_limit);
              const utilPct =
                limit > 0
                  ? Math.min(100, Math.round((spent / limit) * 100))
                  : 0;
              const utilColor =
                utilPct >= 80
                  ? "from-rose-500 to-rose-400"
                  : utilPct >= 50
                    ? "from-amber-500 to-amber-400"
                    : "from-sky-500 to-violet-500";

              return (
                <div key={card.id} className="flex flex-col gap-2">
                  {/* Card face */}
                  <div
                    className={`relative w-[320px] h-[185px] rounded-[20px] bg-gradient-to-br ${cardGradients[index % cardGradients.length]} border border-white/[0.07] p-6 flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-300`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full border border-white/[0.07] pointer-events-none" />

                    <div className="flex items-start justify-between relative">
                      <span className="text-sm font-bold text-white/90 tracking-wide">
                        {card.bank}
                      </span>
                      <div className="w-8 h-5 rounded bg-white/10 border border-white/20" />
                    </div>
                    <p className="font-mono text-[14px] tracking-[0.2em] text-white/40 relative">
                      {card.card_number}
                    </p>
                    <div className="flex items-end justify-between relative">
                      <div>
                        <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-1">
                          Card Holder
                        </p>
                        <p className="text-[13px] font-semibold text-white/85">
                          {card.card_holder}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-1">
                          Expires
                        </p>
                        <p className="text-[13px] font-semibold text-white/85">
                          {card.expires}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${cardAccents[index % cardAccents.length]}`}
                    />
                  </div>

                  {/* Per-card utilisation bar */}
                  <div className="w-[320px] bg-[#0e0e18] border border-white/[0.07] rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-zinc-500">
                        This month
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {formatter.format(spent)}{" "}
                        <span className="text-zinc-600">
                          / {formatter.format(limit)}
                        </span>
                      </span>
                    </div>
                    <div className="h-[4px] rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${utilColor} transition-[width] duration-700`}
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-mono text-zinc-600">
                        {utilPct}% utilized
                      </span>
                      <span className="text-[10px] font-mono text-violet-400">
                        Min due: {formatter.format(card.monthly_due)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Add card */}
          <Link
            to="/add-new"
            className="w-[320px] h-[185px] rounded-[20px] border border-dashed border-white/[0.12] bg-white/[0.02] flex flex-col items-center justify-center gap-3 hover:border-amber-400/30 hover:bg-amber-400/[0.04] transition-all duration-300 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full border border-white/[0.12] flex items-center justify-center text-[22px] text-zinc-600 group-hover:border-amber-400/40 group-hover:text-amber-400 transition-all duration-300">
              +
            </div>
            <span className="text-[13px] font-semibold text-zinc-600 group-hover:text-amber-400/80 transition-colors duration-300">
              New Card
            </span>
          </Link>
        </div>

        {/* ── CHARTS + LAST 5 TX ── */}
        <div className="grid grid-cols-5 gap-6 mb-10">
          {/* Line chart — 3 cols */}
          <div className="col-span-3 relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-6 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-400 opacity-[0.05] blur-[60px] pointer-events-none" />
            <div className="flex items-center justify-between mb-5 relative">
              <div>
                <p className="text-sm font-bold text-zinc-100">
                  Credit vs Debit
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Last 6 months
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-mono text-zinc-500">
                    Credit
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-[10px] font-mono text-zinc-500">
                    Debit
                  </span>
                </div>
              </div>
            </div>
            <div className="h-[220px]">
              {loadingTx ? (
                <div className="h-full rounded-xl bg-white/[0.03] animate-pulse" />
              ) : (
                <Line data={lineData} options={lineOptions} />
              )}
            </div>
          </div>

          {/* Pie chart — 2 cols */}
          <div className="col-span-2 relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-6 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-amber-400 opacity-[0.05] blur-[60px] pointer-events-none" />
            <div className="relative mb-4">
              <p className="text-sm font-bold text-zinc-100">
                Spending by Category
              </p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                All time debits
              </p>
            </div>

            {loadingTx ? (
              <div className="h-[160px] rounded-xl bg-white/[0.03] animate-pulse" />
            ) : pieLabels.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-xs text-zinc-600">
                No data yet
              </div>
            ) : (
              <>
                <div className="h-[150px] relative">
                  <Doughnut data={pieData} options={pieOptions} />
                </div>
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {pieLabels.map((label, i) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 min-w-0"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: pieColors[i] }}
                      />
                      <span className="text-[10px] font-mono text-zinc-500 truncate">
                        {label}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 ml-auto shrink-0">
                        {formatter.format(pieValues[i])}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── LAST 5 TRANSACTIONS ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">
            Recent Transactions
          </h2>
          <Link
            to="/transactions"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium font-mono transition-colors duration-150"
          >
            View all →
          </Link>
        </div>

        <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
          <div className="absolute top-0 right-0 w-48 h-24 rounded-full bg-amber-400 opacity-[0.03] blur-[50px] pointer-events-none" />

          {loadingTx ? (
            <div className="flex flex-col gap-3 p-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-white/[0.03] animate-pulse"
                  style={{ opacity: 1 - i * 0.2 }}
                />
              ))}
            </div>
          ) : lastFive.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-zinc-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">No transactions yet</p>
              <Link
                to="/transactions"
                className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Add one →
              </Link>
            </div>
          ) : (
            lastFive.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors duration-100"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${tx.type === "debit" ? "bg-red-400/10" : "bg-emerald-400/10"}`}
                  >
                    <svg
                      className={`w-4 h-4 ${tx.type === "debit" ? "text-red-400" : "text-emerald-400"}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {tx.type === "debit" ? (
                        <>
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <polyline points="19,12 12,19 5,12" />
                        </>
                      ) : (
                        <>
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5,12 12,5 19,12" />
                        </>
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/[0.07] text-amber-400/80">
                        {tx.category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-500">
                        {tx.bank}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {new Date(tx.transaction_date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <p
                  className={`font-mono font-semibold text-sm ${tx.type === "debit" ? "text-red-400" : "text-emerald-400"}`}
                >
                  {tx.type === "debit" ? "−" : "+"}{" "}
                  {formatter.format(tx.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
