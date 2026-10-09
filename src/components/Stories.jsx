import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import {
  fetchStories,
  viewStory,
  deleteStory,
} from "../store/slices/storySlice";
import { Avatar, run } from "./Common";
export default function Stories({ onCreate }) {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const stories = useSelector((s) => s.story.items);
  const [index, setIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(6000);
  const active = index === null ? null : stories[index];
  const next = useCallback(
    () =>
      setIndex((i) =>
        i === null ? null : i + 1 < stories.length ? i + 1 : null,
      ),
    [stories.length],
  );
  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);
  useEffect(() => {
    if (!active) return;
    setProgress(0);
    setDuration(6000);
    run(dispatch(viewStory({ id: active._id, userId: me._id })));
  }, [active?._id, dispatch, me._id]);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const p = ((Date.now() - start) / duration) * 100;
      setProgress(Math.min(100, p));
      if (p >= 100) next();
    }, 50);
    return () => clearInterval(timer);
  }, [active?._id, duration, next]);
  useEffect(() => {
    if (index === null) return;
    const handler = (e) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, next]);
  const users = [...new Map(stories.map((s) => [s.user._id, s.user])).values()];
  return (
    <>
      <div className="stories">
        <button className="story-button" onClick={onCreate}>
          <span className="story-ring own">
            <Avatar user={me} size={58} />
            <i>
              <Plus size={13} />
            </i>
          </span>
          <small>Your story</small>
        </button>
        {users.map((u) => {
          const theirs = stories.filter((s) => s.user._id === u._id);
          const unviewed = theirs.some((s) => !s.viewedBy.includes(me._id));
          return (
            <button
              key={u._id}
              className="story-button"
              onClick={() =>
                setIndex(
                  stories.findIndex(
                    (s) => s.user._id === u._id && !s.viewedBy.includes(me._id),
                  ) >= 0
                    ? stories.findIndex(
                        (s) =>
                          s.user._id === u._id && !s.viewedBy.includes(me._id),
                      )
                    : stories.findIndex((s) => s.user._id === u._id),
                )
              }
            >
              <span className={`story-ring ${unviewed ? "" : "viewed"}`}>
                <Avatar user={u} size={58} />
              </span>
              <small>{u.username}</small>
            </button>
          );
        })}
      </div>
      {active && (
        <div
          className="story-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Story viewer"
        >
          <button
            className="story-close icon-button"
            onClick={() => setIndex(null)}
            aria-label="Close story"
          >
            <X />
          </button>
          <button
            className="story-prev icon-button"
            onClick={() => setIndex(Math.max(0, index - 1))}
            aria-label="Previous story"
          >
            <ChevronLeft />
          </button>
          <div className="story-frame">
            <div className="story-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="story-author">
              <Avatar user={active.user} />
              <strong>{active.user.username}</strong>
              {active.user._id === me._id && (
                <button
                  className="icon-button ms-auto"
                  aria-label="Delete story"
                  onClick={() => {
                    if (window.confirm("Delete this story?"))
                      run(dispatch(deleteStory(active._id)), () =>
                        setIndex(null),
                      );
                  }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            {active.media.type === "video" ? (
              <video
                key={active._id}
                src={active.media.url}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={(e) =>
                  setDuration(
                    Math.min(e.currentTarget.duration * 1000, 60000) || 6000,
                  )
                }
                onEnded={next}
              />
            ) : (
              <img src={active.media.url} alt="Story" />
            )}
          </div>
          <button
            className="story-next icon-button"
            onClick={next}
            aria-label="Next story"
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </>
  );
}
