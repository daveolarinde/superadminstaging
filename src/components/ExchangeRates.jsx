import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { CreditCard } from "lucide-react";
import StatCard from "./StatCard";

const API_URL = import.meta.env.VITE_API_URL;

export default function ExchangeRates() {
  const [tab, setTab] = useState("list");


  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);


  const [overviewRates, setOverviewRates] = useState({});
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const [baseCurrency, setBaseCurrency] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("");
  const [rate, setRate] = useState("");
  const [editRate, setEditRate] = useState("");

  const getToken = () => localStorage.getItem("token");

  /* ================= FETCH TABLE RATES ================= */
  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();

      const res = await axios.get(
        `${API_URL}/superAdmin/exchange-rates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRates(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching rates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= FETCH OVERVIEW RATES ================= */
  const fetchOverviewRates = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const token = getToken();

      const res = await axios.get(
        `${API_URL}/superAdmin/rates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOverviewRates(res.data?.data?.rates || {});
    } catch (err) {
      console.error("Error fetching overview rates:", err);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    fetchOverviewRates();
  }, [fetchRates, fetchOverviewRates]);

  /* ================= VIEW RATE ================= */
  const viewRate = async (id) => {
    try {
      setLoading(true);
      const token = getToken();

      const res = await axios.get(
        `${API_URL}/superAdmin/exchange-rates/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelected(res.data.data);
      setEditRate(String(res.data.data.rate));
      setTab("view");
    } catch (err) {
      console.error("Error loading rate:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= CREATE ================= */
  const createRate = async () => {
    if (!baseCurrency || !targetCurrency || !rate) {
      return alert("All fields are required");
    }

    try {
      const token = getToken();

      const res = await axios.post(
        `${API_URL}/superAdmin/exchange-rates`,
        { baseCurrency, targetCurrency, rate: rate.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRates((prev) => [res.data.data, ...prev]);
      fetchOverviewRates(); // refresh summary cards
      setBaseCurrency("");
      setTargetCurrency("");
      setRate("");
      setTab("list");
    } catch (err) {
      console.error("Create failed:", err);
      alert("Error creating rate");
    }
  };

  /* ================= UPDATE ================= */
  const updateRate = async () => {
    if (!selected || saving) return;

    try {
      setSaving(true);
      const token = getToken();

      const res = await axios.put(
        `${API_URL}/superAdmin/exchange-rates/${selected.id}`,
        { rate: editRate.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data.data;

      setRates((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );

      setSelected(updated);
      fetchOverviewRates(); // refresh overview
    } catch (err) {
      console.error("Update failed:", err);
      alert("Error updating rate");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteRate = async () => {
    if (!selected) return;
    if (!window.confirm("Delete this rate?")) return;

    try {
      const token = getToken();

      await axios.delete(
        `${API_URL}/superAdmin/exchange-rates/${selected.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRates((prev) => prev.filter((r) => r.id !== selected.id));
      fetchOverviewRates(); // refresh overview
      setSelected(null);
      setTab("list");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Error deleting rate");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Exchange Rates</h1>
        <p className="text-sm text-gray-500">Manage all currency exchange rates</p>
      </div>

      {/* ================= OVERVIEW CARDS ================= */}
      {tab === "list" && (
        <div className="mt-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            💱 Exchange Rates Overview
          </h3>

          {overviewLoading ? (
            <p className="text-gray-500 text-sm text-center">
              Loading exchange rates...
            </p>
          ) : Object.keys(overviewRates).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
{Object.entries(overviewRates)
  .filter(([pair]) =>
    ["USD-NGN", "NGN-USD"].includes(pair.toUpperCase())
  )
  .map(([pair, value]) => {
    const [base, target] = pair.split("-");

    const formattedValue = Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 6,
      maximumFractionDigits: 8,
    });

    return (
      <StatCard
        key={pair}
        label={`${base} → ${target}`}
        value={`1 ${base} = ${formattedValue} ${target}`}
        icon={<CreditCard className="w-5 h-5" />}
        color="#3b82f6"
      />
    );
  })}


            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center">
              No exchange rate data available.
            </p>
          )}
        </div>
      )}

    


     
      <div className="flex gap-3">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${
            tab === "list"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
          onClick={() => setTab("list")}
        >
          All Rates
        </button>

        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${
            tab === "create"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
          onClick={() => setTab("create")}
        >
          Create New
        </button>
      </div>

      {/* ================= TABLE ================= */}
      {tab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          {loading ? (
            <p className="text-gray-500 text-center py-6">Loading...</p>
          ) : (
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4">Base</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Rate</th>
                  <th className="px-6 py-4">Updated</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
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

      {/* ================= CREATE ================= */}
      {tab === "create" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md space-y-4">
          <input
            placeholder="Base Currency (USD)"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          />
          <input
            placeholder="Target Currency (NGN)"
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          />
          <input
            type="number"
            placeholder="Rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          />
          <button
            onClick={createRate}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            Create
          </button>
        </div>
      )}

      {/* ================= VIEW / EDIT ================= */}
      {tab === "view" && selected && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md">
          <button className="text-sm mb-4" onClick={() => setTab("list")}>
            ← Back
          </button>

          <p><strong>Base:</strong> {selected.baseCurrency}</p>
          <p className="mb-4"><strong>Target:</strong> {selected.targetCurrency}</p>

          <input
            type="number"
            value={editRate}
            onChange={(e) => setEditRate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
          />

          <div className="flex gap-3">
            <button
              disabled={saving}
              onClick={updateRate}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={deleteRate}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
