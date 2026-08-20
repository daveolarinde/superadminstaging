import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowUpCircle, ArrowDownCircle, AlertTriangle,
  X, CheckCircle2, XCircle, Send, Bell,
} from "lucide-react";

import ProfileTab from "./UserProfile/userTabs/ProfileTab";
import WalletsTab from "./UserProfile/userTabs/WalletsTab";
import TransactionsTab from "./UserProfile/userTabs/TransactionsTab";
import ProfitHistoryTab from "./UserProfile/userTabs/ProfitHistoryTab";
import VirtualAccountsTab from "./UserProfile/userTabs/VirtualAccountsTab";
import UserKYCTab from "./UserProfile/userTabs/UserKYCTab";
import UserVirtualCardsTab from "./UserProfile/userTabs/Uservirtualcardstab";
import BeneficiariesTab from "./UserProfile/userTabs/BeneficiariesTab";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵" };
const sym = (code) => CURRENCY_SYMBOLS[code] ?? code ?? "";
const fmt = (amount, currency) =>
  `${sym(currency)}${parseFloat(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

const TABS = [
  "Profile",
  "Wallets",
  "Transactions",
  "Profit History",
  "KYC Verification",
  "Virtual Accounts",
  "Beneficiaries",
  "Virtual Cards",

  "Adjust Balance",
  "Push Notification",
];

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = ({ sm }) => (
  <svg className={`animate-spin ${sm ? "w-3.5 h-3.5" : "w-4 h-4"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// ── Result card ───────────────────────────────────────────────────────────────
const AdjustResult = ({ data, onReset }) => (
  <div className="space-y-5 max-w-md mx-auto text-center py-4">
    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
      <CheckCircle2 size={26} className="text-emerald-600" />
    </div>
    <div>
      <h3 className="text-base font-bold text-gray-800">Adjustment Successful</h3>
      <p className="text-sm text-gray-500 mt-0.5">Wallet balance updated and transaction recorded</p>
    </div>
    <div className="bg-gray-50 border border-gray-100 rounded-2xl divide-y divide-gray-100 text-left">
      {[
        { label: "Old Balance", value: fmt(data.oldBalance, data.currency) },
        { label: "New Balance", value: fmt(data.newBalance, data.currency), hi: true },
        { label: "Transaction ID", value: data.transactionId, mono: true },
        { label: "Reference", value: data.referenceId, mono: true },
      ].map(({ label, value, hi, mono }) => (
        <div key={label} className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-gray-500">{label}</span>
          <span className={`text-sm font-semibold ${hi ? "text-emerald-600" : "text-gray-800"} ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
        </div>
      ))}
    </div>
    <button onClick={onReset} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
      Make Another Adjustment
    </button>
  </div>
);

// ── Adjust Wallet Tab ─────────────────────────────────────────────────────────
const AdjustBalanceTab = ({ userId, userName, accounts = [] }) => {
  const [currencies, setCurrencies] = useState([]);
  const [currLoading, setCurrLoading] = useState(true);
  const [form, setForm] = useState({ currency: "", amount: "", actionType: "", info: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setError(""); };

  // Look up the account matching the currently selected currency
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.currency === form.currency),
    [accounts, form.currency]
  );
  const selectedBalance = selectedAccount ? parseFloat(selectedAccount.balance || 0) : null;

  // For debit: what the balance would look like after the adjustment, and whether it's enough
  const debitAmount = form.actionType === "debit" ? parseFloat(form.amount || 0) : 0;
  const insufficientFunds =
    form.actionType === "debit" && selectedBalance !== null && debitAmount > selectedBalance;
  const projectedBalance =
    selectedBalance !== null
      ? form.actionType === "debit"
        ? selectedBalance - debitAmount
        : form.actionType === "credit"
          ? selectedBalance + parseFloat(form.amount || 0)
          : selectedBalance
      : null;

  useEffect(() => {
    axios.get(`${API_BASE_URL}/superAdmin/currencies`, { headers })
      .then((r) => setCurrencies((r.data?.data ?? []).filter((c) => c.isActive)))
      .catch(() => { })
      .finally(() => setCurrLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currency || !form.amount || parseFloat(form.amount) <= 0) return setError("Enter a valid amount and currency.");
    if (!form.actionType) return setError("Select Credit or Debit.");
    if (!form.info.trim()) return setError("Info is required.");
    setError("");
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/superAdmin/users/adjust-wallet-balance`,
        { userId, currency: form.currency, amount: parseFloat(form.amount), actionType: form.actionType, info: form.info.trim(), description: form.description.trim() },
        { headers }
      );
      setResult(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to adjust balance.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setResult(null); setError(""); setForm({ currency: "", amount: "", actionType: "", info: "", description: "" }); };

  if (result) return <AdjustResult data={result} onReset={reset} />;

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800">Adjust Wallet Balance</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Manually credit or debit <strong>{userName}</strong>'s wallet. A transaction record will be created.
        </p>
      </div>

      {/* Current balance overview */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
            {form.currency ? `${form.currency} Balance` : "Select a currency to see balance"}
          </p>
          <p className="text-lg font-bold text-gray-800 mt-0.5">
            {form.currency
              ? (selectedBalance !== null ? fmt(selectedBalance, form.currency) : "No wallet for this currency")
              : "—"}
          </p>
        </div>
        {accounts.length > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Wallets</p>
            <div className="flex gap-1 mt-1 flex-wrap justify-end max-w-[180px]">
              {accounts.map((a) => (
                <button
                  key={a.currency}
                  type="button"
                  onClick={() => set("currency", a.currency)}
                  className={`text-[10px] rounded-full px-2 py-0.5 border transition ${form.currency === a.currency
                      ? "bg-emerald-100 border-emerald-300 text-emerald-700 font-semibold"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                >
                  {a.currency}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Currency + Amount */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Currency <span className="text-red-400">*</span>
            </label>
            {currLoading ? (
              <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400">
                <Spinner sm /> Loading…
              </div>
            ) : (
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">Select…</option>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{sym(c.code)} {c.code} — {c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Amount <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-gray-400">
                {form.currency ? sym(form.currency) : "#"}
              </span>
              <input
                type="number" min="0.01" step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
              />
            </div>
            {form.currency && selectedBalance !== null && (
              <p className="text-[10px] text-gray-400 mt-1">
                Available: {fmt(selectedBalance, form.currency)}
              </p>
            )}
          </div>
        </div>

        {/* Action type */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Action <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "credit", label: "Credit", desc: "Add funds to wallet", icon: <ArrowUpCircle size={14} className="text-emerald-500 shrink-0" />, active: "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100", activeText: "text-emerald-700" },
              { value: "debit", label: "Debit", desc: "Deduct from wallet", icon: <ArrowDownCircle size={14} className="text-red-500 shrink-0" />, active: "border-red-400 bg-red-50 ring-2 ring-red-100", activeText: "text-red-700" },
            ].map((opt) => (
              <button
                key={opt.value} type="button"
                onClick={() => set("actionType", opt.value)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition ${form.actionType === opt.value ? opt.active : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {opt.icon}
                <div>
                  <p className={`text-sm font-semibold ${form.actionType === opt.value ? opt.activeText : "text-gray-700"}`}>{opt.label}</p>
                  <p className="text-[10px] text-gray-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Info <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.info}
            onChange={(e) => set("info", e.target.value)}
            placeholder="e.g. Admin manual credit adjustment"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. Refund for failed transaction TX-1234"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition resize-none"
          />
        </div>

        {/* Debit warning + insufficient funds */}
        {form.actionType === "debit" && form.amount && (
          <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border ${insufficientFunds ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
            }`}>
            <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${insufficientFunds ? "text-red-500" : "text-amber-500"}`} />
            <div className={`text-xs ${insufficientFunds ? "text-red-700" : "text-amber-700"}`}>
              <p>
                You're about to <strong>debit {form.currency ? fmt(form.amount, form.currency) : form.amount}</strong> from this wallet. This cannot be undone.
              </p>
              {selectedBalance !== null && (
                <p className="mt-1">
                  {insufficientFunds
                    ? `Insufficient funds — current balance is only ${fmt(selectedBalance, form.currency)}.`
                    : `Balance after debit: ${fmt(projectedBalance, form.currency)}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Credit preview */}
        {form.actionType === "credit" && form.amount && selectedBalance !== null && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <ArrowUpCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-700">
              Balance after credit: <strong>{fmt(projectedBalance, form.currency)}</strong>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${form.actionType === "debit" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
        >
          {submitting ? <><Spinner sm />Processing…</> : (
            <>
              {form.actionType === "debit" ? <ArrowDownCircle size={15} /> : <ArrowUpCircle size={15} />}
              {form.actionType === "debit" ? "Debit Wallet" : form.actionType === "credit" ? "Credit Wallet" : "Adjust Balance"}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// ── Push Notification Tab ─────────────────────────────────────────────────────
const PushNotificationTab = ({ userId, userName }) => {
  const [form, setForm] = useState({ title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return setError("Title and message are required.");
    setError("");
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/superAdmin/users/send-push`,
        { title: form.title.trim(), body: form.body.trim(), sendTo: "selected", userIds: [userId] },
        { headers }
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to send push notification.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) return (
    <div className="max-w-md mx-auto text-center py-4 space-y-4">
      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
        <Bell size={26} className="text-blue-600" />
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-800">Notification Sent!</h3>
        <p className="text-sm text-gray-500 mt-0.5">{result.message ?? "Push notification dispatched successfully."}</p>
      </div>
      <div className="bg-blue-50 text-blue-700 font-bold text-sm px-5 py-2 rounded-full ring-1 ring-blue-100 inline-block">
        {result.dispatchedCount ?? 1} recipient{result.dispatchedCount !== 1 ? "s" : ""} reached
      </div>
      <button
        onClick={() => { setResult(null); setForm({ title: "", body: "" }); }}
        className="block w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
      >
        Send Another
      </button>
    </div>
  );

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800">Send Push Notification</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Send an in-app push notification directly to <strong>{userName}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Recipient chip — read-only, shows who this is going to */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-xs text-blue-700 font-medium">Sending to: <strong>{userName}</strong></span>
          <span className="ml-auto text-[10px] font-mono text-blue-400 truncate max-w-[140px]">{userId}</span>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Account Update"
            maxLength={100}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-right">{form.title.length}/100</p>
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={3}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder="e.g. Your wallet has been credited with ₦5,000."
            maxLength={300}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-right">{form.body.length}/300</p>
        </div>

        {/* Live preview */}
        {(form.title || form.body) && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Preview</p>
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Bell size={11} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Airpero</span>
                <span className="ml-auto text-[10px] text-gray-400">now</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">{form.title || "Title"}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{form.body || "Message body"}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? <><Spinner sm />Sending…</> : <><Send size={14} />Send Notification</>}
        </button>
      </form>
    </div>
  );
};

// ── Card Summary Tab ─────────────────────────────────────────────────────────
// const StatCard = ({ label, value, tone, icon }) => (
//   <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex items-start justify-between">
//     <div>
//       <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
//       <p className={`text-xl font-bold mt-1 ${tone}`}>{value}</p>
//     </div>
//     {icon}
//   </div>
// );

// const CardSummaryTab = ({ userId }) => {
//   const [loading, setLoading] = useState(true);
//   const [error,   setError]   = useState("");
//   const [stats,   setStats]   = useState(null);

//   const token = localStorage.getItem("token");
//   const headers = { Authorization: `Bearer ${token}` };

//   useEffect(() => {
//     if (!userId) return;
//     let cancelled = false;

//     const fetchAll = async () => {
//       setLoading(true); setError("");
//       try {
//         const limit = 100;
//         let offset = 0;
//         let all = [];
//         while (true) {
//           const res = await axios.get(`${API_BASE_URL}/superAdmin/transactions`, {
//             headers,
//             params: { userId, transactionClass: "card", limit, offset },
//           });
//           const page = Array.isArray(res.data?.data) ? res.data.data : [];
//           all = all.concat(page);
//           const total = res.data?.count ?? all.length;
//           offset += limit;
//           if (page.length === 0 || all.length >= total) break;
//         }
//         if (cancelled) return;

//         const totals = all.reduce(
//           (acc, t) => {
//             const amount = parseFloat(t.total_amount ?? t.amount ?? 0);
//             if (t.type === "credit") acc.funding += amount;
//             if (t.type === "debit")  acc.debit   += amount;
//             if (t.status === "success") acc.successful += 1;
//             if (t.status === "failed")  acc.declined   += 1;
//             return acc;
//           },
//           { funding: 0, debit: 0, successful: 0, declined: 0 }
//         );

//         setStats({ ...totals, currency: all[0]?.currency, count: all.length });
//       } catch (err) {
//         if (!cancelled) setError(err.response?.data?.message ?? "Failed to load card summary.");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };

//     fetchAll();
//     return () => { cancelled = true; };
//   }, [userId]);

//   if (loading)
//     return (
//       <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
//         <Spinner /> Loading card summary…
//       </div>
//     );

//   if (error)
//     return (
//       <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
//         <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
//         <p className="text-sm text-red-600">{error}</p>
//       </div>
//     );

//   if (!stats || !stats.count)
//     return (
//       <div className="text-center py-10 text-sm text-gray-400">
//         No card transactions found for this user.
//       </div>
//     );

//   return (
//     <div className="space-y-4">
//       <div>
//         <h3 className="text-base font-semibold text-gray-800">Card Summary</h3>
//         <p className="text-xs text-gray-400 mt-0.5">Aggregated from {stats.count} card transaction{stats.count !== 1 ? "s" : ""}</p>
//       </div>
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//         <StatCard
//           label="Total Card Funding"
//           value={fmt(stats.funding, stats.currency)}
//           tone="text-emerald-600"
//           icon={<ArrowUpCircle size={18} className="text-emerald-400" />}
//         />
//         <StatCard
//           label="Total Debit"
//           value={fmt(stats.debit, stats.currency)}
//           tone="text-red-600"
//           icon={<ArrowDownCircle size={18} className="text-red-400" />}
//         />
//         <StatCard
//           label="Total Successful Txns"
//           value={stats.successful}
//           tone="text-blue-600"
//           icon={<CheckCircle2 size={18} className="text-blue-400" />}
//         />
//         <StatCard
//           label="Total Declined Txns"
//           value={stats.declined}
//           tone="text-amber-600"
//           icon={<XCircle size={18} className="text-amber-400" />}
//         />
//       </div>
//     </div>
//   );
// };

// ─────────────────────────────────────────────────────────────────────────────
// Main UserProfileView
// ─────────────────────────────────────────────────────────────────────────────
export default function UserProfileView({ onClose }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState("");
  const [activeTab, setActiveTab] = useState("Profile");

  // Virtual Accounts
  const [virtualAccounts, setVirtualAccounts] = useState([]);
  const [virtualAccountsLoading, setVirtualAccountsLoading] = useState(false);
  const [virtualAccountsError, setVirtualAccountsError] = useState("");
  const [virtualAccountsPage, setVirtualAccountsPage] = useState(0);
  const [virtualAccountsCount, setVirtualAccountsCount] = useState(null);
  const virtualAccountsLimit = 10;

  // Transactions
  const [txns, setTxns] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [txnsPage, setTxnsPage] = useState(0);
  const [txnsCount, setTxnsCount] = useState(null);
  const txnsLimit = 10;

  // Profits
  const [profits, setProfits] = useState([]);
  const [profitsLoading, setProfitsLoading] = useState(false);
  const [profitsPage, setProfitsPage] = useState(0);
  const [profitsCount, setProfitsCount] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);
  const profitsLimit = 10;

  // KYC
  const [kycRecords, setKycRecords] = useState([]);

  const token = localStorage.getItem("token");
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const virtualAccountsPagesTotal = virtualAccountsCount ? Math.ceil(virtualAccountsCount / virtualAccountsLimit) : null;
  const txnsPagesTotal = txnsCount ? Math.ceil(txnsCount / txnsLimit) : null;
  const profitsPagesTotal = profitsCount ? Math.ceil(profitsCount / profitsLimit) : null;

  const parsedAddress = useMemo(() => {
    try {
      if (!user?.address) return null;
      if (typeof user.address === "string" && user.address.startsWith("{")) {
        const a = JSON.parse(user.address);
        return [a.street, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", ");
      }
      return user?.address || "N/A";
    } catch { return user?.address || "N/A"; }
  }, [user?.address]);

  // selfieUrl lives inside kycRecords[], not on the user object directly
  const selfieUrl = useMemo(() => {
    const records = Array.isArray(user?.kycRecords) ? user.kycRecords : [];
    const withSelfie = records.find((r) => r.selfieUrl);
    return withSelfie?.selfieUrl || null;
  }, [user?.kycRecords]);

  const userName = user ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() : "this user";

  // Fetch user
  const fetchUser = useCallback(() => {
    if (!userId) return;
    setLoadingUser(true);
    setErrorUser("");
    return axios.get(`${API_BASE_URL}/superAdmin/users`, { headers: { ...authHeaders, Accept: "application/json" } })
      .then((res) => {
        const all = Array.isArray(res.data?.data) ? res.data.data : [];
        const found = all.find((u) => [u?.id, u?._id, u?.userId].some((v) => String(v).trim() === String(userId).trim()));
        if (!found) { setErrorUser("User not found"); setUser(null); }
        else { setUser(found); setKycRecords(Array.isArray(found.kycRecords) ? found.kycRecords : []); }
      })
      .catch(() => setErrorUser("Failed to fetch user"))
      .finally(() => setLoadingUser(false));
  }, [authHeaders, userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const fetchVirtualAccounts = useCallback(async (page = 0) => {
    if (!userId) return;
    setVirtualAccountsLoading(true); setVirtualAccountsError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/superadmin/virtual-accounts`, {
        headers: authHeaders,
        params: { userId, limit: virtualAccountsLimit, offset: page * virtualAccountsLimit },
      });
      setVirtualAccounts(Array.isArray(res.data?.data) ? res.data.data : []);
      if (typeof res.data?.count === "number") setVirtualAccountsCount(res.data.count);
    } catch { setVirtualAccountsError("Failed to fetch virtual accounts"); }
    finally { setVirtualAccountsLoading(false); }
  }, [userId, authHeaders]);

  const fetchTransactions = useCallback(async (page = 0) => {
    if (!userId) return;
    setTxnsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/transactions`, {
        headers: authHeaders,
        params: { userId, limit: txnsLimit, offset: page * txnsLimit },
      });
      setTxns(Array.isArray(res.data?.data) ? res.data.data : []);
      const count = res.data?.count ?? res.data?.total;
      if (typeof count === "number") setTxnsCount(count);
    } catch {
      // Silently fail - transactions will remain as-is
    } finally { setTxnsLoading(false); }
  }, [userId, authHeaders]);

  const fetchProfits = useCallback(async (page = 0) => {
    if (!userId) return;
    setProfitsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/profits`, {
        headers: authHeaders,
        params: { userId, limit: profitsLimit, offset: page * profitsLimit },
      });
      setProfits(Array.isArray(res.data?.data) ? res.data.data : []);
      if (typeof res.data?.count === "number") setProfitsCount(res.data.count);
    } catch {
      // Intentionally silenced - profits will remain as-is
    } finally { setProfitsLoading(false); }
  }, [userId, authHeaders]);

  const fetchProfitSummary = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/profits/summary`, {
        headers: authHeaders, params: { userId },
      });
      setProfitSummary(res.data?.data || null);
    } catch {
      // Silently fail - profit summary will remain as-is
    }
  }, [userId, authHeaders, token]);

  const fetchKycRecords = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/kyc`, {
        headers: authHeaders, params: { userId, limit: 100, offset: 0 },
      });
      setKycRecords(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      // Silently fail - KYC records will remain as-is
    }
  }, [userId, authHeaders]);

  useEffect(() => { if (activeTab === "Virtual Accounts") fetchVirtualAccounts(virtualAccountsPage); }, [activeTab, virtualAccountsPage, fetchVirtualAccounts]);
  useEffect(() => { if (activeTab === "Transactions") fetchTransactions(txnsPage); }, [activeTab, txnsPage, fetchTransactions]);
  useEffect(() => {
    if (activeTab === "Profit History") { fetchProfits(profitsPage); fetchProfitSummary(); }
  }, [activeTab, profitsPage, fetchProfits, fetchProfitSummary]);
  useEffect(() => {
    if (activeTab === "KYC Verification") {
      if (!Array.isArray(user?.kycRecords) || user.kycRecords.length === 0) fetchKycRecords();
      else setKycRecords(user.kycRecords);
    }
  }, [activeTab, user, fetchKycRecords]);

  // Loading / error states
  if (loadingUser)
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading user profile…</span>
      </div>
    );

  if (errorUser || !user)
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-center px-4 gap-3">
        <div className="text-5xl">😕</div>
        <p className="text-gray-500">{errorUser || "User not found"}</p>
        <button onClick={onClose || (() => navigate(-1))} className="mt-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700 transition">
          Go Back
        </button>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* Profile Header */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="h-20 sm:h-24 bg-gradient-to-r from-[#dbeafe] via-[#eff6ff] to-white" />
        <div className="px-4 sm:px-6 pb-5 -mt-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-3xl font-bold text-blue-600 select-none">
              {selfieUrl ? (
                <img
                  src={selfieUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                />
              ) : null}
              <span style={{ display: selfieUrl ? "none" : "flex" }} className="w-full h-full items-center justify-center">
                {user.firstname?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{user.firstname} {user.lastname}</h1>
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                {user.email}
                {user.country && <span className="ml-2">· {user.country}</span>}
                <span className="ml-2">· Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose || (() => navigate(-1))} className="flex items-center gap-1.5 text-sm text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 transition self-start sm:self-auto">
            <FiArrowLeft size={14} /> Back
          </button>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Tab bar */}
        <div className="flex items-center gap-0.5 overflow-x-auto px-4 pt-4 border-b border-gray-100 no-scrollbar">
          {TABS.map((t) => {
            const isAction = t === "Adjust Balance" || t === "Push Notification";
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-shrink-0 text-sm px-3 py-2 rounded-t-lg whitespace-nowrap transition-colors ${t === activeTab
                    ? isAction
                      ? t === "Adjust Balance"
                        ? "text-emerald-600 border-b-2 border-emerald-500 font-semibold bg-emerald-50/50"
                        : "text-blue-600 border-b-2 border-blue-600 font-semibold bg-blue-50/50"
                      : "text-blue-600 border-b-2 border-blue-600 font-semibold bg-blue-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {activeTab === "Profile" && <ProfileTab user={user} parsedAddress={parsedAddress} onUserUpdate={fetchUser} />}
          {activeTab === "Wallets" && <WalletsTab user={user} />}
          {activeTab === "Transactions" && (
            <TransactionsTab txns={txns} txnsLoading={txnsLoading} txnsCount={txnsCount} txnsPage={txnsPage} txnsPagesTotal={txnsPagesTotal} setTxnsPage={setTxnsPage} />
          )}
          {activeTab === "Profit History" && (
            <ProfitHistoryTab profits={profits} profitsLoading={profitsLoading} profitsCount={profitsCount} profitsPage={profitsPage} profitsPagesTotal={profitsPagesTotal} profitSummary={profitSummary} setProfitsPage={setProfitsPage} />
          )}
          {activeTab === "KYC Verification" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-base font-semibold text-gray-800">KYC Records</h3>
                <div className="text-xs text-gray-400">All KYC entries for this user</div>
              </div>
              <UserKYCTab
                kycRecords={kycRecords}
                baseURL={API_BASE_URL}
                authHeader={authHeaders}
                fetchKycRecords={fetchKycRecords}
                fetchSummary={async () => {
                  try { await axios.get(`${API_BASE_URL}/superAdmin/users/${userId}/summary`, { headers: authHeaders }); } catch {
                    // Silently fail - summary will remain as-is
                  }
                }}
              />
            </div>
          )}
          {activeTab === "Virtual Accounts" && (
            <VirtualAccountsTab virtualAccounts={virtualAccounts} virtualAccountsLoading={virtualAccountsLoading} virtualAccountsError={virtualAccountsError} virtualAccountsCount={virtualAccountsCount} virtualAccountsPage={virtualAccountsPage} virtualAccountsPagesTotal={virtualAccountsPagesTotal} setVirtualAccountsPage={setVirtualAccountsPage} />
          )}
          {activeTab === "Beneficiaries" && <BeneficiariesTab userId={userId} baseURL={API_BASE_URL} authHeader={authHeaders} />}
          {activeTab === "Virtual Cards" && <UserVirtualCardsTab userId={userId} baseURL={API_BASE_URL} authHeader={authHeaders} />}
          {/* {activeTab === "Card Summary"     && <CardSummaryTab userId={userId} />} */}

          {/* ── Action tabs ── */}
          {activeTab === "Adjust Balance" && (
            <AdjustBalanceTab userId={userId} userName={userName} accounts={user.accounts || []} />
          )}
          {activeTab === "Push Notification" && <PushNotificationTab userId={userId} userName={userName} />}
        </div>
      </div>
    </div>
  );
}