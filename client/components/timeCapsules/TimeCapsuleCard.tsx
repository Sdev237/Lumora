"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { FiClock, FiMapPin, FiUnlock } from "react-icons/fi";
import { getImageUrl } from "@/lib/imageUtils";

interface TimeCapsuleCardProps {
  capsule: any;
}

export default function TimeCapsuleCard({ capsule }: TimeCapsuleCardProps) {
  const unlockDate = new Date(capsule.unlockDate);
  const isUnlocked = capsule.isUnlocked;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {capsule.images && capsule.images.length > 0 && (
        <img
          src={getImageUrl(capsule.images[0])}
          alt="Capsule"
          className="w-full h-48 object-cover"
        />
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <FiClock className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium">
              {isUnlocked
                ? `Déverrouillée le ${format(
                    new Date(capsule.unlockedAt),
                    "PP",
                    { locale: fr }
                  )}`
                : `Déverrouillage: ${format(unlockDate, "PP", { locale: fr })}`}
            </span>
          </div>
          {isUnlocked && <FiUnlock className="w-5 h-5 text-green-500" />}
        </div>

        <p className="text-gray-700 mb-3 line-clamp-3">{capsule.content}</p>

        {capsule.location && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <FiMapPin className="w-4 h-4 mr-1" />
            <span>
              {capsule.location.city ||
                capsule.location.address ||
                "Position partagée"}
            </span>
          </div>
        )}

        {isUnlocked && capsule.unlockedPost && (
          <a
            href={`/posts/${capsule.unlockedPost._id}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Voir le post →
          </a>
        )}
      </div>
    </div>
  );
}
