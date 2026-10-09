import { createSlice } from "@reduxjs/toolkit";
import { request, track, mergeById } from "./helpers";
export const fetchPosts = request(
  "post/list",
  async (params, api) => (await api.get("/posts", { params })).data.data,
);
export const fetchPost = request(
  "post/detail",
  async (id, api) => (await api.get(`/posts/${id}`)).data.data,
);
export const createPost = request(
  "post/create",
  async (data, api) => (await api.post("/posts", data)).data.data,
);
export const editPost = request(
  "post/edit",
  async ({ id, ...data }, api) =>
    (await api.put(`/posts/${id}`, data)).data.data,
);
export const deletePost = request("post/delete", async (id, api) => {
  await api.delete(`/posts/${id}`);
  return id;
});
export const likePost = request(
  "post/like",
  async ({ id, liked }, api) =>
    (await api[liked ? "delete" : "put"](`/posts/${id}/like`)).data.data,
);
export const savePost = request("post/save", async ({ id, saved }, api) => ({
  id,
  ...(await api[saved ? "delete" : "put"](`/posts/${id}/save`)).data.data,
}));
export const fetchComments = request(
  "post/comments",
  async ({ id, kind = "post", page = 1 }, api) => ({
    id,
    ...(await api.get(`/comments/${id}`, { params: { kind, page } })).data.data,
  }),
);
export const addComment = request(
  "post/addComment",
  async ({ id, kind = "post", text }, api) => ({
    id,
    ...(await api.post(`/comments/${id}`, { kind, text })).data.data,
  }),
);
export const deleteComment = request(
  "post/deleteComment",
  async ({ id, targetId }, api) => {
    await api.delete(`/comments/${id}`);
    return { id, targetId };
  },
);
const slice = createSlice({
  name: "post",
  initialState: {
    items: [],
    detail: null,
    comments: {},
    commentMore: {},
    hasMore: false,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearPosts: (s) => {
      s.items = [];
      s.detail = null;
      s.hasMore = false;
    },
  },
  extraReducers: (b) => {
    track(b, fetchPosts, (s, a) => {
      s.items =
        a.meta.arg?.page > 1
          ? mergeById(s.items, a.payload.posts)
          : a.payload.posts;
      s.hasMore = a.payload.hasMore;
    });
    track(b, fetchPost, (s, a) => {
      s.detail = a.payload.post;
    });
    for (const t of [editPost, likePost])
      track(b, t, (s, a) => {
        s.items = s.items.map((x) =>
          x._id === a.payload.post._id ? a.payload.post : x,
        );
        if (s.detail?._id === a.payload.post._id) s.detail = a.payload.post;
      });
    track(b, createPost, (s, a) => {
      s.items.unshift(a.payload.post);
    });
    track(b, deletePost, (s, a) => {
      s.items = s.items.filter((x) => x._id !== a.payload);
      s.detail = null;
    });
    track(b, savePost);
    track(b, fetchComments, (s, a) => {
      s.comments[a.payload.id] =
        a.meta.arg.page > 1
          ? mergeById(s.comments[a.payload.id] || [], a.payload.comments)
          : a.payload.comments;
      s.commentMore[a.payload.id] = a.payload.hasMore;
    });
    track(b, addComment, (s, a) => {
      s.comments[a.payload.id] = [
        a.payload.comment,
        ...(s.comments[a.payload.id] || []),
      ];
      for (const p of [...s.items, ...(s.detail ? [s.detail] : [])])
        if (p._id === a.payload.id) p.comments.push(a.payload.comment._id);
    });
    track(b, deleteComment, (s, a) => {
      s.comments[a.payload.targetId] = (
        s.comments[a.payload.targetId] || []
      ).filter((x) => x._id !== a.payload.id);
      for (const p of [...s.items, ...(s.detail ? [s.detail] : [])])
        if (p._id === a.payload.targetId)
          p.comments = p.comments.filter((x) => x !== a.payload.id);
    });
  },
});
export const { clearPosts } = slice.actions;
export default slice.reducer;