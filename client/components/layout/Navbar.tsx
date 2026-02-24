"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  FiHome,
  FiMap,
  FiUser,
  FiLogOut,
  FiBell,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { onNotification } from "@/lib/socket";

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

    onNotification(() => {
      setUnreadCount((prev) => prev + 1);
    });
  }, [user]);

  const navItems = [
    { href: "/feed", icon: FiHome, label: "Fil d'actualité" },
    { href: "/explore", icon: FiMap, label: "Explorer" },
    { href: `/profile/${user?._id}`, icon: FiUser, label: "Profil" },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}

            <Link
              href="/notifications"
              className="relative flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors"
              onClick={() => setUnreadCount(0)}
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

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
      </div>
    </nav>
  );
}
