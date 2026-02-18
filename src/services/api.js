// api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // or your API URL

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Response interceptor to sanitize errors
api.interceptors.response.use(
  (response) => response, // pass through successful responses
  (error) => {
    // Only log errors in development
    if (import.meta.env.DEV) {
      console.error("API Error:", error);
    }

    // Return sanitized error message
    const message =
      error.response?.data?.message || "Something went wrong. Please try again.";
    
    // Reject with sanitized message
    return Promise.reject(message);
  }
);

export default api;
