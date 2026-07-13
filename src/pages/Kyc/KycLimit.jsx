import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Pencil, X, Check, RefreshCw, AlertCircle, ChevronRight } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");

const TIER_LABELS = {
  0: { label: "Tier 0", desc: "Unverified",         color: "bg-gray-100 text-gray-500 ring-1 ring-gray-200"          },
  1: { label: "Tier 1", desc: "Basic KYC",           color: "bg-blue-50 text-blue-600 ring-1 ring-blue-200"           },
  2: { label: "Tier 2", desc: "Intermediate KYC",    color: "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"     },
  3: { label: "Tier 3", desc: "Advanced KYC",        color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"  },
  4: { label: "Tier 4", desc: "Premium KYC",         color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"        },
};

const fmt = (val) =>
  Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Editable field ────────────────────────────────────────────────────────────
const EditableField = ({ label, value, editing, fieldKey, draft, onChange }) => (
  <div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
    {editing ? (
      <input
        type="number"
        min="0"
        value={draft[fieldKey] ?? ""}
        onChange={e => onChange(fieldKey, e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition font-mono"
      />
    ) : (
      <p className="text-sm font-semibold text-gray-800 font-mono">{fmt(value)}</p>
    )}
  </div>
);

// ── Tier Card ─────────────────────────────────────────────────────────────────
const TierCard = ({ tierData, currency, onSave }) => {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState({});
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState(null);
  const [success, setSuccess]   = useState(false);

  const meta = TIER_LABELS[tierData.tier] || { label: `Tier ${tierData.tier}`, desc: "", color: "bg-gray-100 text-gray-500" };

  const startEdit = () => {
    setDraft({
      dailyLimit:          tierData.dailyLimit,
      monthlyLimit:        tierData.monthlyLimit,
      perTransactionLimit: tierData.perTransactionLimit,
    });
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setError(null); };

  const handleChange = (key, val) => setDraft(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        dailyLimit:          Number(draft.dailyLimit),
        monthlyLimit:        Number(draft.monthlyLimit),
        perTransactionLimit: Number(draft.perTransactionLimit),
      };
      const res  = await fetch(`${API_URL}/superAdmin/tier-limits/${tierData.tier}/${currency}`, {
        method:  "PUT",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to update limits.");
      } else {
        setSuccess(true);
        setEditing(false);
        onSave(tierData.tier, currency, body);
        setTimeout(() => setSuccess(false), 2500);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      editing ? "border-blue-200 ring-2 ring-blue-50" : "border-gray-100"
    }`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-xs text-gray-400">{meta.desc}</span>
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Check size={12} /> Saved
            </span>
          )}
          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
            >
              <Pencil size={11} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition"
              >
                <X size={13} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? (
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={11} />
                )}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-3 gap-4 px-5 py-4">
        <EditableField
          label="Daily Limit"
          value={tierData.dailyLimit}
          editing={editing}
          fieldKey="dailyLimit"
          draft={draft}
          onChange={handleChange}
        />
        <EditableField
          label="Monthly Limit"
          value={tierData.monthlyLimit}
          editing={editing}
          fieldKey="monthlyLimit"
          draft={draft}
          onChange={handleChange}
        />
        <EditableField
          label="Per Transaction"
          value={tierData.perTransactionLimit}
          editing={editing}
          fieldKey="perTransactionLimit"
          draft={draft}
          onChange={handleChange}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mx-5 mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
          <AlertCircle size={13} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const KycLimit = () => {
  const [data,           setData]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [activeCurrency, setActiveCurrency] = useState(null);

  const fetchLimits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/superAdmin/tier-limits`, {
        headers: { "Authorization": `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch tier limits.");
      setData(json.data);

      // Currencies come straight from the backend response
      const currencies = [...new Set(json.data.map(d => d.currency))].sort();
      setActiveCurrency(prev =>
        prev && currencies.includes(prev) ? prev : (currencies[0] ?? null)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLimits(); }, [fetchLimits]);

  // Optimistically update local data after a save
  const handleSave = (tier, currency, updated) => {
    setData(prev =>
      prev.map(item =>
        item.tier === tier && item.currency === currency
          ? { ...item, ...updated }
          : item
      )
    );
  };

  const currencies = [...new Set(data.map(d => d.currency))].sort();

  const tiersForCurrency = data
    .filter(d => d.currency === activeCurrency)
    .sort((a, b) => a.tier - b.tier);

  return (
    <div className="min-h-screen bg-gray-50/60 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">KYC Tier Limits</h1>
              <p className="text-xs text-gray-400">Manage transaction limits per KYC tier and currency</p>
            </div>
          </div>
          <button
            onClick={fetchLimits}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Currency tabs ── */}
        {currencies.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-gray-100 shadow-sm w-fit">
            {currencies.map(cur => (
              <button
                key={cur}
                onClick={() => setActiveCurrency(cur)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                  activeCurrency === cur
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        )}

        {/* ── States ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading tier limits…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50 border border-red-100">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Failed to load</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
            <button
              onClick={fetchLimits}
              className="ml-auto text-xs font-semibold text-red-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && currencies.length === 0 && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-100 border border-gray-200">
            <AlertCircle size={16} className="text-gray-400 shrink-0" />
            <p className="text-sm text-gray-500">No tier limits returned by the backend yet.</p>
          </div>
        )}

        {/* ── Tier cards ── */}
        {!loading && !error && (
          <div className="space-y-3">
            {tiersForCurrency.map(tierData => (
              <TierCard
                key={`${tierData.tier}-${tierData.currency}`}
                tierData={tierData}
                currency={activeCurrency}
                onSave={handleSave}
              />
            ))}
          </div>
        )}

        {/* ── Info note ── */}
        {!loading && !error && currencies.length > 0 && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
            <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600 leading-relaxed">
              Set limits to <span className="font-semibold">0</span> to effectively disable transactions for that tier.
              Changes take effect immediately after saving.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KycLimit;