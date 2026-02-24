"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { FiImage, FiMapPin, FiX } from "react-icons/fi";

interface CreateStoryFormProps {
  onCreated?: () => void;
}

export default function CreateStoryForm({ onCreated }: CreateStoryFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
          });
        },
        () => {
          toast.error("Impossible d'obtenir votre position");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast.error("Une image est requise");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", image);
      if (content) formData.append("content", content);
      if (location) {
        formData.append("location", JSON.stringify(location));
      }

      await api.post("/stories", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Story créée avec succès!");
      setContent("");
      setImage(null);
      setImagePreview("");
      setLocation(null);

      if (onCreated) {
        onCreated();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la création de la story"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ajoutez une légende..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={3}
          maxLength={500}
        />

        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setImagePreview("");
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center space-x-4">
          <label className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
            <FiImage className="w-5 h-5" />
            <span className="text-sm">Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleLocationClick}
            className={`flex items-center space-x-2 transition-colors ${
              location
                ? "text-primary-600"
                : "text-gray-600 hover:text-primary-600"
            }`}
          >
            <FiMapPin className="w-5 h-5" />
            <span className="text-sm">Position</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !image}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Publication..." : "Publier la story"}
        </button>
      </form>
    </div>
  );
}
