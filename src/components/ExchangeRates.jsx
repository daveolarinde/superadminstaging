import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { ArrowLeftRight, Plus, ChevronLeft, Pencil, Trash2, RefreshCw } from "lucide-react";

const API_URL = import.meta.env.VITE_STAGE_API_URL;
const getToken = () => localStorage.getItem("token");

// ── Overview rate card ────────────────────────────────────────────────────────
const RateOverviewCard = ({ pair, value }) => {
  const [base, target] = pair.split("-");
  const formatted = Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">{base}</span>
          <ArrowLeftRight size={12} className="text-gray-400" />
          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">{target}</span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
          <ArrowLeftRight size={14} className="text-indigo-600" />
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-1"> {base} equals</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{formatted}</p>
      <p className="text-xs text-gray-400 mt-0.5">{target}</p>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExchangeRates() {
  const [tab, setTab] = useState("list");

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overviewRates, setOverviewRates] = useState({});
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  // Create form
  const [baseCurrency, setBaseCurrency] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("");
  const [rate, setRate] = useState("");

  // Edit
  const [editRate, setEditRate] = useState("");

  // ── Converter state ────────────────────────────────────────────────────────
  const [fromCur, setFromCur] = useState("NGN");
  const [toCur, setToCur] = useState("USD");
  const [fromAmount, setFromAmount] = useState("1000");
  const [toAmount, setToAmount] = useState("");
  const [lastEdited, setLastEdited] = useState("from"); // "from" | "to"

  // ── Fetch ───────────────────────────────────────────────────────────────────
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

  const fetchOverviewRates = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const res = await axios.get(`${API_URL}/superAdmin/rates`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setOverviewRates(res.data?.data?.rates || {});
    } catch (err) {
      console.error("Error fetching overview rates:", err);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    fetchOverviewRates();
  }, [fetchRates, fetchOverviewRates]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const viewRate = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/superAdmin/exchange-rates/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSelected(res.data.data);
      setEditRate(String(res.data.data.rate));
      setTab("view");
    } catch (err) {
      console.error("Error loading rate:", err);
    } finally {
      setLoading(false);
    }
  };

  const createRate = async () => {
    if (!baseCurrency || !targetCurrency || !rate) return alert("All fields are required");
    try {
      const res = await axios.post(
        `${API_URL}/superAdmin/exchange-rates`,
        { baseCurrency, targetCurrency, rate: rate.trim() },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setRates((prev) => [res.data.data, ...prev]);
      fetchOverviewRates();
      setBaseCurrency("");
      setTargetCurrency("");
      setRate("");
      setTab("list");
    } catch (err) {
      console.error("Create failed:", err);
      alert("Error creating rate");
    }
  };

  const updateRate = async () => {
    if (!selected || saving) return;
    try {
      setSaving(true);
      const res = await axios.put(
        `${API_URL}/superAdmin/exchange-rates/${selected.id}`,
        { rate: editRate.trim() },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const updated = res.data.data;
      setRates((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelected(updated);
      fetchOverviewRates();
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
      fetchOverviewRates();
      setSelected(null);
      setTab("list");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Error deleting rate");
    }
  };

  const thCls = "px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider";
  const tdCls = "px-5 py-4 text-sm text-gray-700";

  const overviewPairs = Object.entries(overviewRates).filter(([pair]) =>
    ["USD-NGN", "NGN-USD"].includes(pair.toUpperCase())
  );

  // ── Normalize swapped backend rates ───────────────────────────────────────
  const normalized = useMemo(() => {
    const usdToNgn = Number(overviewRates?.["NGN-USD"]);
    const ngnToUsd = Number(overviewRates?.["USD-NGN"]);

    return {
      usdToNgn: Number.isFinite(usdToNgn) ? usdToNgn : null,
      ngnToUsd: Number.isFinite(ngnToUsd) ? ngnToUsd : null,
    };
  }, [overviewRates]);

  const activeRate = useMemo(() => {
    if (fromCur === "USD" && toCur === "NGN") return normalized.usdToNgn;
    if (fromCur === "NGN" && toCur === "USD") return normalized.ngnToUsd;
    return null;
  }, [fromCur, toCur, normalized]);

  // ── Sync the "other" input whenever activeRate, fromAmount, or toAmount changes ──
  useEffect(() => {
    if (!activeRate) return;

    if (lastEdited === "from") {
      const amt = Number(String(fromAmount).replace(/,/g, ""));
      if (Number.isFinite(amt) && amt >= 0) {
        setToAmount((amt * activeRate).toFixed(2));
      } else {
        setToAmount("");
      }
    } else {
      const amt = Number(String(toAmount).replace(/,/g, ""));
      if (Number.isFinite(amt) && amt >= 0) {
        setFromAmount((amt / activeRate).toFixed(2));
      } else {
        setFromAmount("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRate, fromCur, toCur]);

  const handleFromAmountChange = (e) => {
    const val = e.target.value;
    setLastEdited("from");
    setFromAmount(val);
    if (!activeRate) return;
    const amt = Number(String(val).replace(/,/g, ""));
    if (Number.isFinite(amt) && amt >= 0) {
      setToAmount((amt * activeRate).toFixed(2));
    } else {
      setToAmount("");
    }
  };

  const handleToAmountChange = (e) => {
    const val = e.target.value;
    setLastEdited("to");
    setToAmount(val);
    if (!activeRate) return;
    const amt = Number(String(val).replace(/,/g, ""));
    if (Number.isFinite(amt) && amt >= 0) {
      setFromAmount((amt / activeRate).toFixed(2));
    } else {
      setFromAmount("");
    }
  };

  const formatRate = (rateVal) => {
    const n = Number(rateVal);
    if (!Number.isFinite(n)) return "—";
    if (n >= 1) {
      return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
  };

  const swap = () => {
    setFromCur((prev) => (prev === "NGN" ? "USD" : "NGN"));
    setToCur((prev) => (prev === "USD" ? "NGN" : "USD"));
    // Also swap the displayed amounts
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setLastEdited("from");
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Exchange Rates</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage currency exchange rates</p>
        </div>
        <button
          onClick={() => {
            fetchRates();
            fetchOverviewRates();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Overview cards (list tab only) ── */}
      {tab === "list" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Live Rates</p>
            {overviewLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
                ))}
              </div>
            ) : overviewPairs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {overviewPairs.map(([pair, value]) => (
                  <RateOverviewCard key={pair} pair={pair} value={value} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-sm text-gray-400">No exchange rate data available</p>
              </div>
            )}
          </div>

          {/* ── Converter block (bi-directional) ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Quick Convert</p>
                <p className="text-xs text-gray-400">Calculated from your rate table</p>
              </div>

              <button
                onClick={swap}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition flex items-center gap-2 text-xs font-semibold"
              >
                <ArrowLeftRight size={14} /> Swap
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FROM input */}
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

              {/* TO input — now editable */}
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
                  Rate: 1 {fromCur} = <span className="font-semibold text-gray-700">{formatRate(activeRate)}</span> {toCur}
                </p>
              </div>
            </div>

            {/* Currency toggles */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => {
                  setFromCur("NGN");
                  setToCur("USD");
                  setLastEdited("from");
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  fromCur === "NGN"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                NGN → USD
              </button>
              <button
                onClick={() => {
                  setFromCur("USD");
                  setToCur("NGN");
                  setLastEdited("from");
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  fromCur === "USD"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                USD → NGN
              </button>

              <button
                onClick={fetchOverviewRates}
                className="ml-auto px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
              >
                <RefreshCw size={13} /> Update rate
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
              tab === "list"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ArrowLeftRight size={14} /> All Rates
          </button>
          <button
            onClick={() => setTab("create")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition shadow-sm ${
              tab === "create"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Plus size={14} /> Create New
          </button>
        </div>
      )}

      {/* ── LIST ── */}
      {tab === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-gray-400">Loading rates…</p>
            </div>
          ) : rates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-3xl">💱</p>
              <p className="text-sm font-medium text-gray-500">No rates found</p>
              <button onClick={() => setTab("create")} className="mt-1 text-xs text-blue-600 hover:underline">
                Create one now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className={thCls}>Base</th>
                    <th className={thCls}>Target</th>
                    <th className={thCls}>Rate</th>
                    <th className={thCls}>Last Updated</th>
                    <th className={thCls}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rates.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className={tdCls}>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                          {r.baseCurrency}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                          {r.targetCurrency}
                        </span>
                      </td>
                      <td className={`${tdCls} font-mono font-semibold text-gray-900`}>{r.rate}</td>
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
            <Input
              label="Base Currency"
              placeholder="USD"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
            />
            <Input
              label="Target Currency"
              placeholder="NGN"
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value.toUpperCase())}
            />
          </div>
          <Input
            label="Rate"
            type="number"
            placeholder="e.g. 1580.00"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />

          {baseCurrency && targetCurrency && rate && (
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-700">
              <ArrowLeftRight size={14} />
              <span>
                1 <strong>{baseCurrency}</strong> = <strong>{rate}</strong> {targetCurrency}
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

            {/* Pair display */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-700 text-sm font-bold">
                {selected.baseCurrency}
              </span>
              <ArrowLeftRight size={16} className="text-gray-400" />
              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-bold">
                {selected.targetCurrency}
              </span>
            </div>

            <Input label="Rate" type="number" value={editRate} onChange={(e) => setEditRate(e.target.value)} />

            {editRate && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                <ArrowLeftRight size={14} />
                <span>
                  1 <strong>{selected.baseCurrency}</strong> = <strong>{editRate}</strong> {selected.targetCurrency}
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
                  <>
                    <Pencil size={13} /> Save Changes
                  </>
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