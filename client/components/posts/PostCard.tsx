"use client";

import { useEffect, useRef, useState } from "react";
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
  const cardRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  const handleShare = async () => {
    try {
      if (typeof window === "undefined") return;

      const url = `${window.location.origin}/posts/${post._id}`;
      const text =
        post.content?.slice(0, 140) ||
        "Découvrez cette publication sur Lumora";

      if (navigator.share) {
        await navigator.share({
          title: "Lumora",
          text,
          url,
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }

      toast.success("Lien de la publication copié");
    } catch (error) {
      // Ignore share cancellation
      console.error("Erreur lors du partage", error);
      toast.error("Impossible de partager la publication");
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${post.author._id}`);
  };

  const hasVideoMedia = Array.isArray(post.media)
    ? post.media.some((m: any) => m.type === "video")
    : false;

  // Track visibility of the card (used for background music playback)
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.75);
      },
      { threshold: [0.5, 0.75, 1] }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Background music playback tied to visibility
  useEffect(() => {
    // If no music, or post contains video media, skip background music to avoid conflicts
    if (!post.musicURL || hasVideoMedia) {
      return;
    }

    // Lazily create audio instance once per card
    if (!audioRef.current) {
      const audio = new Audio(post.musicURL as string);
      audio.loop = true;
      const storedVolume =
        typeof post.musicVolume === "number" ? post.musicVolume : 0.5;
      audio.volume = Math.max(0, Math.min(1, storedVolume));
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    if (!audio) return;

    if (isVisible) {
      // Best-effort autoplay; browsers may block without user gesture
      audio
        .play()
        .catch(() => {
          // Ignore autoplay errors; do not retry in a loop
        });
    } else {
      audio.pause();
    }
  }, [isVisible, post.musicURL, post.musicVolume, hasVideoMedia]);

  // Cleanup on unmount to avoid leaking audio instances
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
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
      {Array.isArray(post.media) && post.media.length > 0 ? (
        <div className="relative">
          <div
            className={`grid ${
              post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
            } gap-1`}
          >
            {post.media.map((item: any, index: number) => {
              const url =
                item.url && item.url.startsWith("http")
                  ? item.url
                  : `${
                      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                      "http://localhost:5000"
                    }${
                      item.url && item.url.startsWith("/")
                        ? item.url
                        : "/" + item.url
                    }`;

              if (item.type === "video") {
                return (
                  <video
                    key={index}
                    src={url}
                    className="w-full h-80 object-cover"
                    controls
                    playsInline
                  />
                );
              }

              return (
                <img
                  key={index}
                  src={url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-80 object-cover"
                  loading="lazy"
                />
              );
            })}
          </div>
        </div>
      ) : (
        post.images &&
        post.images.length > 0 && (
          <div
            className={`grid ${
              post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            } gap-1`}
          >
            {post.images.map((image: string, index: number) => (
              <img
                key={index}
                src={
                  image.startsWith("http")
                    ? image
                    : `${
                        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                        "http://localhost:5000"
                      }${image.startsWith("/") ? image : "/" + image}`
                }
                alt={`Post image ${index + 1}`}
                className="w-full h-64 object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )
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

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
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
