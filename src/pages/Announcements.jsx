import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Plus, RefreshCw, Megaphone, ImageIcon, Images, FileText,
  Edit2, Eye, EyeOff, X, Upload, Trash2, ChevronLeft, ChevronRight, ExternalLink
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_STAGE_API_URL

// ── Helpers ───────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const PLACEMENT_OPTIONS = [
  { value: "",                   label: "Select placement…" },
  { value: "home_dashboard",     label: "Home Dashboard"     },
  { value: "wallet_screen",      label: "Wallet Screen"      },
  { value: "referral_page",      label: "Referral Page"      },
  { value: "transaction_history",label: "Transaction History"},
  { value: "transfer_screen",    label: "Transfer Screen"    },
  { value: "kyc_banner",         label: "KYC Banner"         },
  { value: "login_popup",        label: "Login Popup"        },
];

const TYPE_META = {
  single_image: { label: "Single Image",  icon: <ImageIcon size={14} />,  color: "bg-violet-50 text-violet-600 ring-1 ring-violet-200" },
  carousel:     { label: "Carousel",      icon: <Images size={14} />,     color: "bg-blue-50 text-blue-600 ring-1 ring-blue-200"       },
  other:        { label: "Other",         icon: <FileText size={14} />,   color: "bg-amber-50 text-amber-600 ring-1 ring-amber-200"    },
};

const STATUS_META = {
  active:   { cls: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  inactive: { cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",         dot: "bg-gray-400"   },
};

// ── Sub-components ────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const m = TYPE_META[type] || TYPE_META.other;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status?.toLowerCase()] || STATUS_META.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {status}
    </span>
  );
};

// Image preview carousel inside table cell
const MediaPreview = ({ media = [], type }) => {
  const [idx, setIdx] = useState(0);
  if (!media.length) return <span className="text-gray-300 text-xs">No media</span>;

  if (type === "single_image" || media.length === 1) {
    return (
      <img
        src={media[0]}
        alt="preview"
        className="w-14 h-10 object-cover rounded-lg border border-gray-100"
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setIdx((i) => Math.max(0, i - 1))}
        disabled={idx === 0}
        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
      >
        <ChevronLeft size={12} />
      </button>
      <img
        src={media[idx]}
        alt={`slide ${idx + 1}`}
        className="w-14 h-10 object-cover rounded-lg border border-gray-100"
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <button
        onClick={() => setIdx((i) => Math.min(media.length - 1, i + 1))}
        disabled={idx === media.length - 1}
        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
      >
        <ChevronRight size={12} />
      </button>
      <span className="text-xs text-gray-400">{idx + 1}/{media.length}</span>
    </div>
  );
};

