import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";

export default function ViewTransactions() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(location.state?.transaction || null);
  const [loading, setLoading] = useState(!transaction);

  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchTransaction = async () => {
      if (transaction || !id) return;
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/superAdmin/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransaction(res.data?.data || res.data);
      } catch (error) {
        console.error("❌ Error fetching transaction details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600">
        <p>Loading transaction details...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-10 text-center text-gray-600">
        <p>No transaction found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ← Back
        </button>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
      case "completed":
        return <FiCheckCircle className="text-green-600" size={22} />;
      case "failed":
        return <FiXCircle className="text-red-600" size={22} />;
      default:
        return <FiClock className="text-yellow-500" size={22} />;
    }
  };

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 max-w-lg w-full relative border border-gray-200">
        {/* Decorative top tear line */}
        <div className="absolute -top-2 left-0 right-0 flex justify-between px-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-gray-100 rounded-full" />
          ))}
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 text-sm hover:text-gray-800 mb-6"
        >
          <FiArrowLeft className="mr-1" /> Back
        </button>

        {/* Header */}
        <div className="text-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Transaction Receipt</h2>
          <p className="text-gray-500 text-sm mt-1 break-all">
            {transaction.id}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {getStatusIcon(transaction.status)}
          <span
            className={`text-lg font-medium ${
              transaction.status === "completed" || transaction.status === "success"
                ? "text-green-600"
                : transaction.status === "failed"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {transaction.status?.toUpperCase()}
          </span>
        </div>

        {/* Amount */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm">Amount</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {transaction.currency || "USD"} {transaction.amount || "0.00"}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Fee: {transaction.fee || "0.00"}
          </p>
        </div>

        {/* Details Section */}
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="font-medium">Type:</span>
            <span>{transaction.type || "-"}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Info:</span>
            <span>{transaction.info || "-"}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Total Amount:</span>
            <span>{transaction.total_amount || "-"}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Description:</span>
            <span>
              {transaction.details
                ? JSON.parse(transaction.details)?.description || "-"
                : "-"}
            </span>
          </div>

          <div className="flex justify-between border-t pt-3 mt-3">
            <span className="font-medium">Date:</span>
            <span>
              {new Date(transaction.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Print / Download */}
        <div className="text-center mt-8 border-t pt-4">
          {/* <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Print Receipt
          </button> */}
        </div>
      </div>
    </div>
  );
}
