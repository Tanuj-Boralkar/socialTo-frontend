import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useSelector } from "react-redux";
import { MemoryRouter } from "react-router-dom";
vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  onSessionChange: vi.fn(),
  setToken: vi.fn(),
  restoreSession: vi.fn(),
  errorText: (e) => e.message,
}));
import api from "../services/api";
import store from "../store/store";
import { sessionChanged, logout } from "../store/slices/authSlice";
import { fetchPosts } from "../store/slices/postSlice";
import { searchUsers } from "../store/slices/userSlice";
import { messageReceived, seenReceived } from "../store/slices/messageSlice";
import { notificationReceived } from "../store/slices/notificationSlice";
import Auth from "../pages/Auth";
import PostCard from "../components/PostCard";
const me = {
  _id: "111111111111111111111111",
  username: "tanuj",
  fullName: "Tanuj",
  following: [],
  followers: [],
  savedPosts: [],
  savedReels: [],
};
const post = {
  _id: "222222222222222222222222",
  user: me,
  caption: "Hello world",
  location: "Pune",
  likes: [],
  comments: [],
  media: [{ url: "/demo.png", type: "image" }],
  createdAt: new Date().toISOString(),
};
function wrap(ui) {
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  store.dispatch(sessionChanged(null));
});
afterEach(cleanup);
describe("SocialGram state and UI", () => {
  it("login form submits credentials and stores session only in memory", async () => {
    api.post.mockResolvedValue({
      data: { data: { user: me, token: "access" } },
    });
    wrap(<Auth />);
    await userEvent.type(
      screen.getByLabelText("Email address"),
      "tanuj@example.test",
    );
    await userEvent.type(
      screen.getByLabelText("Enter your password"),
      "Password123!",
    );
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() =>
      expect(store.getState().auth.user?.username).toBe("tanuj"),
    );
    expect(api.post).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        email: "tanuj@example.test",
        password: "Password123!",
      }),
    );
    expect(localStorage.getItem("token")).toBeNull();
  });
  it("login errors are visible and do not authenticate the user", async () => {
    api.post.mockRejectedValue(new Error("Incorrect email or password"));
    wrap(<Auth />);
    await userEvent.type(
      screen.getByLabelText("Email address"),
      "tanuj@example.test",
    );
    await userEvent.type(
      screen.getByLabelText("Enter your password"),
      "incorrect",
    );
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Incorrect email or password")).toBeTruthy();
    expect(store.getState().auth.user).toBeNull();
  });
  it("like and save buttons connect to Redux async actions", async () => {
    store.dispatch(sessionChanged({ user: me, token: "access" }));
    api.get.mockResolvedValue({
      data: { data: { posts: [post], hasMore: false } },
    });
    await store.dispatch(fetchPosts({ page: 1 }));
    api.put.mockImplementation(async (url) => ({
      data: {
        data: url.endsWith("/like")
          ? { post: { ...post, likes: [me._id] } }
          : { saved: true },
      },
    }));
    function Card() {
      const p = useSelector((s) => s.post.items[0]);
      return <PostCard post={p} />;
    }
    wrap(<Card />);
    await userEvent.click(screen.getByRole("button", { name: "Like post" }));
    expect(
      await screen.findByRole("button", { name: "Unlike post" }),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Save post" }));
    expect(
      await screen.findByRole("button", { name: "Unsave post" }),
    ).toBeTruthy();
    expect(store.getState().auth.user.savedPosts).toContain(post._id);
  });
  it("logout clears private state while keeping authentication bootstrapped", async () => {
    store.dispatch(sessionChanged({ user: me, token: "access" }));
    store.dispatch(notificationReceived({ _id: "n1", read: false }));
    api.post.mockResolvedValue({ data: { data: {} } });
    await store.dispatch(logout());
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.ready).toBe(true);
    expect(store.getState().notification.items).toEqual([]);
  });
  it("older search responses cannot overwrite the latest query", async () => {
    let resolveOld;
    api.get
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolveOld = r;
          }),
      )
      .mockResolvedValueOnce({
        data: {
          data: { users: [{ _id: "new", username: "new" }], hasMore: false },
        },
      });
    const old = store.dispatch(searchUsers({ q: "old" }));
    await store.dispatch(searchUsers({ q: "new" }));
    resolveOld({
      data: {
        data: { users: [{ _id: "old", username: "old" }], hasMore: false },
      },
    });
    await old;
    expect(store.getState().user.results[0].username).toBe("new");
  });
  it("realtime messages deduplicate and merge seen acknowledgements", () => {
    const m = {
      _id: "m1",
      conversation: "c1",
      sender: me._id,
      text: "Hi",
      seenBy: [me._id],
    };
    store.dispatch(messageReceived(m));
    store.dispatch(messageReceived(m));
    store.dispatch(seenReceived({ conversation: "c1", userId: "other" }));
    expect(store.getState().message.history.c1).toHaveLength(1);
    expect(store.getState().message.history.c1[0].seenBy).toContain("other");
  });
  it("notification events deduplicate unread count", () => {
    store.dispatch(notificationReceived({ _id: "n1", read: false }));
    store.dispatch(notificationReceived({ _id: "n1", read: false }));
    expect(store.getState().notification.unread).toBe(1);
  });
});
