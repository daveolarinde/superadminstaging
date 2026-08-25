import React, { useState, useEffect, useMemo } from "react";
import { FiFilter, FiX } from "react-icons/fi";
import axios from "axios";

const CURRENCIES = ["NGN", "USD", "GHS", "GBP", "EUR"];

/**
 * Slide-over filter panel for the Profits page.
 *
 * Props:
 *  - filters:  current filter object { currency, date, startDate, endDate, userId }
 *  - onApply:  (nextFilters) => void
 */
const ProfitFilter = ({ filters: appliedFilters = {}, onApply }) => {
  const [isOpen, setIsOpen] = useState(false);

  // local draft state, only committed to parent on "Apply"
  const [draft, setDraft] = useState({
    currency: appliedFilters.currency || "",
    date: appliedFilters.date || "",
    startDate: appliedFilters.startDate || "",
    endDate: appliedFilters.endDate || "",
    userId: appliedFilters.userId || "",
  });

  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const baseURL = import.meta.env.VITE_STAGE_URL;
  const token = localStorage.getItem("token");

  // keep draft in sync whenever the panel is (re)opened with fresh applied filters
  useEffect(() => {
    if (isOpen) {
      setDraft({
        currency: appliedFilters.currency || "",
        date: appliedFilters.date || "",
        startDate: appliedFilters.startDate || "",
        endDate: appliedFilters.endDate || "",
        userId: appliedFilters.userId || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // fetch users (lazily, once panel opened) — used for the userId picker
  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await axios.get(`${baseURL}/superAdmin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) setUsers(res.data.data || []);
      } catch (err) {
        console.debug("Could not fetch users for filter helper:", err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [isOpen, baseURL, token]);

  // if userId is already applied (e.g. deep link), try to resolve display name once users load
  useEffect(() => {
    if (draft.userId && users.length > 0 && !selectedUser) {
      const match = users.find((u) => u.id === draft.userId);
      if (match) setSelectedUser(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, draft.userId]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 8);
    return users
      .filter((u) =>
        [u.email, u.firstName, u.lastName]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [users, userQuery]);

  const activeCount = Object.values(draft).filter(Boolean).length;

  const handleChange = (key, value) => setDraft((p) => ({ ...p, [key]: value }));

  const handlePickUser = (u) => {
    setSelectedUser(u);
    handleChange("userId", u.id);
    setUserQuery("");
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    handleChange("userId", "");
  };

  const handleApply = () => {
    onApply({
      currency: draft.currency.trim(),
      date: draft.date.trim(),
      startDate: draft.startDate.trim(),
      endDate: draft.endDate.trim(),
      userId: draft.userId.trim(),
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    const cleared = { currency: "", date: "", startDate: "", endDate: "", userId: "" };
    setDraft(cleared);
    setSelectedUser(null);
    setUserQuery("");
    onApply(cleared);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
      >
        <FiFilter className="text-gray-500" />
        Filters
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/40 z-40" />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex justify-between items-center border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Filter Profits</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
            <FiX size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Currency */}
          <div>
            <label className="text-sm font-medium text-gray-600">Currency</label>
            <select
              value={draft.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">All Currencies</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Quick date */}
          <div>
            <label className="text-sm font-medium text-gray-600">Date</label>
            <select
              value={draft.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
            </select>
          </div>

          {/* User picker */}
          <div>
            <label className="text-sm font-medium text-gray-600">User</label>

            {selectedUser ? (
              <div className="flex items-center justify-between border border-gray-300 rounded-md p-2 mt-1 bg-gray-50">
                <span className="text-sm text-gray-700 truncate">
                  {selectedUser.email || `${selectedUser.firstName} ${selectedUser.lastName}`}
                </span>
                <button
                  onClick={handleClearUser}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-100 rounded-md divide-y divide-gray-50">
                  {usersLoading && (
                    <p className="text-xs text-gray-400 px-2 py-2">Loading users…</p>
                  )}
                  {!usersLoading && filteredUsers.length === 0 && (
                    <p className="text-xs text-gray-400 px-2 py-2">No matching users</p>
                  )}
                  {!usersLoading &&
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handlePickUser(u)}
                        className="w-full text-left text-xs px-2 py-2 hover:bg-gray-50 transition"
                      >
                        {u.email || `${u.firstName} ${u.lastName}`}
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Start Date</label>
              <input
                type="datetime-local"
                value={draft.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">End Date</label>
              <input
                type="datetime-local"
                value={draft.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
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
    </div>
  );
};

export default ProfitFilter;