/**
 * Global Axios instance — used by AdminDashboard and other non-table pages.
 * Note: Menu.tsx (TablePage) creates its OWN Axios instance with the
 *       table-specific token, so it does NOT use this file.
 */
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    // CRITICAL BUG FIX: If a customer request already manually attached their
    // Bearer token, DO NOT overwrite it globally because an admin happens to 
    // be logged in on the same browser (localStorage leak).
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  }
);

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
    }
    return Promise.reject(error);
  }
);

export default api;
