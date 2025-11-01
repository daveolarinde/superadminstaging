import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow, isToday } from "date-fns";
import { FiFilter, FiEdit2, FiMoreVertical } from "react-icons/fi";
import { useNavigate } from "react-router-dom";



export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("latestLogin");
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [, setRates] = useState({});
  const [, setRateLoading] = useState(true);
  const [limit] = useState(20);
  const [offset] = useState(0);

 const navigate = useNavigate();
// const setSelectedUser = useUserStore((state) => state.setSelectedUser);
  const token = localStorage.getItem("token");
  const baseURL = import.meta.env.VITE_API_URL;

  // ✅ Fetch summary
  useEffect(() => {
    if (!baseURL || !token) return;

    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${baseURL}/superAdmin/get-user-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && res.data.success) {
          const data = res.data.data || {};
          const usersList = Array.isArray(data.users) ? data.users : [];

          const totalUsers =
            typeof data.totalUsers === "number" ? data.totalUsers : usersList.length;

          const activeUsers = usersList.filter(
            (u) => String(u.status).toLowerCase() === "active"
          ).length;

          const inactiveUsers = usersList.filter(
            (u) => String(u.status).toLowerCase() === "inactive"
          ).length;

          const deactivatedUsers = usersList.filter(
            (u) => String(u.status).toLowerCase() === "deactivate"
          ).length;

          const todayJoined = usersList.filter((u) => {
            try {
              return isToday(new Date(u.createdAt));
            } catch {
              return false;
            }
          }).length;

          setSummary({
            ...data,
            totalUsers,
            activeUsers,
            inactiveUsers,
            deactivatedUsers,
            todayJoined,
          });
        } else {
          setSummary({
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            deactivatedUsers: 0,
            todayJoined: 0,
          });
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
        setSummary({
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          deactivatedUsers: 0,
          todayJoined: 0,
        });
      }
    };

    fetchSummary();
  }, [baseURL, token]);

  //  Fetch users (affected by filters)
  useEffect(() => {
    if (!baseURL || !token) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRes = await axios.get(`${baseURL}/superAdmin/users`, {
          params: {
            limit,
            offset,
            status: statusFilter || undefined,
            sort: sortFilter,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (usersRes.data && usersRes.data.success) {
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
    fetchUsers();
  }, [baseURL, token, limit, offset, statusFilter, sortFilter]);

  //  Fetch exchange rates (not core to users but kept for consistency)
  useEffect(() => {
    if (!baseURL || !token) return;

    const fetchRates = async () => {
      try {
        const res = await axios.get(`${baseURL}/superAdmin/rates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && res.data.status === "success") {
          setRates(res.data.data.rates || {});
        }
      } catch (err) {
        console.error("Error fetching rates:", err);
      } finally {
        setRateLoading(false);
      }
    };
    fetchRates();
  }, [baseURL, token]);

  //  Local search & filter combo
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (u) =>
          u.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, users]);

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500 text-sm">{error}</div>;

  //  Handle status updates
  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Change user status to "${newStatus}"?`)) return;

    try {
      setStatusUpdating(userId);
      const res = await axios.patch(
        `${baseURL}/superAdmin/users/${userId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data && res.data.status === "success") {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
        setFilteredUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );

        setSummary((prev = {}) => {
          const prevUsers = Array.isArray(prev.users)
            ? prev.users.map((u) =>
                u.id === userId ? { ...u, status: newStatus } : u
              )
            : null;
          const usersToCompute =
            prevUsers ?? users.map((u) =>
              u.id === userId ? { ...u, status: newStatus } : u
            );
          const activeUsers = usersToCompute.filter(
            (u) => String(u.status).toLowerCase() === "active"
          ).length;
          const inactiveUsers = usersToCompute.filter(
            (u) => String(u.status).toLowerCase() === "inactive"
          ).length;
          const deactivatedUsers = usersToCompute.filter(
            (u) => String(u.status).toLowerCase() === "deactivate"
          ).length;

          return {
            ...prev,
            users: prevUsers ?? usersToCompute,
            totalUsers: prev.totalUsers ?? usersToCompute.length,
            activeUsers,
            inactiveUsers,
            deactivatedUsers,
            todayJoined:
              prev.todayJoined ??
              usersToCompute.filter((u) => {
                try {
                  return isToday(new Date(u.createdAt));
                } catch {
                  return false;
                }
              }).length,
          };
        });
      }
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Failed to update user status");
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">All Users</h1>
        
      </div>

      {/*  Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: "TOTAL USERS", value: summary?.totalUsers ?? 0 },
          { label: "ACTIVE USERS", value: summary?.activeUsers ?? 0 },
          { label: "INACTIVE USERS", value: summary?.inactiveUsers ?? 0 },
          { label: "TODAY JOIN", value: summary?.todayJoined ?? 0 },
          { label: "DEACTIVATED USERS", value: summary?.deactivatedUsers ?? 0 },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col"
          >
            <div className="text-gray-500 text-sm mb-1">{card.label}</div>
            <div className="text-2xl font-bold text-gray-800">
              {card.value?.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter UI */}
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

      {/* Filter Menu */}
      {filterOpen && (
        <div className="bg-white p-4 rounded-lg shadow-sm border text-sm">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="deactivate">Deactivated</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="latestLogin">Latest Login</option>
              <option value="createdAt">Date Created</option>
            </select>
          </div>
        </div>
      )}

      {/*  Table */}
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
                    <p
                      className="font-medium text-gray-800 cursor-pointer"
                      onClick={() => navigate(`/admin/all-users/${user.id}`)}
                    >
                      {user.firstname} {user.lastname}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{user?.tag || `${user?.firstname?.toLowerCase() || "user"}`}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <p className="text-gray-800">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    {user.phoneNumber || "N/A"}
                  </p>
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
                        : user.status === "deactivated"
                        ? "bg-orange-50 text-orange-600"
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
                        {["active", "inactive", "blocked", "deactivated"].map(
                          (status) => (
                            <button
                              key={status}
                              disabled={statusUpdating === user.id}
                              onClick={() => handleStatusChange(user.id, status)}
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
                          )
                        )}
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

      {/* Pagination Info */}
      <div className="text-sm text-gray-500 text-right">
        Showing {offset + 1}–
        {Math.min(offset + limit, summary?.totalUsers || users.length)} of{" "}
        {summary?.totalUsers || users.length}
      </div>
    </div>
  );
}
