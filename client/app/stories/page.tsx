"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import StoriesList from "@/components/stories/StoriesList";
import api from "@/lib/api";

export default function StoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchStories();
    }
  }, [user, loading]);

  const fetchStories = async () => {
    try {
      setLoadingStories(true);
      const response = await api.get("/stories");
      setStories(response.data.stories);
    } catch (error) {
      console.error("Erreur chargement stories:", error);
    } finally {
      setLoadingStories(false);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Stories</h1>
        {loadingStories ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <StoriesList stories={stories} onStoryCreated={fetchStories} />
        )}
      </div>
    </div>
  );
}
