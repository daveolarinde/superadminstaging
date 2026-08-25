import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import countryList from "country-list";
import { Globe2, Plus, ChevronLeft, Pencil, Trash2, RefreshCw, Power, Search } from "lucide-react";

const API_URL = import.meta.env.VITE_STAGE_URL;
const getToken = () => localStorage.getItem("token");
const authHeader = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

// All ISO 3166-1 alpha-2 countries, e.g. [{ code: "KE", name: "Kenya" }, ...]
const ALL_COUNTRIES = countryList.getData().sort((a, b) => a.name.localeCompare(b.name));

// ── Input ─────────────────────────────────────────────────────────────────────
const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <input
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
      {...props}
    />
  </div>
);

// ── Select ────────────────────────────────────────────────────────────────────
const Select = ({ label, options, ...props }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <select
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
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

// ── Country combobox (searchable dropdown) ─────────────────────────────────────
// Native <select> has no search, so this is a small custom combobox: text
// input filters a dropdown list of countries by name or code.
const CountryCombobox = ({ options, value, onChange, disabled, placeholder = "Search country..." }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = React.useRef(null);

  const selected = options.find((o) => o.value === value) || null;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected ? `${selected.name} (${selected.value})` : placeholder}
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a country name or code..."
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-gray-400">No matches.</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition ${opt.value === value ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                    }`}
                >
                  <span>{opt.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{opt.value}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Toggle switch ──────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, disabled }) => (
  <div className="flex items-center justify-between">
    {label && <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${checked ? "bg-emerald-500" : "bg-gray-200"
        }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  </div>
);

// ── Status badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
        : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
      }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
    {isActive ? "Active" : "Inactive"}
  </span>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingCountries() {
  const [tab, setTab] = useState("list"); // list | create | view
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "active" | "inactive"

  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [toast, setToast] = useState(null); // { type, message }
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Create form
  const [newCountry, setNewCountry] = useState(""); // selected code, e.g. "MZ"
  const [newActive, setNewActive] = useState(true);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/superAdmin/onboarding-countries`, authHeader());
      setCountries(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching onboarding countries:", err);
      showToast("error", "Failed to fetch onboarding countries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // ── Derived / filtered list ─────────────────────────────────────────────────
  const filteredCountries = useMemo(() => {
    let list = countries;
    if (statusFilter === "active") list = list.filter((c) => c.isActive);
    if (statusFilter === "inactive") list = list.filter((c) => !c.isActive);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)
      );
    }
    return list.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, statusFilter, search]);

  const activeCount = countries.filter((c) => c.isActive).length;
  const inactiveCount = countries.length - activeCount;

  // Countries not yet added to the onboarding list, for the create dropdown.
  const existingCodes = useMemo(() => new Set(countries.map((c) => c.code)), [countries]);
  const availableCountryOptions = useMemo(() => {
    return ALL_COUNTRIES
      .filter((c) => !existingCodes.has(c.code))
      .map((c) => ({ value: c.code, name: c.name }));
  }, [existingCodes]);

  const selectedNewCountry = useMemo(
    () => ALL_COUNTRIES.find((c) => c.code === newCountry) || null,
    [newCountry]
  );

  // ── Create ────────────────────────────────────────────────────────────────
  const createCountry = async () => {
    if (!selectedNewCountry) return showToast("error", "Select a country.");
    const code = selectedNewCountry.code.trim().toUpperCase();
    const name = selectedNewCountry.name.trim();

    try {
      setSaving(true);
      const payload = { code, name, isActive: newActive };
      console.log("POST /superAdmin/onboarding-countries payload:", payload); // temp debug log
      const res = await axios.post(
        `${API_URL}/superAdmin/onboarding-countries`,
        payload,
        authHeader()
      );
      setCountries((prev) => [res.data.data, ...prev]);
      setNewCountry("");
      setNewActive(true);
      setTab("list");
      showToast("success", "Onboarding country created successfully.");
    } catch (err) {
      console.error("Create failed:", err?.response?.data || err);
      showToast("error", err?.response?.data?.message || "Error creating onboarding country.");
    } finally {
      setSaving(false);
    }
  };

  // ── View / edit ───────────────────────────────────────────────────────────
  const openCountry = (country) => {
    setSelected(country);
    setEditName(country.name);
    setEditActive(country.isActive);
    setTab("view");
  };

  const updateCountry = async () => {
    if (!selected || saving) return;
    const name = editName.trim();
    if (!name) return showToast("error", "Country name is required.");

    try {
      setSaving(true);
      const payload = { name, isActive: editActive };
      console.log("PUT /superAdmin/onboarding-countries/" + selected.id + " payload:", payload); // temp debug log
      const res = await axios.put(
        `${API_URL}/superAdmin/onboarding-countries/${selected.id}`,
        payload,
        authHeader()
      );
      const updated = res.data.data;
      setCountries((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelected(updated);
      showToast("success", "Onboarding country updated successfully.");
    } catch (err) {
      console.error("Update failed:", err?.response?.data || err);
      showToast("error", err?.response?.data?.message || "Error updating onboarding country.");
    } finally {
      setSaving(false);
    }
  };

  // ── Quick toggle from the list (isActive only) ──────────────────────────────
  const quickToggleActive = async (country) => {
    try {
      setTogglingId(country.id);
      const res = await axios.put(
        `${API_URL}/superAdmin/onboarding-countries/${country.id}`,
        { name: country.name, isActive: !country.isActive },
        authHeader()
      );
      const updated = res.data.data;
      setCountries((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selected?.id === updated.id) {
        setSelected(updated);
        setEditActive(updated.isActive);
      }
      showToast(
        "success",
        `${updated.name} is now ${updated.isActive ? "active" : "inactive"}.`
      );
    } catch (err) {
      console.error("Toggle failed:", err);
      showToast("error", "Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteCountry = async () => {
    if (!selected) return;
    if (!window.confirm(`Permanently delete ${selected.name} (${selected.code})? This cannot be undone. Existing users registered under this country are unaffected.`)) {
      return;
    }
    try {
      setDeleting(true);
      console.log("DELETE /superAdmin/onboarding-countries/" + selected.id); // temp debug log
      await axios.delete(`${API_URL}/superAdmin/onboarding-countries/${selected.id}`, authHeader());
      setCountries((prev) => prev.filter((c) => c.id !== selected.id));
      setSelected(null);
      setTab("list");
      showToast("success", "Onboarding country deleted successfully.");
    } catch (err) {
      console.error("Delete failed:", err?.response?.data || err);
      showToast("error", err?.response?.data?.message || "Error deleting onboarding country.");
    } finally {
      setDeleting(false);
    }
  };

  const thCls = "px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider";
  const tdCls = "px-5 py-4 text-sm text-gray-700";

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">
      {/* ── Toast ── */}
      {toast && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-sm border transition-all ${toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
            }`}
        >
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto text-xs opacity-50 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Onboarding Countries</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage which countries users can register from</p>
        </div>
        {tab !== "view" && (
          <button
            onClick={fetchCountries}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        )}
      </div>

      {/* ── Summary cards ── */}
      {tab === "list" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-2.5">
              <Globe2 size={15} className="text-indigo-600" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Countries</p>
            <p className="text-lg font-bold text-gray-900">{countries.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2.5">
              <Power size={15} className="text-emerald-600" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Active</p>
            <p className="text-lg font-bold text-gray-900">{activeCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mb-2.5">
              <Power size={15} className="text-gray-400" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Inactive</p>
            <p className="text-lg font-bold text-gray-900">{inactiveCount}</p>
          </div>
        </div>
      )}

      {/* ── Tab switcher ── */}
      {tab !== "view" && (
        <div className="flex gap-2">
          <button
            onClick={() => setTab("list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition shadow-sm ${tab === "list" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
          >
            <Globe2 size={14} /> All Countries
          </button>
          <button
            onClick={() => setTab("create")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition shadow-sm ${tab === "create" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
          >
            <Plus size={14} /> Add Country
          </button>
        </div>
      )}

      {/* ── LIST ── */}
      {tab === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* ── Search + status filter bar ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-200 bg-white shrink-0">
              {[
                { value: "", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === opt.value ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-gray-400">Loading countries…</p>
            </div>
          ) : filteredCountries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-3xl">🌍</p>
              <p className="text-sm font-medium text-gray-500">
                {search || statusFilter ? "No countries match your filters" : "No onboarding countries found"}
              </p>
              {search || statusFilter ? (
                <button
                  onClick={() => { setSearch(""); setStatusFilter(""); }}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              ) : (
                <button onClick={() => setTab("create")} className="mt-1 text-xs text-blue-600 hover:underline">
                  Add one now
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className={thCls}>Code</th>
                    <th className={thCls}>Country</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Last Updated</th>
                    <th className={thCls}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCountries.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className={tdCls}>
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold font-mono">
                          {c.code}
                        </span>
                      </td>
                      <td className={`${tdCls} font-semibold text-gray-900`}>{c.name}</td>
                      <td className={tdCls}>
                        <StatusBadge isActive={c.isActive} />
                      </td>
                      <td className={`${tdCls} text-gray-400 text-xs`}>{c.updatedAt?.split("T")[0]}</td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openCountry(c)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => quickToggleActive(c)}
                            disabled={togglingId === c.id}
                            title={c.isActive ? "Deactivate" : "Activate"}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${c.isActive
                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                          >
                            <Power size={11} />
                            {togglingId === c.id ? "…" : c.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
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
          <p className="text-sm font-bold text-gray-800 mb-1">Add Onboarding Country</p>
          <p className="text-xs text-gray-400 -mt-3">
            Search and pick a country below — code and name are set automatically. Takes effect
            immediately once created.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Country *
            </label>
            <CountryCombobox
              options={availableCountryOptions}
              value={newCountry}
              onChange={setNewCountry}
              placeholder="Search country by name or code..."
            />
          </div>

          <Toggle label="Active on creation" checked={newActive} onChange={setNewActive} />

          {selectedNewCountry && (
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-700">
              <Globe2 size={14} />
              <span>
                <strong>{selectedNewCountry.code}</strong> — {selectedNewCountry.name}
                <span className="ml-1 text-blue-500">({newActive ? "active" : "inactive"} on creation)</span>
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setTab("list"); setNewCountry(""); setNewActive(true); }}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={createCountry}
              disabled={saving || !newCountry}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Creating…
                </>
              ) : (
                <><Plus size={14} /> Add Country</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW / EDIT ── */}
      {tab === "view" && selected && (
        <div className="max-w-md space-y-5">
          <button
            onClick={() => { setTab("list"); setSelected(null); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <ChevronLeft size={15} /> Back to countries
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">Edit Country</p>
              <StatusBadge isActive={selected.isActive} />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <span className="px-3 py-1.5 rounded-xl bg-indigo-100 text-indigo-700 text-sm font-bold font-mono">
                {selected.code}
              </span>
              <div>
                <p className="text-xs text-gray-400">Country code</p>
                <p className="text-xs text-gray-400">Set at creation — not editable</p>
              </div>
            </div>

            <Input
              label="Country Name *"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <Toggle
              label="Active"
              checked={editActive}
              onChange={setEditActive}
            />

            {!editActive && (
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 leading-relaxed">
                Deactivating stops new registrations from {selected.name} immediately. Users who already
                registered under this country are entirely unaffected.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={updateCountry}
                disabled={saving || deleting}
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
                onClick={deleteCountry}
                disabled={saving || deleting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-red-300 border-t-red-600 animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Delete
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center pt-1">
              Deleting is permanent. Prefer deactivating for a reversible pause.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}