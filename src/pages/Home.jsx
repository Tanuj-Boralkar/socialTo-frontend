import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useOutletContext, Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { fetchPosts, clearPosts } from "../store/slices/postSlice";
import { fetchSuggested } from "../store/slices/userSlice";
import Stories from "../components/Stories";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";
import {
  UserLink,
  Avatar,
  Skeleton,
  Empty,
  ErrorBox,
  LoadMore,
} from "../components/Common";
export default function Home() {
  const dispatch = useDispatch();
  const { openCreate } = useOutletContext();
  const me = useSelector((s) => s.auth.user);
  const { items, loading, error, hasMore } = useSelector((s) => s.post);
  const suggestions = useSelector((s) => s.user.suggestions);
  const [mode, setMode] = useState("recommended");
  const [page, setPage] = useState(1);
  useEffect(() => {
    dispatch(clearPosts());
    setPage(1);
    dispatch(fetchPosts({ mode, page: 1 }));
    dispatch(fetchSuggested());
  }, [dispatch, mode]);
  return (
    <div className="home-layout">
      <section className="feed-column">
        <header className="page-heading">
          <div>
            <span className="eyebrow">A LITTLE CLOSER</span>
            <h1>
              Your daily circle<span>.</span>
            </h1>
          </div>
          <span className="today-label">
            {new Date().toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </header>
        <Stories onCreate={() => openCreate("story")} />
        <div className="feed-tabs">
          <button
            className={mode === "recommended" ? "active" : ""}
            onClick={() => setMode("recommended")}
          >
            For you
          </button>
          <button
            className={mode === "feed" ? "active" : ""}
            onClick={() => setMode("feed")}
          >
            Following
          </button>
          <span>Good moments live here.</span>
        </div>
        <ErrorBox error={error} />
        {loading && !items.length ? (
          <Skeleton />
        ) : (
          items.map((p) => <PostCard key={p._id} post={p} />)
        )}
        {!loading && !items.length && !error && (
          <Empty title="Your circle starts here">
            Follow a few people or{" "}
            <button className="text-button" onClick={() => openCreate()}>
              share your first moment
            </button>
            .
          </Empty>
        )}
        <LoadMore
          hasMore={hasMore}
          loading={loading}
          onClick={() => {
            setPage(page + 1);
            dispatch(fetchPosts({ mode, page: page + 1 }));
          }}
        />
      </section>
      <aside className="right-rail">
        <div className="rail-profile">
          <UserLink user={me} sub={me.fullName} />
          <Link to="/settings/profile" aria-label="Edit profile">
            <ArrowUpRight size={19} />
          </Link>
        </div>
        <div className="rail-title">
          <strong>People you might like</strong>
          <Link to="/search">Discover</Link>
        </div>
        {suggestions.map((u) => (
          <div className="suggestion" key={u._id}>
            <UserLink user={u} sub={u.fullName} />
            <FollowButton user={u} />
          </div>
        ))}
        <div className="rail-card">
          <span className="small">A NOTE TO YOURSELF</span>
          <h3>
            Life doesn’t need
            <br />a filter.
          </h3>
          <p>
            Share the little things.
            <br />
            They’re usually the big things.
          </p>
          <button onClick={() => openCreate()}>
            Make a moment <ArrowUpRight size={17} />
          </button>
          <span className="rail-flower">✳</span>
        </div>
        <footer>
          SocialGram · Made for connection
          <br />
          <span>© {new Date().getFullYear()} SocialGram</span>
        </footer>
      </aside>
    </div>
  );
}
