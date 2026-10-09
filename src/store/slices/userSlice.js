import { createSlice } from "@reduxjs/toolkit";
import { request, track, mergeById } from "./helpers";
export const fetchProfile = request(
  "user/profile",
  async (username, api) => (await api.get(`/users/${username}`)).data.data,
);
export const searchUsers = request(
  "user/search",
  async (params, api) => (await api.get("/search", { params })).data.data,
);
export const fetchSuggested = request(
  "user/suggested",
  async (_, api) => (await api.get("/users/suggested")).data.data,
);
export const followUser = request(
  "user/follow",
  async ({ id, remove }, api) => ({
    id,
    ...(await api[remove ? "delete" : "put"](`/users/${id}/follow`)).data.data,
  }),
);
export const fetchConnections = request(
  "user/connections",
  async ({ id, kind, page = 1 }, api) =>
    (await api.get(`/users/${id}/${kind}`, { params: { page } })).data.data,
);
export const fetchRequests = request(
  "user/requests",
  async (_, api) => (await api.get("/users/requests")).data.data,
);
export const respondRequest = request(
  "user/respond",
  async ({ id, accept }, api) => {
    await api.put(`/users/requests/${id}`, { accept });
    return id;
  },
);
const slice = createSlice({
  name: "user",
  initialState: {
    profile: null,
    results: [],
    suggestions: [],
    connections: [],
    requests: [],
    hasMore: false,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearProfile: (s) => {
      s.profile = null;
    },
  },
  extraReducers: (b) => {
    track(b, fetchProfile, (s, a) => {
      s.profile = a.payload;
    });
    track(b, searchUsers, (s, a) => {
      s.results =
        a.meta.arg.page > 1
          ? mergeById(s.results, a.payload.users)
          : a.payload.users;
      s.hasMore = a.payload.hasMore;
    });
    track(b, fetchSuggested, (s, a) => {
      s.suggestions = a.payload.users;
    });
    track(b, followUser);
    track(b, fetchConnections, (s, a) => {
      s.connections =
        a.meta.arg.page > 1
          ? mergeById(s.connections, a.payload.users)
          : a.payload.users;
      s.hasMoreConnections = a.payload.hasMore;
    });
    track(b, fetchRequests, (s, a) => {
      s.requests = a.payload.users;
    });
    track(b, respondRequest, (s, a) => {
      s.requests = s.requests.filter((x) => x._id !== a.payload);
    });
  },
});
export const { clearProfile } = slice.actions;
export default slice.reducer;