"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [followLabel, setFollowLabel] = useState("");
  const [followingLabel, setFollowingLabel] = useState("");
  const [likeLabel, setLikeLabel] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      setUsername(user.username || "");
      setBio(user.bio || "");
      const pref: any = (user as any).terminologyPreference || {};
      setFollowLabel(pref.follow || "");
      setFollowingLabel(pref.following || "");
      setLikeLabel(pref.like || "");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("username", username);
      formData.append("bio", bio);
      formData.append(
        "terminologyPreference",
        JSON.stringify({
          follow: followLabel || undefined,
          following: followingLabel || undefined,
          like: likeLabel || undefined,
        })
      );
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await api.put("/users/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Profil mis à jour");
      // Ideally we would also refresh the auth user in context
      // but for now redirect back to profile
      router.push(`/profile/${response.data.user._id}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Erreur lors de la mise à jour du profil"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Modifier le profil</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom d&apos;utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold mb-2">Terminologie</h2>
            <p className="text-xs text-gray-500 mb-3">
              Personnalisez certains libellés (laisser vide pour utiliser les
              valeurs par défaut).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="followLabel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Suivre (ex: Subscribe)
                </label>
                <input
                  id="followLabel"
                  type="text"
                  value={followLabel}
                  onChange={(e) => setFollowLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="followingLabel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Abonné (ex: Subscribed)
                </label>
                <input
                  id="followingLabel"
                  type="text"
                  value={followingLabel}
                  onChange={(e) => setFollowingLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="likeLabel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Like (ex: Appreciate)
                </label>
                <input
                  id="likeLabel"
                  type="text"
                  value={likeLabel}
                  onChange={(e) => setLikeLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Parlez un peu de vous..."
            />
          </div>

          <div>
            <label
              htmlFor="avatar"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Photo de profil
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setAvatarFile(e.target.files ? e.target.files[0] : null)
              }
              className="w-full text-sm text-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF ou WEBP, maximum 5 Mo.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </div>
  );
}

