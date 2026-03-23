import axios from "axios";

/*
 API base URL
 Uses environment variable in production
 Falls back to deployed backend if not set
*/

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

/* Request Interceptor */
api.interceptors.request.use(
    (config) => {
        const adminToken = localStorage.getItem("adminToken");

        if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
            return config;
        }

        const sessionToken = localStorage.getItem("sessionToken");

        if (sessionToken) {
            config.headers.Authorization = `Bearer ${sessionToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/* Response Interceptor */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Unauthorized request");
        }
        return Promise.reject(error);
    }
);

export default api;