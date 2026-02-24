"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import TimeCapsuleCard from "./TimeCapsuleCard";

interface TimeCapsuleListProps {
  timeCapsules: any[];
}

export default function TimeCapsuleList({
  timeCapsules,
}: TimeCapsuleListProps) {
  if (timeCapsules.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune capsule temporelle</p>
      </div>
    );
  }

  const pending = timeCapsules.filter((tc) => !tc.isUnlocked);
  const unlocked = timeCapsules.filter((tc) => tc.isUnlocked);

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">En attente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((capsule) => (
              <TimeCapsuleCard key={capsule._id} capsule={capsule} />
            ))}
          </div>
        </div>
      )}

      {unlocked.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Déverrouillées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlocked.map((capsule) => (
              <TimeCapsuleCard key={capsule._id} capsule={capsule} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
