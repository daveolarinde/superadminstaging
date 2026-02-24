import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, CheckCircle2, XCircle, Clock, Copy, Check } from "lucide-react";

export default function ViewTransactions() {
  const { id }       = useParams();
  const location     = useLocation();
  const navigate     = useNavigate();

  const [transaction, setTransaction] = useState(location.state?.transaction || null);
  const [loading, setLoading]         = useState(!transaction);
  const [copied, setCopied]           = useState(false);

  const token   = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (transaction || !id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/superAdmin/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransaction(res.data?.data || res.data);
      } catch (err) {
        console.error("❌ Error fetching transaction:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const copyId = () => {
    if (!transaction?.id) return;
    navigator.clipboard.writeText(transaction.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-9 h-9 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      <p className="text-sm text-gray-400">Loading transaction details…</p>
    </div>
  );

  if (!transaction) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <p className="text-3xl">📭</p>
      <p className="text-sm text-gray-500 font-medium">Transaction not found</p>
      <button onClick={() => navigate(-1)} className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition">
        ← Go back
      </button>
    </div>
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const status = transaction.status?.toLowerCase();
  const isSuccess = status === "success" || status === "completed";
  const isFailed  = status === "failed";

  const statusConfig = isSuccess
    ? { icon: <CheckCircle2 size={36} className="text-emerald-500" />, text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", label: "Successful" }
    : isFailed
    ? { icon: <XCircle size={36} className="text-red-500" />,         text: "text-red-600",     bg: "bg-red-50",     ring: "ring-red-100",     label: "Failed"      }
    : { icon: <Clock size={36} className="text-amber-500" />,         text: "text-amber-600",   bg: "bg-amber-50",   ring: "ring-amber-100",   label: "Pending"     };

  const isCredit = transaction.type === "credit";

  let parsedDescription = "-";
  try {
    if (transaction.details) {
      parsedDescription = JSON.parse(transaction.details)?.description || "-";
    }
  } catch { /* ignore */ }

  const rows = [
    { label: "Transaction Type", value: transaction.type,         mono: false },
    { label: "Info",             value: transaction.info,         mono: false },
    { label: "Total Amount",     value: transaction.total_amount, mono: true  },
    { label: "Fee",              value: transaction.fee || "0.00",mono: true  },
    { label: "Description",      value: parsedDescription,        mono: false },
    { label: "Currency",         value: transaction.currency,     mono: false },
    { label: "Date & Time",      value: transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : "-", mono: false },
  ].filter((r) => r.value && r.value !== "-" && r.value !== null && r.value !== undefined);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-4">

        {/* ── Back button ── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {/* ── Receipt card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* ── Status header ── */}
          <div className={`${statusConfig.bg} px-6 pt-8 pb-6 flex flex-col items-center gap-3 border-b border-dashed border-gray-200`}>
            <div className={`w-16 h-16 rounded-2xl ${statusConfig.bg} ring-4 ${statusConfig.ring} flex items-center justify-center`}>
              {statusConfig.icon}
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${statusConfig.text}`}>{statusConfig.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">Transaction Receipt</p>
            </div>
          </div>

          {/* ── Amount block ── */}
          <div className="px-6 py-6 border-b border-dashed border-gray-100 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Amount</p>
            <p className={`text-4xl font-black tracking-tight ${isCredit ? "text-emerald-600" : "text-gray-900"}`}>
              {isCredit ? "+" : "-"}{transaction.currency} {transaction.amount}
            </p>
          </div>

          {/* ── Transaction ID ── */}
          <div className="px-6 py-4 border-b border-dashed border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transaction ID</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="font-mono text-xs text-gray-600 flex-1 truncate">{transaction.id}</p>
              <button
                onClick={copyId}
                className="shrink-0 text-gray-400 hover:text-blue-600 transition"
                title="Copy ID"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* ── Detail rows ── */}
          <div className="px-6 py-5 space-y-0 divide-y divide-gray-50">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 py-3">
                <span className="text-xs font-semibold text-gray-400 shrink-0 pt-0.5">{row.label}</span>
                <span className={`text-xs text-right text-gray-800 ${row.mono ? "font-mono font-semibold" : "font-medium"} capitalize`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Footer dots (receipt tearline effect) ── */}
          <div className="flex justify-between items-center px-4 pb-5 pt-1">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gray-100" />
            ))}
          </div>
        </div>

        {/* ── Print hint ── */}
        <p className="text-center text-xs text-gray-300 pb-4">
          Transaction ID · {transaction.id?.slice(0, 12)}…
        </p>
      </div>
    </div>
  );
}