
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Search, Filter } from "lucide-react";

import KycSummaryCards from "../../components/Kyc/KycSummaryCards";
import KycTable from "../../components/Kyc/KycTable";

const KycApproved = () => {
  const [rejectModal, setRejectModal]     = useState(null);
  const [rejectSubject, setRejectSubject] = useState("");
  const [rejectReason, setRejectReason]   = useState("");

  const [kycData, setKycData]             = useState([]);
  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading]     = useState(false);
  const [error, setError]                   = useState(null);

  const [summary, setSummary] = useState({
    total: 0, pending: 0, success: 0, approved: 0, failed: 0,
  });

  const [filterOpen, setFilterOpen]     = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [actionOpenId, setActionOpenId] = useState(null);

  const rowsPerPage = 10;
  const baseURL     = import.meta.env.VITE_STAGE_API_URL;
  const token       = localStorage.getItem("token");
  const authHeader  = { headers: { Authorization: `Bearer ${token}` } };

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch summary ──────────────────────────────────────────────────────────
  const fetchSummary = async () => {
    try {
      const res  = await axios.get(`${baseURL}/superAdmin/kyc`, authHeader);
      const data = res.data?.data || [];
      setSummary({
        total:    data.length,
        pending:  data.filter((d) => d.status === "pending").length,
        success:  data.filter((d) => d.status === "success").length,
        approved: data.filter((d) => d.status === "approved").length,
        failed:   data.filter((d) => d.status === "rejected").length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ── Fetch paginated KYC data ───────────────────────────────────────────────
  const fetchKycPaginated = async (page = 1) => {
    try {
      setTableLoading(true);
      const normalizedSearch =
        debouncedSearch?.trim().length > 1 ? debouncedSearch.trim() : undefined;

      const res = await axios.get(`${baseURL}/superAdmin/kyc`, {
        ...authHeader,
        params: {
          limit:  rowsPerPage,
          offset: (page - 1) * rowsPerPage,
          q:      normalizedSearch,
          status: "approved",
          type:   typeFilter   || undefined,
        },
      });

      setKycData(res.data?.data || []);
    } catch {
      setError("Failed to fetch KYC records.");
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  // ── Client-side search filter (optional extra layer) ──────────────────────
  const filteredKycData = useMemo(() => {
    if (!debouncedSearch) return kycData;
    const kw = debouncedSearch.toLowerCase();
    return kycData.filter((r) => {
      const first = r.user?.firstname?.toLowerCase() || "";
      const last  = r.user?.lastname?.toLowerCase()  || "";
      const tag   = r.user?.tag?.toLowerCase()       || "";
      const type  = r.type?.toLowerCase()            || "";
      return first.includes(kw) || last.includes(kw) || tag.includes(kw) || type.includes(kw);
    });
  }, [kycData, debouncedSearch]);

  // ── Update KYC status ─────────────────────────────────────────────────────
  const updateKycStatus = (kycId, payload) =>
    axios.patch(`${baseURL}/superAdmin/kyc/${kycId}/status`, payload, authHeader);

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

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSummary();
    fetchKycPaginated(1);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    fetchKycPaginated(currentPage);
  }, [currentPage, debouncedSearch, statusFilter, typeFilter]);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (initialLoading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading KYC records...
      </div>
    );
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* ── Summary Cards ── */}
      <KycSummaryCards summary={summary} />

      {/* ── Search + Filter bar ── */}
      <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between mb-6 relative border border-gray-100">
        <div className="flex items-center gap-3 w-full md:w-1/2 relative">
          <Search size={18} className="text-gray-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search KYC records by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="relative mt-4 md:mt-0">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            <Filter size={18} /> Filter
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-10 p-4">
              <p className="text-sm font-semibold text-gray-500 mb-2">Verification Type</p>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
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
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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

      {/* ── KYC Table ── */}
      <KycTable
        data={filteredKycData}
        currentPage={currentPage}
        totalCount={summary.total}
        rowsPerPage={rowsPerPage}
        tableLoading={tableLoading}
        actionOpenId={actionOpenId}
        setActionOpenId={setActionOpenId}
        onStatusChange={handleStatusChange}
        onPageChange={setCurrentPage}
      />

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Reject KYC</h3>
              <button onClick={() => setRejectModal(null)}>✕</button>
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

export default KycApproved;