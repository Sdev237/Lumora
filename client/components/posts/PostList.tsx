"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import PostCard from "./PostCard";

interface PostListProps {
  userId?: string;
  posts?: any[]; // If posts are provided, use them directly
  onUpdate?: () => void;
}

export default function PostList({
  userId,
  posts: initialPosts,
  onUpdate,
}: PostListProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts);
      setLoading(false);
      return;
    }

    fetchPosts();
  }, [userId, page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let response;

      if (userId) {
        const userResponse = await api.get(`/users/${userId}`);
        setPosts(userResponse.data.posts || []);
        setHasMore(false);
      } else {
        response = await api.get("/posts/feed", {
          params: { page, limit: 10 },
        });

        if (page === 1) {
          setPosts(response.data.posts);
        } else {
          setPosts((prev) => [...prev, ...response.data.posts]);
        }

        setHasMore(
          response.data.pagination?.hasMore || response.data.posts.length === 10
        );
      }
    } catch (error) {
      console.error("Erreur chargement posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setPosts([]);
    fetchPosts();
    if (onUpdate) onUpdate();
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucun post à afficher</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {posts.map((post, index) => (
        <div
          key={post._id}
          ref={index === posts.length - 1 ? lastPostElementRef : null}
          className="md:flex md:justify-center"
        >
          <div className="w-full md:max-w-2xl lg:max-w-3xl">
            <PostCard
              post={post}
              currentUserId={user?._id}
              onUpdate={handleRefresh}
            />
          </div>
        </div>
      ))}

      {loading && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
}
