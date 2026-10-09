import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Dropdown } from "react-bootstrap";
import {
  Home,
  Search,
  Compass,
  Clapperboard,
  MessageCircle,
  Heart,
  SquarePlus,
  Menu,
  Moon,
  Sun,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "../store/slices/authSlice";
import {
  fetchNotifications,
  notificationReceived,
} from "../store/slices/notificationSlice";
import {
  fetchConversations,
  messageReceived,
  presenceChanged,
  seenReceived,
} from "../store/slices/messageSlice";
import { socket } from "../services/socket";
import { restoreSession } from "../services/api";
import { Avatar, run } from "./Common";
import CreateModal from "./CreateModal";
export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);
  const unread = useSelector((s) => s.notification.unread);
  const [create, setCreate] = useState(false);
  const [kind, setKind] = useState("post");
  const [dark, setDark] = useState(localStorage.getItem("sg_theme") === "dark");
  useEffect(() => {
    const sync = () => setDark(localStorage.getItem("sg_theme") === "dark");
    window.addEventListener("sg-theme", sync);
    return () => window.removeEventListener("sg-theme", sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.bsTheme = dark ? "dark" : "light";
    localStorage.setItem("sg_theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchConversations());
  }, [dispatch]);
  useEffect(() => {
    if (!token) return;
    socket.auth = { token };
    socket.connect();
    const receive = (m) => {
      dispatch(messageReceived(m));
      dispatch(fetchConversations());
    };
    const notification = (n) => dispatch(notificationReceived(n));
    const presence = (ids) => dispatch(presenceChanged(ids));
    const seen = (data) => dispatch(seenReceived(data));
    const reconnect = (reason) => {
      if (reason === "io server disconnect") restoreSession().catch(() => {});
    };
    const connected = () => {
      dispatch(fetchNotifications());
      dispatch(fetchConversations());
    };
    const connectionError = (error) => {
      if (error.message === "Unauthorized") restoreSession().catch(() => {});
    };
    socket.on("connect", connected);
    socket.on("message", receive);
    socket.on("notification", notification);
    socket.on("presence", presence);
    socket.on("seen", seen);
    socket.on("disconnect", reconnect);
    socket.on("connect_error", connectionError);
    return () => {
      socket.off("connect", connected);
      socket.off("message", receive);
      socket.off("notification", notification);
      socket.off("presence", presence);
      socket.off("seen", seen);
      socket.off("disconnect", reconnect);
      socket.off("connect_error", connectionError);
      socket.disconnect();
    };
  }, [token, dispatch]);
  const openCreate = (type = "post") => {
    setKind(type);
    setCreate(true);
  };
  const links = [
    ["/", Home, "Home"],
    ["/search", Search, "Search"],
    ["/explore", Compass, "Explore"],
    ["/reels", Clapperboard, "Reels"],
    ["/messages", MessageCircle, "Messages"],
    ["/notifications", Heart, "Notifications"],
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <img src="/logo.svg" alt="" />
          <span>
            SocialGram<span className="brand-dot">.</span>
          </span>
        </Link>
        <span className="nav-eyebrow">YOUR EVERYDAY, SHARED</span>
        <nav>
          {links.map(([to, Icon, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <Icon size={23} />
              <span>{label}</span>
              {label === "Notifications" && unread > 0 && (
                <b className="nav-badge">{unread > 99 ? "99+" : unread}</b>
              )}
            </NavLink>
          ))}
          <button onClick={() => openCreate()}>
            <SquarePlus size={23} />
            <span>Create</span>
          </button>
          <NavLink to={`/${user.username}`}>
            <Avatar user={user} size={25} />
            <span>Profile</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            A little closer
            <br />
            to your people.<span>Make room for real moments.</span>
          </div>
          <Dropdown drop="up">
            <Dropdown.Toggle variant="link" className="more-toggle no-caret">
              <Menu size={23} />
              <span>More</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setDark(!dark)}>
                {dark ? <Sun size={16} /> : <Moon size={16} />}{" "}
                {dark ? "Light" : "Dark"} mode
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/settings/profile">
                <Settings size={16} /> Settings
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() =>
                  run(dispatch(logout()), () => navigate("/login"))
                }
              >
                <LogOut size={16} /> Log out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </aside>
      <header className="mobile-header">
        <Link className="brand" to="/">
          <img src="/logo.svg" alt="" />
          SocialGram.
        </Link>
        <div>
          <Link to="/search" aria-label="Search">
            <Search />
          </Link>
          <Link to="/notifications" aria-label="Notifications">
            <Heart />
            {unread > 0 && <small>{unread}</small>}
          </Link>
          <Link to="/messages" aria-label="Messages">
            <MessageCircle />
          </Link>
        </div>
      </header>
      <main className="main-area">
        <Outlet context={{ openCreate }} />
      </main>
      <nav className="mobile-nav">
        <NavLink to="/" aria-label="Home">
          <Home />
        </NavLink>
        <NavLink to="/explore" aria-label="Explore">
          <Compass />
        </NavLink>
        <button aria-label="Create" onClick={() => openCreate()}>
          <SquarePlus />
        </button>
        <NavLink to="/reels" aria-label="Reels">
          <Clapperboard />
        </NavLink>
        <NavLink to={`/${user.username}`} aria-label="Profile">
          <Avatar user={user} size={27} />
        </NavLink>
      </nav>
      <CreateModal
        show={create}
        onHide={() => setCreate(false)}
        initialKind={kind}
      />
    </div>
  );
}
