// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

export const loginSuperAdmin = (email, password) => {
  return API.post("/superAdmin/login", { email, password });
};