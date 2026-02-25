"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import api from "@/lib/api";
import {
  approveJoinLive,
  joinLive,
  leaveLive,
  onLiveEvent,
  rejectJoinLive,
  sendLiveComment,
} from "@/lib/socket";
import toast from "react-hot-toast";

export default function LivePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [publishToFeed, setPublishToFeed] = useState(true);
  const [publishContent, setPublishContent] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
  }, [user, loading, router]);

  useEffect(() => {
    const handleComment = (data: any) => {
      if (data.sessionId === session?._id) {
        setComments((prev) => [...prev, data]);
      }
    };

    onLiveEvent("live:comment", handleComment);

    const handleJoinRequest = (data: any) => {
      if (data.sessionId !== session?._id) return;
      setJoinRequests((prev) => {
        const exists = prev.some((r) => r.user?._id === data.user?._id);
        if (exists) return prev;
        return [{ ...data, status: "pending" }, ...prev];
      });
      toast.success("Nouvelle demande pour monter dans le live");
    };

    onLiveEvent("live:join-request", handleJoinRequest);

    return () => {
      if (session && user) {
        leaveLive(session._id, user._id);
      }
    };
  }, [session, user]);

  const handleStart = async () => {
    try {
      const res = await api.post("/live/start", { title });
      setSession(res.data.session);

      if (user) {
        joinLive(res.data.session._id, user._id);
      }

      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        } catch {
          // ignore camera errors for now
        }
      }
    } catch {
      // ignore
    }
  };

  const handleStop = async () => {
    if (!session) return;
    try {
      await api.post("/live/stop", {
        publishToFeed,
        content: publishContent,
      });
      toast.success(
        publishToFeed ? "Live arrêté et publié" : "Live arrêté"
      );
    } catch {
      // ignore
    } finally {
      if (user) {
        leaveLive(session._id, user._id);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setSession(null);
      setComments([]);
      setJoinRequests([]);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !user || !commentInput.trim()) return;
    sendLiveComment(session._id, user._id, commentInput.trim());
    setCommentInput("");
  };

  const handleApprove = (targetUserId: string) => {
    if (!session) return;
    approveJoinLive(session._id, targetUserId);
    setJoinRequests((prev) =>
      prev.map((r) =>
        r.user?._id === targetUserId ? { ...r, status: "approved" } : r
      )
    );
  };

  const handleReject = (targetUserId: string) => {
    if (!session) return;
    rejectJoinLive(session._id, targetUserId);
    setJoinRequests((prev) =>
      prev.map((r) =>
        r.user?._id === targetUserId ? { ...r, status: "rejected" } : r
      )
    );
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
        <section className="lg:col-span-2 bg-black rounded-xl overflow-hidden relative aspect-[9/16] flex items-center justify-center">
          {session ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted={false}
              playsInline
            />
          ) : (
            <div className="text-gray-400 text-sm">
              Préparez votre live et démarrez lorsque vous êtes prêt.
            </div>
          )}
          {session && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
              LIVE
            </span>
          )}
        </section>

        <aside className="bg-white rounded-xl shadow-md p-4 flex flex-col max-h-[75vh]">
          <h1 className="text-lg font-semibold mb-3">
            {session ? "Live en cours" : "Passer en live"}
          </h1>
          {!session && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre du live
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Discussion en direct"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm mb-4"
              />
              <button
                onClick={handleStart}
                className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                Démarrer le live
              </button>
            </>
          )}

          {session && (
            <>
              <p className="text-xs text-gray-500 mb-2">
                Session ID : {session._id}
              </p>

              {/* Join requests */}
              <div className="mb-3 border border-gray-100 rounded-lg p-2 bg-gray-50">
                <h2 className="text-xs font-semibold text-gray-700 mb-2">
                  Demandes pour monter
                </h2>
                {joinRequests.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Aucune demande pour le moment.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {joinRequests.slice(0, 5).map((r) => (
                      <li
                        key={r.user?._id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          {r.user?.avatar ? (
                            <img
                              src={
                                r.user.avatar.startsWith("http")
                                  ? r.user.avatar
                                  : `${
                                      process.env.NEXT_PUBLIC_API_URL?.replace(
                                        "/api",
                                        ""
                                      ) || "http://localhost:5000"
                                    }${
                                      r.user.avatar.startsWith("/")
                                        ? r.user.avatar
                                        : "/" + r.user.avatar
                                    }`
                              }
                              alt={r.user?.username}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-medium">
                              {r.user?.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-gray-800">
                            {r.user?.username}
                          </span>
                        </div>

                        {r.status === "pending" ? (
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleApprove(r.user?._id)}
                              className="px-2 py-1 bg-primary-600 text-white rounded-full text-[11px] font-semibold"
                            >
                              Accepter
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(r.user?._id)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-[11px] font-semibold"
                            >
                              Refuser
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500">
                            {r.status === "approved" ? "Accepté" : "Refusé"}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
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
              <form
                onSubmit={handleSendComment}
                className="flex items-center space-x-2 mb-2"
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

              <div className="mb-2 border border-gray-200 rounded-lg p-2">
                <label className="flex items-center space-x-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={publishToFeed}
                    onChange={(e) => setPublishToFeed(e.target.checked)}
                  />
                  <span>Publier dans mon fil après l’arrêt</span>
                </label>
                {publishToFeed && (
                  <input
                    type="text"
                    value={publishContent}
                    onChange={(e) => setPublishContent(e.target.value)}
                    placeholder="Texte du post (optionnel)"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs"
                  />
                )}
              </div>
              <button
                onClick={handleStop}
                className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Arrêter le live
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

