"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { FiImage, FiMapPin, FiX, FiCalendar } from "react-icons/fi";

interface CreateTimeCapsuleFormProps {
  onCreated?: () => void;
}

export default function CreateTimeCapsuleForm({
  onCreated,
}: CreateTimeCapsuleFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [unlockDate, setUnlockDate] = useState("");
  const [tags, setTags] = useState("");
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

    if (!content.trim() && images.length === 0) {
      toast.error("Le contenu ou une image est requis");
      return;
    }

    if (!unlockDate) {
      toast.error("La date de déverrouillage est requise");
      return;
    }

    if (new Date(unlockDate) <= new Date()) {
      toast.error("La date de déverrouillage doit être dans le futur");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("unlockDate", unlockDate);

      if (location) {
        formData.append("location", JSON.stringify(location));
      }

      if (tags) {
        formData.append("tags", tags);
      }

      images.forEach((image) => {
        formData.append("images", image);
      });

      await api.post("/time-capsules", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Capsule temporelle créée avec succès!");
      setContent("");
      setImages([]);
      setImagePreviews([]);
      setLocation(null);
      setUnlockDate("");
      setTags("");

      if (onCreated) {
        onCreated();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la création"
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
          placeholder="Message pour le futur..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={4}
          maxLength={2000}
        />

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FiCalendar className="w-4 h-4 mr-2" />
            Date de déverrouillage
          </label>
          <input
            type="datetime-local"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
            <FiImage className="w-5 h-5" />
            <span className="text-sm">Photos</span>
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

        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (séparés par des virgules)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Création..." : "Créer la capsule"}
        </button>
      </form>
    </div>
  );
}
