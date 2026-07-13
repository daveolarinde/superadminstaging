import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { ArrowLeftRight, Plus, ChevronLeft, Pencil, Trash2, RefreshCw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("token");

// ── Overview rate card ────────────────────────────────────────────────────────
const RateOverviewCard = ({ from, to, ask }) => {
  const formatted = Number(ask).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">{from}</span>
          <ArrowLeftRight size={12} className="text-gray-400" />
          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">{to}</span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
          <ArrowLeftRight size={14} className="text-indigo-600" />
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-1">1 {from} equals</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{formatted}</p>
      <p className="text-xs text-gray-400 mt-0.5">{to}</p>
    </div>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────
const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <input
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition"
      {...props}
    />
  </div>
);

// ── Select ────────────────────────────────────────────────────────────────────
const Select = ({ label, options, ...props }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <select
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition appearance-none"
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const MARGIN_OPERATION_OPTIONS = [
  { value: "add", label: "Addition" },
  { value: "subtract", label: "Subtract" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExchangeRates() {
  const [tab, setTab] = useState("list");

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  // System currencies (from /superAdmin/currencies)
  const [currencies, setCurrencies] = useState([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);

  // Live rates state
  const [liveRates, setLiveRates] = useState([]);           // array of fetched { from, to, ask }
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [liveFrom, setLiveFrom] = useState("");
  const [liveTo, setLiveTo] = useState("");
  const [liveFetching, setLiveFetching] = useState(false);
  const [liveError, setLiveError] = useState("");

  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  // Create form
  const [baseCurrency, setBaseCurrency] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("");
  const [rate, setRate] = useState("");
  const [margin, setMargin] = useState("");
  const [marginOperation, setMarginOperation] = useState("add");

  // Edit
  const [editRate, setEditRate] = useState("");
  const [editMargin, setEditMargin] = useState("");
  const [editMarginOperation, setEditMarginOperation] = useState("add");

  // ── List filter state ────────────────────────────────────────────────────
  const [filterCurrency, setFilterCurrency] = useState("");

  // ── Converter state ────────────────────────────────────────────────────────
  const [fromCur, setFromCur] = useState("NGN");
  const [toCur, setToCur] = useState("USD");
  const [fromAmount, setFromAmount] = useState("1000");
  const [toAmount, setToAmount] = useState("");
  const [lastEdited, setLastEdited] = useState("from");

  // ── Fetch rates list ────────────────────────────────────────────────────────
  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/superAdmin/exchange-rates`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setRates(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching rates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch system currencies ─────────────────────────────────────────────────
  const fetchCurrencies = useCallback(async () => {
    try {
      setCurrenciesLoading(true);
      const res = await axios.get(`${API_URL}/superAdmin/currencies`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setCurrencies(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching currencies:", err);
    } finally {
      setCurrenciesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    fetchCurrencies();
  }, [fetchRates, fetchCurrencies]);

  // ── Currency options built from /superAdmin/currencies ─────────────────────
  const currencyOptions = useMemo(() => {
    const active = currencies.filter((c) => c.isActive !== false);
    return [
      { value: "", label: "Select currency..." },
      ...active
        .slice()
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
    ];
  }, [currencies]);

  // Plain list of active currency codes (for filter dropdown, etc.)
  const currencyCodes = useMemo(
    () => currencyOptions.filter((opt) => opt.value).map((opt) => opt.value),
    [currencyOptions]
  );

  // ── Filtered rates for the list table ───────────────────────────────────
  const filteredRates = useMemo(() => {
    if (!filterCurrency) return rates;
    return rates.filter(
      (r) => r.baseCurrency === filterCurrency || r.targetCurrency === filterCurrency
    );
  }, [rates, filterCurrency]);

  // ── Fetch a single WeWire live rate ────────────────────────────────────────
  const fetchWeWireRate = useCallback(async (from, to) => {
    if (!from || !to) return;
    if (from === to) { setLiveError("From and To currencies must be different"); return; }
    try {
      setLiveFetching(true);
      setLiveError("");
      const res = await axios.get(`${API_URL}/users/wewire/rates`, {
        params: { from, to },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = res.data?.data;
      if (data) {
        setLiveRates((prev) => {
          // Replace existing entry for same pair or append
          const exists = prev.findIndex((r) => r.from === data.from && r.to === data.to);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = data;
            return updated;
          }
          return [data, ...prev];
        });
      }
    } catch (err) {
      console.error(`Error fetching WeWire rate ${from}-${to}:`, err);
      setLiveError("Failed to fetch rate. Please try again.");
    } finally {
      setLiveFetching(false);
    }
  }, []);

  // ── Converter active rate (looks up in liveRates array) ───────────────────
  const activeRate = useMemo(() => {
    const entry = liveRates.find((r) => r.from === fromCur && r.to === toCur);
    const n = Number(entry?.ask);
    return Number.isFinite(n) ? n : null;
  }, [fromCur, toCur, liveRates]);

  useEffect(() => {
    if (!activeRate) return;
    if (lastEdited === "from") {
      const amt = Number(String(fromAmount).replace(/,/g, ""));
      if (Number.isFinite(amt) && amt >= 0) setToAmount((amt * activeRate).toFixed(2));
      else setToAmount("");
    } else {
      const amt = Number(String(toAmount).replace(/,/g, ""));
      if (Number.isFinite(amt) && amt >= 0) setFromAmount((amt / activeRate).toFixed(2));
      else setFromAmount("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRate, fromCur, toCur]);

  const handleFromAmountChange = (e) => {
    const val = e.target.value;
    setLastEdited("from");
    setFromAmount(val);
    if (!activeRate) return;
    const amt = Number(String(val).replace(/,/g, ""));
    if (Number.isFinite(amt) && amt >= 0) setToAmount((amt * activeRate).toFixed(2));
    else setToAmount("");
  };

  const handleToAmountChange = (e) => {
    const val = e.target.value;
    setLastEdited("to");
    setToAmount(val);
    if (!activeRate) return;
    const amt = Number(String(val).replace(/,/g, ""));
    if (Number.isFinite(amt) && amt >= 0) setFromAmount((amt / activeRate).toFixed(2));
    else setFromAmount("");
  };

  const formatRate = (rateVal) => {
    const n = Number(rateVal);
    if (!Number.isFinite(n)) return "—";
    if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
  };

  const swap = () => {
    setFromCur((prev) => (prev === "NGN" ? "USD" : "NGN"));
    setToCur((prev) => (prev === "USD" ? "NGN" : "USD"));
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setLastEdited("from");
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const viewRate = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/superAdmin/exchange-rates/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = res.data.data;
      setSelected(data);
      setEditRate(String(data.rate));
      setEditMargin(String(data.margin ?? ""));
      setEditMarginOperation(data.marginOperation || "add");
      setTab("view");
    } catch (err) {
      console.error("Error loading rate:", err);
    } finally {
      setLoading(false);
    }
  };

  const createRate = async () => {
    if (!baseCurrency || !targetCurrency) return alert("Base and target currencies are required");
    if (!margin) return alert("Margin is required");
    try {
      const res = await axios.post(
        `${API_URL}/superAdmin/exchange-rates`,
        {
          baseCurrency,
          targetCurrency,
          ...(rate ? { rate: rate.trim() } : {}),
          margin: Number(margin),
          marginOperation,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setRates((prev) => [res.data.data, ...prev]);
      setBaseCurrency("");
      setTargetCurrency("");
      setRate("");
      setMargin("");
      setMarginOperation("add");
      setTab("list");
    } catch (err) {
      console.error("Create failed:", err);
      alert("Error creating rate");
    }
  };

  const updateRate = async () => {
    if (!selected || saving) return;
    if (!editMargin) return alert("Margin is required");
    try {
      setSaving(true);
      const res = await axios.put(
        `${API_URL}/superAdmin/exchange-rates/${selected.id}`,
        {
          rate: editRate.trim(),
          margin: Number(editMargin),
          marginOperation: editMarginOperation,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const updated = res.data.data;
      setRates((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelected(updated);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Error updating rate");
    } finally {
      setSaving(false);
    }
  };

  const deleteRate = async () => {
    if (!selected || !window.confirm("Delete this rate?")) return;
    try {
      await axios.delete(`${API_URL}/superAdmin/exchange-rates/${selected.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setRates((prev) => prev.filter((r) => r.id !== selected.id));
      setSelected(null);
      setTab("list");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Error deleting rate");
    }
  };

  const thCls = "px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider";
  const tdCls = "px-5 py-4 text-sm text-gray-700";

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Exchange Rates</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage currency exchange rates</p>
        </div>
        <button
          onClick={() => { fetchRates(); fetchCurrencies(); }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Live Rates section (list tab only) ── */}
      {tab === "list" && (
        <div className="space-y-4">
          {/* Live rate lookup */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Live Rates</p>
              <p className="text-xs text-gray-400">Fetch real-time WeWire rates for any currency pair</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="From"
                options={currencyOptions}
                value={liveFrom}
                onChange={(e) => setLiveFrom(e.target.value)}
                disabled={currenciesLoading}
              />
              <Select
                label="To"
                options={currencyOptions}
                value={liveTo}
                onChange={(e) => setLiveTo(e.target.value)}
                disabled={currenciesLoading}
              />
            </div>

            {liveError && (
              <p className="text-xs text-red-500">{liveError}</p>
            )}

            <button
              onClick={() => fetchWeWireRate(liveFrom, liveTo)}
              disabled={!liveFrom || !liveTo || liveFetching}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              {liveFetching ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Fetching…
                </>
              ) : (
                <><RefreshCw size={13} /> Get Rate</>
              )}
            </button>

            {/* Fetched rate cards */}
            {liveRates.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {liveRates.map((r) => (
                  <RateOverviewCard key={`${r.from}-${r.to}`} from={r.from} to={r.to} ask={r.ask} />
                ))}
              </div>
            )}
          </div>

          {/* ── Converter block ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Quick Convert</p>
                <p className="text-xs text-gray-400">Calculated from fetched WeWire rates</p>
              </div>
              <button
                onClick={swap}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition flex items-center gap-2 text-xs font-semibold"
              >
                <ArrowLeftRight size={14} /> Swap
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Amount ({fromCur})
                </label>
                <input
                  value={fromAmount}
                  onChange={handleFromAmountChange}
                  inputMode="decimal"
                  placeholder="e.g. 1000"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Amount ({toCur})
                </label>
                <input
                  value={toAmount}
                  onChange={handleToAmountChange}
                  inputMode="decimal"
                  placeholder="e.g. 0.72"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition"
                />
                <p className="text-[11px] text-gray-400 mt-2">
                  Rate: 1 {fromCur} ={" "}
                  <span className="font-semibold text-gray-700">{formatRate(activeRate)}</span> {toCur}
                  {!activeRate && (
                    <span className="ml-1 text-amber-500">— fetch this pair above first</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => { setFromCur("NGN"); setToCur("USD"); setLastEdited("from"); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  fromCur === "NGN" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                NGN → USD
              </button>
              <button
                onClick={() => { setFromCur("USD"); setToCur("NGN"); setLastEdited("from"); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  fromCur === "USD" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                USD → NGN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab switcher ── */}
      {tab !== "view" && (
        <div className="flex gap-2">
          <button
            onClick={() => setTab("list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition shadow-sm ${
              tab === "list" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ArrowLeftRight size={14} /> All Rates
          </button>
          <button
            onClick={() => setTab("create")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition shadow-sm ${
              tab === "create" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Plus size={14} /> Create New
          </button>
        </div>
      )}

      {/* ── LIST ── */}
      {tab === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* ── Filter bar ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <p className="text-xs font-semibold text-gray-500">
              {filterCurrency ? `Showing ${filterCurrency} pairs (${filteredRates.length})` : `Showing all rates (${rates.length})`}
            </p>
            <div className="w-44">
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">All currencies</option>
                {currencyCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-gray-400">Loading rates…</p>
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-3xl">💱</p>
              <p className="text-sm font-medium text-gray-500">
                {filterCurrency ? `No rates found for ${filterCurrency}` : "No rates found"}
              </p>
              {filterCurrency ? (
                <button onClick={() => setFilterCurrency("")} className="mt-1 text-xs text-blue-600 hover:underline">
                  Clear filter
                </button>
              ) : (
                <button onClick={() => setTab("create")} className="mt-1 text-xs text-blue-600 hover:underline">
                  Create one now
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className={thCls}>Base</th>
                    <th className={thCls}>Target</th>
                    <th className={thCls}>Rate</th>
                    <th className={thCls}>Margin</th>
                    <th className={thCls}>Operation</th>
                    <th className={thCls}>Last Updated</th>
                    <th className={thCls}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRates.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className={tdCls}>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">{r.baseCurrency}</span>
                      </td>
                      <td className={tdCls}>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">{r.targetCurrency}</span>
                      </td>
                      <td className={`${tdCls} font-mono font-semibold text-gray-900`}>{r.rate}</td>
                      <td className={`${tdCls} font-mono text-gray-700`}>{r.margin != null ? r.margin : "—"}</td>
                      <td className={tdCls}>
                        {r.marginOperation ? (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            r.marginOperation === "add" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}>
                            {r.marginOperation === "add" ? "Addition" : "Subtract"}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className={`${tdCls} text-gray-400 text-xs`}>{r.updatedAt?.split("T")[0]}</td>
                      <td className={tdCls}>
                        <button
                          onClick={() => viewRate(r.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE ── */}
      {tab === "create" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-md space-y-4">
          <p className="text-sm font-bold text-gray-800 mb-1">New Exchange Rate</p>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Base Currency"
              options={currencyOptions}
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              disabled={currenciesLoading}
            />
            <Select
              label="Target Currency"
              options={currencyOptions}
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              disabled={currenciesLoading}
            />
          </div>

          <Input
            label="Rate (optional)"
            type="number"
            placeholder="e.g. 1580.00"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Margin *"
              type="number"
              placeholder="e.g. 5"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
            <Select
              label="Margin Operation *"
              options={MARGIN_OPERATION_OPTIONS}
              value={marginOperation}
              onChange={(e) => setMarginOperation(e.target.value)}
            />
          </div>

          {baseCurrency && targetCurrency && (
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-700">
              <ArrowLeftRight size={14} />
              <span>
                <strong>{baseCurrency}</strong> → <strong>{targetCurrency}</strong>
                {rate && <span className="mx-1">@ {rate}</span>}
                {margin && (
                  <span className="ml-1 text-blue-500">
                    ({marginOperation === "add" ? "+" : "−"}{margin}% margin)
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setTab("list")}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={createRate}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
            >
              Create Rate
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW / EDIT ── */}
      {tab === "view" && selected && (
        <div className="max-w-md space-y-5">
          <button
            onClick={() => setTab("list")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <ChevronLeft size={15} /> Back to rates
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <p className="text-sm font-bold text-gray-800">Edit Rate</p>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-700 text-sm font-bold">{selected.baseCurrency}</span>
              <ArrowLeftRight size={16} className="text-gray-400" />
              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-bold">{selected.targetCurrency}</span>
            </div>

            <Input
              label="Rate"
              type="number"
              value={editRate}
              onChange={(e) => setEditRate(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Margin *"
                type="number"
                placeholder="e.g. 5"
                value={editMargin}
                onChange={(e) => setEditMargin(e.target.value)}
              />
              <Select
                label="Margin Operation *"
                options={MARGIN_OPERATION_OPTIONS}
                value={editMarginOperation}
                onChange={(e) => setEditMarginOperation(e.target.value)}
              />
            </div>

            {editRate && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                <ArrowLeftRight size={14} />
                <span>
                  1 <strong>{selected.baseCurrency}</strong> = <strong>{editRate}</strong> {selected.targetCurrency}
                  {editMargin && (
                    <span className="ml-1 text-blue-500">
                      ({editMarginOperation === "add" ? "+" : "−"}{editMargin}% margin)
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={updateRate}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Saving…
                  </>
                ) : (
                  <><Pencil size={13} /> Save Changes</>
                )}
              </button>
              <button
                onClick={deleteRate}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}