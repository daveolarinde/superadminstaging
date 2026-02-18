// login.js
import api from "./api";

export const loginSuperAdmin = async (email, password) => {
  const response = await api.post("/superAdmin/login", { email, password });
  return response.data; // frontend gets only what it needs
};
