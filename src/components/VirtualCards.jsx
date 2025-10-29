import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiRefreshCcw } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function VirtualCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCards();
  }, [statusFilter]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = statusFilter ? { status: statusFilter } : {};

      const res = await axios.get(`${API_BASE_URL}/superAdmin/cards`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        params,
      });

      setCards(res.data?.data || []);
    } catch {
      setError("Failed to fetch cards");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, card) => {
    if (!card?.id) return alert("Invalid card selected");
    const token = localStorage.getItem("token");
    const endpointMap = {
      freeze: "/superAdmin/card/freeze",
      unfreeze: "/superAdmin/card/unfreeze",
      terminate: "/superAdmin/card/terminate",
    };
    const payload = { cardId: card.id };

    try {
      setRefreshing(true);
      const res = await axios.post(`${API_BASE_URL}${endpointMap[action]}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(`Card ${card.id} ${action}d successfully!`, res.data);
      fetchCards();
    } catch (error) {
      console.error(`Failed to ${action} card:`, error);
      alert(`Failed to ${action} card`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Virtual Cards</h2>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
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

      {loading ? (
        <p className="text-gray-500 text-center">Loading cards...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : cards.length === 0 ? (
        <p className="text-gray-500 text-center">No cards found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                <th className="px-4 py-3">Card Holder</th>
                <th className="px-4 py-3">Card Number</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
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
                  <td className="px-4 py-3 font-mono">{card.masked}</td>
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
                          : card.status === "frozen"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {card.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 flex items-center gap-2 justify-center">
                    <div className="relative inline-block">
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
                    </div>

                    <button
                      onClick={() => navigate(`/admin/virtual-cards/${card.id}`)}
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
      )}
    </div>
  );
}
