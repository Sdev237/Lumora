"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { FiImage, FiMapPin, FiX } from "react-icons/fi";

interface PostFormProps {
  onPostCreated?: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    lng: number;
    lat: number;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setImages(files);

      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lng: position.coords.longitude,
            lat: position.coords.latitude,
            address: "",
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
    if (!content.trim() && images.length === 0) {
      toast.error("Veuillez ajouter du contenu ou une image");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content);

      if (location) {
        formData.append("location", `${location.lng},${location.lat}`);
        formData.append("address", location.address);
      }

      images.forEach((image) => {
        formData.append("images", image);
      });

      await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Post créé avec succès!");
      setContent("");
      setImages([]);
      setImagePreviews([]);
      setLocation(null);

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la création du post"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium flex-shrink-0">
            {user?.username?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partagez votre voyage..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={2000}
            />

            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {location && (
              <div className="mt-2 flex items-center text-sm text-primary-600">
                <FiMapPin className="w-4 h-4 mr-1" />
                <span>Position ajoutée</span>
                <button
                  type="button"
                  onClick={() => setLocation(null)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
                  <FiImage className="w-5 h-5" />
                  <span className="text-sm">Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
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
                disabled={loading || (!content.trim() && images.length === 0)}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Publication..." : "Publier"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
