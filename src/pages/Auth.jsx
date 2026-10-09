import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { ArrowUpRight, Sparkles, Eye, EyeOff } from "lucide-react";
import { login, register } from "../store/slices/authSlice";
import { ErrorBox } from "../components/Common";
export default function Auth({ signup = false }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading } = useSelector((s) => s.auth);
  const [values, setValues] = useState({
    email: "",
    password: "",
    username: "",
    fullName: "",
  });
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  if (user) return <Navigate to={location.state?.from || "/"} replace />;
  const input = (key, placeholder, type = "text") => (
    <Form.Control
      id={`auth-${key}`}
      type={type}
      value={values[key]}
      required
      autoComplete={
        key === "password"
          ? signup
            ? "new-password"
            : "current-password"
          : key === "fullName"
            ? "name"
            : key
      }
      minLength={key === "password" && signup ? 8 : undefined}
      maxLength={key === "password" ? 72 : key === "username" ? 24 : undefined}
      aria-label={placeholder}
      placeholder={placeholder}
      onChange={(e) => setValues({ ...values, [key]: e.target.value })}
    />
  );
  return (
    <div className="auth-page">
      <section className="auth-art">
        <Link className="brand" to="/">
          <img src="/logo.svg" alt="" />
          SocialGram.
        </Link>
        <div className="auth-art-copy">
          <span className="pill">
            <Sparkles size={14} /> LESS SCROLLING. MORE CONNECTING.
          </span>
          <h1>
            Your everyday.
            <br />A little more
            <br />
            <em>extraordinary.</em>
          </h1>
          <p>
            The small things. The big feelings.
            <br />
            The people who make it all worth sharing.
          </p>
        </div>
        <div className="auth-collage">
          <div className="art-tile tile-one">
            <div className="landscape">
              <i />
              <b />
            </div>
            <span>Somewhere, together ↗</span>
          </div>
          <div className="art-tile tile-two">
            <div className="abstract-flower">✳</div>
            <span>Find your kind of people.</span>
          </div>
        </div>
        <small>REAL MOMENTS. REAL CONNECTIONS.</small>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">YOUR PEOPLE ARE HERE</span>
          <h2>
            {signup ? "Make yourself at home." : "Good to see you again."}
          </h2>
          <p className="text-muted mb-4">
            {signup
              ? "A new chapter starts with a little hello."
              : "Catch up with the people and moments you love."}
          </p>
          <ErrorBox error={error} />
          <Form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              try {
                await dispatch((signup ? register : login)(values)).unwrap();
              } catch (err) {
                setError(err);
              }
            }}
          >
            {signup && (
              <>
                <Form.Label htmlFor="auth-fullName">Full name</Form.Label>
                {input("fullName", "Your full name")}
                <Form.Label htmlFor="auth-username">Username</Form.Label>
                {input("username", "Choose a username")}
              </>
            )}
            <Form.Label htmlFor="auth-email">Email address</Form.Label>
            {input("email", "you@example.com", "email")}
            <Form.Label htmlFor="auth-password">Password</Form.Label>
            <div className="password-input">
              {input(
                "password",
                signup ? "At least 8 characters" : "Enter your password",
                visible ? "text" : "password",
              )}
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button type="submit" className="w-100 mt-4" disabled={loading}>
              {loading
                ? "One moment…"
                : signup
                  ? "Create your account"
                  : "Log in"}{" "}
              <ArrowUpRight size={18} />
            </Button>
          </Form>
          <p className="auth-switch">
            {signup ? "Already part of the circle?" : "New around here?"}{" "}
            <Link to={signup ? "/login" : "/register"}>
              {signup ? "Log in" : "Join SocialGram"}
            </Link>
          </p>
          <div className="auth-footnote">
            A space for the things that make you, you.
          </div>
        </div>
      </section>
    </div>
  );
}
