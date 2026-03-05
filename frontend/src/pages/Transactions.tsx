import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Transaction = {
  id: number;
  type: "debit" | "credit";
  amount: number;
  description: string;
  category: string;
  transaction_date: string;
  bank: string;
};

type Card = {
  id: number;
  bank: string;
  card_number: string;
  card_holder: string;
  expires: string;
};

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    type: "debit" as "debit" | "credit",
    amount: "",
    description: "",
    category: "Shopping",
    customCategory: "",
  });

  const categories = [
    "Shopping",
    "Food",
    "Travel",
    "Bills",
    "Entertainment",
    "Payment",
    "Other",
  ];

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      try {
        const response = await fetch("http://localhost:8120/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Unauthorized");
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        console.error(err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [navigate]);

  // Fetch cards lazily when modal first opens
  const openModal = async () => {
    setShowModal(true);
    if (cards.length > 0) return;
    setCardsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:8120/cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch cards");
      const data: Card[] = await response.json();
      setCards(data);
      if (data.length > 0) setSelectedCardId(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setCardsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      type: "debit",
      amount: "",
      description: "",
      category: "Shopping",
      customCategory: "",
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId) return;
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    try {
      const response = await fetch("http://localhost:8120/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: formData.type,
          amount: Number(formData.amount),
          description: formData.description,
          category:
            formData.category === "Other"
              ? formData.customCategory
              : formData.category,
          card_id: selectedCardId,
        }),
      });
      if (!response.ok) throw new Error("Failed");
      const newTx = await response.json();
      setTransactions((prev) => [newTx, ...prev]);
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const totalSpent = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPaid = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const netFlow = totalPaid - totalSpent;

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10 transition-colors duration-150";

  return (
    <div className="flex min-h-screen bg-[#09090f] text-zinc-100 font-sans">
      {/* ── SIDEBAR ── */}
      <aside className="w-60 shrink-0 flex flex-col bg-[#0e0e18] border-r border-white/[0.06] px-5 py-8 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-2 mb-12">
          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]" />
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-amber-400/10 text-amber-400"
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
        {/* Page header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-[2rem] font-extrabold tracking-tight leading-none text-zinc-100">
              Transactions
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5 font-mono font-light">
              Track your recent activity
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_28px_rgba(251,191,36,0.35)] transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Transaction
            </button>
            <span className="text-xs text-zinc-600 font-mono">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-3 gap-5 mb-12">
          <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-7 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-red-400 opacity-10 blur-[50px] pointer-events-none" />
            <div className="w-9 h-9 rounded-[10px] bg-red-400/10 flex items-center justify-center mb-5">
              <svg
                className="w-4 h-4 text-red-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19,12 12,19 5,12" />
              </svg>
            </div>
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-2">
              Total Spent
            </p>
            <p className="text-[1.75rem] font-extrabold tracking-tight text-zinc-100 leading-none mb-4">
              {formatter.format(totalSpent)}
            </p>
            <span className="inline-flex items-center text-xs font-mono px-2.5 py-1 rounded-full bg-red-400/10 text-red-400">
              {transactions.filter((t) => t.type === "debit").length} debits
            </span>
          </div>

          <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-7 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-400 opacity-10 blur-[50px] pointer-events-none" />
            <div className="w-9 h-9 rounded-[10px] bg-emerald-400/10 flex items-center justify-center mb-5">
              <svg
                className="w-4 h-4 text-emerald-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5,12 12,5 19,12" />
              </svg>
            </div>
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-2">
              Total Paid
            </p>
            <p className="text-[1.75rem] font-extrabold tracking-tight text-zinc-100 leading-none mb-4">
              {formatter.format(totalPaid)}
            </p>
            <span className="inline-flex items-center text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400">
              {transactions.filter((t) => t.type === "credit").length} credits
            </span>
          </div>

          <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] p-7 overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div
              className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-[50px] pointer-events-none ${netFlow >= 0 ? "bg-sky-400" : "bg-orange-400"}`}
            />
            <div
              className={`w-9 h-9 rounded-[10px] flex items-center justify-center mb-5 ${netFlow >= 0 ? "bg-sky-400/10" : "bg-orange-400/10"}`}
            >
              <svg
                className={`w-4 h-4 ${netFlow >= 0 ? "text-sky-400" : "text-orange-400"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-2">
              Net Flow
            </p>
            <p className="text-[1.75rem] font-extrabold tracking-tight text-zinc-100 leading-none mb-4">
              {netFlow >= 0 ? "+" : ""}
              {formatter.format(netFlow)}
            </p>
            <span
              className={`inline-flex items-center text-xs font-mono px-2.5 py-1 rounded-full ${netFlow >= 0 ? "bg-sky-400/10 text-sky-400" : "bg-orange-400/10 text-orange-400"}`}
            >
              {netFlow >= 0 ? "Net positive" : "Net negative"}
            </span>
          </div>
        </div>

        {/* ── TRANSACTIONS LIST ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">
            All Transactions
          </h2>
          <span className="text-xs font-mono text-zinc-600">
            {transactions.length} record{transactions.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
          <div className="absolute top-0 right-0 w-64 h-32 rounded-full bg-amber-400 opacity-[0.03] blur-[60px] pointer-events-none" />

          {loading ? (
            <div className="flex flex-col gap-3 p-7">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-white/[0.03] animate-pulse"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-zinc-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">No transactions yet</p>
              <button
                onClick={openModal}
                className="mt-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Add your first transaction →
              </button>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-7 py-5 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors duration-100"
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
                    <div className="flex items-center gap-2 mt-1">
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

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="relative w-full max-w-4xl bg-[#0e0e18] border border-white/[0.08] rounded-[18px] overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-400 opacity-[0.05] blur-[60px] pointer-events-none" />

            {/* Modal header */}
            <div className="px-7 py-5 border-b border-white/[0.06] flex items-center justify-between relative sticky top-0 bg-[#0e0e18] z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-amber-400/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-amber-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    Add Transaction
                  </p>
                  <p className="text-xs text-zinc-500 font-mono font-light">
                    Record a new entry
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.1] transition-all duration-150"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleAddTransaction}
              className="p-7 space-y-5 relative"
            >
              {/* ── CARD PICKER ── */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                  Select Card
                </label>

                {cardsLoading ? (
                  <div className="flex flex-col gap-2">
                    <div className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
                    <div className="h-14 rounded-xl bg-white/[0.03] animate-pulse opacity-60" />
                  </div>
                ) : cards.length === 0 ? (
                  <div className="flex items-center gap-2.5 bg-orange-400/10 border border-orange-400/20 rounded-xl px-4 py-3">
                    <svg
                      className="w-4 h-4 text-orange-400 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-orange-400">
                      No cards found.{" "}
                      <Link
                        to="/add-new"
                        className="underline hover:text-orange-300 transition-colors"
                      >
                        Add a card first.
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {cards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCardId(card.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                          selectedCardId === card.id
                            ? "bg-amber-400/10 border-amber-400/40"
                            : "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedCardId === card.id ? "bg-amber-400/20" : "bg-white/[0.05]"}`}
                          >
                            <svg
                              className={`w-3.5 h-3.5 ${selectedCardId === card.id ? "text-amber-400" : "text-zinc-500"}`}
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
                            <p
                              className={`text-xs font-semibold ${selectedCardId === card.id ? "text-zinc-100" : "text-zinc-400"}`}
                            >
                              {card.bank}
                            </p>
                            <p className="text-[10px] font-mono text-zinc-600">
                              {card.card_number}
                            </p>
                          </div>
                        </div>
                        {selectedCardId === card.id && (
                          <svg
                            className="w-4 h-4 text-amber-400 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Type toggle */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                  Type
                </label>
                <div className="flex gap-3">
                  {(["debit", "credit"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, type: t }))
                      }
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                        formData.type === t
                          ? t === "debit"
                            ? "bg-red-400/10 border-red-400/50 text-red-400"
                            : "bg-emerald-400/10 border-emerald-400/50 text-emerald-400"
                          : "bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.15]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                  Amount
                </label>
                <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 gap-2 focus-within:border-amber-400/40 focus-within:ring-1 focus-within:ring-amber-400/10 transition-colors duration-150">
                  <span className="text-zinc-500 text-sm font-mono shrink-0">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grocery run at D-Mart"
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className={inputClass + " appearance-none cursor-pointer"}
                >
                  {categories.map((cat) => (
                    <option key={cat} className="bg-zinc-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom category */}
              {formData.category === "Other" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Custom Category
                  </label>
                  <input
                    type="text"
                    placeholder="Enter category name"
                    required
                    value={formData.customCategory}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customCategory: e.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!selectedCardId || cardsLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_28px_rgba(251,191,36,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-sm font-medium hover:text-zinc-100 hover:border-white/[0.15] transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
