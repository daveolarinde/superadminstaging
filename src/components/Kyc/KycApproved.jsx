import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, Eye } from "lucide-react";

const KycApproved = () => {
  const [kycData, setKycData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const baseURL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchKYC = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseURL}/superAdmin/kyc`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data?.data || [];
        setKycData(data);
        setFilteredData(data);

        // Summary calculation
        const total = data.length;
        const pending = data.filter((d) => d.status === "pending").length;
        const verified = data.filter((d) => d.status === "success").length;
        const failed = data.filter((d) => d.status === "failed").length;

        setSummary({ total, pending, verified, failed });
      } catch (err) {
        console.error("Error fetching KYC records:", err);
        setError("Failed to fetch KYC records.");
      } finally {
        setLoading(false);
      }
    };

    fetchKYC();
  }, []);

  // Combined filter + search logic
  useEffect(() => {
    const lowerSearch = search.toLowerCase();

    const filtered = kycData.filter((record) => {
      const user = record.user || {};
      const matchesSearch =
        user.firstname?.toLowerCase().includes(lowerSearch) ||
        user.lastname?.toLowerCase().includes(lowerSearch) ||
        user.email?.toLowerCase().includes(lowerSearch) ||
        user.tag?.toLowerCase().includes(lowerSearch);

      const matchesStatus = statusFilter ? record.status === statusFilter : true;
      const matchesType = typeFilter ? record.type === typeFilter : true;

      return matchesSearch && matchesStatus && matchesType;
    });

    setFilteredData(filtered);
  }, [search, kycData, statusFilter, typeFilter]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading approved KYC records...
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center mt-10 font-medium">{error}</div>
    );

  // Helper for percentage text
  const getPercent = (value) =>
    summary.total ? ((value / summary.total) * 100).toFixed(1) + "%" : "0%";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "TOTAL KYC",
            value: summary.total,
            sub: `From ${summary.total}`,
            percent: getPercent(summary.total),
            color: "text-blue-500",
          },
          {
            title: "PENDING KYC",
            value: summary.pending,
            sub: `From ${summary.total}`,
         
            color: "text-yellow-500",
          },
          {
            title: "APPROVED KYC",
            value: summary.verified,
            sub: `From ${summary.total}`,
          
            color: "text-green-500",
          },
          {
            title: "REJECTED KYC",
            value: summary.failed,
            sub: `From ${summary.total}`,
           
            color: "text-red-500",
          },
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
                <p className="text-4xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="text-gray-400 text-sm mt-1">{card.sub}</p>
              </div>
              
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between mb-6 relative border border-gray-100">
        <div className="flex items-center gap-3 w-full md:w-1/2 relative">
          <Search size={18} className="text-gray-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search KYC records by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-gray-600 mb-3 focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Types</option>
                <option value="NIN">NIN</option>
                <option value="BVN">BVN</option>
                <option value="Passport">Passport</option>
              </select>

              <p className="text-sm font-semibold text-gray-500 mb-2">Status</p>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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

      {/* KYC Records Grid */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100">
        <div className="grid grid-cols-5 px-6 py-3 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
          <p>No.</p>
          <p>Name</p>
          <p>Verification Type</p>
          <p>Status</p>
          <p>Action</p>
        </div>

        {filteredData.length > 0 ? (
          filteredData.map((record, i) => (
            <div
              key={record.id}
              className="grid grid-cols-5 items-center px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition"
            >
              <p className="text-gray-500">{i + 1}</p>

              <div className="flex items-center gap-3">
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
              </div>

              <p className="capitalize text-gray-700">{record.type}</p>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                  record.status === "success"
                    ? "bg-green-100 text-green-600"
                    : record.status === "pending"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {record.status}
              </span>

              <button
                onClick={() =>
                  window.open(record.documentUrl || record.selfieUrl, "_blank")
                }
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm border border-gray-200 px-3 py-1.5 rounded-lg transition"
              >
                <Eye size={16} /> View
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            No KYC records found for selected filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default KycApproved;
