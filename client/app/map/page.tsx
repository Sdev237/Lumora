"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import api from "@/lib/api";

// Carte chargée côté client uniquement (Leaflet utilise window)
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
});

export default function MapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchMapData();
    }
  }, [user, loading]);

  const fetchMapData = async () => {
    try {
      setLoadingData(true);

      // Get user's current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { longitude, latitude } = position.coords;

          // Fetch nearby posts
          const postsResponse = await api.get("/explore/nearby", {
            params: { longitude, latitude, maxDistance: 50000 },
          });
          setPosts(postsResponse.data.posts);

          // Fetch active users
          const usersResponse = await api.get("/users/active");
          setActiveUsers(usersResponse.data.users);

          setLoadingData(false);
        },
        () => {
          // If geolocation fails, fetch all public posts
          api
            .get("/posts/feed", { params: { limit: 100 } })
            .then((res) => {
              setPosts(res.data.posts);
              setLoadingData(false);
            })
            .catch(() => setLoadingData(false));
        }
      );
    } catch (error) {
      console.error("Erreur chargement données carte:", error);
      setLoadingData(false);
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
      <div className="h-[calc(100vh-64px)]">
        <MapView
          posts={posts}
          activeUsers={activeUsers}
          loading={loadingData}
        />
      </div>
    </div>
  );
}
