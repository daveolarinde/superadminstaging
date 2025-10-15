import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginSuperAdmin } from "../services/api";

export default function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginSuperAdmin(email, password);
      localStorage.setItem("token", res.data.token); // ✅ use localStorage
      setIsAuthenticated(true);
      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Login failed. Please check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Admin Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8b54af]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8b54af]"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold text-white shadow transition duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#8b54af] hover:bg-[#7a47a0]"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
