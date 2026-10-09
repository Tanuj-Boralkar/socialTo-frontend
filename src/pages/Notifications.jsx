import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import {
  fetchNotifications,
  markRead,
} from "../store/slices/notificationSlice";
import { fetchRequests, respondRequest } from "../store/slices/userSlice";
import {
  Avatar,
  UserLink,
  Empty,
  ErrorBox,
  LoadMore,
  timeAgo,
  run,
} from "../components/Common";
const labels = {
  follow: "started following you.",
  request: "requested to follow you.",
  accepted: "accepted your follow request.",
  like: "liked your moment.",
  comment: "commented on your moment.",
  mention: "mentioned you.",
  message: "sent you a message.",
};
export default function Notifications() {
  const dispatch = useDispatch();
  const { items, unread, loading, error, hasMore } = useSelector(
    (s) => s.notification,
  );
  const requests = useSelector((s) => s.user.requests);
  const [page, setPage] = useState(1);
  useEffect(() => {
    dispatch(fetchNotifications({ page: 1 }));
    dispatch(fetchRequests());
  }, [dispatch]);
  return (
    <div className="narrow-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE LOVE</span>
          <h1>
            Your activity<span>.</span>
          </h1>
        </div>
        {unread > 0 && (
          <Button variant="link" onClick={() => run(dispatch(markRead()))}>
            Mark all read
          </Button>
        )}
      </header>
      <ErrorBox error={error} />
      {requests.length > 0 && (
        <section className="settings-card mb-4">
          <h5>Follow requests</h5>
          {requests.map((u) => (
            <div key={u._id} className="person-row">
              <UserLink user={u} />
              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    run(dispatch(respondRequest({ id: u._id, accept: true })))
                  }
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() =>
                    run(dispatch(respondRequest({ id: u._id, accept: false })))
                  }
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}
      {items.map((n) => (
        <Link
          key={n._id}
          className={`notification-row ${n.read ? "" : "unread"}`}
          to={
            n.conversation
              ? `/messages/${n.conversation}`
              : n.post
                ? `/p/${n.post}`
                : n.reel
                  ? `/reels?id=${n.reel}`
                  : `/${n.actor?.username}`
          }
        >
          <Avatar user={n.actor} />
          <span>
            <strong>{n.actor?.username}</strong> {labels[n.type]}
            <small>{timeAgo(n.createdAt)}</small>
          </span>
          {!n.read && <i />}
        </Link>
      ))}
      {!loading && !items.length && !error && (
        <Empty title="All quiet for now">
          Likes, new followers and conversations will show up here.
        </Empty>
      )}
      <LoadMore
        hasMore={hasMore}
        loading={loading}
        onClick={() => {
          setPage(page + 1);
          dispatch(fetchNotifications({ page: page + 1 }));
        }}
      />
    </div>
  );
}
