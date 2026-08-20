import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Globe, CheckCircle2, XCircle, RefreshCw, X } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ── helpers ───────────────────────────────────────────────────────────────────
const SYMBOL_FALLBACKS = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵" };
const resolveSymbol = (code, raw) =>
  raw && !raw.includes("?") ? raw : SYMBOL_FALLBACKS[code] ?? code;

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 ${checked ? "bg-emerald-500" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
    />
  </button>
);

// ── empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  code: "",
  name: "",
  symbol: "",
  isActive: true,
  isVirtualAccountSupported: false,
  transferNote: "",
};

// ── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    />
    <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
        >
          <X size={15} />
        </button>
      </div>
      <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

// ── Form ──────────────────────────────────────────────────────────────────────
const COMMON_CURRENCIES = [
  { code: "NGN", name: "Nigerian Naira" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound Sterling" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "ZAR", name: "South African Rand" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "AED", name: "UAE Dirham" },
  { code: "custom", name: "Custom / Other…" },
];

const SYMBOL_MAP = {
  NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵",
  ZAR: "R", KES: "KSh", CAD: "$", AUD: "$", JPY: "¥",
  CNY: "¥", AED: "د.إ",
};

const CurrencyForm = ({ initial, onSubmit, submitting, isEdit }) => {
  const [form, setForm] = useState(initial);
  const [codeMode, setCodeMode] = useState(
    isEdit ? "custom" : (COMMON_CURRENCIES.find((c) => c.code === initial.code) ? initial.code : "custom")
  );

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleCodeSelect = (val) => {
    setCodeMode(val);
    if (val !== "custom") {
      const found = COMMON_CURRENCIES.find((c) => c.code === val);
      setForm((p) => ({
        ...p,
        code: val,
        name: found?.name ?? p.name,
        symbol: SYMBOL_MAP[val] ?? p.symbol,
      }));
    } else {
      setForm((p) => ({ ...p, code: "", name: "", symbol: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isCustom = codeMode === "custom";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Currency Code — dropdown for new, locked for edit */}
      {isEdit ? (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Currency Code</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <Globe size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{form.code}</span>
            <span className="ml-auto text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">locked</span>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Currency Code</label>
          <select
            value={codeMode}
            onChange={(e) => handleCodeSelect(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            required
          >
            <option value="">Select a currency…</option>
            {COMMON_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code === "custom" ? c.name : `${c.code} — ${c.name}`}</option>
            ))}
          </select>
          {isCustom && (
            <input
              type="text"
              placeholder="e.g. XOF"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              required
              className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
            />
          )}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Currency Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Nigerian Naira"
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      {/* Symbol */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Symbol</label>
        <input
          type="text"
          value={form.symbol}
          onChange={(e) => set("symbol", e.target.value)}
          placeholder="e.g. ₦"
          required
          maxLength={5}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      {/* Transfer Note — plain text, sent to backend as string */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Transfer Note <span className="text-gray-300 font-normal">(optional)</span>
        </label>
        <textarea
          value={form.transferNote}
          onChange={(e) => set("transferNote", e.target.value)}
          placeholder="e.g. Please ensure to include transaction reference when sending ZAR."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 min-h-[80px] resize-none"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Shown to users as guidance for this currency.
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">Active</p>
            <p className="text-xs text-gray-400">Currency is live and usable</p>
          </div>
          <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} />
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">Virtual Account Support</p>
            <p className="text-xs text-gray-400">Allow virtual accounts in this currency</p>
          </div>
          <Toggle
            checked={form.isVirtualAccountSupported}
            onChange={(v) => set("isVirtualAccountSupported", v)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {submitting && (
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {isEdit ? "Save Changes" : "Create Currency"}
      </button>
    </form>
  );
};

// ── Delete confirm ────────────────────────────────────────────────────────────
const DeleteConfirm = ({ currency, onConfirm, onCancel, submitting }) => (
  <div className="text-center space-y-4">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
      <Trash2 size={20} className="text-red-500" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-800">
        Delete <span className="font-bold">{currency.code}</span>?
      </p>
      <p className="text-xs text-gray-400 mt-1">
        This permanently removes <strong>{currency.name}</strong> from the system. This action cannot be undone.
      </p>
    </div>
    <div className="flex gap-2 pt-1">
      <button
        onClick={onCancel}
        className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={submitting}
        className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting && (
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        Yes, Delete
      </button>
    </div>
  </div>
);

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in ${type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-red-500 text-white"
        }`}
    >
      {type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={13} />
      </button>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Currencies() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // modal state
  const [modal, setModal] = useState(null); // null | "create" | "edit" | "delete"
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // toast
  const [toast, setToast] = useState(null); // { message, type }

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (message, type = "success") => setToast({ message, type });

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchCurrencies = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/currencies`, { headers });
      setCurrencies(res.data?.data ?? []);
    } catch {
      setError("Failed to load currencies.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCurrencies(); }, []);

  // ── create ─────────────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/superAdmin/currencies`, form, { headers });
      showToast(`${form.code} created successfully`);
      setModal(null);
      fetchCurrencies(true);
    } catch (err) {
      showToast(err.response?.data?.message ?? "Failed to create currency.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── update ─────────────────────────────────────────────────────────────────
  const handleUpdate = async (form) => {
    setSubmitting(true);
    try {
      const { name, symbol, isActive, isVirtualAccountSupported, transferNote } = form;
      await axios.put(
        `${API_BASE_URL}/superAdmin/currencies/${selected.id}`,
        { name, symbol, isActive, isVirtualAccountSupported, transferNote },
        { headers }
      );
      showToast(`${selected.code} updated successfully`);
      setModal(null);
      fetchCurrencies(true);
    } catch (err) {
      showToast(err.response?.data?.message ?? "Failed to update currency.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await axios.delete(`${API_BASE_URL}/superAdmin/currencies/${selected.id}`, { headers });
      showToast(`${selected.code} deleted`);
      setModal(null);
      fetchCurrencies(true);
    } catch (err) {
      showToast(err.response?.data?.message ?? "Failed to delete currency.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── derived ────────────────────────────────────────────────────────────────
  const activeCount = currencies.filter((c) => c.isActive).length;
  const vaCount = currencies.filter((c) => c.isVirtualAccountSupported).length;

  // ── render ─────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-4 h-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading currencies…
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-gray-500">
        <p>{error}</p>
        <button
          onClick={() => fetchCurrencies()}
          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Currencies</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage system-wide currency configurations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCurrencies(true)}
            disabled={refreshing}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => { setSelected(null); setModal("create"); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Plus size={15} />
            Add Currency
          </button>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: currencies.length, color: "text-gray-800" },
          { label: "Active", value: activeCount, color: "text-emerald-600" },
          { label: "Virtual Account", value: vaCount, color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Currency", "Name", "Symbol", "Active", "Virtual Acct", "Created", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currencies.length > 0 ? (
                currencies.map((c) => {
                  const symbol = resolveSymbol(c.code, c.symbol);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">

                      {/* Currency code + symbol badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                            {symbol}
                          </div>
                          <span className="font-semibold text-gray-800">{c.code}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{c.name}</td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-base text-gray-700">{symbol}</span>
                      </td>

                      {/* Active toggle — inline quick-edit */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={c.isActive}
                            onChange={async (val) => {
                              try {
                                await axios.put(
                                  `${API_BASE_URL}/superAdmin/currencies/${c.id}`,
                                  { name: c.name, symbol: c.symbol, isActive: val, isVirtualAccountSupported: c.isVirtualAccountSupported, transferNote: c.transferNote },
                                  { headers }
                                );
                                fetchCurrencies(true);
                                showToast(`${c.code} ${val ? "activated" : "deactivated"}`);
                              } catch {
                                showToast("Failed to update status.", "error");
                              }
                            }}
                          />
                          <span className={`text-xs font-medium ${c.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                            {c.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* Virtual account toggle — inline quick-edit */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={c.isVirtualAccountSupported}
                            onChange={async (val) => {
                              try {
                                await axios.put(
                                  `${API_BASE_URL}/superAdmin/currencies/${c.id}`,
                                  { name: c.name, symbol: c.symbol, isActive: c.isActive, isVirtualAccountSupported: val, transferNote: c.transferNote },
                                  { headers }
                                );
                                fetchCurrencies(true);
                                showToast(`${c.code} virtual account ${val ? "enabled" : "disabled"}`);
                              } catch {
                                showToast("Failed to update.", "error");
                              }
                            }}
                          />
                          <span className={`text-xs font-medium ${c.isVirtualAccountSupported ? "text-blue-600" : "text-gray-400"}`}>
                            {c.isVirtualAccountSupported ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelected(c); setModal("edit"); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { setSelected(c); setModal("delete"); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <Globe size={32} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">No currencies configured yet</p>
                    <button
                      onClick={() => { setSelected(null); setModal("create"); }}
                      className="mt-3 text-sm text-emerald-600 hover:underline"
                    >
                      Add the first one
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {modal === "create" && (
        <Modal title="Add Currency" onClose={() => setModal(null)}>
          <CurrencyForm
            initial={EMPTY_FORM}
            onSubmit={handleCreate}
            submitting={submitting}
            isEdit={false}
          />
        </Modal>
      )}

      {modal === "edit" && selected && (
        <Modal title={`Edit ${selected.code}`} onClose={() => setModal(null)}>
          <CurrencyForm
            initial={{
              code: selected.code,
              name: selected.name,
              symbol: resolveSymbol(selected.code, selected.symbol),
              isActive: selected.isActive,
              isVirtualAccountSupported: selected.isVirtualAccountSupported,
              transferNote: selected.transferNote ?? "",
            }}
            onSubmit={handleUpdate}
            submitting={submitting}
            isEdit={true}
          />
        </Modal>
      )}

      {modal === "delete" && selected && (
        <Modal title="Confirm Deletion" onClose={() => setModal(null)}>
          <DeleteConfirm
            currency={selected}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            submitting={submitting}
          />
        </Modal>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}