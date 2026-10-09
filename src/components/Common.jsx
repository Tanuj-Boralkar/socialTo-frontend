import { Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Camera, ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";
export function Avatar({ user, size = 42 }) {
  return user?.profilePicture ? (
    <img
      className="avatar"
      src={user.profilePicture}
      alt={user.username || "Avatar"}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="avatar avatar-fallback"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {(user?.username || "S").slice(0, 1).toUpperCase()}
    </span>
  );
}
export function UserLink({ user, sub }) {
  return (
    <Link className="user-link" to={`/${user?.username}`}>
      <Avatar user={user} />
      <span>
        <strong>{user?.username || "SocialGram user"}</strong>
        {sub && <small>{sub}</small>}
      </span>
    </Link>
  );
}
export function Empty({ title = "A fresh start", children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Camera size={30} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Busy() {
  return (
    <div className="loading-wrap">
      <Spinner animation="border" size="sm" />
      <span>Loading your world…</span>
    </div>
  );
}
export function Skeleton({ count = 2 }) {
  return Array.from({ length: count }, (_, i) => (
    <div className="post-card skeleton-card" key={i}>
      <div
        className="skeleton"
        style={{ height: 40, width: "50%", margin: 20 }}
      />
      <div className="skeleton" style={{ height: 360 }} />
      <div className="skeleton" style={{ height: 20, margin: 20 }} />
    </div>
  ));
}
export function ErrorBox({ error }) {
  return error ? (
    <Alert variant="danger" className="small">
      {error}
    </Alert>
  ) : null;
}
export function LoadMore({ hasMore, loading, onClick }) {
  return hasMore ? (
    <div className="text-center py-4">
      <Button variant="outline-secondary" disabled={loading} onClick={onClick}>
        {loading ? "Loading…" : "Load more"} <ArrowUpRight size={16} />
      </Button>
    </div>
  ) : null;
}
export function timeAgo(date) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  return s < 60
    ? "just now"
    : s < 3600
      ? `${Math.floor(s / 60)}m ago`
      : s < 86400
        ? `${Math.floor(s / 3600)}h ago`
        : new Date(date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
}
export async function share(path) {
  const url = window.location.origin + path;
  try {
    if (navigator.share) await navigator.share({ title: "SocialGram", url });
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  } catch (e) {
    if (e.name !== "AbortError") toast.error("Could not share this link");
  }
}
export async function run(promise, onSuccess) {
  try {
    const result = await promise.unwrap();
    onSuccess?.(result);
    return result;
  } catch (e) {
    toast.error(String(e));
    return null;
  }
}
