import { createAsyncThunk } from "@reduxjs/toolkit";
import api, { errorText } from "../../services/api";
export const request = (name, fn) =>
  createAsyncThunk(name, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg, api);
    } catch (e) {
      return rejectWithValue(errorText(e));
    }
  });
// Each operation retains its own lifecycle; obsolete responses cannot replace newer data.
export const track = (builder, thunk, onSuccess) => {
  const key = thunk.typePrefix;
  const summarize = (s) => {
    s.loading = Object.values(s.asyncStates || {}).some((x) => x.loading);
  };
  builder
    .addCase(thunk.pending, (s, a) => {
      s.asyncStates ||= {};
      s.asyncStates[key] = {
        requestId: a.meta.requestId,
        loading: true,
        success: false,
        error: null,
      };
      s.loading = true;
      s.success = false;
      s.error = null;
    })
    .addCase(thunk.fulfilled, (s, a) => {
      if (s.asyncStates?.[key]?.requestId !== a.meta.requestId) return;
      s.asyncStates[key] = {
        requestId: a.meta.requestId,
        loading: false,
        success: true,
        error: null,
      };
      summarize(s);
      s.success = true;
      onSuccess?.(s, a);
    })
    .addCase(thunk.rejected, (s, a) => {
      if (s.asyncStates?.[key]?.requestId !== a.meta.requestId) return;
      const error = a.payload || a.error.message;
      s.asyncStates[key] = {
        requestId: a.meta.requestId,
        loading: false,
        success: false,
        error,
      };
      summarize(s);
      s.success = false;
      s.error = error;
    });
};
export const mergeById = (a, b) => [
  ...new Map([...a, ...b].map((x) => [x._id, x])).values(),
];