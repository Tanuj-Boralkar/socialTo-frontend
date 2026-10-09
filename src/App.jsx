import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { bootstrapAuth } from "./store/slices/authSlice";
import { Busy } from "./components/Common";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import PostDetail from "./pages/PostDetail";
import Reels from "./pages/Reels";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
function Protected() {
  const user = useSelector((s) => s.auth.user);
  const location = useLocation();
  return user ? (
    <Layout />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}
export default function App() {
  const dispatch = useDispatch();
  const ready = useSelector((s) => s.auth.ready);
  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);
  if (!ready) return <Busy />;
  return (
    <Routes>
      <Route path="/login" element={<Auth key="login" />} />
      <Route path="/register" element={<Auth key="register" signup />} />
      <Route element={<Protected />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="search" element={<Search />} />
        <Route path="reels" element={<Reels />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:conversationId" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings/profile" element={<Settings />} />
        <Route path="p/:postId" element={<PostDetail />} />
        <Route path=":username/saved" element={<Profile />} />
        <Route path=":username" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
