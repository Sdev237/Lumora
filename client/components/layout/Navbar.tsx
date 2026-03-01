"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  FiHome,
  FiSearch,
  FiPlusSquare,
  FiMessageCircle,
  FiUser,
  FiLogOut,
  FiBell,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getSocket, onNotification } from "@/lib/socket";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const response = await api.get("/notifications", {
          params: { page: 1, limit: 1 },
        });
        setUnreadCount(response.data.unreadCount || 0);
      } catch {
        // ignore
      }
    };

    fetchUnread();

    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };


  const navItems = [
    { href: "/feed", icon: FiHome, label: "Accueil" },
    { href: "/explore", icon: FiSearch, label: "Rechercher" },
    { href: "/create-post", icon: FiPlusSquare, label: "Créer" },
    { href: "/chat", icon: FiMessageCircle, label: "Messages" },
    { href: "/notifications", icon: FiBell, label: "Notifications" },
    { href: `/profile/${user?._id}`, icon: FiUser, label: "Profil" },
  ];

  return (
    <nav className="bg-white shadow-md fixed bottom-0 inset-x-0 z-50 md:sticky md:top-0 md:bottom-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hidden md:flex justify-between items-center h-16">
          <Link href="/feed" className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">Lumora</span>
          </Link>

          <div className="flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href.includes("/profile") &&
                  pathname?.includes("/profile"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (item.href === "/notifications") {
                      setUnreadCount(0);
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{item.label}</span>
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span className="hidden md:inline">Déconnexion</span>
            </button>

            {user?.avatar ? (
              <Link href={`/profile/${user._id}`}>
                <img
                  src={
                    user.avatar.startsWith("http")
                      ? user.avatar
                      : `${
                          process.env.NEXT_PUBLIC_API_URL?.replace(
                            "/api",
                            ""
                          ) || "http://localhost:5000"
                        }${
                          user.avatar.startsWith("/")
                            ? user.avatar
                            : "/" + user.avatar
                        }`
                  }
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Bottom navigation - mobile first */}
        <div className="flex md:hidden items-center justify-between h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href.includes("/profile") && pathname?.includes("/profile"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 ${
                  isActive ? "text-primary-600" : "text-gray-500"
                }`}
                onClick={() => {
                  if (item.href === "/notifications") {
                    setUnreadCount(0);
                  }
                }}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-0.5">{item.label}</span>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute top-1 right-6 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
