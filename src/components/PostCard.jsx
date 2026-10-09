import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Carousel, Dropdown, Modal, Button, Form } from "react-bootstrap";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import {
  likePost,
  savePost,
  deletePost,
  editPost,
} from "../store/slices/postSlice";
import { savedChanged } from "../store/slices/authSlice";
import { UserLink, timeAgo, share, run } from "./Common";
import Comments from "./Comments";
export default function PostCard({ post, expanded = false, onDeleted }) {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const [comments, setComments] = useState(expanded);
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [location, setLocation] = useState(post.location);
  const [busy, setBusy] = useState(false);
  const liked = post.likes.includes(me._id);
  const saved = me.savedPosts.includes(post._id);
  const media = (m) =>
    m.type === "video" ? (
      <video src={m.url} controls playsInline preload="metadata" />
    ) : (
      <img src={m.url} alt={post.caption || "Shared moment"} loading="lazy" />
    );
  return (
    <article className="post-card">
      <header>
        <UserLink
          user={post.user}
          sub={post.location || "Somewhere in the everyday"}
        />
        <span className="post-time">{timeAgo(post.createdAt)}</span>
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="link"
            className="icon-button no-caret"
            aria-label="Post options"
          >
            <MoreHorizontal />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item as={Link} to={`/p/${post._id}`}>
              View post
            </Dropdown.Item>
            <Dropdown.Item onClick={() => share(`/p/${post._id}`)}>
              Share link
            </Dropdown.Item>
            {post.user._id === me._id && (
              <>
                <Dropdown.Item onClick={() => setEdit(true)}>
                  Edit post
                </Dropdown.Item>
                <Dropdown.Item
                  className="text-danger"
                  onClick={() => setConfirm(true)}
                >
                  Delete post
                </Dropdown.Item>
              </>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </header>
      <div className="post-media">
        {post.media.length > 1 ? (
          <Carousel interval={null}>
            {post.media.map((m) => (
              <Carousel.Item key={m.url}>{media(m)}</Carousel.Item>
            ))}
          </Carousel>
        ) : (
          media(post.media[0])
        )}
      </div>
      <div className="post-body">
        <div className="post-actions">
          <button
            aria-label={liked ? "Unlike post" : "Like post"}
            className={`icon-button ${liked ? "liked" : ""}`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await run(dispatch(likePost({ id: post._id, liked })));
              setBusy(false);
            }}
          >
            <Heart fill={liked ? "currentColor" : "none"} />
          </button>
          <button
            className="icon-button"
            aria-label="Show comments"
            onClick={() => setComments(!comments)}
          >
            <MessageCircle />
          </button>
          <button
            className="icon-button"
            aria-label="Share post"
            onClick={() => share(`/p/${post._id}`)}
          >
            <Send />
          </button>
          <button
            className="icon-button ms-auto"
            aria-label={saved ? "Unsave post" : "Save post"}
            onClick={() =>
              run(dispatch(savePost({ id: post._id, saved })), (r) =>
                dispatch(
                  savedChanged({ kind: "post", id: post._id, saved: r.saved }),
                ),
              )
            }
          >
            <Bookmark fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <strong className="small">
          {post.likes.length.toLocaleString()}{" "}
          {post.likes.length === 1 ? "like" : "likes"}
        </strong>
        <p className="caption">
          <Link to={`/${post.user.username}`}>
            <strong>{post.user.username}</strong>
          </Link>{" "}
          {post.caption}
        </p>
        <button
          className="text-button text-muted"
          onClick={() => setComments(!comments)}
        >
          {post.comments.length
            ? `View ${post.comments.length} comments`
            : "Start a conversation"}
        </button>
      </div>
      {comments && <Comments id={post._id} ownerId={post.user._id} />}
      <Modal show={edit} onHide={() => setEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit your moment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            as="textarea"
            aria-label="Caption"
            rows={4}
            maxLength={2200}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <Form.Control
            className="mt-3"
            placeholder="Location"
            maxLength={100}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await run(
                dispatch(editPost({ id: post._id, caption, location })),
                () => setEdit(false),
              );
              setBusy(false);
            }}
          >
            Save changes
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={confirm} onHide={() => setConfirm(false)} centered>
        <Modal.Body>
          <h4>Delete this post?</h4>
          <p>The post, media and comments will be permanently removed.</p>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await run(dispatch(deletePost(post._id)), () => {
                setConfirm(false);
                onDeleted?.();
              });
              setBusy(false);
            }}
          >
            Delete post
          </Button>
          <Button
            variant="light"
            className="ms-2"
            onClick={() => setConfirm(false)}
          >
            Keep post
          </Button>
        </Modal.Body>
      </Modal>
    </article>
  );
}
