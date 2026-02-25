"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import api from "@/lib/api";
import {
  joinChatRoom,
  leaveChatRoom,
  onChatMessage,
  emitChatTyping,
  emitChatStopTyping,
  getSocket,
} from "@/lib/socket";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (user) {
      fetchConversations();
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handler = (data: any) => {
      if (data.conversationId === activeId) {
        setMessages((prev) => [...prev, data.message]);
      }
      fetchConversations();
    };

    onChatMessage(handler);

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off("chat:message", handler);
      }
    };
  }, [activeId]);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.data.conversations || []);
      if (!activeId && res.data.conversations?.length) {
        setActive(res.data.conversations[0]._id);
      }
    } catch {
      // ignore
    }
  };

  const setActive = async (id: string) => {
    if (activeId) {
      leaveChatRoom(activeId);
    }
    setActiveId(id);
    joinChatRoom(id);
    await fetchMessages(id);
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(res.data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !messageInput.trim()) return;

    try {
      const res = await api.post(
        `/chat/conversations/${activeId}/messages`,
        {
          content: messageInput.trim(),
        }
      );
      setMessages((prev) => [...prev, res.data.message]);
      setMessageInput("");
    } catch {
      // ignore for now
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
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversations list */}
        <aside className="bg-white rounded-lg shadow-md overflow-hidden md:col-span-1">
          <div className="px-4 py-3 border-b border-gray-200">
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {conversations.length === 0 && (
              <p className="text-sm text-gray-500 p-4">
                Aucun message pour le moment.
              </p>
            )}
            {conversations.map((conv) => {
              const other =
                conv.participants.find((p: any) => p._id !== user._id) ||
                conv.participants[0];
              return (
                <button
                  key={conv._id}
                  onClick={() => setActive(conv._id)}
                  className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 ${
                    activeId === conv._id ? "bg-primary-50" : ""
                  }`}
                >
                  {other?.avatar ? (
                    <img
                      src={
                        other.avatar.startsWith("http")
                          ? other.avatar
                          : `${
                              process.env.NEXT_PUBLIC_API_URL?.replace(
                                "/api",
                                ""
                              ) || "http://localhost:5000"
                            }${
                              other.avatar.startsWith("/")
                                ? other.avatar
                                : "/" + other.avatar
                            }`
                      }
                      alt={other.username}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium mr-3">
                      {other?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {other?.firstName && other?.lastName
                        ? `${other.firstName} ${other.lastName}`
                        : other?.username}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-xs text-gray-500 truncate">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Messages window */}
        <section className="bg-white rounded-lg shadow-md overflow-hidden md:col-span-2 flex flex-col max-h-[70vh]">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Sélectionnez une conversation pour commencer à discuter.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingMessages ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">
                    Aucun message pour le moment.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m._id}
                      className={`flex ${
                        m.sender._id === user._id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${
                          m.sender._id === user._id
                            ? "bg-primary-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        <p>{m.content}</p>
                        <p className="mt-1 text-[10px] opacity-75 text-right">
                          {formatDistanceToNow(new Date(m.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="border-t border-gray-200 p-3 flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    if (activeId) {
                      emitChatTyping(activeId, user._id);
                    }
                  }}
                  onBlur={() => {
                    if (activeId) {
                      emitChatStopTyping(activeId, user._id);
                    }
                  }}
                  placeholder="Envoyer un message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium disabled:opacity-50"
                >
                  Envoyer
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

