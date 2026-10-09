import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "react-bootstrap";
import { followUser } from "../store/slices/userSlice";
import { refreshMe } from "../store/slices/authSlice";
import { run } from "./Common";
export default function FollowButton({ user, requested = false, onChange }) {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(requested);
  if (!user || me._id === user._id) return null;
  const following = me.following.includes(user._id);
  return (
    <Button
      size="sm"
      variant={following || pending ? "outline-secondary" : "primary"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await run(
          dispatch(followUser({ id: user._id, remove: following || pending })),
          async (result) => {
            setPending(result.requested);
            await dispatch(refreshMe());
            onChange?.();
          },
        );
        setBusy(false);
      }}
    >
      {following ? "Following" : pending ? "Requested" : "Follow"}
    </Button>
  );
}
