import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiSearch, FiFilter } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const VirtualAccounts = () => {
  const [virtualAccounts, setVirtualAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [limit] = useState(10);
  const [count, setCount] = useState(null);
  const [search, setSearch] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const navigate = useNavigate();

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const fetchVirtualAccounts = async (page = 0) => {
    setLoading(true);
    setError("");

    try {
      const offset = page * limit;

      const res = await axios.get(
        `${API_BASE_URL}/superadmin/virtual-accounts`,
        {
          headers: authHeaders,
          params: {
            limit,
            offset,
            ...(currencyFilter && { currency: currencyFilter }),
            ...(statusFilter && { status: statusFilter }),
          },
        }
      );

      const data = res.data?.data || [];
      setVirtualAccounts(Array.isArray(data) ? data : []);
      if (typeof res.data?.count === "number") {
        setCount(res.data.count);
      }
    } catch (err) {
      console.error("Fetch virtual accounts error:", err);
      setError("Failed to fetch virtual accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVirtualAccounts(page);
  }, [page, currencyFilter, statusFilter]);

  useEffect(() => {
    let filtered = [...virtualAccounts];

    if (search.trim() !== "") {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (va) =>
          va.accountName?.toLowerCase().includes(term) ||
          va.accountNumber?.toLowerCase().includes(term) ||
          va.bank?.toLowerCase().includes(term) ||
          va.user?.firstname?.toLowerCase().includes(term) ||
          va.user?.lastname?.toLowerCase().includes(term) ||
          va.user?.email?.toLowerCase().includes(term)
      );
    }

    setFilteredAccounts(filtered);
  }, [search, virtualAccounts]);

  const pagesTotal = count ? Math.ceil(count / limit) : null;

  return (
    <div className="p-4 sm:p-6">
    
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h2 className="text-2xl font-semibold text-gray-800">
          Virtual Accounts
        </h2>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 w-full sm:w-80">
            <FiSearch className="text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-sm"
            />
          </div>

         
          <button
            onClick={() => setFilterOpen((prev) => !prev)}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
          >
            <FiFilter />
            Filters
          </button>
        </div>
      </div>

    
      {filterOpen && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300 text-sm mb-4">
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Currency Filter */}
            <select
              value={currencyFilter}
              onChange={(e) => {
                setPage(0);
                setCurrencyFilter(e.target.value);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Currencies</option>
              <option value="USD">USD</option>
              <option value="NGN">NGN</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(0);
                setStatusFilter(e.target.value);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            
            </select>

         
            <button
              onClick={() => {
                setCurrencyFilter("");
                setStatusFilter("");
                setPage(0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-medium">
            <tr>
              <th className="px-4 py-3">Account Name</th>
              <th className="px-4 py-3">Account Number</th>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created At</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-red-500">
                  {error}
                </td>
              </tr>
            ) : filteredAccounts.length > 0 ? (
              filteredAccounts.map((va) => (
                <tr
                  key={va.id}
                  onClick={() => {
                    if (!va.userId) return;
                    navigate(`/admin/virtual-accounts/${va.userId}`, {
                      state: { accountId: va.id, account: va },
                    });
                  }}
                  className="border-t hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {va.accountName || "N/A"}
                  </td>
                  <td className="px-4 py-3">{va.accountNumber || "—"}</td>
                  <td className="px-4 py-3">{va.bank || "—"}</td>
                  <td className="px-4 py-3">{va.currency || "—"}</td>
                  <td className="px-4 py-3">
                    {va.user?.firstname
                      ? `${va.user.firstname} ${va.user.lastname || ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{va.user?.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        va.status === "active"
                          ? "bg-green-100 text-green-600"
                          : va.status === "pending"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {va.status || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {va.createdAt
                      ? new Date(va.createdAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No virtual accounts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3">
        <div className="text-sm text-gray-500">
          {count !== null ? (
            <span>
              Page {page + 1} of {pagesTotal ?? "?"} — {count} total
            </span>
          ) : (
            <span>Page {page + 1}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={pagesTotal !== null && page + 1 >= pagesTotal}
            className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualAccounts;
