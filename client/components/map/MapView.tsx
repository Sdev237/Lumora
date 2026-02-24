"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/imageUtils";

interface MapViewProps {
  posts: any[];
  activeUsers?: any[];
  loading: boolean;
}

export default function MapView({
  posts,
  activeUsers = [],
  loading,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Charger Leaflet côté client uniquement (évite les erreurs SSR)
    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Corriger l'icône par défaut de Leaflet (problème de chemin avec Next.js)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Créer la carte avec OpenStreetMap
      const map = L.map(mapContainer.current).setView([48.8566, 2.3522], 2); // [lat, lng] Paris par défaut

      // Tuiles OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapLoaded(true);

      // Centrer sur la position de l'utilisateur si disponible
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 10);
          },
          () => {}
        );
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || loading) return;

    const L = require("leaflet");

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Marqueurs pour les posts
    posts.forEach((post) => {
      if (post.location && post.location.coordinates) {
        const [lng, lat] = post.location.coordinates;

        const imageUrl =
          post.images && post.images.length > 0
            ? getImageUrl(post.images[0])
            : "";

        const popupContent = `
          <div class="p-2" style="min-width: 200px;">
            <p class="font-semibold text-sm mb-1">${post.author.username}</p>
            <p class="text-xs text-gray-600 mb-2">${post.content.substring(
              0,
              50
            )}${post.content.length > 50 ? "..." : ""}</p>
            ${
              imageUrl
                ? `<img src="${imageUrl}" class="w-full h-24 object-cover rounded mt-2" />`
                : ""
            }
            ${
              post.location.placeName
                ? `<p class="text-xs text-gray-500 mt-2">📍 ${post.location.placeName}</p>`
                : ""
            }
          </div>
        `;

        const markerIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:32px;height:32px;border-radius:50%;background:#0ea5e9;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([lat, lng], { icon: markerIcon })
          .addTo(mapRef.current!)
          .bindPopup(popupContent);

        markersRef.current.push(marker);
      }
    });

    // Marqueurs pour les utilisateurs actifs
    activeUsers.forEach((activeUser) => {
      if (
        activeUser.currentLocation &&
        activeUser.currentLocation.coordinates &&
        activeUser.currentLocation.isSharing
      ) {
        const [lng, lat] = activeUser.currentLocation.coordinates;

        const avatarUrl = getImageUrl(activeUser.avatar);

        const popupContent = `
          <div class="p-2" style="min-width: 150px;">
            <div class="flex items-center space-x-2">
              ${
                avatarUrl
                  ? `<img src="${avatarUrl}" class="w-8 h-8 rounded-full" />`
                  : ""
              }
              <p class="font-semibold text-sm">${activeUser.username}</p>
            </div>
            <p class="text-xs text-green-600 mt-1">📍 En ligne</p>
            ${
              activeUser.currentLocation.city
                ? `<p class="text-xs text-gray-500 mt-1">${activeUser.currentLocation.city}</p>`
                : ""
            }
          </div>
        `;

        const userIcon = L.divIcon({
          className: "custom-marker-user",
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#10b981;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon: userIcon })
          .addTo(mapRef.current!)
          .bindPopup(popupContent);

        markersRef.current.push(marker);
      }
    });
  }, [posts, activeUsers, mapLoaded, loading]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full" />;
}
