import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchPosts, clearPosts } from "../store/slices/postSlice";
import PostGrid from "../components/PostGrid";
import { LoadMore, Empty, ErrorBox, Skeleton } from "../components/Common";
export default function Explore() {
  const dispatch = useDispatch();
  const { items, loading, error, hasMore } = useSelector((s) => s.post);
  const [mode, setMode] = useState("trending");
  const [page, setPage] = useState(1);
  useEffect(() => {
    dispatch(clearPosts());
    setPage(1);
    dispatch(fetchPosts({ mode, page: 1 }));
  }, [dispatch, mode]);
  return (
    <div className="wide-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">OUTSIDE YOUR CIRCLE</span>
          <h1>
            A world to discover<span>.</span>
          </h1>
          <p className="text-muted">Fresh perspectives, familiar feelings.</p>
        </div>
        <Link className="icon-button" to="/search" aria-label="Search accounts">
          <Search />
        </Link>
      </header>
      <div className="segmented mb-4">
        <button
          className={mode === "trending" ? "active" : ""}
          onClick={() => setMode("trending")}
        >
          Trending
        </button>
        <button
          className={mode === "recommended" ? "active" : ""}
          onClick={() => setMode("recommended")}
        >
          Recommended
        </button>
      </div>
      <ErrorBox error={error} />
      {loading && !items.length ? (
        <Skeleton />
      ) : (
        <PostGrid items={items} explore />
      )}
      {!loading && !items.length && !error && (
        <Empty title="New perspectives are on their way">
          Shared moments will appear here.
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
    </div>
  );
}
