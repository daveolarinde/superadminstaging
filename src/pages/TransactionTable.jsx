import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

export default function TransactionTable() {
  const [transactions, setTransactions]               = useState([]);
  const [searchTerm, setSearchTerm]                   = useState("");
  const [showFilter, setShowFilter]                   = useState(false);
  const [filterTransactionId, setFilterTransactionId] = useState("");
  const [filterStartDate, setFilterStartDate]         = useState("");
  const [filterEndDate, setFilterEndDate]             = useState("");
  const [filterCurrency, setFilterCurrency]           = useState("");
  const [filterType, setFilterType]                   = useState("");
  const [filterClass, setFilterClass]                 = useState("");
  const [loading, setLoading]                         = useState(false);
  const [currentPage, setCurrentPage]                 = useState(1);

  // ✅ Staged filter state — only committed when "Apply" is clicked
  const [stagedStartDate, setStagedStartDate] = useState("");
  const [stagedEndDate, setStagedEndDate]     = useState("");
  const [stagedCurrency, setStagedCurrency]   = useState("");
  const [stagedType, setStagedType]           = useState("");
  const [stagedClass, setStagedClass]         = useState("");

  const pageSize = 10;
  const navigate = useNavigate();
  const location = useLocation();
  const token    = localStorage.getItem("token");
  const baseUrl  = import.meta.env.VITE_STAGE_API_URL;
  const selectedCurrency = location.state?.currency || "";

  // ── Fetch — depends only on committed filter state ─────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStartDate) params.startDate        = filterStartDate;
      if (filterEndDate)   params.endDate          = filterEndDate;
      if (filterType)      params.type             = filterType;
      if (filterClass)     params.transactionClass = filterClass;

      // Route-level currency takes priority over filter currency
      if (selectedCurrency)  params.currency = selectedCurrency;
      else if (filterCurrency) params.currency = filterCurrency;

      const res = await axios.get(`${baseUrl}/superAdmin/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map((tx, idx) => ({
          id:            idx + 1,
          transactionId: tx.id,
          type:          tx.type,
          user: {
            id:       tx.user?.id,
            name:     `${tx.user?.firstname || "Unknown"} ${tx.user?.lastname || ""}`.trim(),
            username: tx.user?.tag ? `@${tx.user.tag}` : tx.user?.email || "",
          },
          amount:      `${tx.type === "credit" ? "+" : "-"}${tx.amount} ${tx.currency}`,
          old_balance: tx.oldBalance ?? tx.old_balance ?? "-",
          new_balance: tx.newBalance ?? tx.new_balance ?? "-",
          charge:      tx.fee ? `${tx.fee} ${tx.currency}` : "0.00",
          remarks:     tx.info || tx.type || "-",
          dateTime:    new Date(tx.createdAt || Date.now()).toLocaleString(),
          raw:         tx,
        }));
        setTransactions(formatted);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterCurrency, filterType, filterClass, selectedCurrency, token, baseUrl]);

  // ✅ Re-fetch whenever committed filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ── Sync staged state when modal opens ───────────────────────────────────
  const handleOpenFilter = () => {
    setStagedStartDate(filterStartDate);
    setStagedEndDate(filterEndDate);
    setStagedCurrency(filterCurrency);
    setStagedType(filterType);
    setStagedClass(filterClass);
    setShowFilter(true);
  };

  // ✅ Apply — commit staged → real filter state, then close modal
  // useEffect above will detect the state changes and re-fetch automatically
  const handleApplyFilters = () => {
    setFilterStartDate(stagedStartDate);
    setFilterEndDate(stagedEndDate);
    setFilterCurrency(stagedCurrency);
    setFilterType(stagedType);
    setFilterClass(stagedClass);
    setCurrentPage(1);
    setShowFilter(false);
  };

  const handleClearFilters = () => {
    // Clear both staged and committed
    setStagedStartDate(""); setStagedEndDate("");
    setStagedCurrency("");  setStagedType(""); setStagedClass("");
    setFilterTransactionId("");
    setFilterStartDate(""); setFilterEndDate("");
    setFilterCurrency("");  setFilterType(""); setFilterClass("");
    setCurrentPage(1);
    setShowFilter(false);
  };

  // ── Client-side search + paginate ────────────────────────────────────────
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilterId = filterTransactionId
      ? tx.transactionId.toLowerCase().includes(filterTransactionId.toLowerCase())
      : true;
    return matchesSearch && matchesFilterId;
  });

  const totalPages          = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex          = (currentPage - 1) * pageSize;
  const endIndex            = Math.min(startIndex + pageSize, filteredTransactions.length);
  const currentTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);
  const pageNumbers         = getPageNumbers(currentPage, totalPages);
  const activeFilterCount   = [filterStartDate, filterEndDate, filterCurrency, filterType, filterClass].filter(Boolean).length;

  const headers = ["No.", "Transaction ID", "User", "Amount", "Old Balance", "New Balance", "Charge", "Remarks", "Date & Time", "Action"];

  const classBadgeMap = {
    card:     "bg-violet-50 text-violet-700 border border-violet-200",
    swap:     "bg-amber-50 text-amber-700 border border-amber-200",
    transfer: "bg-blue-50 text-blue-700 border border-blue-200",
    wallet:   "bg-teal-50 text-teal-700 border border-teal-200",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
          <FiArrowLeft size={15} /> Back
        </button>
        {selectedCurrency && (
          <span className="text-sm text-gray-500">
            Filtering by:{" "}
            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg">{selectedCurrency}</span>
          </span>
        )}
      </div>

      {/* ── Search + Filter row ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-5 gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search by name or transaction ID…" value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleOpenFilter}
            className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-700">
            <SlidersHorizontal size={15} /> Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterType && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              Type: {filterType}
              <button onClick={() => { setFilterType(""); setStagedType(""); }}><X size={10} /></button>
            </span>
          )}
          {filterClass && (
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${classBadgeMap[filterClass] || "bg-gray-100 text-gray-700"}`}>
              Class: {filterClass}
              <button onClick={() => { setFilterClass(""); setStagedClass(""); }}><X size={10} /></button>
            </span>
          )}
          {filterCurrency && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              Currency: {filterCurrency}
              <button onClick={() => { setFilterCurrency(""); setStagedCurrency(""); }}><X size={10} /></button>
            </span>
          )}
          {filterStartDate && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              From: {filterStartDate}
              <button onClick={() => { setFilterStartDate(""); setStagedStartDate(""); }}><X size={10} /></button>
            </span>
          )}
          {filterEndDate && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              To: {filterEndDate}
              <button onClick={() => { setFilterEndDate(""); setStagedEndDate(""); }}><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400 text-sm">
            <span className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            Loading transactions…
          </div>
        ) : currentTransactions.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <p className="text-2xl mb-2">📭</p>No transactions found
          </div>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentTransactions.map((tx, index) => (
                <tr key={tx.transactionId} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3.5 text-xs font-mono text-gray-400">{String(startIndex + index + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{tx.transactionId.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3.5 cursor-pointer group" onClick={() => tx.user.id && navigate(`/admin/all-users/${tx.user.id}`)}>
                    <div className="flex items-center gap-2.5 min-w-[140px]">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                        {tx.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-xs group-hover:text-blue-600 transition leading-tight">{tx.user.name}</p>
                        <p className="text-[11px] text-gray-400">{tx.user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`font-bold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>{tx.amount}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{tx.old_balance}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-700 font-mono font-medium">{tx.new_balance}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium">{tx.charge}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 capitalize max-w-[110px] truncate">{tx.remarks}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-400">{tx.dateTime}</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => navigate(`/admin/transactions/view`, { state: { transaction: tx.raw } })}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {filteredTransactions.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5">
          <p className="text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-600">{startIndex + 1}–{endIndex}</span> of{" "}
            <span className="font-semibold text-gray-600">{filteredTransactions.length}</span> transactions
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition ${currentPage === 1 ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white" : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"}`}>
              <ChevronLeft size={15} />
            </button>
            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span key={`e-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
              ) : (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition ${p === currentPage ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"}`}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition ${currentPage === totalPages ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white" : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"}`}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Filter Modal ── */}
      {showFilter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">Filter Transactions</h3>
                <p className="text-xs text-gray-400 mt-0.5">Narrow down results</p>
              </div>
              <button onClick={() => setShowFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">

              {/* Date range — now edits STAGED state */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">From</label>
                    <input type="date" value={stagedStartDate} onChange={(e) => setStagedStartDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">To</label>
                    <input type="date" value={stagedEndDate} onChange={(e) => setStagedEndDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Currency</label>
                <select value={stagedCurrency || selectedCurrency} onChange={(e) => setStagedCurrency(e.target.value)}
                  disabled={!!selectedCurrency}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400">
                  <option value="">All Currencies</option>
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Transaction Type</label>
                <div className="flex gap-2">
                  {[{ v: "", l: "All" }, { v: "credit", l: "Credit" }, { v: "debit", l: "Debit" }].map((t) => (
                    <button key={t.v} onClick={() => setStagedType(t.v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                        stagedType === t.v
                          ? t.v === "credit" ? "bg-emerald-600 border-emerald-600 text-white"
                          : t.v === "debit"  ? "bg-red-500 border-red-500 text-white"
                          : "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                      }`}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Class */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Transaction Class</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "",         l: "All",       cls: "bg-blue-600 border-blue-600 text-white"     },
                    { v: "card",     l: "💳 Card",    cls: "bg-violet-600 border-violet-600 text-white" },
                    { v: "swap",     l: "🔄 Swap",    cls: "bg-amber-500 border-amber-500 text-white"   },
                    { v: "transfer", l: "↗ Transfer", cls: "bg-blue-600 border-blue-600 text-white"     },
                    { v: "wallet",   l: "👜 Wallet",  cls: "bg-teal-600 border-teal-600 text-white"     },
                  ].map((c) => (
                    <button key={c.v} onClick={() => setStagedClass(c.v)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${
                        stagedClass === c.v ? c.cls : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                      } ${c.v === "" ? "col-span-2" : ""}`}>
                      {c.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition">
                Clear All
              </button>
              {/* ✅ Apply just commits staged state — useEffect handles the re-fetch */}
              <button onClick={handleApplyFilters}
                className="px-6 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}