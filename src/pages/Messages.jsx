import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Form, Button, Modal } from "react-bootstrap";
import {
  SquarePen,
  ArrowLeft,
  Send,
  ImagePlus,
  X,
  CheckCheck,
} from "lucide-react";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markSeen,
  startConversation,
} from "../store/slices/messageSlice";
import { searchUsers } from "../store/slices/userSlice";
import { socket } from "../services/socket";
import {
  Avatar,
  UserLink,
  Empty,
  ErrorBox,
  LoadMore,
  run,
  timeAgo,
} from "../components/Common";
export default function Messages() {
  const { conversationId: id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const me = useSelector((s) => s.auth.user);
  const { conversations, history, more, hasMore, online, error } = useSelector(
    (s) => s.message,
  );
  const users = useSelector((s) => s.user.results);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const [typing, setTyping] = useState(false);
  const [newChat, setNewChat] = useState(false);
  const [q, setQ] = useState("");
  const end = useRef(null);
  const typingTimer = useRef();
  const imageInput = useRef();
  const messages = history[id] || [];
  const conversation = conversations.find((c) => c._id === id);
  const other = conversation?.participants.find((u) => u._id !== me._id);
  useEffect(() => {
    dispatch(fetchConversations({ page: 1 }));
  }, [dispatch]);
  useEffect(() => {
    if (!id) return;
    setPage(1);
    setText("");
    setFile(null);
    setTyping(false);
    run(dispatch(fetchMessages({ id, page: 1 })), () => {
      if (document.visibilityState === "visible") dispatch(markSeen(id));
    });
  }, [id, dispatch]);
  useEffect(() => {
    if (id && messages.length && document.visibilityState === "visible") {
      dispatch(markSeen(id));
      if (page === 1)
        end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [id, messages.length, dispatch]);
  useEffect(() => {
    const onTyping = (data) => {
      if (data.conversation !== id) return;
      setTyping(data.typing);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 2500);
    };
    socket.on("typing", onTyping);
    const onFocus = () => {
      if (id) {
        dispatch(fetchMessages({ id, page: 1 }));
        dispatch(markSeen(id));
      }
    };
    const onMessage = (m) => {
      if (m.conversation === id && document.visibilityState === "visible")
        dispatch(markSeen(id));
    };
    socket.on("message", onMessage);
    socket.on("connect", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      socket.off("typing", onTyping);
      socket.off("message", onMessage);
      socket.off("connect", onFocus);
      window.removeEventListener("focus", onFocus);
      clearTimeout(typingTimer.current);
    };
  }, [id, dispatch]);
  useEffect(() => {
    if (!newChat) return;
    const timer = setTimeout(() => dispatch(searchUsers({ q })), 300);
    return () => clearTimeout(timer);
  }, [q, newChat, dispatch]);
  return (
    <div className={`messages-page ${id ? "chat-open" : ""}`}>
      <aside className="conversation-sidebar">
        <header>
          <div>
            <span className="eyebrow">STAY CLOSE</span>
            <h2>
              Messages<span>.</span>
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="New conversation"
            onClick={() => setNewChat(true)}
          >
            <SquarePen />
          </button>
        </header>
        {conversations.map((c) => {
          const u = c.participants.find((x) => x._id !== me._id);
          return (
            <Link
              key={c._id}
              to={`/messages/${c._id}`}
              className={`conversation-row ${id === c._id ? "active" : ""}`}
            >
              <span className="online-avatar">
                <Avatar user={u} />
                {online.includes(u?._id) && <i />}
              </span>
              <span>
                <strong>{u?.username}</strong>
                <small>
                  {c.lastMessage?.text ||
                    (c.lastMessage?.image?.url ? "Sent an image" : "Say hello")}
                </small>
              </span>
              <small>{c.lastMessage && timeAgo(c.lastMessage.createdAt)}</small>
            </Link>
          );
        })}
        <LoadMore
          hasMore={hasMore}
          onClick={() => {
            setListPage(listPage + 1);
            dispatch(fetchConversations({ page: listPage + 1 }));
          }}
        />
        {!conversations.length && (
          <p className="text-muted p-4">
            Start a conversation with someone in your circle.
          </p>
        )}
      </aside>
      <section className="active-chat">
        {id ? (
          <>
            <header>
              <Link
                to="/messages"
                className="chat-back icon-button"
                aria-label="Back to conversations"
              >
                <ArrowLeft />
              </Link>
              {other && (
                <UserLink
                  user={other}
                  sub={online.includes(other._id) ? "Online now" : "Offline"}
                />
              )}
            </header>
            <ErrorBox error={error} />
            <div className="chat-history">
              <LoadMore
                hasMore={more[id]}
                onClick={() => {
                  setPage(page + 1);
                  run(dispatch(fetchMessages({ id, page: page + 1 })));
                }}
              />
              {messages.map((m) => (
                <div
                  key={m._id}
                  className={`message-bubble ${m.sender === me._id ? "outgoing" : "incoming"}`}
                >
                  {m.image?.url && (
                    <a
                      href={m.image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={m.image.url} alt="Sent attachment" />
                    </a>
                  )}
                  {m.text && <p>{m.text}</p>}
                  <small>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {m.sender === me._id && (
                      <span title={m.seenBy.length > 1 ? "Seen" : "Sent"}>
                        {m.seenBy.length > 1 ? (
                          <CheckCheck size={14} />
                        ) : (
                          " · Sent"
                        )}
                      </span>
                    )}
                  </small>
                </div>
              ))}
              {typing && (
                <div className="typing-indicator">
                  {other?.username} is typing<span>…</span>
                </div>
              )}
              <div ref={end} />
            </div>
            <Form
              className="chat-compose"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim() && !file) return;
                const data = new FormData();
                data.append("text", text);
                if (file) data.append("image", file);
                setBusy(true);
                await run(dispatch(sendMessage({ id, data })), () => {
                  setText("");
                  setFile(null);
                  setPage(1);
                  if (imageInput.current) imageInput.current.value = "";
                  socket.emit("typing", { conversation: id, typing: false });
                  end.current?.scrollIntoView({ behavior: "smooth" });
                });
                setBusy(false);
              }}
            >
              {file && (
                <div className="attachment-chip">
                  {file.name}
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Remove attachment"
                    onClick={() => {
                      setFile(null);
                      imageInput.current.value = "";
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
              <label className="icon-button" aria-label="Attach image">
                <ImagePlus />
                <input
                  ref={imageInput}
                  type="file"
                  className="visually-hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
              <Form.Control
                aria-label="Message"
                placeholder="Write a little hello…"
                maxLength={4000}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  socket.emit("typing", {
                    conversation: id,
                    typing: !!e.target.value,
                  });
                }}
              />
              <Button
                type="submit"
                disabled={busy || (!text.trim() && !file)}
                aria-label="Send message"
              >
                <Send size={19} />
              </Button>
            </Form>
          </>
        ) : (
          <Empty title="A conversation can change a day">
            Send a message, share a photo, say a little hello.
            <br />
            <Button className="mt-3" onClick={() => setNewChat(true)}>
              Start a conversation
            </Button>
          </Empty>
        )}
      </section>
      <Modal show={newChat} onHide={() => setNewChat(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>New conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            autoFocus
            aria-label="Find a person to message"
            placeholder="Search a username…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {users
            .filter((u) => u._id !== me._id)
            .map((u) => (
              <button
                key={u._id}
                className="person-row w-100 text-start border-0 bg-transparent"
                onClick={() =>
                  run(dispatch(startConversation(u._id)), (r) => {
                    setNewChat(false);
                    navigate(`/messages/${r.conversation._id}`);
                  })
                }
              >
                <Avatar user={u} />
                <span>
                  <strong>{u.username}</strong>
                  <small className="d-block">{u.fullName}</small>
                </span>
              </button>
            ))}
        </Modal.Body>
      </Modal>
    </div>
  );
}
