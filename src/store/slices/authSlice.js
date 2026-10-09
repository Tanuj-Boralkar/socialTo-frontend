import { createSlice } from "@reduxjs/toolkit";
import { request, track } from "./helpers";
import { setToken, restoreSession } from "../../services/api";
export const bootstrapAuth = request("auth/bootstrap", () => restoreSession());
export const login = request("auth/login", async (data, api) => {
  const r = await api.post("/auth/login", data);
  setToken(r.data.data.token);
  return r.data.data;
});
export const register = request("auth/register", async (data, api) => {
  const r = await api.post("/auth/register", data);
  setToken(r.data.data.token);
  return r.data.data;
});
export const logout = request("auth/logout", async (_, api) => {
  await api.post("/auth/logout");
  setToken(null);
});
export const updateProfile = request(
  "auth/updateProfile",
  async (data, api) => (await api.put("/users/profile", data)).data.data,
);
export const changePassword = request(
  "auth/changePassword",
  async (data, api) => {
    const r = (await api.put("/auth/password", data)).data.data;
    setToken(r.token);
    return r;
  },
);
export const refreshMe = request(
  "auth/me",
  async (_, api) => (await api.get("/auth/me")).data.data,
);
const slice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    ready: false,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    sessionChanged: (s, a) => {
      s.user = a.payload?.user || null;
      s.token = a.payload?.token || null;
      s.ready = true;
    },
    savedChanged: (s, a) => {
      if (!s.user) return;
      const { kind, id, saved } = a.payload;
      const key = kind === "reel" ? "savedReels" : "savedPosts";
      s.user[key] = saved
        ? [...new Set([...s.user[key], id])]
        : s.user[key].filter((x) => x !== id);
    },
  },
  extraReducers: (b) => {
    for (const t of [bootstrapAuth, login, register, changePassword])
      track(b, t, (s, a) => {
        s.user = a.payload.user;
        s.token = a.payload.token;
        s.ready = true;
      });
    for (const t of [updateProfile, refreshMe])
      track(b, t, (s, a) => {
        s.user = a.payload.user;
      });
    track(b, logout, (s) => {
      s.ready = true;
      s.user = null;
      s.token = null;
    });
    b.addMatcher(
      (a) => a.type === "auth/bootstrap/rejected",
      (s) => {
        s.ready = true;
        s.error = null;
      },
    );
  },
});
export const { sessionChanged, savedChanged } = slice.actions;
export default slice.reducer;