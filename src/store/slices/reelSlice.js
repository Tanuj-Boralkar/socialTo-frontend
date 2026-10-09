import { createSlice } from "@reduxjs/toolkit";
import { request, track, mergeById } from "./helpers";
export const fetchReels = request(
  "reel/list",
  async (params, api) => (await api.get("/reels", { params })).data.data,
);
export const fetchReel = request(
  "reel/detail",
  async (id, api) => (await api.get(`/reels/${id}`)).data.data,
);
export const createReel = request(
  "reel/create",
  async (data, api) => (await api.post("/reels", data)).data.data,
);
export const likeReel = request(
  "reel/like",
  async ({ id, liked }, api) =>
    (await api[liked ? "delete" : "put"](`/reels/${id}/like`)).data.data,
);
export const saveReel = request("reel/save", async ({ id, saved }, api) => ({
  id,
  ...(await api[saved ? "delete" : "put"](`/reels/${id}/save`)).data.data,
}));
export const deleteReel = request("reel/delete", async (id, api) => {
  await api.delete(`/reels/${id}`);
  return id;
});
const slice = createSlice({
  name: "reel",
  initialState: {
    items: [],
    hasMore: false,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearReels: (s) => {
      s.items = [];
    },
  },
  extraReducers: (b) => {
    track(b, fetchReels, (s, a) => {
      s.items =
        a.meta.arg?.page > 1
          ? mergeById(s.items, a.payload.reels)
          : a.payload.reels;
      s.hasMore = a.payload.hasMore;
    });
    track(b, fetchReel, (s, a) => {
      s.items = [a.payload.reel];
      s.hasMore = false;
    });
    track(b, createReel, (s, a) => {
      s.items.unshift(a.payload.reel);
    });
    track(b, likeReel, (s, a) => {
      s.items = s.items.map((x) =>
        x._id === a.payload.reel._id ? a.payload.reel : x,
      );
    });
    b.addCase("post/addComment/fulfilled", (s, a) => {
      const r = s.items.find((x) => x._id === a.payload.id);
      if (r) r.comments.push(a.payload.comment._id);
    });
    b.addCase("post/deleteComment/fulfilled", (s, a) => {
      const r = s.items.find((x) => x._id === a.payload.targetId);
      if (r) r.comments = r.comments.filter((x) => x !== a.payload.id);
    });
    track(b, saveReel);
    track(b, deleteReel, (s, a) => {
      s.items = s.items.filter((x) => x._id !== a.payload);
    });
  },
});
export const { clearReels } = slice.actions;
export default slice.reducer;