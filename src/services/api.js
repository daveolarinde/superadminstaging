// src/services/api.js
import axios from "axios";
console.log("✅ API Base URL:", import.meta.env.VITE_API_URL);
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Automatically attach token from sessionStorage to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No token found in localStorage");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Login function
export const loginSuperAdmin = (email, password) => {
  return API.post("/superAdmin/login", { email, password });
};

export default API;
