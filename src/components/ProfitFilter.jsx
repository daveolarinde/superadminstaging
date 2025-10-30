import React, { useState } from "react";
import { FiFilter, FiX } from "react-icons/fi";

const ProfitFilter = ({ onApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    userId: "",
    currency: "",
    transactionId: "",
    date: "",
    startDate: "",
    endDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleApply = () => {
    onApply(filters);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
      >
        <FiFilter />
        Filter
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40"
        ></div>
      )}

      {/* Slide-over Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Filter Profits</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">User ID</label>
            <input
              type="text"
              name="userId"
              value={filters.userId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Currency</label>
            <select
              name="currency"
              value={filters.currency}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select</option>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Transaction ID</label>
            <input
              type="text"
              name="transactionId"
              value={filters.transactionId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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

        {/* Footer Buttons */}
        <div className="border-t p-5 flex justify-end gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfitFilter;
