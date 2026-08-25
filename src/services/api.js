import axios from "axios";
const API = axios.create({
  baseURL: import.meta.env.VITE_STAGE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
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
export const loginSuperAdmin = (email, password) => {
  return API.post("/superAdmin/login", { email, password });
};
export default API;
