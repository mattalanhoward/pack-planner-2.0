// services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

const SAFE_METHODS = ["get", "head", "options"];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    const url = config.url || ""; // ← add this
    const isRefreshCall = config.url.includes("/auth/refresh");
    const method = (config.method || "").toLowerCase(); // ← safer normalization

    // Don’t intercept 401s from login/register/verify endpoints
    if (
      response?.status === 401 &&
      (url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/verify-email"))
    ) {
      // Let your Login.jsx catch & display the error
      return Promise.reject(error);
    }
    // 1) If 401 on a SAFE call, try one silent refresh then retry
    if (
      response?.status === 401 &&
      !config._retry &&
      !isRefreshCall &&
      SAFE_METHODS.includes(method)
    ) {
      config._retry = true;
      try {
        const { data: refreshData } = await api.post("/auth/refresh");
        const { accessToken } = refreshData;
        localStorage.setItem("accessToken", accessToken);
        // update headers
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api(config);
      } catch {
        // fall through to redirect
      }
    }

    // 2) If 401 on a refresh call OR on any non‐safe method, just log out
    if (
      (response?.status === 401 && isRefreshCall) ||
      (response?.status === 401 && !SAFE_METHODS.includes(method))
    ) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
