import { useState, useEffect } from "react";
import axios from "axios";
import { FiRefreshCcw, FiAlertTriangle, FiCreditCard } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function VirtualCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [statusFilter]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError("");

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

  const handleAction = async (type, cardId) => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("token");

      const endpointMap = {
        freeze: "/superAdmin/card/freeze",
        unfreeze: "/superAdmin/card/unfreeze",
        terminate: "/superAdmin/card/terminate",
      };

      await axios.post(
        `${API_BASE_URL}${endpointMap[type]}`,
        { cardId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await fetchCards();
    } catch {
      alert(`Failed to ${type} card`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FiCreditCard /> Virtual Cards
        </h2>
        <div className="flex items-center gap-3">
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
        <div className="flex justify-center items-center min-h-[50vh] text-gray-500">
          Loading cards...
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center min-h-[50vh] text-gray-500">
          <FiAlertTriangle className="text-red-500 text-3xl mb-2" />
          {error}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center text-gray-500 min-h-[50vh] flex items-center justify-center">
          No cards found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FiCreditCard /> {card.brand?.toUpperCase() || "Card"}
                </h4>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    card.status === "active"
                      ? "bg-green-100 text-green-700"
                      : card.status === "frozen"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {card.status || "unknown"}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  Holder:{" "}
                  <span className="font-medium">
                    {card.name || card.user?.firstname + " " + card.user?.lastname}
                  </span>
                </p>
                <p>
                  Number:{" "}
                  <span className="font-mono">{card.masked || "**** **** **** ****"}</span>
                </p>
                <p>
                  Currency: <span>{card.currency}</span>
                </p>
                <p>
                  Balance:{" "}
                  <span className="font-semibold">
                    {card.currency === "USD" ? "$" : "₦"}
                    {parseFloat(card.balance || 0).toLocaleString()}
                  </span>
                </p>
                <p>
                  User Tag: <span>@{card.user?.tag || "unknown"}</span>
                </p>
                <p>
                  Expiry: <span>{card.expiry || "N/A"}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 mt-4">
                {card.status === "active" && (
                  <button
                    onClick={() => handleAction("freeze", card.card_id)}
                    className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-md text-xs hover:bg-yellow-100"
                  >
                    Freeze
                  </button>
                )}
                {card.status === "frozen" && (
                  <button
                    onClick={() => handleAction("unfreeze", card.card_id)}
                    className="bg-green-50 text-green-700 px-3 py-1.5 rounded-md text-xs hover:bg-green-100"
                  >
                    Unfreeze
                  </button>
                )}
                {card.status !== "terminated" && (
                  <button
                    onClick={() => handleAction("terminate", card.card_id)}
                    className="bg-red-50 text-red-700 px-3 py-1.5 rounded-md text-xs hover:bg-red-100"
                  >
                    Terminate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
