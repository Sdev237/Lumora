\"use client\";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import PostCard from "@/components/posts/PostCard";
import api from "@/lib/api";

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [post, setPost] = useState<any | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user && id) {
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, loading]);

  const fetchPost = async () => {
    try {
      setLoadingPost(true);
      const response = await api.get(`/posts/${id}`);
      setPost(response.data.post);
    } catch (error) {
      setPost(null);
    } finally {
      setLoadingPost(false);
    }
  };

  if (loading || loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">
            Cette publication n'existe plus ou est introuvable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PostCard post={post} currentUserId={user?._id} onUpdate={fetchPost} />
      </div>
    </div>
  );
}

