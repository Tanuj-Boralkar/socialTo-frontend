import axios from "axios";

export const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://socialto-backend.onrender.com/api/v1"
)
  .trim()
  .replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 60000,
});

let accessToken = null;
let refreshPromise = null;
let sessionListener = () => { };

export function setToken(token) {
  accessToken = token;
}

export function getToken() {
  return accessToken;
}

export function onSessionChange(fn) {
  sessionListener = fn;
}

export async function restoreSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          timeout: 15000,
        }
      )
      .then((response) => {
        const session = response.data.data;

        setToken(session.token);
        sessionListener(session);

        return session;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      ![
        "/auth/login",
        "/auth/register",
        "/auth/refresh",
      ].includes(config.url)
    ) {
      config._retried = true;

      try {
        await restoreSession();
        return api(config);
      } catch {
        setToken(null);
        sessionListener(null);
      }
    }

    return Promise.reject(error);
  }
);

export const errorText = (error) =>
  error.response?.data?.message ||
  (!error.response && error.code === "ERR_NETWORK"
    ? "Cannot reach the API. Check the backend URL and allowed frontend origins."
    : error.message) ||
  "Something went wrong";

export default api;