"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostList from "@/components/posts/PostList";
import axios from "axios";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser, loading } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/");
      return;
    }

    if (currentUser) {
      fetchProfile();
    }
  }, [id, currentUser, loading]);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfileUser(response.data.user);
      setPosts(response.data.posts);
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Profil non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileHeader user={profileUser} currentUserId={currentUser?._id} />
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Publications</h2>
          <PostList userId={id as string} />
        </div>
      </div>
    </div>
  );
}
