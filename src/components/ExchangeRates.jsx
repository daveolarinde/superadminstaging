import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { ArrowLeftRight, Plus, ChevronLeft, Pencil, Trash2, RefreshCw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("token");

// ── Rate pill UI (matches screenshot style) ───────────────────────────────────
const RatePill = ({ pair, value }) => {
  const [base, target] = String(pair || "").split("-");

  const formatted = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value ?? "");

    // Big numbers like 1390.50 -> 2dp
    if (n >= 1) {
      return n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    // Small numbers like 0.0007407407 -> show as 0.000740 (6 dp)
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    });
  }, [value]);

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white/70 backdrop-blur border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
              <ArrowLeftRight size={16} className="text-gray-500" />
            </div>

            <p className="text-sm text-gray-600 truncate">
              <span className="text-gray-500">1 </span>
              <span className="font-semibold text-gray-900">{base}</span>
              <span className="text-gray-500"> = </span>
              <span className="font-semibold text-gray-900">{formatted}</span>
              <span className="text-gray-500"> </span>
              <span className="font-semibold text-gray-900">{target}</span>
            </p>
          </div>

          {/* <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition shrink-0"
            aria-label="Refresh rate"
            title="Refresh"
          >
            <RefreshCw size={16} className="text-gray-600" />
          </button> */}
        </div>
      </div>
    </div>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────
const Input = ({ label, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
    )}
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

  // ✅ FIX: map backend swapped keys to correct display labels (NO MATH / NO inversion)
  // backend:
  //   NGN-USD: 1390.5  -> should display as USD-NGN
  //   USD-NGN: 0.0007407407 -> should display as NGN-USD
  const overviewPairs = useMemo(() => {
    const usdNgnDisplayValue = overviewRates["NGN-USD"]; // big number
    const ngnUsdDisplayValue = overviewRates["USD-NGN"]; // small number

    const pairs = [];
    if (usdNgnDisplayValue !== undefined) pairs.push(["USD-NGN", usdNgnDisplayValue]);
    if (ngnUsdDisplayValue !== undefined) pairs.push(["NGN-USD", ngnUsdDisplayValue]);

    return pairs;
  }, [overviewRates]);

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

      {/* ── Overview (list tab only) ── */}
      {tab === "list" && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Live Rates</p>

          {overviewLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="w-full max-w-md mx-auto h-12 rounded-full bg-white border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : overviewPairs.length > 0 ? (
            <div className="space-y-3">
              {overviewPairs.map(([pair, value]) => (
                <RatePill key={pair} pair={pair} value={value} onRefresh={() => fetchOverviewRates()} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400">No exchange rate data available</p>
            </div>
          )}
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