"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import PostForm from "@/components/posts/PostForm";

export default function CreatePostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Créer un post</h1>
          <p className="text-sm text-gray-500 mb-4">
            Partagez une publication classique avec texte, médias et localisation.
          </p>
          <PostForm onPostCreated={() => router.push("/feed")} />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Passer en live</h2>
            <p className="text-sm text-gray-500">
              Lancez un live comme sur TikTok et interagissez en direct avec votre communauté.
            </p>
          </div>
          <button
            onClick={() => router.push("/live")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Démarrer un live
          </button>
        </div>
      </div>
    </div>
  );
}
