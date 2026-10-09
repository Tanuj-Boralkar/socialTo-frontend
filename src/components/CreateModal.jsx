import { useState, useEffect } from "react";
import { Modal, Button, Form, ProgressBar } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { ImagePlus, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import { createPost } from "../store/slices/postSlice";
import { createStory } from "../store/slices/storySlice";
import { createReel } from "../store/slices/reelSlice";
import { run } from "./Common";
export default function CreateModal({ show, onHide, initialKind = "post" }) {
  const dispatch = useDispatch();
  const [kind, setKind] = useState(initialKind);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [audio, setAudio] = useState("Original audio");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (show) {
      setKind(initialKind);
      setFiles([]);
      setCaption("");
      setLocation("");
    }
  }, [show, initialKind]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);
  const submit = async (e) => {
    e.preventDefault();
    if (!files.length) return;
    const data = new FormData();
    files.forEach((f) => data.append("media", f));
    data.append("caption", caption);
    data.append("location", location);
    data.append("audio", audio);
    setBusy(true);
    await run(
      dispatch(
        { post: createPost, story: createStory, reel: createReel }[kind](data),
      ),
      () => {
        toast.success(`${kind[0].toUpperCase() + kind.slice(1)} shared`);
        onHide();
      },
    );
    setBusy(false);
  };
  return (
    <Modal show={show} onHide={() => !busy && onHide()} centered size="lg">
      <Modal.Header closeButton={!busy}>
        <Modal.Title>Something worth sharing</Modal.Title>
      </Modal.Header>
      <Form onSubmit={submit}>
        <Modal.Body>
          <div className="segmented mb-4">
            {["post", "story", "reel"].map((x) => (
              <button
                type="button"
                key={x}
                className={kind === x ? "active" : ""}
                onClick={() => {
                  setKind(x);
                  setFiles([]);
                }}
              >
                {x}
              </button>
            ))}
          </div>
          <label className="upload-area">
            <ImagePlus size={34} />
            <strong>
              {files.length
                ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                : "Drop a little piece of your day"}
            </strong>
            <span>
              Choose {kind === "reel" ? "a video" : "images or videos"} · 20 MB
              each{kind === "post" ? " · up to 10 files" : ""}
            </span>
            <Form.Control
              type="file"
              key={kind}
              accept={
                kind === "reel"
                  ? "video/mp4,video/webm,video/quicktime"
                  : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              }
              multiple={kind === "post"}
              required={!files.length}
              onChange={(e) => {
                const selected = [...e.target.files];
                if (
                  selected.length > (kind === "post" ? 10 : 1) ||
                  selected.some((f) => f.size > 20 * 1024 * 1024)
                ) {
                  toast.error(
                    "Choose up to 10 files, each under 20 MB. Stories and reels use one file.",
                  );
                  e.target.value = "";
                  return;
                }
                setFiles(selected);
              }}
            />
          </label>
          <div className="upload-previews">
            {previews.map((url, i) =>
              files[i]?.type.startsWith("video") ? (
                <video key={url} src={url} controls />
              ) : (
                <img key={url} src={url} alt="Upload preview" />
              ),
            )}
          </div>
          {kind !== "story" && (
            <>
              <Form.Label>Caption</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={2200}
                placeholder="Tell the story. Mention friends with @username."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <small className="text-muted">{caption.length}/2200</small>
            </>
          )}
          {kind === "post" && (
            <Form.Control
              className="mt-3"
              placeholder="Add a location"
              maxLength={100}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          )}
          {kind === "reel" && (
            <Form.Control
              className="mt-3"
              aria-label="Audio information"
              value={audio}
              maxLength={100}
              onChange={(e) => setAudio(e.target.value)}
            />
          )}
          {kind === "story" && (
            <p className="text-muted mt-3">A moment for the next 24 hours.</p>
          )}
          {busy && (
            <ProgressBar
              animated
              now={100}
              label="Uploading and publishing…"
              className="mt-3"
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" disabled={busy} onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !files.length}>
            {busy ? "Sharing…" : "Share your moment"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
