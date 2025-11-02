import React, { useState, useEffect } from "react";
import { FiFilter, FiX } from "react-icons/fi";
import axios from "axios";

const ProfitFilter = ({ filters: initialFilters = {}, onApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: initialFilters.search || "",
    startDate: initialFilters.startDate || "",
    endDate: initialFilters.endDate || "",
  });

  useEffect(() => {
    // keep local state in sync if parent passes different initialFilters later
    setFilters({
      search: initialFilters.search || "",
      startDate: initialFilters.startDate || "",
      endDate: initialFilters.endDate || "",
    });
  }, [initialFilters]);

  const baseURL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  // optional: fetch users for a helper dropdown (not required)
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${baseURL}/superAdmin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) setUsers(res.data.data || []);
      } catch (err) {
        // ignore — optional helper only
        console.debug("Could not fetch users for filter helper:", err);
      }
    };
    fetchUsers();
  }, [baseURL, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const handleApply = () => {
    // normalize and trim
    const normalized = {
      search: (filters.search || "").trim(),
      startDate: (filters.startDate || "").trim(),
      endDate: (filters.endDate || "").trim(),
    };
    onApply(normalized);
    setIsOpen(false);
  };

  const handleClear = () => {
    const cleared = { search: "", startDate: "", endDate: "" };
    setFilters(cleared);
    onApply(cleared);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
      >
        <FiFilter />
        Filter
      </button>

      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/40 z-40" />}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Filter Profits</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
            <FiX size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-600">Username or Email</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="e.g. john or john@example.com"
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {/* optional helper dropdown */}
            {users.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Tip: try selecting a user from your users list below (optional).
                <div className="flex flex-wrap gap-2 mt-2">
                  {users.slice(0, 6).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setFilters((p) => ({ ...p, search: u.email || `${u.firstName} ${u.lastName}` }))}
                      className="text-xs px-2 py-1 border rounded-full"
                    >
                      {u.email || `${u.firstName} ${u.lastName}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t p-5 flex justify-between items-center gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            Clear
          </button>

          <div className="flex gap-3">
            <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition">
              Cancel
            </button>
            <button onClick={handleApply} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitFilter;