// ── File Drop Zone ────────────────────────────────────────────────────────────
const FileDropZone = ({ label, multiple, files, onChange, onRemove }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    onChange(multiple ? dropped : [dropped[0]]);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
        }`}
      >
        <Upload size={20} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => onChange(Array.from(e.target.files))}
        />
      </div>

      {/* Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(f)}
                alt=""
                className="w-20 h-16 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
              <p className="text-xs text-gray-400 truncate max-w-[80px] mt-0.5">{f.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Announcement Form Modal ───────────────────────────────────────────────────
const AnnouncementModal = ({ open, onClose, onSaved, editData }) => {
  const isEdit = !!editData;
  const [form, setForm] = useState({
    name: "", type: "single_image", placement: "", actionUrl: "", status: "active",
  });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        name:      editData.name      || "",
        type:      editData.type      || "single_image",
        placement: editData.placement || "",
        actionUrl: editData.actionUrl || "",
        status:    editData.status    || "active",
      });
    } else {
      setForm({ name: "", type: "single_image", placement: "", actionUrl: "", status: "active" });
    }
    setFiles([]);
    setError("");
  }, [editData, open]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required");
    if (!isEdit && form.type !== "other" && files.length === 0)
      return setError("Please upload at least one image");
    if (form.type === "single_image" && files.length > 1)
      return setError("Single image type allows only one image");

    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name",      form.name);
      fd.append("type",      form.type);
      fd.append("placement", form.placement);
      fd.append("actionUrl", form.actionUrl);
      fd.append("status",    form.status);
      files.forEach((f) => fd.append("media", f));

      if (isEdit) {
        await axios.put(`${API_BASE_URL}/superadmin/announcements/${editData.id}`, fd, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${API_BASE_URL}/superadmin/announcements`, fd, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || `Failed to ${isEdit ? "update" : "create"} announcement`);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Megaphone size={15} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? "Edit Announcement" : "New Announcement"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Summer Promo Banner"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-300"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_META).map(([val, meta]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { set("type", val); setFiles([]); }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.type === val
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">
                    {val === "single_image" ? "🖼️" : val === "carousel" ? "🎠" : "📄"}
                  </span>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media upload — conditional on type */}
          {form.type === "single_image" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Image {!isEdit && "*"}
              </label>
              <FileDropZone
                label="Drop or click to upload one image"
                multiple={false}
                files={files}
                onChange={(f) => setFiles([f[0]])}
                onRemove={() => setFiles([])}
              />
              {isEdit && editData?.media?.length > 0 && files.length === 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Current image kept unless you upload a new one.
                </p>
              )}
            </div>
          )}

          {form.type === "carousel" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Carousel Images {!isEdit && "*"}{" "}
                <span className="text-gray-400 normal-case font-normal">(2 or more recommended)</span>
              </label>
              <FileDropZone
                label="Drop or click to upload multiple images"
                multiple={true}
                files={files}
                onChange={(f) => setFiles((prev) => [...prev, ...f])}
                onRemove={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
              />
              {isEdit && editData?.media?.length > 0 && files.length === 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Current {editData.media.length} image(s) kept unless you upload new ones.
                </p>
              )}
            </div>
          )}

          {form.type === "other" && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
              📄 No media required for "Other" type — uses action URL and placement only.
            </div>
          )}

          {/* Placement */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Placement
            </label>
            <select
              value={form.placement}
              onChange={(e) => set("placement", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              {PLACEMENT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value} disabled={value === ""}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Action URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Action URL
            </label>
            <input
              type="text"
              value={form.actionUrl}
              onChange={(e) => set("actionUrl", e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-300"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Status
            </label>
            <div className="flex gap-3">
              {["active", "inactive"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                    form.status === s
                      ? s === "active"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                        : "border-gray-400 bg-gray-100 text-gray-600"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {s === "active" ? "✅ Active" : "⏸ Inactive"}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : isEdit ? "Save Changes" : "Create Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState("");
  const [filterType, setFilterType]       = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [modalOpen, setModalOpen]         = useState(false);
  const [editData, setEditData]           = useState(null);
  const [togglingId, setTogglingId]       = useState(null);
  const [deletingId, setDeletingId]       = useState(null);

  const fetchAnnouncements = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE_URL}/superadmin/announcements`, {
        headers: authHeaders(),
      });
      const raw = res.data?.data || res.data;
      setAnnouncements(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === "active" ? "inactive" : "active";
    setTogglingId(item.id);
    try {
      const fd = new FormData();
      fd.append("status", newStatus);
      await axios.put(`${API_BASE_URL}/superadmin/announcements/${item.id}`, fd, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      await axios.delete(`${API_BASE_URL}/superadmin/announcements/${item.id}`, {
        headers: authHeaders(),
      });
      setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete announcement");
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = () => { setEditData(null); setModalOpen(true); };
  const openEdit   = (item) => { setEditData(item); setModalOpen(true); };

  const filtered = announcements.filter((a) => {
    if (filterType && a.type !== filterType) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  const summary = {
    total:    announcements.length,
    active:   announcements.filter((a) => a.status === "active").length,
    inactive: announcements.filter((a) => a.status === "inactive").length,
  };

  // Resolve a placement value to its readable label
  const placementLabel = (value) =>
    PLACEMENT_OPTIONS.find((o) => o.value === value)?.label || value || "—";

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone size={20} className="text-blue-600" />
            Announcements
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{summary.total} total · {summary.active} active</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          >
            <option value="">All Types</option>
            <option value="single_image">Single Image</option>
            <option value="carousel">Carousel</option>
            <option value="other">Other</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => fetchAnnouncements(true)}
            disabled={refreshing}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border shadow-sm transition ${
              refreshing
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* Create */}
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={15} />
            New Announcement
          </button>
        </div>
      </div>

      {/* ── Summary row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",    value: summary.total,    bg: "bg-indigo-50",  text: "text-indigo-700"  },
          { label: "Active",   value: summary.active,   bg: "bg-emerald-50", text: "text-emerald-700" },
          { label: "Inactive", value: summary.inactive, bg: "bg-gray-100",   text: "text-gray-600"    },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-sm text-gray-400">Loading announcements…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-center px-4">
            <p className="text-2xl">⚠️</p>
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button
              onClick={() => fetchAnnouncements()}
              className="mt-2 px-4 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <Megaphone size={32} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No announcements found</p>
            <p className="text-xs text-gray-400">
              {filterType || filterStatus ? "Try adjusting your filters" : "Create your first announcement"}
            </p>
            {!filterType && !filterStatus && (
              <button
                onClick={openCreate}
                className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
              >
                + Create one
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Preview", "Name", "Type", "Placement", "Action URL", "Status", "Created", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group">

                    {/* Preview */}
                    <td className="px-4 py-3.5">
                      <MediaPreview media={item.media || []} type={item.type} />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-gray-800">{item.name}</span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <TypeBadge type={item.type} />
                    </td>

                    {/* Placement */}
                    <td className="px-4 py-3.5 text-gray-500 text-xs">
                      {item.placement
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">{placementLabel(item.placement)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Action URL */}
                    <td className="px-4 py-3.5">
                      {item.actionUrl ? (
                        <a
                          href={item.actionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline max-w-[140px] truncate"
                        >
                          <ExternalLink size={10} />
                          {item.actionUrl}
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">

                        {/* Toggle status */}
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingId === item.id}
                          title={item.status === "active" ? "Deactivate" : "Activate"}
                          className={`p-1.5 rounded-lg transition ${
                            item.status === "active"
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-gray-400 hover:bg-gray-100"
                          } disabled:opacity-40`}
                        >
                          {togglingId === item.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : item.status === "active" ? (
                            <Eye size={15} />
                          ) : (
                            <EyeOff size={15} />
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEdit(item)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          title="Delete"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
                        >
                          {deletingId === item.id ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
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

      {/* ── Modal ── */}
      <AnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchAnnouncements(true)}
        editData={editData}
      />
    </div>
  );
}