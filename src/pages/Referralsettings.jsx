import { useState, useEffect, useCallback } from "react";
import {
  Gift, RefreshCw, AlertCircle, Check, Percent, Hash,
  ToggleLeft, ToggleRight, Save,
} from "lucide-react";

const API_URL = import.meta.env.VITE_STAGE_API_URL;
const getToken = () => localStorage.getItem("token");

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (val, type) => {
  if (type === "percent") return `${parseFloat(val).toFixed(2)}%`;
  return `₦${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, hint }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

// ── Reward input ──────────────────────────────────────────────────────────────
const RewardInput = ({ label, value, onChange, rewardType }) => {
  const isPercent = rewardType === "percent";
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
          {isPercent ? "%" : "₦"}
        </span>
        <input
          type="number"
          min="0"
          max={isPercent ? 100 : undefined}
          step={isPercent ? "0.01" : "1"}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
        />
        {isPercent && Number(value) > 100 && (
          <p className="mt-1 text-xs text-red-500">Maximum is 100%</p>
        )}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ReferralSettings = () => {
  const [settings,  setSettings]  = useState(null);
  const [draft,     setDraft]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saved,     setSaved]     = useState(false);
  const [dirty,     setDirty]     = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/superAdmin/referral-settings`, {
        headers: { "Authorization": `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch referral settings.");
      setSettings(json.data);
      setDraft({ ...json.data });
      setDirty(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Draft helpers ────────────────────────────────────────────────────────
  const update = (key, val) => {
    setDraft(prev => {
      const next = { ...prev, [key]: val };
      // if switching to percent, clamp rewards to 100
      if (key === "rewardType" && val === "percent") {
        next.referrerReward = Math.min(parseFloat(prev.referrerReward) || 0, 100).toString();
        next.referredReward = Math.min(parseFloat(prev.referredReward) || 0, 100).toString();
      }
      return next;
    });
    setDirty(true);
    setSaveError(null);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft) return;

    // Validate percent max
    if (draft.rewardType === "percent") {
      if (parseFloat(draft.referrerReward) > 100 || parseFloat(draft.referredReward) > 100) {
        setSaveError("Reward percentages cannot exceed 100%.");
        return;
      }
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        thresholdAmount: Number(draft.thresholdAmount),
        rewardType:      draft.rewardType,
        referrerReward:  Number(draft.referrerReward),
        referredReward:  Number(draft.referredReward),
        currency:        "NGN",
        isOneTime:       draft.isOneTime,
        isActive:        draft.isActive,
      };

      const res  = await fetch(`${API_URL}/superAdmin/referral-settings`, {
        method:  "PUT",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data?.message || "Failed to save settings.");
      } else {
        setSettings({ ...draft });
        setDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setSaveError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft({ ...settings });
    setDirty(false);
    setSaveError(null);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/60 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading referral settings…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/60 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-6 py-8 flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <AlertCircle size={32} className="text-red-400" />
          <div>
            <p className="text-sm font-bold text-gray-800">Failed to load</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const isPercent = draft?.rewardType === "percent";

  return (
    <div className="min-h-screen bg-gray-50/60 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Gift size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Referral Settings</h1>
              <p className="text-xs text-gray-400">Configure the global referral reward system</p>
            </div>
          </div>
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Status banner ── */}
        <div className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border ${
          draft?.isActive
            ? "bg-emerald-50 border-emerald-100"
            : "bg-gray-100 border-gray-200"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${draft?.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
            <p className={`text-sm font-semibold ${draft?.isActive ? "text-emerald-700" : "text-gray-500"}`}>
              Referral program is {draft?.isActive ? "active" : "inactive"}
            </p>
          </div>
          <button
            onClick={() => update("isActive", !draft?.isActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              draft?.isActive
                ? "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {draft?.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>

        {/* ── Reward type ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-800">Reward Type</p>
            <p className="text-xs text-gray-400 mt-0.5">How rewards are calculated and distributed</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "fixed",
                  icon: Hash,
                  label: "Fixed Amount",
                  desc: "Reward is a fixed currency value",
                },
                {
                  value: "percent",
                  icon: Percent,
                  label: "Percentage",
                  desc: "Reward is a % of threshold (max 100%)",
                },
              ].map(opt => {
                const Icon = opt.icon;
                const active = draft?.rewardType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => update("rewardType", opt.value)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition ${
                      active
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      active ? "bg-blue-600" : "bg-gray-200"
                    }`}>
                      <Icon size={15} className={active ? "text-white" : "text-gray-500"} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${active ? "text-blue-700" : "text-gray-700"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{opt.desc}</p>
                    </div>
                    {active && (
                      <Check size={14} className="text-blue-600 ml-auto shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Reward amounts ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-800">Reward Amounts</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isPercent
                ? "Percentage of threshold awarded to each party (0–100%)"
                : "Fixed amount awarded to each party in " + draft?.currency}
            </p>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <RewardInput
              label="Referrer Reward"
              value={draft?.referrerReward ?? ""}
              onChange={val => update("referrerReward", val)}
              rewardType={draft?.rewardType}
            />
            <RewardInput
              label="Referred Reward"
              value={draft?.referredReward ?? ""}
              onChange={val => update("referredReward", val)}
              rewardType={draft?.rewardType}
            />
          </div>
        </div>

        {/* ── Threshold & currency ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-800">Threshold & Currency</p>
            <p className="text-xs text-gray-400 mt-0.5">Minimum transaction amount to qualify for referral reward</p>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Threshold Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
                  {draft?.currency === "USD" ? "$" : "₦"}
                </span>
                <input
                  type="number"
                  min="0"
                  value={draft?.thresholdAmount ?? ""}
                  onChange={e => update("thresholdAmount", e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-gray-500">
                NGN — Nigerian Naira
              </div>
            </div>
          </div>
        </div>

        {/* ── Behaviour toggles ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-800">Behaviour</p>
            <p className="text-xs text-gray-400 mt-0.5">Control how and when referral rewards are applied</p>
          </div>
          <div className="px-5 py-2">
            <Toggle
              checked={draft?.isOneTime ?? true}
              onChange={val => update("isOneTime", val)}
              label="One-time reward"
              hint="Each user can only receive the referral reward once"
            />
            <Toggle
              checked={draft?.isActive ?? false}
              onChange={val => update("isActive", val)}
              label="Program active"
              hint="Enable or disable the entire referral program"
            />
          </div>
        </div>

        {/* ── Save error ── */}
        {saveError && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{saveError}</p>
          </div>
        )}

        {/* ── Action bar ── */}
        {dirty && (
          <div className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              You have unsaved changes
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscard}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Saved confirmation ── */}
        {saved && !dirty && (
          <div className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <Check size={15} className="text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">Settings saved successfully</p>
          </div>
        )}

        {/* ── Live preview ── */}
        {draft && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-gray-800">Live Preview</p>
              <p className="text-xs text-gray-400 mt-0.5">How the referral reward reads with current settings</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                When a referred user completes a transaction of at least{" "}
                <span className="font-semibold text-gray-800">
                  {draft.currency === "USD" ? "$" : "₦"}{Number(draft.thresholdAmount).toLocaleString()}
                </span>
                , the referrer receives{" "}
                <span className="font-semibold text-blue-600">{fmt(draft.referrerReward, draft.rewardType)}</span>
                {" "}and the referred user receives{" "}
                <span className="font-semibold text-blue-600">{fmt(draft.referredReward, draft.rewardType)}</span>.
                {draft.isOneTime && (
                  <span className="text-gray-400"> This reward is granted once per user.</span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  draft.isActive
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${draft.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {draft.isActive ? "Active" : "Inactive"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                  {draft.rewardType === "percent" ? <Percent size={10} /> : <Hash size={10} />}
                  {draft.rewardType === "percent" ? "Percentage" : "Fixed"} reward
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 ring-1 ring-gray-200">
                  {draft.currency}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReferralSettings;