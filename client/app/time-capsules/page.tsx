"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import TimeCapsuleList from "@/components/timeCapsules/TimeCapsuleList";
import CreateTimeCapsuleForm from "@/components/timeCapsules/CreateTimeCapsuleForm";
import api from "@/lib/api";

export default function TimeCapsulesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [timeCapsules, setTimeCapsules] = useState<any[]>([]);
  const [loadingCapsules, setLoadingCapsules] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchTimeCapsules();
    }
  }, [user, loading]);

  const fetchTimeCapsules = async () => {
    try {
      setLoadingCapsules(true);
      const response = await api.get("/time-capsules/my");
      setTimeCapsules(response.data.timeCapsules);
    } catch (error) {
      console.error("Erreur chargement capsules:", error);
    } finally {
      setLoadingCapsules(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Capsules Temporelles</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            {showCreateForm ? "Annuler" : "Créer une capsule"}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-8">
            <CreateTimeCapsuleForm
              onCreated={() => {
                setShowCreateForm(false);
                fetchTimeCapsules();
              }}
            />
          </div>
        )}

        {loadingCapsules ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <TimeCapsuleList timeCapsules={timeCapsules} />
        )}
      </div>
    </div>
  );
}
