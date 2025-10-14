import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, Eye } from "lucide-react";

const KycPending = () => {
  const [kycData, setKycData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    failed: 0,
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const baseURL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchKYC = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseURL}/superAdmin/kyc`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("KYC API Response:", res.data);

        const data = res.data?.data || [];
        setKycData(data);
        setFilteredData(data);

        setSummary({
          total: data.length,
          verified: data.filter((d) => d.status === "verified").length,
          pending: data.filter((d) => d.status === "pending").length,
          failed: data.filter((d) => d.status === "failed").length,
        });
      } catch (err) {
        console.error("Error fetching KYC records:", err);
        setError("Failed to fetch KYC records.");
      } finally {
        setLoading(false);
      }
    };

    fetchKYC();
  }, []);

  // Live Search
  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = kycData.filter((record) => {
      const user = record.user || {};
      return (
        user.firstname?.toLowerCase().includes(lowerSearch) ||
        user.lastname?.toLowerCase().includes(lowerSearch) ||
        user.email?.toLowerCase().includes(lowerSearch) ||
        user.tag?.toLowerCase().includes(lowerSearch)
      );
    });
    setFilteredData(filtered);
  }, [search, kycData]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading pending KYC records...
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center mt-10 font-medium">{error}</div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "TOTAL KYC",
            value: summary.total,
            sub: `from ${summary.total}`,
            color: "text-blue-500",
            percent: "6%",
          },
          {
            title: "PENDING KYC",
            value: summary.pending,
            sub: `From ${summary.total}`,
            color: "text-yellow-500",
            percent: "16.67%",
          },
          {
            title: "APPROVED KYC",
            value: summary.verified,
            sub: `From ${summary.total}`,
            color: "text-green-500",
            percent: "50%",
          },
          {
            title: "REJECTED KYC",
            value: summary.failed,
            sub: `From ${summary.total}`,
            color: "text-red-500",
            percent: "33.33%",
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
              <div
                className={`text-xs font-semibold ${card.color} bg-gray-50 px-2 py-1 rounded-md`}
              >
                ↗ {card.percent}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between mb-6 relative">
        <div className="flex items-center gap-3 w-full md:w-1/2">
          <Search size={18} className="text-gray-400 absolute ml-3" />
          <input
            type="text"
            placeholder="Search KYC"
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
              <select className="w-full border border-gray-200 rounded-lg p-2 text-gray-600 mb-3 focus:ring-2 focus:ring-blue-400">
                <option value="">All Types</option>
                <option value="NIN">NIN</option>
                <option value="BVN">BVN</option>
                <option value="Passport">Passport</option>
              </select>

              <p className="text-sm font-semibold text-gray-500 mb-2">Status</p>
              <select className="w-full border border-gray-200 rounded-lg p-2 text-gray-600 mb-3 focus:ring-2 focus:ring-blue-400">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="failed">Failed</option>
              </select>

              <p className="text-sm font-semibold text-gray-500 mb-2">
                Date Range
              </p>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg p-2 text-gray-600 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="py-3 px-6 text-left">No.</th>
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Verification Type</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((record, i) => (
                <tr
                  key={record.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-6">{i + 1}</td>
                  <td className="py-3 px-6 flex items-center gap-3">
                    <img
                      src={
                        record.user?.profileImage ||
                        `https://ui-avatars.com/api/?name=${record.user?.firstname}+${record.user?.lastname}`
                      }
                      alt="User"
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {record.user?.firstname} {record.user?.lastname}
                      </p>
                      <p className="text-xs text-gray-500">@{record.user?.tag}</p>
                    </div>
                  </td>
                  <td className="py-3 px-6">{record.type}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === "verified"
                          ? "bg-green-100 text-green-600"
                          : record.status === "pending"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm border border-gray-200 px-3 py-1.5 rounded-lg">
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-6 text-gray-500 font-medium"
                >
                  No KYC records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-500">
          <p>
            Showing: <span className="font-semibold">{filteredData.length}</span>{" "}
            of {kycData.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KycPending;
