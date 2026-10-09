import { createSlice } from "@reduxjs/toolkit";
import { request, track, mergeById } from "./helpers";
export const fetchConversations = request(
  "message/list",
  async (params, api) => (await api.get("/messages", { params })).data.data,
);
export const startConversation = request(
  "message/start",
  async (userId, api) => (await api.post("/messages", { userId })).data.data,
);
export const fetchMessages = request(
  "message/history",
  async ({ id, page = 1 }, api) => ({
    id,
    ...(await api.get(`/messages/${id}`, { params: { page, limit: 30 } })).data
      .data,
  }),
);
export const sendMessage = request(
  "message/send",
  async ({ id, data }, api) =>
    (await api.post(`/messages/${id}`, data)).data.data,
);
export const markSeen = request("message/seen", async (id, api) => {
  await api.put(`/messages/${id}/seen`);
});
function receive(s, m) {
  s.history[m.conversation] = mergeById(s.history[m.conversation] || [], [m]);
  const c = s.conversations.find((x) => x._id === m.conversation);
  if (c) {
    c.lastMessage = m;
    s.conversations = [c, ...s.conversations.filter((x) => x._id !== c._id)];
  }
}
const slice = createSlice({
  name: "message",
  initialState: {
    conversations: [],
    history: {},
    more: {},
    hasMore: false,
    online: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    messageReceived: (s, a) => receive(s, a.payload),
    presenceChanged: (s, a) => {
      s.online = a.payload;
    },
    seenReceived: (s, a) => {
      for (const m of s.history[a.payload.conversation] || [])
        if (!m.seenBy.includes(a.payload.userId))
          m.seenBy.push(a.payload.userId);
    },
  },
  extraReducers: (b) => {
    track(b, fetchConversations, (s, a) => {
      s.conversations =
        a.meta.arg?.page > 1
          ? mergeById(s.conversations, a.payload.conversations)
          : a.payload.conversations;
      s.hasMore = a.payload.hasMore;
    });
    track(b, startConversation, (s, a) => {
      s.conversations = mergeById([a.payload.conversation], s.conversations);
    });
    track(b, fetchMessages, (s, a) => {
      s.history[a.payload.id] =
        a.meta.arg.page > 1
          ? mergeById(a.payload.messages, s.history[a.payload.id] || [])
          : mergeById(a.payload.messages, s.history[a.payload.id] || []);
      s.more[a.payload.id] = a.payload.hasMore;
      if (!s.conversations.some((x) => x._id === a.payload.id))
        s.conversations.push(a.payload.conversation);
    });
    track(b, sendMessage, (s, a) => receive(s, a.payload.message));
    track(b, markSeen);
  },
});
export const { messageReceived, presenceChanged, seenReceived } = slice.actions;
export default slice.reducer;