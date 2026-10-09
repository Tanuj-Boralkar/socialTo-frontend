import { Link } from "react-router-dom";
import { Heart, MessageCircle, Layers, Play } from "lucide-react";
export default function PostGrid({ items, reels = false, explore = false }) {
  return (
    <div className={`post-grid ${explore ? "explore-grid" : ""}`}>
      {items.map((p) => {
        const m = reels ? p.media : p.media[0];
        return (
          <Link
            key={p._id}
            to={reels ? `/reels?id=${p._id}` : `/p/${p._id}`}
            className="grid-tile"
          >
            {m.type === "video" ? (
              <video src={m.url} muted playsInline preload="metadata" />
            ) : (
              <img
                src={m.url}
                alt={p.caption || "Shared photo"}
                loading="lazy"
              />
            )}
            <span className="grid-type">
              {m.type === "video" ? (
                <Play size={20} fill="currentColor" />
              ) : p.media.length > 1 ? (
                <Layers size={20} />
              ) : null}
            </span>
            <span className="grid-overlay">
              <span>
                <Heart size={19} fill="currentColor" /> {p.likes.length}
              </span>
              <span>
                <MessageCircle size={19} fill="currentColor" />{" "}
                {p.comments.length}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
