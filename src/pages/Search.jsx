import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form } from "react-bootstrap";
import { Search as SearchIcon } from "lucide-react";
import { searchUsers, fetchSuggested } from "../store/slices/userSlice";
import FollowButton from "../components/FollowButton";
import {
  UserLink,
  Empty,
  ErrorBox,
  Busy,
  LoadMore,
} from "../components/Common";
export default function Search() {
  const dispatch = useDispatch();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { results, suggestions, loading, error, hasMore } = useSelector(
    (s) => s.user,
  );
  useEffect(() => {
    dispatch(fetchSuggested());
  }, [dispatch]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      dispatch(searchUsers({ q, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [q, dispatch]);
  const users = q ? results : suggestions;
  return (
    <div className="narrow-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">FIND YOUR PEOPLE</span>
          <h1>
            A hello away<span>.</span>
          </h1>
        </div>
      </header>
      <div className="search-box">
        <SearchIcon />
        <Form.Control
          autoFocus
          aria-label="Search people"
          placeholder="Search usernames or names…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <h6 className="mt-4 mb-3">
        {q ? "Search results" : "People to discover"}
      </h6>
      <ErrorBox error={error} />
      {loading && <Busy />}
      {users.map((u) => (
        <div className="person-row" key={u._id}>
          <UserLink user={u} sub={u.fullName} />
          <FollowButton user={u} />
        </div>
      ))}
      {q && !loading && !users.length && (
        <Empty title="No people found">Try another name or username.</Empty>
      )}
      <LoadMore
        hasMore={!!q && hasMore}
        loading={loading}
        onClick={() => {
          setPage(page + 1);
          dispatch(searchUsers({ q, page: page + 1 }));
        }}
      />
    </div>
  );
}
