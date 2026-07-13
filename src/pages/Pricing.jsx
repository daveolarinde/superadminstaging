import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Plus, Pencil, RefreshCw, X, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Info, Globe,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ── constants ─────────────────────────────────────────────────────────────────
const SERVICE_NAMES = ["wallet_deposit", "payout", "card_creation", "card_decline", "conversion"];

const SERVICE_META = {
  wallet_deposit: { label: "Wallet Deposit",  color: "bg-blue-50 text-blue-700 border-blue-100",    dot: "bg-blue-400"    },
  payout:         { label: "Payout",          color: "bg-violet-50 text-violet-700 border-violet-100", dot: "bg-violet-400" },
  card_creation:  { label: "Card Creation",   color: "bg-amber-50 text-amber-700 border-amber-100",  dot: "bg-amber-400"  },
  card_decline:   { label: "Card Decline",    color: "bg-red-50 text-red-600 border-red-100",        dot: "bg-red-400"    },
  conversion:     { label: "Conversion",      color: "bg-teal-50 text-teal-700 border-teal-100",     dot: "bg-teal-400"   },
};

const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵" };
const sym = (code) => CURRENCY_SYMBOLS[code] ?? code ?? "";

const pctDisplay = (val) => `${(parseFloat(val || 0) * 100).toFixed(2)}%`;

// `currency` is a single field on the record itself, and can be:
//  - a plain code    → "NGN"
//  - a wildcard        → "*"        (applies to all currencies for this service)
//  - a FROM_TO pair     → "NGN_USD"  (conversion only, mirrors fromCurrency/toCurrency)
const isWildcard = (currency) => currency === "*";
const isPair     = (currency) => typeof currency === "string" && currency.includes("_") && currency !== "*";

const pairParts = (currency) => {
  const [from, to] = (currency || "").split("_");
  return { from, to };
};

// Fee amounts on a pair are denominated in the FROM currency; on a wildcard
// there's no single currency, so fall back to a neutral (no symbol) display.
const feeCurrencyFor = (c) => {
  if (isWildcard(c.currency)) return null;
  if (c.fromCurrency) return c.fromCurrency;
  if (isPair(c.currency)) return pairParts(c.currency).from;
  return c.currency;
};

const feeDisplay = (currency, val) => {
  const amt = parseFloat(val || 0).toFixed(2);
  return currency ? `${sym(currency)}${amt}` : amt;
};

const currencyLabel = (c) => {
  if (isWildcard(c.currency)) return "All currencies";
  if (c.fromCurrency && c.toCurrency) return `${c.fromCurrency} → ${c.toCurrency}`;
  if (isPair(c.currency)) {
    const { from, to } = pairParts(c.currency);
    return `${from} → ${to}`;
  }
  return c.currency || "—";
};

// Numeric fee/percentage fields, split so conversion (no provider side) can
// omit provider fields entirely rather than sending them as 0.
const PROVIDER_FIELDS = ["providerPercentage", "providerFixedFee", "providerMinCap", "providerMaxCap"];
const CUSTOMER_FIELDS = ["customerPercentage", "customerFixedFee", "customerMinCap", "customerMaxCap"];
const NUMERIC_FIELDS = [...PROVIDER_FIELDS, ...CUSTOMER_FIELDS];

const EMPTY_FORM = {
  serviceName:            "",
  currencyMode:           "single",   // "single" | "wildcard" | "pair" (pair = conversion only)
  currency:               "",
  fromCurrency:           "",
  toCurrency:              "",
  providerPercentage:     "",
  providerFixedFee:       "",
  providerMinCap:         "",
  providerMaxCap:         "",
  customerPercentage:     "",
  customerFixedFee:       "",
  customerMinCap:         "",
  customerMaxCap:         "",
  isActive:               true,
};

