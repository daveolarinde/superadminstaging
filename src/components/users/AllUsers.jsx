import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow, isToday } from "date-fns";
import { FiFilter, FiEdit2 } from "react-icons/fi";

export default function AllUsers() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("latestLogin");
  const [error, setError] = useState(null);

  // Pagination
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const token = localStorage.getItem("token");
  const baseURL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, usersRes] = await Promise.all([
          axios.get(`${baseURL}/superAdmin/get-user-summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${baseURL}/superAdmin/users`, {
            params: {
              limit,
              offset,
              status: statusFilter || undefined,
              sort: sortFilter,
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (summaryRes.data.success) setSummary(summaryRes.data.data);

        if (usersRes.data.success) {
          const list = usersRes.data.data || [];
          setUsers(list);
          setFilteredUsers(list);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [statusFilter, sortFilter, offset]);

  // Local search
  useEffect(() => {
    const filtered = users.filter(
      (u) =>
        u.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500 text-sm">{error}</div>;

  // Derive summary metrics
  const activeUsers = users.filter((u) => u.status === "active").length;
  const blockedUsers = users.filter((u) => u.status === "blocked").length;
  const deactivatedUsers = users.filter((u) => u.status === "deactivate").length;
  const todayJoined = users.filter((u) => isToday(new Date(u.createdAt || Date.now()))).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">All Users</h1>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-2">
          + Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "TOTAL USERS", value: summary?.totalUsers ?? 0 },
          { label: "ACTIVE USERS", value: activeUsers },
          { label: "TODAY JOIN", value: todayJoined },
          { label: "DEACTIVATED USERS", value: deactivatedUsers },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col">
            <div className="text-gray-500 text-sm mb-1">{card.label}</div>
            <div className="text-2xl font-bold text-gray-800 flex items-baseline">
              {card.value}
              <span className="text-sm text-gray-400 ml-1">
                of {summary?.totalUsers ?? 0}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-300 focus:border-emerald-400 outline-none"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 absolute left-3 top-3 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.6-5.4A7.25 7.25 0 1110.25 4a7.25 7.25 0 018 8z" />
          </svg>
        </div>

        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FiFilter className="text-gray-600" /> Filter
        </button>
      </div>

      {/* Filter dropdown */}
      {filterOpen && (
        <div className="border border-gray-200 bg-white rounded-lg p-4 shadow-md max-w-sm">
          <div className="text-gray-700 font-medium mb-2">Filter Options</div>

          <label className="text-sm text-gray-500 block mb-1">Status</label>
          <select
            className="w-full border rounded-md px-3 py-2 mb-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
            <option value="deactivate">Deactivated</option>
          </select>

          <label className="text-sm text-gray-500 block mb-1">Sort By</label>
          <select
            className="w-full border rounded-md px-3 py-2 mb-3 text-sm"
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
          >
            <option value="latestLogin">Latest Login</option>
            <option value="createdAt">Created At</option>
          </select>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">FULL NAME</th>
              <th className="px-4 py-2 text-left font-semibold">EMAIL</th>
              <th className="px-4 py-2 text-left font-semibold">IDENTIFIER</th>
              <th className="px-4 py-2 text-left font-semibold">STATUS</th>
              <th className="px-4 py-2 text-left font-semibold">LAST LOGIN</th>
              <th className="px-4 py-2 text-right font-semibold">ACTION</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  {user.firstname} {user.lastname}
                  <div className="text-gray-400 text-xs">@{user.email.split("@")[0]}</div>
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  {user.kyc?.typeValue || "—"}
                  <div className="text-gray-400 text-xs">{user.kyc?.type || "N/A"}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.status === "active"
                        ? "bg-green-100 text-green-700"
                        : user.status === "blocked"
                        ? "bg-red-100 text-red-600"
                        : user.status === "inactive"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {user.lastLogin
                    ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                    : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-emerald-600 hover:text-emerald-800">
                    <FiEdit2 />
                  </button>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-400 text-sm">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Info */}
      <div className="text-sm text-gray-500 text-right">
        Showing {offset + 1}–
        {Math.min(offset + limit, summary?.totalUsers || users.length)} of{" "}
        {summary?.totalUsers || users.length}
      </div>
    </div>
  );
}
