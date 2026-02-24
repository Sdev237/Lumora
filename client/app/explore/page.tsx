"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import ExploreFilters from "@/components/explore/ExploreFilters";
import PostList from "@/components/posts/PostList";
import api from "@/lib/api";

export default function ExplorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [filters, setFilters] = useState({
    location: "",
    popularity: "recent",
    interests: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchPosts();
    }
  }, [user, loading, filters]);

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const params: any = {
        page: 1,
        limit: 20,
        popularity: filters.popularity,
      };

      if (filters.location) {
        params.location = filters.location;
      }

      if (filters.interests) {
        params.interests = filters.interests;
      }

      const response = await api.get("/explore/posts", { params });
      setPosts(response.data.posts);
    } catch (error) {
      console.error("Erreur chargement posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Explorer</h1>
        <ExploreFilters filters={filters} onFiltersChange={setFilters} />
        {loadingPosts ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <PostList posts={posts} />
        )}
      </div>
    </div>
  );
}
