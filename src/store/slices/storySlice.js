import { createSlice } from "@reduxjs/toolkit";
import { request, track } from "./helpers";
export const fetchStories = request(
  "story/list",
  async (_, api) => (await api.get("/stories")).data.data,
);
export const createStory = request(
  "story/create",
  async (data, api) => (await api.post("/stories", data)).data.data,
);
export const viewStory = request("story/view", async ({ id, userId }, api) => {
  await api.put(`/stories/${id}/view`);
  return { id, userId };
});
export const deleteStory = request("story/delete", async (id, api) => {
  await api.delete(`/stories/${id}`);
  return id;
});
const slice = createSlice({
  name: "story",
  initialState: { items: [], loading: false, error: null, success: false },
  reducers: {},
  extraReducers: (b) => {
    track(b, fetchStories, (s, a) => {
      s.items = a.payload.stories;
    });
    track(b, createStory, (s, a) => {
      s.items.push(a.payload.story);
    });
    track(b, viewStory, (s, a) => {
      const x = s.items.find((x) => x._id === a.payload.id);
      if (x && !x.viewedBy.includes(a.payload.userId))
        x.viewedBy.push(a.payload.userId);
    });
    track(b, deleteStory, (s, a) => {
      s.items = s.items.filter((x) => x._id !== a.payload);
    });
  },
});
export default slice.reducer;