import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPost } from "../store/slices/postSlice";
import PostCard from "../components/PostCard";
import { Skeleton, ErrorBox } from "../components/Common";
export default function PostDetail() {
  const { postId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { detail, error } = useSelector((s) => s.post);
  useEffect(() => {
    dispatch(fetchPost(postId));
  }, [postId, dispatch]);
  return (
    <div className="detail-page">
      <ErrorBox error={error} />
      {detail?._id === postId ? (
        <PostCard post={detail} expanded onDeleted={() => navigate("/")} />
      ) : (
        !error && <Skeleton count={1} />
      )}
    </div>
  );
}
