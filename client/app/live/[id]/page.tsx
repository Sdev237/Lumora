"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import api from "@/lib/api";
import {
  joinLive,
  leaveLive,
  onLiveEvent,
  requestJoinLive,
  sendLiveComment,
  sendLiveLike,
} from "@/lib/socket";
import toast from "react-hot-toast";

export default function LiveViewerPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<any | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [joinStatus, setJoinStatus] = useState<
    "idle" | "pending" | "approved" | "rejected"
  >("idle");

  const emojis = useMemo(
    () => [
      { key: "heart", label: "❤️" },
      { key: "thumbs", label: "👍" },
      { key: "laugh", label: "😂" },
      { key: "wow", label: "😮" },
      { key: "sad", label: "😢" },
    ],
    []
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (user && id) {
      fetchSession(id as string);
      joinLive(id as string, user._id);
    }

    return () => {
      if (user && id) {
        leaveLive(id as string, user._id);
      }
    };
  }, [user, loading, id, router]);

  useEffect(() => {
    const handleComment = (data: any) => {
      if (data.sessionId === session?._id) {
        setComments((prev) => [...prev, data]);
      }
    };

    const handleLike = (data: any) => {
      if (data.sessionId === session?._id) {
        setLikeCounts((prev) => ({
          ...prev,
          [data.emoji || "heart"]: (prev[data.emoji || "heart"] || 0) + 1,
        }));
      }
    };

    onLiveEvent("live:comment", handleComment);
    onLiveEvent("live:like", handleLike);

    const handleApproved = (data: any) => {
      if (data.sessionId === session?._id) {
        setJoinStatus("approved");
        toast.success("Vous avez été accepté pour monter dans le live");
      }
    };
    const handleRejected = (data: any) => {
      if (data.sessionId === session?._id) {
        setJoinStatus("rejected");
        toast.error("Votre demande a été refusée");
      }
    };

    onLiveEvent("live:join-approved", handleApproved);
    onLiveEvent("live:join-rejected", handleRejected);
  }, [session]);

  const fetchSession = async (sessionId: string) => {
    try {
      const res = await api.get(`/live/${sessionId}`);
      setSession(res.data.session);
    } catch {
      setSession(null);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !user || !commentInput.trim()) return;
    sendLiveComment(session._id, user._id, commentInput.trim());
    setCommentInput("");
  };

  const handleRequestJoin = () => {
    if (!session || !user) return;
    requestJoinLive(session._id, user._id);
    setJoinStatus("pending");
    toast.success("Demande envoyée");
  };

  const handleLike = (emojiKey: string) => {
    if (!session || !user) return;
    sendLiveLike(session._id, user._id, emojiKey);
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
      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-black rounded-xl overflow-hidden relative aspect-[9/16] flex items-center justify-center text-white">
          {session ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-center text-sm text-gray-300 px-4">
                Flux vidéo en direct à intégrer ici (via WebRTC ou service
                streaming). Pour l&apos;instant, vous pouvez interagir via les
                commentaires et les réactions en temps réel.
              </p>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Ce live n&apos;est plus disponible.
            </div>
          )}
          {session && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
              LIVE
            </span>
          )}
        </section>

        <aside className="bg-white rounded-xl shadow-md p-4 flex flex-col max-h-[75vh]">
          {session && (
            <>
              <h1 className="text-lg font-semibold mb-1">
                {session.title || "Live en cours"}
              </h1>
              <p className="text-xs text-gray-500 mb-3">
                Par{" "}
                {session.host?.firstName && session.host?.lastName
                  ? `${session.host.firstName} ${session.host.lastName}`
                  : session.host?.username}
              </p>
            </>
          )}

          {session && (
            <div className="mb-3 border border-gray-100 rounded-lg p-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 font-semibold">
                  Monter dans le live
                </p>
                {joinStatus === "idle" && (
                  <button
                    type="button"
                    onClick={handleRequestJoin}
                    className="px-3 py-1 bg-primary-600 text-white rounded-full text-[11px] font-semibold"
                  >
                    Demander
                  </button>
                )}
                {joinStatus === "pending" && (
                  <span className="text-[11px] text-gray-500">
                    En attente…
                  </span>
                )}
                {joinStatus === "approved" && (
                  <span className="text-[11px] text-green-600 font-semibold">
                    Accepté
                  </span>
                )}
                {joinStatus === "rejected" && (
                  <button
                    type="button"
                    onClick={handleRequestJoin}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-[11px] font-semibold"
                  >
                    Redemander
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Si l’hôte accepte, l’étape suivante sera l’intégration du flux
                invité (WebRTC).
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">
              Réactions en direct
            </span>
            <div className="flex space-x-1">
              {emojis.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => handleLike(e.key)}
                  className="flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[11px]"
                >
                  <span className="mr-1">{e.label}</span>
                  <span className="text-gray-600">
                    {likeCounts[e.key] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg p-2 mb-3 bg-gray-50 space-y-1 text-xs">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-center">
                Les commentaires du live apparaîtront ici.
              </p>
            ) : (
              comments.map((c, idx) => (
                <p key={idx} className="text-gray-800">
                  <span className="font-semibold mr-1">
                    {c.userId === user._id ? "Vous" : "Viewer"}
                  </span>
                  {c.message}
                </p>
              ))
            )}
          </div>

          {session && (
            <form
              onSubmit={handleSendComment}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Envoyer un commentaire..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="px-3 py-2 bg-primary-600 text-white rounded-full text-xs font-medium disabled:opacity-50"
              >
                Envoyer
              </button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

