import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function ExchangeRates() {
  const [tab, setTab] = useState("list");
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const [baseCurrency, setBaseCurrency] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("");
  const [rate, setRate] = useState("");

  const [editRate, setEditRate] = useState("");

  const getToken = () => localStorage.getItem("token");

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);

      const token = getToken();
      const res = await axios.get(`${API_URL}/superAdmin/exchange-rates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRates(res.data.data || []);
    } catch (err) {
      console.error("Error fetching rates", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ===========================
      VIEW SINGLE RATE
  ============================ */
  const viewRate = async (id) => {
    try {
      setLoading(true);
      const token = getToken();

      const res = await axios.get(
        `${API_URL}/superAdmin/exchange-rates/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelected(res.data.data);
      setEditRate(res.data.data.rate);
      setTab("view");
    } catch (err) {
      console.error("Error loading rate", err);
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
      CREATE RATE
  ============================ */
  const createRate = async () => {
    try {
      const token = getToken();

      await axios.post(
        `${API_URL}/superAdmin/exchange-rates`,
        {
          baseCurrency,
          targetCurrency,
          rate: Number(rate),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Exchange rate created!");
      setBaseCurrency("");
      setTargetCurrency("");
      setRate("");
      fetchRates();
      setTab("list");
    } catch (err) {
      console.error("Create failed:", err);
      alert("Error creating rate");
    }
  };

  /* ===========================
      UPDATE RATE
  ============================ */
  const updateRate = async () => {
    try {
      const token = getToken();

      await axios.put(
        `${API_URL}/superAdmin/exchange-rates/${selected.id}`,
        {
          rate: Number(editRate),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Rate updated!");
      fetchRates();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Error updating rate");
    }
  };

  /* ===========================
      DELETE RATE
  ============================ */
  const deleteRate = async () => {
    if (!confirm("Delete this rate?")) return;

    try {
      const token = getToken();

      await axios.delete(
        `${API_URL}/superAdmin/exchange-rates/${selected.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Rate deleted!");
      setTab("list");
      fetchRates();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Error deleting rate");
    }
  };

  
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Exchange Rates</h1>
        <p className="text-sm text-gray-500">Manage all currency exchange rates</p>
      </div>

      {/* TABS */}
      <div className="flex gap-3">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${
            tab === "list"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
          onClick={() => setTab("list")}
        >
          All Rates
        </button>

        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${
            tab === "create"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
          onClick={() => setTab("create")}
        >
          Create New
        </button>
      </div>

      {/* LIST */}
      {tab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          {loading ? (
            <p className="text-gray-500 text-center py-6">Loading...</p>
          ) : (
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-600">Base</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Target</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Rate</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Updated</th>
                  <th className="px-6 py-4 font-medium text-gray-600 text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {rates.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">{r.baseCurrency}</td>
                    <td className="px-6 py-4">{r.targetCurrency}</td>
                    <td className="px-6 py-4">{r.rate}</td>
                    <td className="px-6 py-4">{r.updatedAt?.split("T")[0]}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        className="text-blue-600 font-medium hover:underline"
                        onClick={() => viewRate(r.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CREATE */}
      {tab === "create" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md">
          <h2 className="font-semibold text-lg mb-4 text-gray-800">
            Create Exchange Rate
          </h2>

          <div className="space-y-4">
            <input
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Base Currency (USD)"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
            />

            <input
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Target Currency (NGN)"
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
            />

            <input
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Rate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />

            <button
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              onClick={createRate}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* VIEW / EDIT */}
      {tab === "view" && selected && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md">
          <button
            className="text-sm mb-4 text-gray-600 hover:underline"
            onClick={() => setTab("list")}
          >
            ← Back
          </button>

          <p className="text-gray-700">
            <strong>Base:</strong> {selected.baseCurrency}
          </p>

          <p className="text-gray-700 mb-4">
            <strong>Target:</strong> {selected.targetCurrency}
          </p>

          <label className="font-medium text-gray-700">Rate:</label>
          <input
            className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-blue-400 outline-none"
            type="number"
            value={editRate}
            onChange={(e) => setEditRate(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
              onClick={updateRate}
            >
              Save Changes
            </button>

            <button
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
              onClick={deleteRate}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
