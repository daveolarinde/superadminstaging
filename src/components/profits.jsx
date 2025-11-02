import React, { useEffect, useState } from "react";
import axios from "axios";
import ProfitFilter from "./ProfitFilter";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Profits = () => {
  const [summary, setSummary] = useState(null);
  const [profits, setProfits] = useState([]);
  const [filteredProfits, setFilteredProfits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchProfits = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Missing authentication token");
        setLoading(false);
        return;
      }

      const query = new URLSearchParams({
        page,
        limit: pagination.limit,
      }).toString();

      const [summaryRes, profitsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/superAdmin/profits/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/superAdmin/profits?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSummary(summaryRes.data?.data || {});
      const data = profitsRes.data?.data || [];
      setProfits(data);
      setFilteredProfits(data);
      const total =
        profitsRes.data?.count ??
        profitsRes.data?.total ??
        profitsRes.data?.meta?.total ??
        0;
      setPagination((prev) => ({
        ...prev,
        page,
        total,
      }));
    } catch (err) {
      console.error("Error fetching profits:", err);
      setError("Failed to fetch profits");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Live search filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProfits(profits);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = profits.filter(
      (p) =>
        p.user?.firstName?.toLowerCase().includes(term) ||
        p.user?.lastName?.toLowerCase().includes(term) ||
        p.user?.email?.toLowerCase().includes(term)
    );
    setFilteredProfits(filtered);
  }, [searchTerm, profits]);

  const handlePageChange = (newPage) => {
    fetchProfits(newPage);
  };

  useEffect(() => {
    fetchProfits(1);
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-gray-500">
        Loading profits...
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Profit</h1>

      {/* ✅ Search Input */}
      <div className="relative w-full sm:w-1/3">
        <input
          type="text"
          placeholder="Search by name or email"
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

      {/* ✅ Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries({
          "This Month": summary?.thisMonth?.TOTAL ?? 0,
          "This Year": summary?.thisYear?.TOTAL ?? 0,
          "All Time": summary?.allTime?.TOTAL ?? 0,
          "Last Month": summary?.lastMonth?.TOTAL ?? 0,
        }).map(([label, value]) => (
          <div
            key={label}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 hover:shadow-md transition"
          >
            <p className="text-gray-500 text-sm">{label}</p>
            <p className="text-xl font-semibold text-gray-800 mt-2">
              ₦{Number(value || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* ✅ Profits Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm text-left border-collapse border-none text-gray-600">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-600">User</th>
              <th className="px-6 py-4 font-medium text-gray-600">Email</th>
              <th className="px-6 py-4 font-medium text-gray-600">Amount</th>
              <th className="px-6 py-4 font-medium text-gray-600">Profit</th>
              <th className="px-6 py-4 font-medium text-gray-600">Currency</th>
              <th className="px-6 py-4 font-medium text-gray-600">Date</th>
              <th className="px-6 py-4 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfits.length > 0 ? (
              filteredProfits.map((profit) => (
                <tr
                  key={profit.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {profit.user?.firstName} {profit.user?.lastName}
                  </td>
                  <td className="px-6 py-4">{profit.user?.email}</td>
                  <td className="px-6 py-4 font-semibold">
                    ₦
                    {parseFloat(profit.transaction?.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    ₦{parseFloat(profit.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {profit.transaction?.currency || "NGN"}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(profit.createdAt).toLocaleDateString()}
                  </td>
                  <td
                    className={`px-6 py-4 font-semibold ${
                      profit.transaction?.status === "success"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {profit.transaction?.status || "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="text-center text-gray-500 py-6 font-medium"
                >
                  No profit records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination */}
      <div className="flex justify-end items-center mt-4 gap-3">
        <button
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
          className={`px-4 py-2 rounded-md ${
            pagination.page === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Previous
        </button>
        <span className="text-gray-600 text-sm">
          Page {pagination.page} of{" "}
          {Math.max(1, Math.ceil(pagination.total / pagination.limit))}
        </span>
        <button
          disabled={
            pagination.page >= Math.ceil(pagination.total / pagination.limit)
          }
          onClick={() => handlePageChange(pagination.page + 1)}
          className={`px-4 py-2 rounded-md ${
            pagination.page >= Math.ceil(pagination.total / pagination.limit)
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Profits;
