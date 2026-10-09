import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Volume2,
  VolumeX,
  Play,
  Music2,
  Trash2,
} from "lucide-react";
import {
  fetchReels,
  fetchReel,
  likeReel,
  saveReel,
  deleteReel,
  clearReels,
} from "../store/slices/reelSlice";
import { savedChanged } from "../store/slices/authSlice";
import {
  UserLink,
  run,
  share,
  Empty,
  ErrorBox,
  LoadMore,
} from "../components/Common";
import FollowButton from "../components/FollowButton";
import Comments from "../components/Comments";
function Reel({ reel }) {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const ref = useRef(null);
  const [comments, setComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const liked = reel.likes.includes(me._id);
  const saved = me.savedReels.includes(reel._id);
  useEffect(() => {
    const v = ref.current;
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          v.play()
            .then(() => setPaused(false))
            .catch(() => setPaused(true));
        } else v.pause();
      },
      { threshold: 0.65 },
    );
    observer.observe(v);
    return () => observer.disconnect();
  }, []);
  return (
    <article className="reel">
      <video
        ref={ref}
        src={reel.media.url}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onClick={() => {
          if (ref.current.paused) {
            ref.current.play().catch(() => {});
            setPaused(false);
          } else {
            ref.current.pause();
            setPaused(true);
          }
        }}
      />
      {paused && (
        <button
          className="reel-play"
          aria-label="Play reel"
          onClick={() => {
            ref.current.play().catch(() => {});
            setPaused(false);
          }}
        >
          <Play size={38} />
        </button>
      )}
      <button
        className="reel-sound icon-button"
        onClick={() => setMuted(!muted)}
        aria-label={muted ? "Enable sound" : "Mute"}
      >
        {muted ? <VolumeX /> : <Volume2 />}
      </button>
      <div className="reel-caption">
        <div className="d-flex align-items-center gap-3">
          <UserLink user={reel.user} />
          <FollowButton user={reel.user} />
        </div>
        <p>{reel.caption}</p>
        <small>
          <Music2 size={14} /> {reel.audio}
        </small>
      </div>
      <div className="reel-actions">
        <button
          aria-label="Like reel"
          className={liked ? "liked" : ""}
          onClick={() => run(dispatch(likeReel({ id: reel._id, liked })))}
        >
          <Heart fill={liked ? "currentColor" : "none"} />
          <small>{reel.likes.length}</small>
        </button>
        <button aria-label="Reel comments" onClick={() => setComments(true)}>
          <MessageCircle />
          <small>{reel.comments.length}</small>
        </button>
        <button
          aria-label="Save reel"
          onClick={() =>
            run(dispatch(saveReel({ id: reel._id, saved })), (r) =>
              dispatch(
                savedChanged({ kind: "reel", id: reel._id, saved: r.saved }),
              ),
            )
          }
        >
          <Bookmark fill={saved ? "currentColor" : "none"} />
        </button>
        <button
          aria-label="Share reel"
          onClick={() => share(`/reels?id=${reel._id}`)}
        >
          <Send />
        </button>
        {reel.user._id === me._id && (
          <button
            aria-label="Delete reel"
            onClick={() => {
              if (window.confirm("Permanently delete this reel?"))
                run(dispatch(deleteReel(reel._id)));
            }}
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
      <Modal show={comments} onHide={() => setComments(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Comments id={reel._id} kind="reel" ownerId={reel.user._id} />
        </Modal.Body>
      </Modal>
    </article>
  );
}
export default function Reels() {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const id = params.get("id");
  const { items, hasMore, loading, error } = useSelector((s) => s.reel);
  const [page, setPage] = useState(1);
  useEffect(() => {
    dispatch(clearReels());
    setPage(1);
    dispatch(id ? fetchReel(id) : fetchReels({ page: 1 }));
  }, [id, dispatch]);
  return (
    <div className="reels-page">
      <ErrorBox error={error} />
      {items.map((r) => (
        <Reel key={r._id} reel={r} />
      ))}
      {!loading && !items.length && !error && (
        <Empty title="A moment in motion">
          Share a reel using the Create button.
        </Empty>
      )}
      <LoadMore
        hasMore={hasMore}
        loading={loading}
        onClick={() => {
          setPage(page + 1);
          dispatch(fetchReels({ page: page + 1 }));
        }}
      />
    </div>
  );
}
