import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, Eye } from "lucide-react";

const KycApproved = () => {
  const [kycData, setKycData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    failed: 0,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("success"); // default approved
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const rowsPerPage = 10;
  const baseURL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  // ✅ Fetch overall summary (once)
  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${baseURL}/superAdmin/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data || [];
      const total = data.length;
      const pending = data.filter((d) => d.status === "pending").length;
      const verified = data.filter((d) => d.status === "success").length;
      const failed = data.filter((d) => d.status === "failed").length;
      setSummary({ total, pending, verified, failed });
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  //  Fetch paginated KYC records
  const fetchKycPaginated = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/superAdmin/kyc`, {
        params: {
          page,
          limit: rowsPerPage,
          search: search || undefined,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data, pagination } = res.data;
      setKycData(data || []);
      setTotalPages(pagination?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching KYC:", err);
      setError("Failed to fetch KYC records.");
    } finally {
      setLoading(false);
    }
  };

  //  Initial load
  useEffect(() => {
    fetchSummary();
    fetchKycPaginated(1);
  }, []);

  //  Refetch on filters/search/page change
  useEffect(() => {
    fetchKycPaginated(currentPage);
  }, [currentPage, search, statusFilter, typeFilter]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading KYC records...
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center mt-10 font-medium">{error}</div>
    );

  const getPercent = (value) =>
    summary.total ? ((value / summary.total) * 100).toFixed(1) + "%" : "0%";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/*  Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "TOTAL KYC", value: summary.total, color: "text-blue-500" },
          { title: "PENDING KYC", value: summary.pending, color: "text-yellow-500" },
          { title: "APPROVED KYC", value: summary.verified, color: "text-green-500" },
          { title: "REJECTED KYC", value: summary.failed, color: "text-red-500" },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white shadow-sm rounded-xl p-5 border border-gray-100"
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase">
              {card.title}
            </h3>
            <div className="flex items-end justify-between mt-3">
              <div>
                <p className="text-4xl font-bold text-gray-900">{card.value}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {getPercent(card.value)} of total
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/*  Search + Filter */}
      <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between mb-6 relative border border-gray-100">
        <div className="flex items-center gap-3 w-full md:w-1/2 relative">
          <Search size={18} className="text-gray-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search KYC records by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="relative mt-4 md:mt-0">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            <Filter size={18} />
            Filter
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-10 p-4">
              <p className="text-sm font-semibold text-gray-500 mb-2">
                Verification Type
              </p>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-200 rounded-lg p-2 text-gray-600 mb-3 focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Types</option>
                <option value="nin">NIN</option>
                <option value="bvn">BVN</option>
                <option value="utility_bill">Utility Bill</option>
              </select>

              <p className="text-sm font-semibold text-gray-500 mb-2">Status</p>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-200 rounded-lg p-2 text-gray-600 focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="success">Approved</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/*  Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">No.</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Verification Type</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {kycData.length > 0 ? (
              kycData.map((record, i) => (
                <tr
                  key={record.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 text-gray-500">
                    {(currentPage - 1) * rowsPerPage + i + 1}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img
                      src={record.documentUrl || record.selfieUrl}
                      alt="User Document"
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <p className="font-medium text-gray-800">
                        {record.user?.firstname} {record.user?.lastname}
                      </p>
                      <p className="text-xs text-gray-500">@{record.user?.tag}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 capitalize text-gray-700">
                    {record.type}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === "success"
                          ? "bg-green-100 text-green-600"
                          : record.status === "pending"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        window.open(
                          record.documentUrl || record.selfieUrl,
                          "_blank"
                        )
                      }
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm border border-gray-200 px-3 py-1.5 rounded-lg transition"
                    >
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center text-gray-500 py-8 text-sm"
                >
                  No KYC records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/*  Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg border ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
            >
              Previous
            </button>

            <span>
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg border ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KycApproved;
