/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
// npm install react-chartjs-2 chart.js  (if not already installed)
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
  BarElement,
  Filler,
} from "chart.js";
import { Doughnut, Line, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
);

// ─── Types ────────────────────────────────────────────────────────────────────

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

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    };
  });
}

function getLast12Months() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTHS[d.getMonth()],
    };
  });
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
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

const CARD_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#ec4899",
  "#14b8a6",
];

// Shared chart theme helpers
const tooltipDefaults = {
  backgroundColor: "#0e0e18",
  borderColor: "rgba(255,255,255,0.08)",
  borderWidth: 1,
  titleColor: "#a1a1aa",
  bodyColor: "#f4f4f5",
  padding: 12,
  cornerRadius: 10,
};

const axisDefaults = {
  grid: { color: "rgba(255,255,255,0.04)" },
  border: { color: "transparent" },
  ticks: { color: "#52525b", font: { size: 11, family: "monospace" } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Reports() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:8120/transactions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setTransactions)
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ── 1. Monthly spending trend (last 12 months, debits only) ───────────────
  const last12 = getLast12Months();
  const spendByMonth: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "debit")
    .forEach((t) => {
      const k = getMonthKey(t.transaction_date);
      spendByMonth[k] = (spendByMonth[k] ?? 0) + Number(t.amount);
    });

  const trendData = {
    labels: last12.map((m) => m.label),
    datasets: [
      {
        label: "Spending",
        data: last12.map((m) => spendByMonth[m.key] ?? 0),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.08)",
        pointBackgroundColor: "#f59e0b",
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults,
        callbacks: { label: (ctx: any) => ` ${formatter.format(ctx.raw)}` },
      },
    },
    scales: {
      x: { ...axisDefaults },
      y: {
        ...axisDefaults,
        ticks: {
          ...axisDefaults.ticks,
          callback: (v: any) =>
            "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v),
        },
      },
    },
  } as const;

  // ── 2. Credit vs Debit per month (last 6 months) ──────────────────────────
  const last6 = getLast6Months();
  const creditByMonth: Record<string, number> = {};
  const debitByMonth: Record<string, number> = {};
  transactions.forEach((t) => {
    const k = getMonthKey(t.transaction_date);
    if (t.type === "credit")
      creditByMonth[k] = (creditByMonth[k] ?? 0) + Number(t.amount);
    else debitByMonth[k] = (debitByMonth[k] ?? 0) + Number(t.amount);
  });

  const cvdData = {
    labels: last6.map((m) => m.label),
    datasets: [
      {
        label: "Credit",
        data: last6.map((m) => creditByMonth[m.key] ?? 0),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.08)",
        pointBackgroundColor: "#10b981",
        pointRadius: 4,
        pointHoverRadius: 7,
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
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const cvdOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx: any) =>
            ` ${ctx.dataset.label}: ${formatter.format(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: { ...axisDefaults },
      y: {
        ...axisDefaults,
        ticks: {
          ...axisDefaults.ticks,
          callback: (v: any) =>
            "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v),
        },
      },
    },
  } as const;

  // ── 3. Spending by category (doughnut, all-time debits) ───────────────────
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "debit")
    .forEach((t) => {
      categoryTotals[t.category] =
        (categoryTotals[t.category] ?? 0) + Number(t.amount);
    });

  const pieLabels = Object.keys(categoryTotals).sort(
    (a, b) => categoryTotals[b] - categoryTotals[a],
  );
  const pieValues = pieLabels.map((l) => categoryTotals[l]);
  const pieColors = pieLabels.map(
    (l, i) => CATEGORY_COLORS[l] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  );
  const totalSpend = pieValues.reduce((s, v) => s + v, 0);

  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieValues,
        backgroundColor: pieColors.map((c) => c + "cc"),
        borderColor: pieColors,
        borderWidth: 1.5,
        hoverOffset: 8,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx: any) => {
            const pct =
              totalSpend > 0 ? ((ctx.raw / totalSpend) * 100).toFixed(1) : 0;
            return ` ${formatter.format(ctx.raw)}  (${pct}%)`;
          },
        },
      },
    },
  } as const;

  // ── 4. Per-card spend comparison (bar, last 6 months) ─────────────────────
  const banks = [...new Set(transactions.map((t) => t.bank))];
  const spendPerBankPerMonth: Record<string, Record<string, number>> = {};
  transactions
    .filter((t) => t.type === "debit")
    .forEach((t) => {
      const k = getMonthKey(t.transaction_date);
      if (!spendPerBankPerMonth[t.bank]) spendPerBankPerMonth[t.bank] = {};
      spendPerBankPerMonth[t.bank][k] =
        (spendPerBankPerMonth[t.bank][k] ?? 0) + Number(t.amount);
    });

  const barData = {
    labels: last6.map((m) => m.label),
    datasets: banks.map((bank, i) => ({
      label: bank,
      data: last6.map((m) => spendPerBankPerMonth[bank]?.[m.key] ?? 0),
      backgroundColor: CARD_COLORS[i % CARD_COLORS.length] + "cc",
      borderColor: CARD_COLORS[i % CARD_COLORS.length],
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    })),
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx: any) =>
            ` ${ctx.dataset.label}: ${formatter.format(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: { ...axisDefaults, stacked: true },
      y: {
        ...axisDefaults,
        stacked: true,
        ticks: {
          ...axisDefaults.ticks,
          callback: (v: any) =>
            "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v),
        },
      },
    },
  } as const;

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalCredit = transactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = transactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const topCategory = pieLabels[0] ?? "—";

  // ── Shared skeleton ────────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="h-full w-full rounded-xl bg-white/[0.03] animate-pulse" />
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[#09090f] text-zinc-100 font-sans">
      {/* ── SIDEBAR ── */}
      <aside className="w-60 shrink-0 flex flex-col bg-[#0e0e18] border-r border-white/[0.06] px-5 py-8 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-2 mb-12">
          <div className="animate-pulse w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]" />
          <span className="text-lg font-bold tracking-tight">Financer</span>
        </div>

        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-600 px-2 mb-3">
          Menu
        </p>

        <nav className="flex flex-col gap-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-100 transition-colors duration-150"
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-amber-400/10 text-amber-400"
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
              Reports
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5 font-mono font-light">
              Visual breakdown of your finances
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

        {/* ── SUMMARY STATS ── */}
        <div className="grid grid-cols-4 gap-5 mb-10">
          {[
            {
              label: "Total Transactions",
              value: transactions.length.toString(),
              color: "amber",
              icon: (
                <>
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </>
              ),
            },
            {
              label: "Total Spent",
              value: formatter.format(totalDebit),
              color: "red",
              icon: (
                <>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19,12 12,19 5,12" />
                </>
              ),
            },
            {
              label: "Total Received",
              value: formatter.format(totalCredit),
              color: "emerald",
              icon: (
                <>
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5,12 12,5 19,12" />
                </>
              ),
            },
            {
              label: "Top Category",
              value: topCategory,
              color: "violet",
              icon: (
                <>
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </>
              ),
            },
          ].map(({ label, value, color, icon }) => (
            <div
              key={label}
              className={`relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-6 overflow-hidden hover:border-white/[0.13] transition-colors duration-200`}
            >
              <div
                className={`absolute top-0 right-0 w-28 h-28 rounded-full opacity-10 blur-[50px] pointer-events-none bg-${color}-400`}
              />
              <div
                className={`w-8 h-8 rounded-[10px] bg-${color}-400/10 flex items-center justify-center mb-4`}
              >
                <svg
                  className={`w-4 h-4 text-${color}-400`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {icon}
                </svg>
              </div>
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-1">
                {label}
              </p>
              <p className="text-xl font-extrabold tracking-tight text-zinc-100 leading-none truncate">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── ROW 1: Spending trend (wide) ── */}
        <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-7 mb-6 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
          <div className="absolute top-0 right-0 w-64 h-48 rounded-full bg-amber-400 opacity-[0.04] blur-[70px] pointer-events-none" />
          <div className="flex items-start justify-between mb-6 relative">
            <div>
              <p className="text-sm font-bold text-zinc-100">
                Monthly Spending Trend
              </p>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Debit transactions — last 12 months
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[10px] font-mono text-amber-400">
                Spending
              </span>
            </div>
          </div>
          <div className="h-[220px]">
            {loading ? (
              <Skeleton />
            ) : (
              <Line data={trendData} options={trendOptions} />
            )}
          </div>
        </div>

        {/* ── ROW 2: Credit vs Debit + Doughnut ── */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          {/* Credit vs Debit line — 3 cols */}
          <div className="col-span-3 relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-7 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-400 opacity-[0.04] blur-[60px] pointer-events-none" />
            <div className="flex items-start justify-between mb-6 relative">
              <div>
                <p className="text-sm font-bold text-zinc-100">
                  Credit vs Debit
                </p>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Last 6 months
                </p>
              </div>
              <div className="flex items-center gap-4">
                {[
                  { color: "#10b981", label: "Credit" },
                  { color: "#f87171", label: "Debit" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="text-[10px] font-mono text-zinc-500">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[220px]">
              {loading ? (
                <Skeleton />
              ) : (
                <Line data={cvdData} options={cvdOptions} />
              )}
            </div>
          </div>

          {/* Doughnut — 2 cols */}
          <div className="col-span-2 relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-7 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-violet-400 opacity-[0.04] blur-[60px] pointer-events-none" />
            <div className="relative mb-4">
              <p className="text-sm font-bold text-zinc-100">
                Spending by Category
              </p>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                All-time debits
              </p>
            </div>

            {loading ? (
              <div className="h-[220px]">
                <Skeleton />
              </div>
            ) : pieLabels.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-zinc-600">
                No data yet
              </div>
            ) : (
              <div className="flex gap-5 items-center">
                {/* Chart */}
                <div
                  className="relative shrink-0"
                  style={{ width: 140, height: 140 }}
                >
                  <Doughnut data={pieData} options={pieOptions} />
                  {/* Centre label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-zinc-600 font-mono">Total</p>
                    <p className="text-xs font-bold text-zinc-200">
                      {formatter.format(totalSpend)}
                    </p>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  {pieLabels.map((label, i) => {
                    const pct =
                      totalSpend > 0
                        ? ((pieValues[i] / totalSpend) * 100).toFixed(1)
                        : "0";
                    return (
                      <div
                        key={label}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: pieColors[i] }}
                        />
                        <span className="text-[11px] text-zinc-400 truncate flex-1">
                          {label}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 3: Per-card bar (full width) ── */}
        <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-7 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
          <div className="absolute top-0 left-0 w-64 h-48 rounded-full bg-sky-400 opacity-[0.04] blur-[70px] pointer-events-none" />
          <div className="flex items-start justify-between mb-6 relative">
            <div>
              <p className="text-sm font-bold text-zinc-100">
                Per-Card Spend Comparison
              </p>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Stacked debit spend by card — last 6 months
              </p>
            </div>
            {/* Dynamic legend */}
            <div className="flex items-center gap-4 flex-wrap justify-end">
              {banks.map((bank, i) => (
                <div key={bank} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: CARD_COLORS[i % CARD_COLORS.length] }}
                  />
                  <span className="text-[10px] font-mono text-zinc-500">
                    {bank}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[240px]">
            {loading ? (
              <Skeleton />
            ) : banks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-600">
                No data yet
              </div>
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
