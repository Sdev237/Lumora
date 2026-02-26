"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { FiUserPlus, FiUserCheck, FiMapPin, FiEdit2 } from "react-icons/fi";

interface ProfileHeaderProps {
  user: any;
  currentUserId?: string;
}

export default function ProfileHeader({
  user,
  currentUserId,
}: ProfileHeaderProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(
    user.followers?.length || 0
  );
  const [followingCount, setFollowingCount] = useState(
    user.following?.length || 0
  );
  const [loading, setLoading] = useState(false);

  const followLabel =
    (authUser as any)?.terminologyPreference?.follow || "S'abonner";
  const followingLabel =
    (authUser as any)?.terminologyPreference?.following || "Abonné";

  useEffect(() => {
    if (currentUserId && user.followers) {
      setIsFollowing(
        user.followers.some((follower: any) => follower._id === currentUserId)
      );
    }
  }, [user, currentUserId]);

  const handleFollow = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/follows/${user._id}`);
      setIsFollowing(response.data.following);
      setFollowersCount((prev) =>
        response.data.following ? prev + 1 : prev - 1
      );
      toast.success(
        response.data.following ? "Abonnement ajouté" : "Abonnement retiré"
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = currentUserId === user._id;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-r from-primary-400 to-primary-600"></div>

      {/* Profile Info */}
      <div className="px-6 pb-6 -mt-16">
        <div className="flex items-end justify-between mb-4">
          <div className="flex items-end space-x-4">
            {user.avatar ? (
              <img
                src={
                  user.avatar.startsWith("http")
                    ? user.avatar
                    : `${
                        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                        "http://localhost:5000"
                      }${
                        user.avatar.startsWith("/")
                          ? user.avatar
                          : "/" + user.avatar
                      }`
                }
                alt={user.username}
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white bg-primary-600 flex items-center justify-center text-white text-4xl font-bold">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                <span>
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </span>
                {user.isLive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-600 text-white">
                    LIVE
                  </span>
                )}
              </h1>
              <p className="text-gray-600">@{user.username}</p>
            </div>
          </div>

          {isOwnProfile ? (
            <button
              onClick={() => router.push("/settings")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
            >
              <FiEdit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          ) : (
            <button
              onClick={handleFollow}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                isFollowing
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-primary-600 text-white hover:bg-primary-700"
              } disabled:opacity-50`}
            >
              {isFollowing ? (
                <>
                  <FiUserCheck className="w-4 h-4" />
                  <span>{followingLabel}</span>
                </>
              ) : (
                <>
                  <FiUserPlus className="w-4 h-4" />
                  <span>{followLabel}</span>
                </>
              )}
            </button>
          )}
        </div>

        {user.bio && <p className="text-gray-700 mb-4">{user.bio}</p>}

        {user.location && (
          <div className="flex items-center text-gray-600 mb-4">
            <FiMapPin className="w-4 h-4 mr-2" />
            <span>{user.location.address || "Position partagée"}</span>
          </div>
        )}

        <div className="flex items-center space-x-6">
          <div>
            <span className="font-semibold text-gray-900">
              {followersCount}
            </span>
            <span className="text-gray-600 ml-1">abonnés</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">
              {followingCount}
            </span>
            <span className="text-gray-600 ml-1">abonnements</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">
              {user.posts?.length || 0}
            </span>
            <span className="text-gray-600 ml-1">publications</span>
          </div>
        </div>
      </div>
    </div>
  );
}
