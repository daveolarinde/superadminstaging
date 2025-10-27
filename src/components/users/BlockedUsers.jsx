import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { FiFilter, FiEdit2, FiMoreVertical } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function BlockedUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortFilter, setSortFilter] = useState("latestLogin");
  const [statusUpdating, setStatusUpdating] = useState(null);

  const navigate = useNavigate();
  const [limit] = useState(20);
  const [offset] = useState(0);

  const token = localStorage.getItem("token");
  const baseURL = import.meta.env.VITE_API_URL;

  // 🔹 Fetch summary (optional)
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${baseURL}/superAdmin/get-user-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setSummary(res.data.data);
      } catch (err) {
        console.error("Error fetching summary:", err);
      }
    };
    fetchSummary();
  }, [baseURL, token]);

  // 🔹 Fetch Blocked Users (status = blocked)
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseURL}/superAdmin/users`, {
          params: {
            status: "blocked",
            sort: sortFilter,
            limit,
            offset,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && Array.isArray(res.data.data)) {
          setUsers(res.data.data);
          setFilteredUsers(res.data.data);
        } else {
          console.warn("Unexpected response format:", res.data);
        }
      } catch (err) {
        console.error("Error fetching blocked users:", err);
        setError("Failed to load blocked users");
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, [baseURL, token, sortFilter, offset, limit]);

  // 🔹 Local search filter
  useEffect(() => {
    const filtered = users.filter(
      (u) =>
        u.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // 🔹 Update user status
  const handleStatusChange = async (userId, newStatus) => {
    try {
      setStatusUpdating(userId);
      const res = await axios.put(
        `${baseURL}/superAdmin/update-user-status/${userId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update user status:", err);
    } finally {
      setStatusUpdating(null);
    }
  };

  if (loading)
    return <div className="p-6 text-gray-500 text-sm">Loading blocked users...</div>;

  if (error)
    return <div className="p-6 text-red-500 text-sm">{error}</div>;

  const blockedUsers = users.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Blocked Users</h1>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "TOTAL USERS", value: summary?.totalUsers ?? 0 },
          { label: "BLOCKED USERS", value: blockedUsers },
          {
            label: "ACTIVE USERS",
            value: summary?.users?.filter((u) => u.status === "active").length ?? 0,
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col"
          >
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
            placeholder="Search blocked users"
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-4.35-4.35m1.6-5.4A7.25 7.25 0 1110.25 4a7.25 7.25 0 018 8z"
            />
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
          <div className="text-gray-700 font-medium mb-2">Sort Options</div>
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

      {/* 🔹 Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Full Name</th>
              <th className="px-4 py-2 text-left font-medium">Email / Phone</th>
              <th className="px-4 py-2 text-left font-medium">Country</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              <th className="px-4 py-2 text-left font-medium">Last Login</th>
              <th className="px-4 py-2 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold uppercase">
                    {user.firstname?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 cursor-pointer" onClick={() =>
                                       navigate(`/admin/all-users/${user.id}`)
                                      }>
                      {user.firstname} {user.lastname}
                    </p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <p className="text-gray-800">{user.email}</p>
                  <p className="text-xs text-gray-500">{user.phone || "N/A"}</p>
                </td>

                <td className="px-4 py-3 text-gray-700">
                  {user.country || "-"}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === "active"
                        ? "bg-green-50 text-green-600"
                        : user.status === "inactive"
                        ? "bg-yellow-50 text-yellow-600"
                        : user.status === "blocked"
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {user.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {user.lastLogin
                    ? formatDistanceToNow(new Date(user.lastLogin), {
                        addSuffix: true,
                      })
                    : "N/A"}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                      onClick={() => navigate(`/admin/all-users/${user.id}`)}
                    >
                      <FiEdit2 size={14} /> Edit
                    </button>

                    <div className="relative group">
                      <button className="p-2 rounded-md hover:bg-gray-100">
                        <FiMoreVertical size={14} />
                      </button>
                      <div className="hidden group-hover:block absolute right-0 mt-2 bg-white border border-gray-100 rounded-md shadow-md w-32 z-20">
                        {["active", "inactive", "blocked"].map((status) => (
                          <button
                            key={status}
                            disabled={statusUpdating === user.id}
                            onClick={() =>
                              handleStatusChange(user.id, status)
                            }
                            className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                              status === "blocked"
                                ? "text-red-600"
                                : "text-gray-700"
                            }`}
                          >
                            {statusUpdating === user.id
                              ? "Updating..."
                              : `Set ${status}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="text-center text-gray-400 py-6 text-sm"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500 text-right">
        Showing {offset + 1}–{Math.min(offset + limit, filteredUsers.length)} of{" "}
        {filteredUsers.length}
      </div>
    </div>
  );
}
