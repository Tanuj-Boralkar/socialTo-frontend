import { configureStore, combineReducers } from "@reduxjs/toolkit";
import auth from "./slices/authSlice";
import user from "./slices/userSlice";
import post from "./slices/postSlice";
import story from "./slices/storySlice";
import reel from "./slices/reelSlice";
import notification from "./slices/notificationSlice";
import message from "./slices/messageSlice";
import { onSessionChange } from "../services/api";
const combined = combineReducers({
  auth,
  user,
  post,
  story,
  reel,
  notification,
  message,
});
export const store = configureStore({
  reducer: (state, action) => {
    if (
      action.type === "auth/logout/fulfilled" ||
      (action.type === "auth/sessionChanged" && !action.payload)
    ) {
      state =
        action.type === "auth/logout/fulfilled"
          ? { auth: state?.auth }
          : undefined;
    }
    return combined(state, action);
  },
});
onSessionChange((data) =>
  store.dispatch({ type: "auth/sessionChanged", payload: data }),
);
export default store;