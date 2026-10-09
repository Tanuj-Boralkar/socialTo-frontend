import { createSlice } from "@reduxjs/toolkit";
import { request, track, mergeById } from "./helpers";
export const fetchNotifications = request(
  "notification/list",
  async (params, api) =>
    (await api.get("/notifications", { params })).data.data,
);
export const markRead = request("notification/read", async (_, api) => {
  await api.put("/notifications/read");
});
const slice = createSlice({
  name: "notification",
  initialState: {
    items: [],
    unread: 0,
    hasMore: false,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    notificationReceived: (s, a) => {
      if (!s.items.some((x) => x._id === a.payload._id)) {
        s.items.unshift(a.payload);
        s.unread++;
      }
    },
  },
  extraReducers: (b) => {
    track(b, fetchNotifications, (s, a) => {
      s.items =
        a.meta.arg?.page > 1
          ? mergeById(s.items, a.payload.notifications)
          : a.payload.notifications;
      s.unread = a.payload.unread;
      s.hasMore = a.payload.hasMore;
    });
    track(b, markRead, (s) => {
      s.unread = 0;
      s.items.forEach((x) => {
        x.read = true;
      });
    });
  },
});
export const { notificationReceived } = slice.actions;
export default slice.reducer;