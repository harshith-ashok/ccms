/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface Card {
  id: number;
  bank: string;
  card_number: string;
  card_holder: string;
  expires: string;
}

type ToastType = "success" | "error" | null;

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";

  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [confirmReset, setConfirmReset] = useState<"hard" | "monthly" | null>(
    null,
  );
  const [resetLoading, setResetLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: ToastType }>({
    msg: "",
    type: null,
  });

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: null }), 3500);
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ── Fetch cards ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetch("http://localhost:8120/cards", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setCards)
      .catch(() => showToast("Failed to load cards", "error"))
      .finally(() => setLoadingCards(false));
  }, []);

  // ── Delete card ────────────────────────────────────────────────────────────
  const deleteCard = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`http://localhost:8120/cards/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setCards((prev) => prev.filter((c) => c.id !== id));
      showToast("Card removed successfully", "success");
    } catch {
      showToast("Failed to delete card", "error");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // ── Update profile ─────────────────────────────────────────────────────────
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch("http://localhost:8120/settings/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          first_name: firstName,
          current_password: currentPassword,
          new_password: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      showToast(data.message || "Profile updated", "success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      showToast(err.message || "Update failed", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Hard reset ─────────────────────────────────────────────────────────────
  const hardReset = async () => {
    setResetLoading(true);
    try {
      const res = await fetch("http://localhost:8120/settings/hard-reset", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      showToast("All transactions deleted", "success");
    } catch {
      showToast("Reset failed", "error");
    } finally {
      setResetLoading(false);
      setConfirmReset(null);
    }
  };

  // ── Reset monthly ──────────────────────────────────────────────────────────
  const resetMonthly = async () => {
    setResetLoading(true);
    try {
      const res = await fetch("http://localhost:8120/settings/reset-monthly", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      showToast("Monthly usage reset complete", "success");
    } catch {
      showToast("Reset failed", "error");
    } finally {
      setResetLoading(false);
      setConfirmReset(null);
    }
  };

  // ── Insert demo data ───────────────────────────────────────────────────────
  const insertDemoData = async () => {
    if (cards.length === 0) {
      showToast("Add at least one card first", "error");
      return;
    }
    setDemoLoading(true);

    const categories = [
      "Shopping",
      "Food",
      "Travel",
      "Bills",
      "Entertainment",
      "Payment",
      "Other",
    ];
    const descriptions: Record<string, string[]> = {
      Shopping: [
        "Amazon Purchase",
        "Flipkart Order",
        "DMart Grocery",
        "Reliance Trends",
        "Myntra",
      ],
      Food: [
        "Swiggy Order",
        "Zomato Delivery",
        "Restaurant Dinner",
        "Cafe Coffee Day",
        "Dominos",
      ],
      Travel: [
        "Uber Ride",
        "Ola Cab",
        "IRCTC Train",
        "IndiGo Flight",
        "Metro Recharge",
      ],
      Bills: [
        "Electricity Bill",
        "Mobile Recharge",
        "DTH Recharge",
        "Internet Bill",
        "Gas Bill",
      ],
      Entertainment: [
        "Netflix Subscription",
        "Spotify Premium",
        "Movie Tickets",
        "BookMyShow",
        "Gaming",
      ],
      Payment: [
        "Credit Card Payment",
        "EMI Payment",
        "Loan Repayment",
        "Insurance Premium",
      ],
      Other: [
        "ATM Withdrawal",
        "Bank Transfer",
        "Miscellaneous",
        "Online Payment",
      ],
    };

    // Generate 20 random transactions spread across the last 6 months
    const now = new Date();
    const txList = Array.from({ length: 20 }, (_, i) => {
      const card = cards[i % cards.length];
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const descPool = descriptions[category];
      const desc = descPool[Math.floor(Math.random() * descPool.length)];
      const type =
        category === "Payment"
          ? "credit"
          : Math.random() > 0.15
            ? "debit"
            : "credit";
      const amount = Math.floor(Math.random() * 4900) + 100; // ₹100–₹5000

      // Random date in the last 6 months
      const daysAgo = Math.floor(Math.random() * 180);
      const txDate = new Date(now);
      txDate.setDate(txDate.getDate() - daysAgo);
      const dateStr = txDate.toISOString().split("T")[0];

      return {
        card_id: card.id,
        type,
        amount,
        description: desc,
        category,
        date: dateStr,
      };
    });

    // Fire all inserts in parallel
    try {
      const results = await Promise.allSettled(
        txList.map((tx) =>
          fetch("http://localhost:8120/transactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: tx.type,
              amount: tx.amount,
              description: tx.description,
              category: tx.category,
              card_id: tx.card_id,
              date: tx.date,
            }),
          }),
        ),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      showToast(`${succeeded} demo transactions inserted`, "success");
    } catch {
      showToast("Failed to insert demo data", "error");
    } finally {
      setDemoLoading(false);
    }
  };

  const inputCls =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10 transition-colors duration-150";

  return (
    <div className="flex min-h-screen bg-[#09090f] text-zinc-100 font-sans">
      {/* ── TOAST ── */}
      {toast.type && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl text-sm font-medium transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
              : "bg-red-400/10 border-red-400/20 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20,6 9,17 4,12" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* ── CONFIRM MODAL ── */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="relative w-full max-w-sm bg-[#0e0e18] border border-white/[0.08] rounded-[18px] overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-red-400 opacity-[0.05] blur-[60px] pointer-events-none" />
            <div className="p-7 relative">
              <div className="w-10 h-10 rounded-[10px] bg-red-400/10 flex items-center justify-center mb-5">
                <svg
                  className="w-5 h-5 text-red-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <p className="text-base font-bold text-zinc-100 mb-2">
                {confirmReset === "hard"
                  ? "Delete All Transactions?"
                  : "Reset Monthly Usage?"}
              </p>
              <p className="text-sm text-zinc-500 mb-7">
                {confirmReset === "hard"
                  ? "This will permanently delete every transaction. This cannot be undone."
                  : "This will reset the monthly spending counters for all cards."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmReset === "hard" ? hardReset : resetMonthly}
                  disabled={resetLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 disabled:opacity-50 transition-colors duration-150"
                >
                  {resetLoading ? "Processing..." : "Yes, continue"}
                </button>
                <button
                  onClick={() => setConfirmReset(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-sm font-medium hover:text-zinc-100 hover:border-white/[0.15] transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-amber-400/10 text-amber-400"
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
              Settings
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5 font-mono font-light">
              Manage your account and cards
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

        <div className="grid grid-cols-5 gap-8 items-start">
          {/* ── LEFT COLUMN ── */}
          <div className="col-span-3 space-y-6">
            {/* ── MANAGE CARDS ── */}
            <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-400 opacity-[0.05] blur-[60px] pointer-events-none" />
              <div className="px-7 py-5 border-b border-white/[0.06] flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] bg-amber-400/10 flex items-center justify-center">
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
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      Manage Cards
                    </p>
                    <p className="text-xs text-zinc-500 font-mono font-light">
                      Remove cards from your account
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-600">
                  {cards.length} card{cards.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="p-4">
                {loadingCards ? (
                  <div className="flex flex-col gap-2 p-3">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className="h-14 rounded-xl bg-white/[0.03] animate-pulse"
                        style={{ opacity: 1 - i * 0.3 }}
                      />
                    ))}
                  </div>
                ) : cards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <p className="text-sm text-zinc-500">No cards added yet</p>
                    <Link
                      to="/add-new"
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      Add your first card →
                    </Link>
                  </div>
                ) : (
                  cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white/[0.02] transition-colors duration-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                          <svg
                            className="w-3.5 h-3.5 text-zinc-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="1" y="4" width="22" height="16" rx="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-200">
                            {card.bank}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-600">
                            {card.card_number} · Exp {card.expires}
                          </p>
                        </div>
                      </div>

                      {confirmDeleteId === card.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500 mr-1">
                            Sure?
                          </span>
                          <button
                            onClick={() => deleteCard(card.id)}
                            disabled={deletingId === card.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all duration-150"
                          >
                            {deletingId === card.id ? "..." : "Delete"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-all duration-150"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(card.id)}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all duration-150"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── UPDATE PROFILE ── */}
            <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-sky-400 opacity-[0.05] blur-[60px] pointer-events-none" />
              <div className="px-7 py-5 border-b border-white/[0.06] flex items-center gap-3 relative">
                <div className="w-8 h-8 rounded-[10px] bg-sky-400/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-sky-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    Update Profile
                  </p>
                  <p className="text-xs text-zinc-500 font-mono font-light">
                    Change your name, username or password
                  </p>
                </div>
              </div>

              <form onSubmit={updateProfile} className="p-7 space-y-4 relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="new_username"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-4 space-y-4">
                  <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Change Password
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                        New Password{" "}
                        <span className="text-zinc-600 normal-case tracking-normal">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-2.5 rounded-xl bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_28px_rgba(251,191,36,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {profileLoading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="col-span-2 space-y-5">
            {/* ── DANGER ZONE ── */}
            <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-red-500 opacity-[0.05] blur-[60px] pointer-events-none" />
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3 relative">
                <div className="w-8 h-8 rounded-[10px] bg-red-400/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    Danger Zone
                  </p>
                  <p className="text-xs text-zinc-500 font-mono font-light">
                    Irreversible actions
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4 relative">
                {/* Hard reset */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-red-500/[0.04] border border-red-500/[0.12]">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100 mb-1">
                      Delete All Transactions
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Permanently removes every transaction record. Cannot be
                      undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmReset("hard")}
                    className="shrink-0 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all duration-150"
                  >
                    Delete
                  </button>
                </div>

                {/* Monthly reset */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-orange-500/[0.04] border border-orange-500/[0.12]">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100 mb-1">
                      Reset Monthly Usage
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Resets spending counters for the current month across all
                      cards.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmReset("monthly")}
                    className="shrink-0 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs font-bold text-orange-400 hover:bg-orange-500/20 transition-all duration-150"
                  >
                    Reset
                  </button>
                </div>

                {/* Demo data */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/[0.12]">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100 mb-1">
                      Insert Demo Data
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Adds 20 random transactions across your cards over the
                      last 6 months.
                    </p>
                  </div>
                  <button
                    onClick={insertDemoData}
                    disabled={demoLoading || cards.length === 0}
                    className="shrink-0 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    {demoLoading ? (
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="w-3 h-3 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        Inserting...
                      </span>
                    ) : (
                      "Insert"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── ACCOUNT INFO ── */}
            <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-6 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-400 opacity-[0.05] blur-[50px] pointer-events-none" />
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">
                About
              </p>
              <div className="space-y-3">
                {[
                  { label: "App", value: "Financer" },
                  { label: "Cards", value: `${cards.length} linked` },
                  { label: "Version", value: "1.0.0" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-zinc-500">{label}</span>
                    <span className="text-xs font-mono text-zinc-400">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
