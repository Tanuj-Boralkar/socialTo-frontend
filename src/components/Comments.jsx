import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Form } from "react-bootstrap";
import { Trash2 } from "lucide-react";
import {
  fetchComments,
  addComment,
  deleteComment,
} from "../store/slices/postSlice";
import { UserLink, run, timeAgo, LoadMore } from "./Common";
export default function Comments({ id, kind = "post", ownerId }) {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const comments = useSelector((s) => s.post.comments[id] || []);
  const more = useSelector((s) => s.post.commentMore[id]);
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setPage(1);
    run(dispatch(fetchComments({ id, kind, page: 1 })));
  }, [id, kind, dispatch]);
  return (
    <section className="comments">
      <Form
        className="comment-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await run(dispatch(addComment({ id, kind, text })), () =>
            setText(""),
          );
          setBusy(false);
        }}
      >
        <Form.Control
          aria-label="Write a comment"
          placeholder="Add to the conversation…"
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" variant="link" disabled={busy || !text.trim()}>
          Post
        </Button>
      </Form>
      {comments.map((c) => (
        <div className="comment" key={c._id}>
          <UserLink user={c.user} />
          <p>{c.text}</p>
          <small>{timeAgo(c.createdAt)}</small>
          {(c.user?._id === me._id || ownerId === me._id) && (
            <button
              className="icon-button"
              aria-label="Delete comment"
              onClick={() =>
                run(dispatch(deleteComment({ id: c._id, targetId: id })))
              }
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      <LoadMore
        hasMore={more}
        onClick={() => {
          setPage(page + 1);
          run(dispatch(fetchComments({ id, kind, page: page + 1 })));
        }}
      />
    </section>
  );
}
