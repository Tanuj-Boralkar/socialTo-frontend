import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  updateProfile,
  changePassword,
  logout,
} from "../store/slices/authSlice";
import { Avatar, run } from "../components/Common";
export default function Settings() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [values, setValues] = useState({
    fullName: user.fullName,
    bio: user.bio,
    website: user.website,
    gender: user.gender,
    isPrivate: user.isPrivate,
  });
  const [file, setFile] = useState(null);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [dark, setDark] = useState(
    document.documentElement.dataset.bsTheme === "dark",
  );
  return (
    <div className="narrow-page">
      <div className="d-flex justify-content-end gap-2 mb-3">
        <Button
          variant="outline-secondary"
          onClick={() => {
            const value = !dark;
            setDark(value);
            document.documentElement.dataset.bsTheme = value ? "dark" : "light";
            localStorage.setItem("sg_theme", value ? "dark" : "light");
            window.dispatchEvent(new Event("sg-theme"));
          }}
        >
          {dark ? "Light mode" : "Dark mode"}
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => run(dispatch(logout()))}
        >
          Log out
        </Button>
      </div>
      <header className="page-heading">
        <div>
          <span className="eyebrow">MAKE IT YOURS</span>
          <h1>
            Your little corner<span>.</span>
          </h1>
        </div>
      </header>
      <Form
        className="settings-card"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData();
          Object.entries(values).forEach(([k, v]) => data.append(k, v));
          if (file) data.append("avatar", file);
          setBusy(true);
          await run(dispatch(updateProfile(data)), () =>
            toast.success("Profile updated"),
          );
          setBusy(false);
        }}
      >
        <div className="d-flex align-items-center gap-3 mb-4">
          <Avatar user={user} size={74} />
          <div>
            <strong>{user.username}</strong>
            <Form.Control
              className="mt-2"
              aria-label="Profile picture"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
        </div>
        {[
          ["fullName", "Full name"],
          ["bio", "Bio"],
          ["website", "Website"],
        ].map(([key, label]) => (
          <Form.Group key={key} className="mb-3">
            <Form.Label>{label}</Form.Label>
            <Form.Control
              as={key === "bio" ? "textarea" : "input"}
              type={key === "website" ? "url" : "text"}
              value={values[key]}
              maxLength={key === "bio" ? 160 : key === "fullName" ? 60 : 200}
              required={key === "fullName"}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            />
          </Form.Group>
        ))}
        <Form.Label>Gender</Form.Label>
        <Form.Select
          className="mb-4"
          value={values.gender}
          onChange={(e) => setValues({ ...values, gender: e.target.value })}
        >
          {["", "Female", "Male", "Non-binary", "Prefer not to say"].map(
            (x) => (
              <option key={x} value={x}>
                {x || "Choose (optional)"}
              </option>
            ),
          )}
        </Form.Select>
        <Form.Check
          type="switch"
          label="Private account"
          checked={values.isPrivate}
          onChange={(e) =>
            setValues({ ...values, isPrivate: e.target.checked })
          }
        />
        <p className="text-muted small mt-2">
          Only approved followers can see your posts, reels and stories.
          Existing followers keep access.
        </p>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </Form>
      <Form
        className="settings-card mt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await run(dispatch(changePassword(passwords)), () => {
            setPasswords({ currentPassword: "", newPassword: "" });
            toast.success(
              "Password changed. Other sessions have been signed out.",
            );
          });
          setBusy(false);
        }}
      >
        <h4>Change password</h4>
        <Form.Control
          className="my-3"
          type="password"
          autoComplete="current-password"
          aria-label="Current password"
          placeholder="Current password"
          required
          value={passwords.currentPassword}
          onChange={(e) =>
            setPasswords({ ...passwords, currentPassword: e.target.value })
          }
        />
        <Form.Control
          className="mb-3"
          type="password"
          autoComplete="new-password"
          aria-label="New password"
          placeholder="New password (at least 8 characters)"
          required
          minLength={8}
          maxLength={72}
          value={passwords.newPassword}
          onChange={(e) =>
            setPasswords({ ...passwords, newPassword: e.target.value })
          }
        />
        <Button type="submit" variant="outline-secondary" disabled={busy}>
          Update password
        </Button>
      </Form>
    </div>
  );
}
