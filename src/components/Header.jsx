import { useState } from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Header({  setIsAuthenticated }) {
  const [showBanner, setShowBanner] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  

  // ✅ Handle logout
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");

      if (typeof setIsAuthenticated === "function") {
        setIsAuthenticated(false);
      } else {
        console.warn("⚠️ setIsAuthenticated prop not provided to <Header>");
      }

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-6 relative">
       

        {/* 🧑‍💼 Right Section (Notifications + User Menu) */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Bell Icon */}
          <button
            type="button"
            className="relative p-2 hover:bg-gray-50 rounded-full transition"
          >
            <FaBell className="text-[1.3rem] text-gray-600 hover:text-blue-600 transition" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-50 transition"
            >
              <FaUserCircle className="text-2xl text-gray-600 hover:text-blue-600 transition" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg border border-gray-100 rounded-lg w-44 py-1 z-50 animate-fadeIn">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✨ Animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </header>
  );
}
