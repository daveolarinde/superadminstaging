import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Wallet, Bell, Search, X, CheckCircle2, XCircle,
  ArrowUpCircle, ArrowDownCircle, ChevronDown, Users,
  Send, AlertTriangle, RefreshCw,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ── helpers ───────────────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵" };
const sym = (code) => CURRENCY_SYMBOLS[code] ?? code ?? "";

const fmt = (amount, currency) =>
  `${sym(currency)}${parseFloat(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
      }`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={13} /></button>
    </div>
  );
};

// ── Select ────────────────────────────────────────────────────────────────────
const Select = ({ value, onChange, options, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 hover:border-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={selected ? "text-gray-800 font-medium" : "text-gray-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition hover:bg-gray-50 ${value === opt.value ? "bg-blue-50/60 text-blue-700 font-medium" : "text-gray-700"
                  }`}
              >
                {opt.icon && opt.icon}
                <div>
                  <p className="font-medium">{opt.label}</p>
                  {opt.description && <p className="text-xs text-gray-400">{opt.description}</p>}
                </div>
                {value === opt.value && <span className="ml-auto text-blue-600 text-xs font-bold">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Result card ───────────────────────────────────────────────────────────────
const AdjustResult = ({ data, onReset }) => (
  <div className="space-y-5">
    <div className="flex flex-col items-center text-center gap-3 py-4">
      <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 size={26} className="text-emerald-600" />
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-800">Adjustment Successful</h3>
        <p className="text-sm text-gray-500 mt-0.5">Wallet balance updated and transaction recorded</p>
      </div>
    </div>

    <div className="bg-gray-50 border border-gray-100 rounded-2xl divide-y divide-gray-100">
      {[
        { label: "Target", value: data.target === "wallet" ? "Wallet" : "Card" },
        { label: "Currency", value: data.currency },
        { label: "Old Balance", value: fmt(data.oldBalance, data.currency) },
        { label: "New Balance", value: fmt(data.newBalance, data.currency), highlight: true },
        { label: "Transaction ID", value: data.transactionId, mono: true },
        { label: "Reference", value: data.referenceId, mono: true },
      ].map(({ label, value, highlight, mono }) => (
        <div key={label} className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-gray-500">{label}</span>
          <span className={`text-sm font-semibold ${highlight ? "text-emerald-600" : "text-gray-800"} ${mono ? "font-mono text-xs" : ""}`}>
            {value}
          </span>
        </div>
      ))}
    </div>

    <button
      onClick={onReset}
      className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
    >
      Make Another Adjustment
    </button>
  </div>
);

// ── Push Result ───────────────────────────────────────────────────────────────
const PushResult = ({ data, onReset }) => (
  <div className="space-y-5">
    <div className="flex flex-col items-center text-center gap-3 py-4">
      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
        <Bell size={26} className="text-blue-600" />
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-800">Notifications Dispatched!</h3>
        <p className="text-sm text-gray-500 mt-0.5">{data.message}</p>
      </div>
      <div className="bg-blue-50 text-blue-700 font-bold text-lg px-6 py-2 rounded-full ring-1 ring-blue-100">
        {data.dispatchedCount?.toLocaleString() ?? "—"} users reached
      </div>
    </div>
    <button
      onClick={onReset}
      className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
    >
      Send Another
    </button>
  </div>
);

// ── SECTION: Adjust Wallet Balance ────────────────────────────────────────────
const AdjustWalletSection = ({ currencies, users }) => {
  const [form, setForm] = useState({
    userId: "", currency: "", amount: "", actionType: "", info: "", description: "",
  });
  const [userSearch, setUserSearch] = useState("");
  const [userDropdown, setUserDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    return (
      u.firstname?.toLowerCase().includes(term) ||
      u.lastname?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }).slice(0, 20);

  const selectedUser = users.find((u) => u.id === form.userId);

  const currencyOptions = currencies.map((c) => ({
    value: c.code,
    label: `${sym(c.code)} ${c.code} — ${c.name}`,
  }));

  const actionOptions = [
    { value: "credit", label: "Credit", description: "Add funds to wallet", icon: <ArrowUpCircle size={14} className="text-emerald-500 shrink-0" /> },
    { value: "debit", label: "Debit", description: "Deduct funds from wallet", icon: <ArrowDownCircle size={14} className="text-red-500 shrink-0" /> },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.currency || !form.amount || !form.actionType || !form.info) {
      return setError("Please fill in all required fields.");
    }
    setError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/superAdmin/users/adjust-wallet-balance`,
        { ...form, amount: parseFloat(form.amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to adjust wallet balance.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError("");
    setForm({ userId: "", currency: "", amount: "", actionType: "", info: "", description: "" });
    setUserSearch("");
  };

  if (result) return <AdjustResult data={result} onReset={reset} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* User picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          User <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <div className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition cursor-text" onClick={() => setUserDropdown(true)}>
            <Search size={14} className="text-gray-400 shrink-0" />
            {selectedUser && !userDropdown ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center uppercase shrink-0">
                  {selectedUser.firstname?.[0]}
                </span>
                <span className="text-sm font-medium text-gray-800 truncate">
                  {selectedUser.firstname} {selectedUser.lastname}
                </span>
                <span className="text-xs text-gray-400 truncate">{selectedUser.email}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); set("userId", ""); setUserSearch(""); }} className="ml-auto text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <input
                autoFocus={userDropdown}
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserDropdown(true); }}
                onFocus={() => setUserDropdown(true)}
                placeholder="Search by name or email…"
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
              />
            )}
          </div>

          {userDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserDropdown(false)} />
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden max-h-56 overflow-y-auto">
                {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { set("userId", u.id); setUserDropdown(false); setUserSearch(""); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition text-left"
                  >
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center uppercase shrink-0">
                      {u.firstname?.[0] ?? "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.firstname} {u.lastname}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </button>
                )) : (
                  <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Currency + Amount row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Currency <span className="text-red-400">*</span>
          </label>
          <Select
            value={form.currency}
            onChange={(v) => set("currency", v)}
            options={currencyOptions}
            placeholder="Select currency…"
          />
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
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
            />
          </div>
        </div>
      </div>

      {/* Action type */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Action Type <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {actionOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("actionType", opt.value)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition ${form.actionType === opt.value
                  ? opt.value === "credit"
                    ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                    : "border-red-400 bg-red-50 ring-2 ring-red-100"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              {opt.icon}
              <div>
                <p className={`text-sm font-semibold ${form.actionType === opt.value
                    ? opt.value === "credit" ? "text-emerald-700" : "text-red-700"
                    : "text-gray-700"
                  }`}>{opt.label}</p>
                <p className="text-[10px] text-gray-400">{opt.description}</p>
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
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
        />
        <p className="text-[10px] text-gray-400 mt-1">Short label shown on transaction history</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="e.g. Refund for failed transaction TX-1234"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition resize-none"
        />
      </div>

      {/* Warning */}
      {form.actionType === "debit" && form.amount && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            You're about to <strong>debit {form.currency ? fmt(form.amount, form.currency) : form.amount}</strong> from this user's wallet. This cannot be undone.
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
        className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${form.actionType === "debit"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-emerald-600 hover:bg-emerald-700"
          }`}
      >
        {submitting ? (
          <><svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Processing…</>
        ) : (
          <>
            {form.actionType === "debit" ? <ArrowDownCircle size={15} /> : <ArrowUpCircle size={15} />}
            {form.actionType === "debit" ? "Debit Wallet" : form.actionType === "credit" ? "Credit Wallet" : "Adjust Balance"}
          </>
        )}
      </button>
    </form>
  );
};

// ── SECTION: Send Push Notification ──────────────────────────────────────────
const SEND_TO_OPTIONS = [
  { value: "all", label: "All Users", description: "Every registered user", icon: <Users size={14} className="text-blue-500 shrink-0" /> },
  { value: "active", label: "Active Users", description: "Currently active accounts", icon: <Users size={14} className="text-emerald-500 shrink-0" /> },
  { value: "inactive", label: "Inactive Users", description: "Dormant or unverified users", icon: <Users size={14} className="text-amber-500 shrink-0" /> },
  { value: "selected", label: "Selected Users", description: "Specific user IDs", icon: <Users size={14} className="text-purple-500 shrink-0" /> },
];

const PushSection = ({ users }) => {
  const [form, setForm] = useState({ title: "", body: "", sendTo: "all", userIds: [] });
  const [userSearch, setUserSearch] = useState("");
  const [userDropdown, setUserDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    return (
      u.firstname?.toLowerCase().includes(term) ||
      u.lastname?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }).slice(0, 20);

  const selectedUsers = users.filter((u) => form.userIds.includes(u.id));

  const toggleUserId = (id) => {
    set("userIds", form.userIds.includes(id)
      ? form.userIds.filter((x) => x !== id)
      : [...form.userIds, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return setError("Title and body are required.");
    if (form.sendTo === "selected" && form.userIds.length === 0) return setError("Select at least one user.");
    setError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { title: form.title.trim(), body: form.body.trim(), sendTo: form.sendTo };
      if (form.sendTo === "selected") payload.userIds = form.userIds;
      const res = await axios.post(
        `${API_BASE_URL}/superAdmin/users/send-push`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to send push notification.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError("");
    setForm({ title: "", body: "", sendTo: "all", userIds: [] });
    setUserSearch("");
  };

  if (result) return <PushResult data={result} onReset={reset} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Send To */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Send To <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SEND_TO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("sendTo", opt.value)}
              className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-left transition ${form.sendTo === opt.value
                  ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              {opt.icon}
              <div>
                <p className={`text-xs font-semibold ${form.sendTo === opt.value ? "text-blue-700" : "text-gray-700"}`}>{opt.label}</p>
                <p className="text-[10px] text-gray-400 leading-snug">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* User picker when "selected" */}
      {form.sendTo === "selected" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Pick Users <span className="text-red-400">*</span>
          </label>

          {/* Selected pills */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedUsers.map((u) => (
                <span key={u.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs font-medium text-purple-700">
                  {u.firstname} {u.lastname}
                  <button type="button" onClick={() => toggleUserId(u.id)} className="hover:text-purple-900"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white cursor-text" onClick={() => setUserDropdown(true)}>
              <Search size={13} className="text-gray-400 shrink-0" />
              <input
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserDropdown(true); }}
                onFocus={() => setUserDropdown(true)}
                placeholder="Search users to add…"
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
              />
            </div>
            {userDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto py-1">
                  {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { toggleUserId(u.id); setUserSearch(""); }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition text-left ${form.userIds.includes(u.id) ? "bg-purple-50/60" : ""}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center uppercase shrink-0">{u.firstname?.[0]}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{u.firstname} {u.lastname}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      {form.userIds.includes(u.id) && <span className="ml-auto text-purple-600 text-xs font-bold">✓</span>}
                    </button>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                  )}
                </div>
              </>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{form.userIds.length} user{form.userIds.length !== 1 ? "s" : ""} selected</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. System Update"
          maxLength={100}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
        />
        <p className="text-[10px] text-gray-400 mt-1 text-right">{form.title.length}/100</p>
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Message Body <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={3}
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          placeholder="e.g. We have upgraded our platform for better performance."
          maxLength={300}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition resize-none"
        />
        <p className="text-[10px] text-gray-400 mt-1 text-right">{form.body.length}/300</p>
      </div>

      {/* Preview */}
      {(form.title || form.body) && (
        <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50 space-y-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Preview</p>
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm max-w-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Bell size={10} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Airpero</span>
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
        {submitting ? (
          <><svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Sending…</>
        ) : (
          <><Send size={15} />Dispatch Push Notification</>
        )}
      </button>
    </form>
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function WalletTools() {
  const [activeTab, setActiveTab] = useState("wallet");
  const [currencies, setCurrencies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [currRes, userRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/superAdmin/currencies`, { headers }),
        axios.get(`${API_BASE_URL}/superAdmin/users`, { headers }),
      ]);
      setCurrencies((currRes.data?.data ?? []).filter((c) => c.isActive));
      setUsers(userRes.data?.data ?? []);
    } catch {
      setToast({ message: "Failed to load currencies or users.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const tabs = [
    { id: "wallet", label: "Adjust Wallet", icon: <Wallet size={15} />, color: "emerald" },
    { id: "push", label: "Push Notification", icon: <Bell size={15} />, color: "blue" },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-4 h-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading tools…
      </div>
    );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Admin Tools</h1>
          <p className="text-sm text-gray-400 mt-0.5">Wallet adjustments & push notifications</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === tab.id
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        {activeTab === "wallet" && (
          <>
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Wallet size={16} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Adjust Wallet Balance</h2>
                <p className="text-xs text-gray-400">Manually credit or debit any user's wallet</p>
              </div>
            </div>
            <AdjustWalletSection currencies={currencies} users={users} />
          </>
        )}

        {activeTab === "push" && (
          <>
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bell size={16} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Send Push Notification</h2>
                <p className="text-xs text-gray-400">Dispatch in-app push to any user segment</p>
              </div>
            </div>
            <PushSection users={users} />
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}