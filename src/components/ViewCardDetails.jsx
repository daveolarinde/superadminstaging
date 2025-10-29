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

  if (loading) return <div className="text-white p-6">Loading card details...</div>;
  if (!card) return <div className="text-white p-6">Card not found.</div>;

  return (
    <div className="p-6 text-white">
      <button onClick={() => navigate(-1)} className="mb-4 text-gray-400 hover:text-white text-sm">
        ← Back
      </button>

      <div className="bg-[#0B0D0C] border border-[#1C1E1C] rounded-xl p-6 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">{card.name}'s Card</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Masked:</strong> {card.masked}</p>
          <p><strong>Brand:</strong> {card.brand}</p>
          <p><strong>Currency:</strong> {card.currency}</p>
          <p><strong>Balance:</strong> ${card.balance}</p>
          <p><strong>Status:</strong> {card.status}</p>
          <p><strong>Expiry:</strong> {card.expiry}</p>
          <p><strong>Billing City:</strong> {card.billing_city}</p>
          <p><strong>Created At:</strong> {new Date(card.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ViewCardDetails;
