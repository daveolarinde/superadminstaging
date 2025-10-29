import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ViewCardDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/superAdmin/cards`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const foundCard = res.data.data.find((c) => c.id === id);
        setCard(foundCard);
      } catch (error) {
        console.error("Error fetching card details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id]);

  if (loading)
    return (
      <div className="text-gray-300 p-6 animate-pulse">Loading card details...</div>
    );
  if (!card)
    return <div className="text-gray-400 p-6">Card not found.</div>;

  return (
    <div className="p-6 text-white min-h-screen bg-[#020302]">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-sm text-gray-400 hover:text-white transition"
      >
        ← Back
      </button>

      <div className="bg-[#0B0D0C] border border-[#1C1E1C] rounded-2xl p-8 max-w-3xl mx-auto shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-white">
          {card.name}'s Card Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-10">
          <Detail label="Card Holder" value={card.name} />
          <Detail label="Card ID" value={card.card_id} />
          <Detail label="Masked Number" value={card.masked} />
          <Detail
            label="Unmasked Number"
            value={card.number}
            className="tracking-widest text-green-400"
          />
          <Detail label="Brand" value={card.brand.toUpperCase()} />
          <Detail label="Currency" value={card.currency} />
          <Detail label="Balance" value={`$${card.balance}`} />
          <Detail
            label="Status"
            value={card.status}
            className={
              card.status === "active"
                ? "text-green-400"
                : card.status === "frozen"
                ? "text-yellow-400"
                : "text-red-400"
            }
          />
          <Detail label="CVV" value={card.ccv} />
          <Detail label="Billing Postal Code" value={card.billing_postal_code || "N/A"} />
          <Detail label="Customer ID" value={card.customer_id || "N/A"} />
          <Detail label="Expiry" value={card.expiry} />
          <Detail label="Billing City" value={card.billing_city || "N/A"} />
          <Detail label="Billing State" value={card.billing_state || "N/A"} />
          <Detail label="Previous Balance" value={`$${card.prev_balance}`} />
          <Detail label="Created At" value={new Date(card.createdAt).toLocaleString()} />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="bg-[#131613] hover:bg-[#1C1E1C] text-gray-200 text-sm px-5 py-2 rounded-lg border border-[#1C1E1C] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, value, className = "" }) => (
  <div className="flex flex-col space-y-1">
    <span className="text-gray-400 text-xs uppercase">{label}</span>
    <span className={`text-sm font-medium text-white ${className}`}>
      {value || "—"}
    </span>
  </div>
);

export default ViewCardDetails;
