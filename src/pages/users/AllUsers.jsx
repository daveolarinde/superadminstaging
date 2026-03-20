// pages/users/AllUsers.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { isToday } from "date-fns";
import { Search, SlidersHorizontal, X } from "lucide-react";

import UserSummaryCards from "../../components/users/Usersummarycards";
import UsersTable from "../../components/users/Userstable";

const baseURL = import.meta.env.VITE_STAGE_API_URL;

export default function AllUsers() {
  const [users, setUsers]               = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [summary, setSummary]           = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  const [searchTerm, setSearchTerm]     = useState("");
  const [filterOpen, setFilterOpen]     = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortFilter, setSortFilter]     = useState("latestLogin");

  const [limit]  = useState(20);
  const [offset, setOffset] = useState(0);

  const token = localStorage.getItem("token");

  // ── Fetch summary ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!baseURL || !token) return;
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${baseURL}/superAdmin/get-user-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          const data      = res.data.data || {};
          const usersList = Array.isArray(data.users) ? data.users : [];
          const total     = typeof data.totalUsers === "number" ? data.totalUsers : usersList.length;
          setSummary({
            ...data,
            totalUsers:       total,
            activeUsers:      usersList.filter((u) => u.status?.toLowerCase() === "active").length,
            inactiveUsers:    usersList.filter((u) => u.status?.toLowerCase() === "inactive").length,
            deactivatedUsers: usersList.filter((u) => u.status?.toLowerCase() === "deactivate").length,
            todayJoined:      usersList.filter((u) => { try { return isToday(new Date(u.createdAt)); } catch { return false; } }).length,
          });
        }
      } catch (err) {
        console.error("Summary fetch error:", err);
        setSummary({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0, deactivatedUsers: 0, todayJoined: 0 });
      }
    };
    fetchSummary();
  }, [baseURL, token]);

  // ── Fetch users ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!baseURL || !token) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseURL}/superAdmin/users`, {
          params: { limit, offset, status: statusFilter || undefined, sort: sortFilter },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          const list = res.data.data || [];
          setUsers(list);
          setFilteredUsers(list);
        }
      } catch (err) {
        console.error("Users fetch error:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [baseURL, token, limit, offset, statusFilter, sortFilter]);

  // ── Client-side search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredUsers(users); return; }
    const term = searchTerm.toLowerCase();
    setFilteredUsers(users.filter((u) =>
      u.firstname?.toLowerCase().includes(term) ||
      u.lastname?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.tag?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term)
    ));
  }, [searchTerm, users]);

  // ── Status change ──────────────────────────────────────────────────────────
  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    try {
      setStatusUpdating(userId);
      const res = await axios.patch(
        `${baseURL}/superAdmin/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      if (res.data?.status === "success") {
        const update = (list) => list.map((u) => u.id === userId ? { ...u, status: newStatus } : u);
        setUsers(update);
        setFilteredUsers(update);
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update user status");
    } finally {
      setStatusUpdating(null);
    }
  };

  const hasFilters    = statusFilter || sortFilter !== "latestLogin";
  const inputCls      = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition";

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Users</h1>
          <p className="text-xs text-gray-400 mt-0.5">{summary?.totalUsers?.toLocaleString() ?? "—"} total users</p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <UserSummaryCards summary={summary} />

      {/* ── Search + filter bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, tag…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setOffset(0); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={() => { setStatusFilter(""); setSortFilter("latestLogin"); setOffset(0); }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition"
            >
              <X size={13} /> Clear
            </button>
          )}
          <button
            onClick={() => setFilterOpen((p) => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-sm transition ${
              hasFilters
                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={15} /> Filter
            {hasFilters && (
              <span className="w-4 h-4 rounded-full bg-white/30 text-white text-[10px] flex items-center justify-center font-bold">
                {[statusFilter, sortFilter !== "latestLogin" ? sortFilter : ""].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      {filterOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Filters</p>
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Status */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[{ v: "", l: "All" }, { v: "active", l: "Active" }, { v: "inactive", l: "Inactive" }, { v: "blocked", l: "Blocked" }].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => { setStatusFilter(o.v); setOffset(0); }}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      statusFilter === o.v
                        ? o.v === "active"   ? "bg-emerald-600 border-emerald-600 text-white"
                        : o.v === "inactive" ? "bg-amber-500 border-amber-500 text-white"
                        : o.v === "blocked"  ? "bg-red-500 border-red-500 text-white"
                        : "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sort By</label>
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className={inputCls}
              >
                <option value="latestLogin">Latest Login</option>
                <option value="createdAt">Date Created</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading / error / table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-sm text-gray-400">Loading users…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-2xl">⚠️</p>
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      ) : (
        <UsersTable
          users={filteredUsers}
          totalUsers={summary?.totalUsers ?? users.length}
          limit={limit}
          offset={offset}
          onPageChange={setOffset}
          onStatusChange={handleStatusChange}
          statusUpdating={statusUpdating}
        />
      )}
    </div>
  );
}