"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { FiSend, FiHeart } from "react-icons/fi";

interface CommentSectionProps {
  postId: string;
  onUpdate?: () => void;
}

export default function CommentSection({
  postId,
  onUpdate,
}: CommentSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/comments/${postId}`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Erreur chargement commentaires:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await api.post(`/comments/${postId}`, { content });
      setContent("");
      fetchComments();
      if (onUpdate) onUpdate();
      toast.success("Commentaire ajouté");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'ajout du commentaire"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await api.post(`/likes/comment/${commentId}`);
      fetchComments();
    } catch (error) {
      toast.error("Erreur lors du like");
    }
  };

  const handleAuthorClick = (authorId: string) => {
    if (!authorId) return;
    router.push(`/profile/${authorId}`);
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        {user && (
          <>
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
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </>
        )}
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <p className="text-sm text-gray-500 text-center py-4">Chargement...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Aucun commentaire
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment._id} className="flex items-start space-x-3">
              <button
                type="button"
                onClick={() => handleAuthorClick(comment.author._id)}
                className="flex-shrink-0 focus:outline-none"
              >
                {comment.author.avatar ? (
                  <img
                    src={
                      comment.author.avatar.startsWith("http")
                        ? comment.author.avatar
                        : `${
                            process.env.NEXT_PUBLIC_API_URL?.replace(
                              "/api",
                              ""
                            ) || "http://localhost:5000"
                          }${
                            comment.author.avatar.startsWith("/")
                              ? comment.author.avatar
                              : "/" + comment.author.avatar
                          }`
                    }
                    alt={comment.author.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                    {comment.author.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleAuthorClick(comment.author._id)}
                    className="font-semibold text-sm text-gray-900 hover:underline"
                  >
                    {comment.author.firstName && comment.author.lastName
                      ? `${comment.author.firstName} ${comment.author.lastName}`
                      : comment.author.username}
                  </button>
                  <p className="text-gray-700 text-sm mt-1">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-1 ml-2">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                  <button
                    onClick={() => handleLikeComment(comment._id)}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center space-x-1"
                  >
                    <FiHeart className="w-3 h-3" />
                    <span>{comment.likes?.length || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
