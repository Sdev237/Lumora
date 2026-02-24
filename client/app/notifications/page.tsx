"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";

interface Notification {
  _id: string;
  type: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  post?: {
    _id: string;
    content: string;
    images: string[];
  };
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchNotifications();
      markAllAsRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await api.get("/notifications", {
        params: { page: 1, limit: 50 },
      });
      setNotifications(response.data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read");
    } catch {
      // ignore
    }
  };

  const renderMessage = (notification: Notification) => {
    if (notification.message) return notification.message;

    switch (notification.type) {
      case "follow":
        return "vous suit maintenant";
      case "like":
        return "a aimé votre publication";
      case "comment":
        return "a commenté votre publication";
      default:
        return "Nouvelle activité";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>

        {loadingNotifications ? (
          <p className="text-center text-gray-500 py-8">Chargement...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Vous n&apos;avez pas encore de notifications.
          </p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notification) => {
              const sender = notification.sender;
              const senderName =
                sender?.firstName && sender?.lastName
                  ? `${sender.firstName} ${sender.lastName}`
                  : sender?.username;

              const avatarSrc =
                sender?.avatar && !sender.avatar.startsWith("http")
                  ? `${
                      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                      "http://localhost:5000"
                    }${
                      sender.avatar.startsWith("/")
                        ? sender.avatar
                        : "/" + sender.avatar
                    }`
                  : sender?.avatar;

              return (
                <li
                  key={notification._id}
                  className={`flex items-start space-x-3 rounded-lg px-3 py-2 ${
                    notification.isRead ? "bg-white" : "bg-primary-50"
                  }`}
                >
                  {sender ? (
                    <Link
                      href={`/profile/${sender._id}`}
                      className="flex-shrink-0 mt-1"
                    >
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={sender.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                          {sender.username
                            ? sender.username.charAt(0).toUpperCase()
                            : "L"}
                        </div>
                      )}
                    </Link>
                  ) : (
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      {senderName ? (
                        <>
                          <Link
                            href={`/profile/${sender?._id}`}
                            className="font-semibold hover:underline"
                          >
                            {senderName}
                          </Link>{" "}
                          {renderMessage(notification)}
                        </>
                      ) : (
                        renderMessage(notification)
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

