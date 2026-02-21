
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Search, Filter, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

const KycAll = () => {
  const navigate = useNavigate();
const [rejectModal, setRejectModal] = useState(null);
const [rejectSubject, setRejectSubject] = useState("");
const [rejectReason, setRejectReason] = useState("");
  const [kycData, setKycData] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionOpenId, setActionOpenId] = useState(null);

  const rowsPerPage = 10;
  const baseURL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

 
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ------------------ API ------------------ */

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${baseURL}/superAdmin/kyc`, authHeader);
      const data = res.data?.data || [];
      setSummary({
        total: data.length,
        pending: data.filter((d) => d.status === "pending").length,
        verified: data.filter((d) => d.status === "approved").length,
        failed: data.filter((d) => d.status === "rejected").length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKycPaginated = async (page = 1, isInitial = false) => {
  try {
    isInitial ? setInitialLoading(true) : setTableLoading(true);

    const normalizedSearch =
      debouncedSearch?.trim().length > 1
        ? debouncedSearch.trim()
        : undefined;

    const res = await axios.get(`${baseURL}/superAdmin/kyc`, {
      ...authHeader,
      params: {
        page,
        limit: rowsPerPage,
        q: normalizedSearch, 
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      },
    });

    setKycData(res.data?.data || []);
    setTotalPages(res.data?.pagination?.totalPages || 1);
  } catch (err) {
    setError("Failed to fetch KYC records.");
  } finally {
    setInitialLoading(false);
    setTableLoading(false);
  }
};
const filteredKycData = useMemo(() => {
  if (!debouncedSearch) return kycData;

  const keyword = debouncedSearch.toLowerCase();

  return kycData.filter((record) => {
    const first = record.user?.firstname?.toLowerCase() || "";
    const last = record.user?.lastname?.toLowerCase() || "";
    const tag = record.user?.tag?.toLowerCase() || "";
    const type = record.type?.toLowerCase() || "";

    return (
      first.includes(keyword) ||
      last.includes(keyword) ||
      tag.includes(keyword) ||
      type.includes(keyword)
    );
  });
}, [kycData, debouncedSearch]);


  const updateKycStatus = async (kycId, payload) => {
    await axios.patch(
      `${baseURL}/superAdmin/kyc/${kycId}/status`,
      payload,
      authHeader
    );
  };

const handleStatusChange = async (record, status) => {
  if (status === "rejected") {
    setRejectModal(record);
    setActionOpenId(null);
    return;
  }

  try {
    await updateKycStatus(record.id, { status });
    fetchKycPaginated(currentPage);
    fetchSummary();
  } catch {
    alert("Failed to update KYC status");
  } finally {
    setActionOpenId(null);
  }
};
  

useEffect(() => {
  fetchSummary();
  fetchKycPaginated(1, true);
}, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    fetchKycPaginated(currentPage);
  }, [currentPage, debouncedSearch, statusFilter, typeFilter]);

  if (initialLoading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading KYC records...
      </div>
    );

  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;

  

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
      {/* TABLE */} {/* table loading overlay */}
      {tableLoading && (
        <div className="text-sm text-gray-400 mb-2">Updating results…</div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">No.</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
          {filteredKycData.map((record, i) => (
              <tr key={record.id} className=" hover:bg-gray-50">
                <td className="px-6 py-4">
                  {(currentPage - 1) * rowsPerPage + i + 1}
                </td>

                <td className="px-6 py-4 flex gap-3 items-center">
                  <img
                    src={record.documentUrl || record.selfieUrl}
                    className="w-8 h-8 rounded-full border"
                  />
                  <div>
                    <p className="font-medium">
                      {record.user?.firstname} {record.user?.lastname}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{record.user?.tag}
                    </p>
                  </div>
                </td>

                <td className="px-6 py-4 capitalize">{record.type}</td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      record.status === "approved"
                        ? "bg-green-100 text-green-600"
                        : record.status === "pending"
                        ? "bg-yellow-100 text-yellow-600"
                        : record.status === "success"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {record.status}
                  </span>
                </td>

                
              {/* ACTION DROPDOWN */}
<td className="px-6 py-4 relative">
 <button
  onClick={() =>
    setActionOpenId(actionOpenId === record.id ? null : record.id)
  }
  className="flex items-center gap-2 px-3 py-1.5  text-sm
             transition"
>
  <span>Action</span>
  <MoreVertical size={16} />
</button>


  {actionOpenId === record.id && (
    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
      
      {/* APPROVE */}
      <button
        onClick={() => handleStatusChange(record, "approved")}
        className="block w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-green-600"
      >
        Approve
      </button>

      {/* PENDING */}
      <button
        onClick={() => handleStatusChange(record, "pending")}
        className="block w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-600"
      >
        Set Pending
      </button>

      {/* REJECT */}
      <button
        onClick={() => handleStatusChange(record, "rejected")}
        className="block w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600"
      >
        Reject
      </button>
<button
  onClick={() => {
   
    navigate(`/admin/all-users/${record.user.id}`);
    
  }}
  className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
>
  View Profile
</button>
      {/* DIVIDER */}
      {(record.documentUrl || record.selfieUrl) && (
        <div className="h-px bg-gray-100 my-1" />
      )}

      {/* VIEW DOCUMENT */}
      {record.documentUrl || record.selfieUrl ? (
        <a
          href={record.documentUrl || record.selfieUrl}
          target="_blank"
          rel="noreferrer"
          className="block px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-600"
        >
          View Document
        </a>
      ) : null}
    </div>
  )}
</td>

              </tr>
            ))}
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
{/* REJECT MODAL */}
{rejectModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl w-full max-w-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Reject KYC</h3>
        <button onClick={() => setRejectModal(null)}>
          ✕
        </button>
      </div>

      <input
        placeholder="Subject"
        value={rejectSubject}
        onChange={(e) => setRejectSubject(e.target.value)}
        className="w-full border rounded-lg p-2 mb-3 focus:ring-2 focus:ring-red-400"
      />

      <textarea
        placeholder="Reason"
        rows={4}
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-red-400"
      />

      <button
        disabled={!rejectSubject || !rejectReason}
        onClick={async () => {
          await updateKycStatus(rejectModal.id, {
            status: "rejected",
            subject: rejectSubject,
            reason: rejectReason,
          });

          setRejectModal(null);
          setRejectSubject("");
          setRejectReason("");
          fetchKycPaginated(currentPage);
          fetchSummary();
        }}
        className="w-full bg-red-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        Reject KYC
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default KycAll;