// ── helpers ───────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
      checked ? "bg-emerald-500" : "bg-gray-200"
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform ${
        checked ? "translate-x-[18px]" : "translate-x-0.5"
      }`}
    />
  </button>
);

// ── number input ──────────────────────────────────────────────────────────────
// Kept fully uncontrolled-string-friendly: an empty field stays empty (no
// forced 0), and only becomes a number when the parent actually needs one
// (on submit). This lets users clear a field without it snapping back to 0.
// placeholder defaults to "" so nothing is shown in the box until the user
// types something — no ghost "0" sitting in empty fields.
const NumInput = ({ label, hint, value, onChange, step = "0.0001", min = "0", max, placeholder = "" }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">
      {label}
      {hint && (
        <span className="ml-1 text-gray-400 font-normal">({hint})</span>
      )}
    </label>
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
    />
  </div>
);

// ── modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-10 pb-6 overflow-y-auto">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition mt-0.5"
        >
          <X size={15} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

// ── pricing form ──────────────────────────────────────────────────────────────
const PricingForm = ({ initial, currencies, onSubmit, submitting, isEdit }) => {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const isConversion = form.serviceName === "conversion";

  const handleSubmit = (e) => {
    e.preventDefault();

    // Resolve the `currency` string exactly as the API expects.
    let currency;
    let fromCurrency = null;
    let toCurrency = null;

    if (form.currencyMode === "wildcard") {
      currency = "*";
    } else if (form.currencyMode === "pair") {
      fromCurrency = form.fromCurrency || null;
      toCurrency = form.toCurrency || null;
      currency = fromCurrency && toCurrency ? `${fromCurrency}_${toCurrency}` : "";
    } else {
      currency = form.currency;
    }

    // Numeric fields: blank input → 0 only at submit time, never before.
    // Conversion has no provider side at all, so provider keys are simply
    // never added to the payload for it (not sent as 0, not sent as null —
    // just absent), matching what the backend expects.
    const numeric = {};
    CUSTOMER_FIELDS.forEach((key) => {
      numeric[key] = form[key] === "" || form[key] === null || form[key] === undefined
        ? 0
        : Number(form[key]);
    });
    if (!isConversion) {
      PROVIDER_FIELDS.forEach((key) => {
        numeric[key] = form[key] === "" || form[key] === null || form[key] === undefined
          ? 0
          : Number(form[key]);
      });
    }

    onSubmit({
      serviceName: form.serviceName,
      currency,
      fromCurrency,
      toCurrency,
      ...numeric,
      isActive: form.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service & Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Service Name</label>
          {isEdit ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${SERVICE_META[form.serviceName]?.dot ?? "bg-gray-400"}`} />
              <span className="text-sm font-semibold text-gray-700 capitalize">
                {SERVICE_META[form.serviceName]?.label ?? form.serviceName}
              </span>
              <span className="ml-auto text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">locked</span>
            </div>
          ) : (
            <select
              value={form.serviceName}
              onChange={(e) => {
                const serviceName = e.target.value;
                // conversion defaults to "pair" mode, everything else to "single"
                set("serviceName", serviceName);
                set("currencyMode", serviceName === "conversion" ? "pair" : "single");
              }}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            >
              <option value="">Select service…</option>
              {SERVICE_NAMES.map((s) => (
                <option key={s} value={s}>{SERVICE_META[s]?.label ?? s}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
          {isEdit ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">
                {isConversion && form.fromCurrency && form.toCurrency
                  ? `${form.fromCurrency} → ${form.toCurrency}`
                  : form.currencyMode === "wildcard" ? "All currencies" : form.currency}
              </span>
              <span className="ml-auto text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">locked</span>
            </div>
          ) : isConversion ? (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.fromCurrency}
                onChange={(e) => set("fromCurrency", e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">From…</option>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <select
                value={form.toCurrency}
                onChange={(e) => set("toCurrency", e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">To…</option>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={form.currencyMode === "wildcard" ? "*" : form.currency}
              onChange={(e) => {
                if (e.target.value === "*") {
                  set("currencyMode", "wildcard");
                  set("currency", "*");
                } else {
                  set("currencyMode", "single");
                  set("currency", e.target.value);
                }
              }}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            >
              <option value="">Select currency…</option>
              <option value="*">✱ All currencies (wildcard)</option>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isConversion && !isEdit && (
        <p className="text-[11px] text-gray-400 -mt-3">
          Both currencies in the pair must be active on the platform.
        </p>
      )}

      {/* Provider section — conversion has no provider side, hide it entirely */}
      {!isConversion && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
              Provider (Cost)
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NumInput
              label="Percentage"
              hint="0–1"
              value={form.providerPercentage}
              onChange={(v) => set("providerPercentage", v)}
              max="1"
            />
            <NumInput
              label="Fixed Fee"
              step="0.01"
              value={form.providerFixedFee}
              onChange={(v) => set("providerFixedFee", v)}
            />
            <NumInput
              label="Min Cap"
              step="0.01"
              value={form.providerMinCap}
              onChange={(v) => set("providerMinCap", v)}
            />
            <NumInput
              label="Max Cap"
              step="0.01"
              value={form.providerMaxCap}
              onChange={(v) => set("providerMaxCap", v)}
            />
          </div>
        </div>
      )}

      {/* Customer section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
            Customer (Sale)
          </span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <NumInput
            label="Percentage"
            hint="0–1, takes priority over fixed fee"
            value={form.customerPercentage}
            onChange={(v) => set("customerPercentage", v)}
            max="1"
          />
          <NumInput
            label="Fixed Fee"
            hint="used only if % = 0"
            step="0.01"
            value={form.customerFixedFee}
            onChange={(v) => set("customerFixedFee", v)}
          />
          <NumInput
            label="Min Cap"
            step="0.01"
            value={form.customerMinCap}
            onChange={(v) => set("customerMinCap", v)}
          />
          <NumInput
            label="Max Cap"
            step="0.01"
            value={form.customerMaxCap}
            onChange={(v) => set("customerMaxCap", v)}
          />
        </div>
      </div>

      {/* Margin preview */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Info size={11} className="text-gray-400" />
          {parseFloat(form.customerPercentage || 0) > 0
            ? "Customer fee is percent-based (capped by min/max)."
            : "Customer % is 0 or blank — flat customer fee applies."}
        </span>
      </div>

      {/* Active */}
      <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-700">Active</p>
          <p className="text-xs text-gray-400">This pricing rule is currently applied</p>
        </div>
        <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting && (
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {isEdit ? "Save Changes" : "Create Pricing Rule"}
      </button>
    </form>
  );
};

// ── service group ─────────────────────────────────────────────────────────────
const ServiceGroup = ({ serviceName, configs, onEdit }) => {
  const [open, setOpen] = useState(true);
  const meta = SERVICE_META[serviceName] ?? { label: serviceName, color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
  const isConversion = serviceName === "conversion";

  const headers = isConversion
    ? ["Currency", "Customer %", "Customer Fee", "C. Min", "C. Max", "Status", "Updated", ""]
    : [
        "Currency",
        "Provider %", "Provider Fee", "P. Min", "P. Max",
        "Customer %", "Customer Fee", "C. Min", "C. Max",
        "Status", "Updated", "",
      ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* group header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition text-left"
      >
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.color}`}>
          {meta.label}
        </span>
        <span className="text-xs text-gray-400 ml-1">{configs.length} rule{configs.length !== 1 ? "s" : ""}</span>
        <span className="ml-auto text-gray-400">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-50 overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {configs.map((c) => {
                const feeCurrency = feeCurrencyFor(c);
                const wildcard = isWildcard(c.currency);
                const pair = Boolean(c.fromCurrency && c.toCurrency) || isPair(c.currency);
                return (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {wildcard ? (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                            <Globe size={12} />
                          </span>
                        ) : !pair ? (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600 flex items-center justify-center">
                            {sym(c.currency)}
                          </span>
                        ) : null}
                        <span className="font-semibold text-gray-800">{currencyLabel(c)}</span>
                      </div>
                    </td>

                    {/* provider — omitted entirely for conversion, no data to show */}
                    {!isConversion && (
                      <>
                        <td className="px-4 py-3 text-orange-600 font-medium">{pctDisplay(c.providerPercentage)}</td>
                        <td className="px-4 py-3 text-orange-600">{feeDisplay(feeCurrency, c.providerFixedFee)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{feeDisplay(feeCurrency, c.providerMinCap)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{feeDisplay(feeCurrency, c.providerMaxCap)}</td>
                      </>
                    )}

                    {/* customer */}
                    <td className="px-4 py-3 text-emerald-600 font-medium">{pctDisplay(c.customerPercentage)}</td>
                    <td className="px-4 py-3 text-emerald-600">{feeDisplay(feeCurrency, c.customerFixedFee)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{feeDisplay(feeCurrency, c.customerMinCap)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{feeDisplay(feeCurrency, c.customerMaxCap)}</td>

                    {/* status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {c.updatedAt
                        ? new Date(c.updatedAt).toLocaleDateString(undefined, {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => onEdit(c)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
      type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
    }`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={13} /></button>
    </div>
  );
};

// ── main page ─────────────────────────────────────────────────────────────────
export default function Pricing() {
  const [configs, setConfigs]       = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState("");
  const [modal, setModal]           = useState(null);  // null | "create" | "edit"
  const [selected, setSelected]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (message, type = "success") => setToast({ message, type });

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const [pricingRes, currenciesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/superAdmin/pricing`,    { headers }),
        axios.get(`${API_BASE_URL}/superAdmin/currencies`, { headers }),
      ]);
      setConfigs(pricingRes.data?.data ?? []);
      // only active currencies for the form dropdown
      const allCurrencies = currenciesRes.data?.data ?? [];
      setCurrencies(allCurrencies.filter((c) => c.isActive));
    } catch {
      setError("Failed to load pricing configurations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  // ── save (POST handles both create & update) ───────────────────────────────
  const handleSave = async (payload) => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/superAdmin/pricing`, payload, { headers });
      const saved = res.data?.data ?? payload;
      const label = `${SERVICE_META[saved.serviceName]?.label ?? saved.serviceName} / ${currencyLabel(saved)}`;
      showToast(`${label} saved`);
      setModal(null);
      fetchAll(true);
    } catch (err) {
      const msg = err.response?.data?.error ?? err.response?.data?.message ?? "Failed to save pricing.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── group by service ───────────────────────────────────────────────────────
  const grouped = SERVICE_NAMES.reduce((acc, s) => {
    acc[s] = configs.filter((c) => c.serviceName === s);
    return acc;
  }, {});

  // stats
  const totalActive = configs.filter((c) => c.isActive).length;

  // ── render ─────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-4 h-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading pricing…
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-gray-500">
        <p>{error}</p>
        <button onClick={() => fetchAll()} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Service Pricing</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Provider cost & customer sale rules per service, currency, and conversion pair
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAll(true)}
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
            New Rule
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-800">{configs.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Rules</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-600">{totalActive}</p>
          <p className="text-xs text-gray-400 mt-0.5">Active</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-800">{configs.length - totalActive}</p>
          <p className="text-xs text-gray-400 mt-0.5">Inactive</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">
            {new Set(configs.map((c) => c.currency)).size}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Currency Rules</p>
        </div>
      </div>

      {/* ── Math model info banner ─────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3 text-xs text-blue-700">
        <Info size={14} className="mt-0.5 shrink-0 text-blue-400" />
        <div className="space-y-0.5">
          <p><strong>How charges are calculated:</strong> If Customer % &gt; 0, the fee is percent-based (clamped between Min/Max Cap). If Customer % = 0, the flat Customer Fixed Fee applies instead.</p>
          <p className="text-blue-500">Platform Profit = Customer Fee − Provider Fee. "*" currency rules apply as a fallback for any currency without a specific rule. All math runs server-side.</p>
        </div>
      </div>

      {/* ── Service groups ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {SERVICE_NAMES.map((service) => (
          grouped[service].length > 0 && (
            <ServiceGroup
              key={service}
              serviceName={service}
              configs={grouped[service]}
              onEdit={(c) => { setSelected(c); setModal("edit"); }}
            />
          )
        ))}
        {configs.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-sm text-gray-400">
            No pricing rules configured yet.{" "}
            <button
              onClick={() => { setSelected(null); setModal("create"); }}
              className="text-emerald-600 hover:underline"
            >
              Add the first one
            </button>
          </div>
        )}
      </div>

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      {modal === "create" && (
        <Modal
          title="New Pricing Rule"
          
          onClose={() => setModal(null)}
        >
          <PricingForm
            initial={EMPTY_FORM}
            currencies={currencies}
            onSubmit={handleSave}
            submitting={submitting}
            isEdit={false}
          />
        </Modal>
      )}

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      {modal === "edit" && selected && (
        <Modal
          title={`Edit — ${SERVICE_META[selected.serviceName]?.label ?? selected.serviceName} / ${currencyLabel(selected)}`}
          subtitle="serviceName and currency are locked (upsert key)"
          onClose={() => setModal(null)}
        >
          <PricingForm
            initial={{
              serviceName:            selected.serviceName,
              currencyMode:           isWildcard(selected.currency)
                                         ? "wildcard"
                                         : (selected.fromCurrency && selected.toCurrency) || isPair(selected.currency)
                                           ? "pair"
                                           : "single",
              currency:               selected.currency ?? "",
              fromCurrency:           selected.fromCurrency ?? (isPair(selected.currency) ? pairParts(selected.currency).from : ""),
              toCurrency:             selected.toCurrency ?? (isPair(selected.currency) ? pairParts(selected.currency).to : ""),
              providerPercentage:     selected.providerPercentage ?? "",
              providerFixedFee:       selected.providerFixedFee ?? "",
              providerMinCap:         selected.providerMinCap ?? "",
              providerMaxCap:         selected.providerMaxCap ?? "",
              customerPercentage:     selected.customerPercentage ?? "",
              customerFixedFee:       selected.customerFixedFee ?? "",
              customerMinCap:         selected.customerMinCap ?? "",
              customerMaxCap:         selected.customerMaxCap ?? "",
              isActive:               selected.isActive,
            }}
            currencies={currencies}
            onSubmit={handleSave}
            submitting={submitting}
            isEdit={true}
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