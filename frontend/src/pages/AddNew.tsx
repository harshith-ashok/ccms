/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

interface FormState {
  bank: string;
  provider: string;
  card_number: string;
  card_holder: string;
  expiry_mm: string;
  expiry_yy: string;
  credit_limit: string;
  monthly_due: string;
  due_date: string;
}

export default function AddNew() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    bank: "",
    provider: "Visa",
    card_number: "",
    card_holder: "",
    expiry_mm: "",
    expiry_yy: "",
    credit_limit: "",
    monthly_due: "",
    due_date: "15",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ── Live field update ──────────────────────────────────────────────────────
  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Auto-format card number: insert spaces every 4 digits
  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const spaced = raw.match(/.{1,4}/g)?.join(" ") ?? raw;
    setForm((prev) => ({ ...prev, card_number: spaced }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Validate expiry
    const mm = parseInt(form.expiry_mm, 10);
    const yy = parseInt(form.expiry_yy, 10);
    if (!mm || mm < 1 || mm > 12) {
      setError("Enter a valid expiry month (01–12).");
      return;
    }
    if (!yy || yy < 0 || yy > 99) {
      setError("Enter a valid expiry year (YY).");
      return;
    }

    const expires = `${String(mm).padStart(2, "0")}/${String(yy).padStart(2, "0")}`;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8120/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bank: form.bank,
          card_number: form.card_number,
          card_holder: form.card_holder,
          expires,
          credit_limit: Number(form.credit_limit.replace(/,/g, "")),
          monthly_due: Number(form.monthly_due.replace(/,/g, "")),
          due_date: Number(form.due_date),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save card");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived preview values ─────────────────────────────────────────────────
  const previewBank = form.bank || "Bank Name";
  const previewNumber = form.card_number || "•••• •••• •••• ••••";
  const previewHolder = form.card_holder || "YOUR NAME";
  const previewExpiry =
    form.expiry_mm || form.expiry_yy
      ? `${form.expiry_mm.padStart(2, "0") || "MM"} / ${form.expiry_yy.padStart(2, "0") || "YY"}`
      : "MM / YY";

  // Shared input class
  const inputCls =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10 transition-colors duration-150";

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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-amber-400/10 text-amber-400"
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
              New Card
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5 font-mono font-light">
              Register a card to start tracking it
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-200 transition-colors duration-150"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-5 gap-8 items-start">
          {/* ── FORM ── */}
          <div className="col-span-3 relative bg-[#0e0e18] border border-white/[0.07] rounded-[18px] overflow-hidden hover:border-white/[0.13] transition-colors duration-200">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-400 opacity-[0.06] blur-[60px] pointer-events-none" />

            {/* Form header */}
            <div className="px-7 py-5 border-b border-white/[0.06] flex items-center gap-3 relative">
              <div className="w-9 h-9 rounded-[10px] bg-amber-400/10 flex items-center justify-center shrink-0">
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
                  Card Details
                </p>
                <p className="text-xs text-zinc-500 font-mono font-light">
                  Fill in the information from your card
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6 relative">
              {/* Error banner */}
              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
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

              {/* Row 1: Bank name + Provider */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.bank}
                    onChange={set("bank")}
                    placeholder="e.g. Punjab National Bank"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Provider
                  </label>
                  <select
                    value={form.provider}
                    onChange={set("provider")}
                    className={inputCls + " appearance-none cursor-pointer"}
                  >
                    <option className="bg-zinc-900">Visa</option>
                    <option className="bg-zinc-900">Mastercard</option>
                    <option className="bg-zinc-900">RuPay</option>
                    <option className="bg-zinc-900">American Express</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Card holder */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                  Card Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={form.card_holder}
                  onChange={set("card_holder")}
                  placeholder="As printed on card"
                  className={inputCls}
                />
              </div>

              {/* Row 3: Card number + Expiry */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={form.card_number}
                    onChange={handleCardNumber}
                    placeholder="1234 5678 9101 1121"
                    maxLength={19}
                    className={inputCls + " font-mono"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Expiry
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={form.expiry_mm}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          expiry_mm: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 2),
                        }))
                      }
                      placeholder="MM"
                      maxLength={2}
                      className={inputCls + " font-mono text-center px-2"}
                    />
                    <span className="text-zinc-600 font-mono shrink-0">/</span>
                    <input
                      type="text"
                      required
                      value={form.expiry_yy}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          expiry_yy: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 2),
                        }))
                      }
                      placeholder="YY"
                      maxLength={2}
                      className={inputCls + " font-mono text-center px-2"}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Row 4: Credit limit + Monthly due + Due date */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Credit Limit
                  </label>
                  <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 gap-2 focus-within:border-amber-400/40 focus-within:ring-1 focus-within:ring-amber-400/10 transition-colors duration-150">
                    <span className="text-zinc-500 text-sm font-mono shrink-0">
                      ₹
                    </span>
                    <input
                      type="text"
                      required
                      value={form.credit_limit}
                      onChange={set("credit_limit")}
                      placeholder="1,00,000"
                      className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Min. Monthly Due
                  </label>
                  <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 gap-2 focus-within:border-amber-400/40 focus-within:ring-1 focus-within:ring-amber-400/10 transition-colors duration-150">
                    <span className="text-zinc-500 text-sm font-mono shrink-0">
                      ₹
                    </span>
                    <input
                      type="text"
                      required
                      value={form.monthly_due}
                      onChange={set("monthly_due")}
                      placeholder="2,500"
                      className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Due Date
                  </label>
                  <select
                    value={form.due_date}
                    onChange={set("due_date")}
                    className={inputCls + " appearance-none cursor-pointer"}
                  >
                    {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                      <option key={d} value={d} className="bg-zinc-900">
                        {d}
                        {["st", "nd", "rd"][d - 1] ?? "th"} of Month
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 text-zinc-900 text-sm font-bold hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:shadow-[0_0_28px_rgba(251,191,36,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
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
                    "Save Card"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-sm font-medium hover:text-zinc-100 hover:border-white/[0.15] transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="col-span-2 space-y-5">
            {/* Live card preview */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-3">
                Preview
              </p>
              <div className="relative w-full h-[200px] rounded-[20px] bg-gradient-to-br from-slate-900 via-[#16213e] to-[#0f3460] border border-white/[0.07] p-7 flex flex-col justify-between overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full border border-white/[0.07] pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-yellow-400/20 to-yellow-400 pointer-events-none" />

                <div className="flex items-start justify-between relative">
                  <span className="text-sm uppercase font-bold text-white/90 tracking-wide">
                    {previewBank}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-white/30">
                      {form.provider}
                    </span>
                    <div className="w-8 h-5 rounded bg-white/10 border border-white/20" />
                  </div>
                </div>
                <p className="font-mono text-[14px] tracking-[0.2em] text-white/40 relative">
                  {previewNumber}
                </p>

                <div className="flex items-end justify-between relative">
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-1">
                      Card Holder
                    </p>
                    <p className="text-[13px] font-semibold text-white/85 uppercase">
                      {previewHolder}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-1">
                      Expires
                    </p>
                    <p className="text-[13px] font-semibold text-white/85">
                      {previewExpiry}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
