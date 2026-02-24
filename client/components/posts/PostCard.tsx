"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import {
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiMapPin,
  FiMoreVertical,
} from "react-icons/fi";
import CommentSection from "./CommentSection";

interface PostCardProps {
  post: any;
  currentUserId?: string;
  onUpdate?: () => void;
}

export default function PostCard({
  post,
  currentUserId,
  onUpdate,
}: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(
    post.likes?.some((like: any) => like._id === currentUserId) || false
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/likes/post/${post._id}`);
      setIsLiked(response.data.liked);
      setLikesCount((prev) => (response.data.liked ? prev + 1 : prev - 1));
    } catch (error) {
      toast.error("Erreur lors du like");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${post.author._id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={handleProfileClick}
        >
          {post.author.avatar ? (
            <img
              src={
                post.author.avatar.startsWith("http")
                  ? post.author.avatar
                  : `${
                      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                      "http://localhost:5000"
                    }${
                      post.author.avatar.startsWith("/")
                        ? post.author.avatar
                        : "/" + post.author.avatar
                    }`
              }
              alt={post.author.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
              {post.author.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">
              {post.author.firstName && post.author.lastName
                ? `${post.author.firstName} ${post.author.lastName}`
                : post.author.username}
            </p>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <FiMoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>

        {post.location && (
          <div className="mt-2 flex items-center text-sm text-primary-600">
            <FiMapPin className="w-4 h-4 mr-1" />
            <span>
              {post.location.placeName ||
                post.location.address ||
                "Position partagée"}
            </span>
          </div>
        )}
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div
          className={`grid ${
            post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          } gap-1`}
        >
          {post.images.map((image: string, index: number) => (
            <img
              key={index}
              src={image}
              alt={`Post image ${index + 1}`}
              className="w-full h-64 object-cover"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? "text-red-600" : "text-gray-600 hover:text-red-600"
              }`}
            >
              <FiHeart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <FiMessageCircle className="w-5 h-5" />
              <span>{post.comments?.length || 0}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
              <FiShare2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showComments && (
          <CommentSection postId={post._id} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
}
