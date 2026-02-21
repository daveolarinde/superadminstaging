import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiRefreshCcw } from "react-icons/fi";

const baseURL = import.meta.env.VITE_API_URL;

export default function VirtualCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError("");

      const params = statusFilter ? { status: statusFilter } : {};

      const res = await axios.get(`${baseURL}/superAdmin/cards`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        params,
      });

      setCards(res.data?.data || []);
    } catch (err) {
      console.error("Fetch cards error:", err);
      setError("Failed to fetch cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (baseURL && token) {
      fetchCards();
    }
  }, [statusFilter]);

  const summary = useMemo(() => {
    const activeCards = cards.filter(
      (c) => String(c.status).toLowerCase() === "active"
    ).length;

    const freezeCards = cards.filter(
      (c) => String(c.status).toLowerCase() === "freeze"
    ).length;

    const blockedCards = cards.filter(
      (c) => String(c.status).toLowerCase() === "blocked"
    ).length;

    const terminatedCards = cards.filter(
      (c) => String(c.status).toLowerCase() === "terminated"
    ).length;

    return {
      totalCards: cards.length,
      activeCards,
      freezeCards,
      blockedCards,
      terminatedCards,
    };
  }, [cards]);

  const handleAction = async (action, card) => {
    if (!card?.id) return alert("Invalid card selected");

    const endpointMap = {
      freeze: "/superAdmin/card/freeze",
      unfreeze: "/superAdmin/card/unfreeze",
      terminate: "/superAdmin/card/terminate",
    };

    try {
      setRefreshing(true);

      await axios.post(
        `${baseURL}${endpointMap[action]}`,
        { cardId: card.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      fetchCards();
    } catch (error) {
      console.error(`Failed to ${action} card:`, error);
      alert(`Failed to ${action} card`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header + Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Virtual Cards
        </h2>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="freeze">Frozen</option>
            <option value="terminated">Terminated</option>
          </select>

          <button
            onClick={fetchCards}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border ${
              refreshing
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <FiRefreshCcw className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "TOTAL CARDS", value: summary.totalCards },
          { label: "ACTIVE CARDS", value: summary.activeCards },
          { label: "FREEZED CARDS", value: summary.freezeCards },
          { label: "TERMINATED CARDS", value: summary.terminatedCards },
          { label: "BLOCKED CARDS", value: summary.blockedCards },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col"
          >
            <div className="text-gray-500 text-xs sm:text-sm mb-1">
              {card.label}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800">
              {card.value?.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 text-center">Loading cards...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : cards.length === 0 ? (
        <p className="text-gray-500 text-center">No cards found.</p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                  <th className="px-4 py-3">Card Holder</th>
                  <th className="px-4 py-3">Card Number</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr
                    key={card.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {card.name}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {card.masked}
                    </td>
                    <td className="px-4 py-3">{card.currency}</td>
                    <td className="px-4 py-3">
                      {card.currency === "USD" ? "$" : "₦"}
                      {parseFloat(card.balance || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          card.status === "active"
                            ? "bg-green-100 text-green-700"
                            : card.status === "freeze"
                            ? "bg-yellow-100 text-yellow-700"
                            : card.status === "terminated"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {card.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{card.brand}</td>
                    <td className="px-4 py-3 flex items-center gap-2 justify-center">
                      <select
                        className="border border-gray-300 rounded-md text-xs px-2 py-1 bg-white"
                        defaultValue=""
                        onChange={(e) => {
                          const action = e.target.value;
                          if (action) handleAction(action, card);
                        }}
                      >
                        <option value="">Action</option>
                        {card.status === "active" && (
                          <option value="freeze">Freeze</option>
                        )}
                        {card.status === "freeze" && (
                          <option value="unfreeze">Unfreeze</option>
                        )}
                        {card.status !== "terminated" && (
                          <option value="terminate">Terminate</option>
                        )}
                      </select>

                      <button
                        onClick={() =>
                          navigate(`/admin/virtual-cards/${card.id}`)
                        }
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
