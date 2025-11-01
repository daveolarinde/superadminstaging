import React, { useEffect, useState } from "react";
import axios from "axios";
import ProfitFilter from "./ProfitFilter"; 

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Profits = () => {
  const [summary, setSummary] = useState(null);
  const [profits, setProfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    userId: "",
    transactionId: "",
    currency: "NGN",
    date: "",
    startDate: "",
    endDate: "",
  });

  const fetchProfits = async (appliedFilters = {}) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Missing authentication token");
        setLoading(false);
        return;
      }

      // Build query string dynamically
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(appliedFilters).filter(([_, v]) => v !== "")
        )
      ).toString();

      const [summaryRes, profitsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/superAdmin/profits/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/superAdmin/profits?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSummary(summaryRes.data?.data || {});
      setProfits(profitsRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching profits:", err);
      setError("Failed to fetch profits");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    fetchProfits(newFilters);
  };

  useEffect(() => {
    fetchProfits({});
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
    <div className="p-6 space-y-8">
      <h1>Profit</h1>
      {/* ✅ Filter Component */}
      <ProfitFilter filters={filters} onApply={handleFilter} />

      {/* Summary Cards */}
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

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">User</th>
              <th className="px-4 py-3 font-medium text-gray-700">Email</th>
              {/* <th className="px-4 py-3 font-medium text-gray-700">Transaction ID</th> */}
              <th className="px-4 py-3 font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 font-medium text-gray-700">Profit</th>
              <th className="px-4 py-3 font-medium text-gray-700">Currency</th>
              <th className="px-4 py-3 font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {profits.length > 0 ? (
              profits.map((profit) => (
                <tr key={profit.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    {profit.user?.firstName} {profit.user?.lastName}
                  </td>
                  <td className="px-4 py-3">{profit.user?.email}</td>
                  {/* <td className="px-4 py-3 text-gray-500">
                    {profit.transactionId}
                  </td> */}
                  <td className="px-4 py-3 font-medium text-gray-800">
                    ₦{parseFloat(profit.transaction?.amount || 0).toLocaleString()}
                  </td>
                   <td className="px-4 py-3 font-medium text-gray-800">
                    ₦{parseFloat(profit.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {profit.transaction?.currency || "NGN"}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(profit.createdAt).toLocaleDateString()}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${
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
                <td colSpan="7" className="text-center text-gray-500 py-6">
                  No profit records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Profits;
