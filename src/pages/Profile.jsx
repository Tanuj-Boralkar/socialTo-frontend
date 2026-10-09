import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Modal } from "react-bootstrap";
import {
  Grid3X3,
  Clapperboard,
  Bookmark,
  UserRound,
  Link as LinkIcon,
  Lock,
} from "lucide-react";
import {
  fetchProfile,
  fetchConnections,
  clearProfile,
} from "../store/slices/userSlice";
import { fetchPosts, clearPosts } from "../store/slices/postSlice";
import { fetchReels, clearReels } from "../store/slices/reelSlice";
import { startConversation } from "../store/slices/messageSlice";
import FollowButton from "../components/FollowButton";
import PostGrid from "../components/PostGrid";
import {
  Avatar,
  UserLink,
  LoadMore,
  Empty,
  ErrorBox,
  Busy,
  run,
} from "../components/Common";
export default function Profile() {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const { profile, connections, hasMoreConnections, error } = useSelector(
    (s) => s.user,
  );
  const posts = useSelector((s) => s.post);
  const reels = useSelector((s) => s.reel);
  const [tab, setTab] = useState(
    location.pathname.endsWith("/saved") ? "saved" : "posts",
  );
  const [page, setPage] = useState(1);
  const [list, setList] = useState(null);
  const [listPage, setListPage] = useState(1);
  const [savedKind, setSavedKind] = useState("post");
  useEffect(() => {
    dispatch(clearProfile());
    dispatch(fetchProfile(username));
    setTab(
      location.pathname.endsWith("/saved")
        ? "saved"
        : location.state?.tab || "posts",
    );
  }, [username, location.pathname, dispatch]);
  const own = username === me.username;
  const user = profile?.user;
  const isReel = tab === "reels" || (tab === "saved" && savedKind === "reel");
  const load = (p) => {
    if (!user) return;
    const params = {
      page: p,
      ...(tab === "saved"
        ? { mode: "saved" }
        : tab === "tagged"
          ? { tagged: user._id }
          : { user: user._id }),
    };
    dispatch(isReel ? fetchReels(params) : fetchPosts(params));
  };
  useEffect(() => {
    dispatch(clearPosts());
    dispatch(clearReels());
    setPage(1);
    if (profile?.canView) load(1);
  }, [user?._id, profile?.canView, tab, savedKind]);
  if (!own && location.pathname.endsWith("/saved"))
    return <Navigate to={`/${me.username}/saved`} replace />;
  if (!user)
    return (
      <div className="wide-page">
        <ErrorBox error={error} />
        {!error && <Busy />}
      </div>
    );
  const data = isReel ? reels : posts;
  const openList = (kind) => {
    setList(kind);
    setListPage(1);
    dispatch(fetchConnections({ id: user._id, kind, page: 1 }));
  };
  return (
    <div className="profile-page">
      <section className="profile-header">
        <Avatar user={user} size={140} />
        <div>
          <div className="profile-name">
            <h1>{user.username}</h1>
            {own ? (
              <Button
                as={Link}
                to="/settings/profile"
                variant="outline-secondary"
              >
                Edit profile
              </Button>
            ) : (
              <>
                <FollowButton
                  key={user._id + profile.requested}
                  user={user}
                  requested={profile.requested}
                  onChange={() => dispatch(fetchProfile(username))}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    run(dispatch(startConversation(user._id)), (r) =>
                      navigate(`/messages/${r.conversation._id}`),
                    )
                  }
                >
                  Message
                </Button>
              </>
            )}
          </div>
          <div className="profile-counts">
            <span>
              <strong>{profile.counts.posts}</strong> posts
            </span>
            <button onClick={() => openList("followers")}>
              <strong>{profile.counts.followers}</strong> followers
            </button>
            <button onClick={() => openList("following")}>
              <strong>{profile.counts.following}</strong> following
            </button>
          </div>
          <strong>{user.fullName}</strong>
          <p className="profile-bio">
            {user.bio || "Collecting little moments."}
          </p>
          {user.website && (
            <a
              href={user.website}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-website"
            >
              <LinkIcon size={14} /> {user.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {user.isPrivate && (
            <span className="private-label">
              <Lock size={13} /> Private account
            </span>
          )}
        </div>
      </section>
      <div className="profile-tabs">
        {[
          ["posts", Grid3X3],
          ["reels", Clapperboard],
          ...(own ? [["saved", Bookmark]] : []),
          ["tagged", UserRound],
        ].map(([key, Icon]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => {
              setTab(key);
              if (key === "saved") navigate(`/${username}/saved`);
              else if (location.pathname.endsWith("/saved"))
                navigate(`/${username}`, { state: { tab: key } });
            }}
          >
            <Icon size={16} />
            {key}
          </button>
        ))}
      </div>
      {!profile.canView ? (
        <Empty title="A more personal circle">
          Follow this private account to see their moments.
        </Empty>
      ) : (
        <>
          {tab === "saved" && (
            <div className="segmented my-3">
              <button
                className={savedKind === "post" ? "active" : ""}
                onClick={() => setSavedKind("post")}
              >
                Posts
              </button>
              <button
                className={savedKind === "reel" ? "active" : ""}
                onClick={() => setSavedKind("reel")}
              >
                Reels
              </button>
            </div>
          )}
          <ErrorBox error={data.error} />
          {data.loading && !data.items.length ? (
            <Busy />
          ) : (
            <PostGrid items={data.items} reels={isReel} />
          )}
          {!data.loading && !data.items.length && !data.error && (
            <Empty
              title={
                tab === "saved"
                  ? "Keep the good ones close"
                  : "Nothing shared here yet"
              }
            >
              {tab === "tagged"
                ? "Posts that mention this username appear here."
                : "Your moments will find a home here."}
            </Empty>
          )}
          <LoadMore
            hasMore={data.hasMore}
            loading={data.loading}
            onClick={() => {
              setPage(page + 1);
              load(page + 1);
            }}
          />
        </>
      )}
      <Modal show={!!list} onHide={() => setList(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-capitalize">{list}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorBox error={error} />
          {connections.map((u) => (
            <div key={u._id} className="person-row">
              <div onClick={() => setList(null)}>
                <UserLink user={u} sub={u.fullName} />
              </div>
              <FollowButton user={u} />
            </div>
          ))}
          <LoadMore
            hasMore={hasMoreConnections}
            onClick={() => {
              setListPage(listPage + 1);
              dispatch(
                fetchConnections({
                  id: user._id,
                  kind: list,
                  page: listPage + 1,
                }),
              );
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}
