import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : `${window.location.protocol}//${window.location.hostname}:4000/api`);

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("dc_access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshInFlight = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    if (!refreshInFlight) {
      refreshInFlight = api
        .post("/auth/refresh", { refreshToken: localStorage.getItem("dc_refresh_token") })
        .then((res) => {
          localStorage.setItem("dc_access_token", res.data.accessToken);
          localStorage.setItem("dc_refresh_token", res.data.refreshToken);
          return res.data.accessToken;
        })
        .finally(() => {
          refreshInFlight = null;
        });
    }

    const newAccessToken = await refreshInFlight;
    original.headers.Authorization = `Bearer ${newAccessToken}`;
    return api.request(original);
  }
);

export default api;
