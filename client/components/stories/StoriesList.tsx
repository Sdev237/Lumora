"use client";

import { useState } from "react";
import StoryCard from "./StoryCard";
import CreateStoryForm from "./CreateStoryForm";
import { FiPlus } from "react-icons/fi";

interface StoriesListProps {
  stories: any[];
  onStoryCreated?: () => void;
}

export default function StoriesList({
  stories,
  onStoryCreated,
}: StoriesListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (stories.length === 0 && !showCreateForm) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Aucune story disponible</p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Créer une story
        </button>
        {showCreateForm && (
          <div className="mt-6">
            <CreateStoryForm
              onCreated={() => {
                setShowCreateForm(false);
                if (onStoryCreated) onStoryCreated();
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6 overflow-x-auto pb-4">
        {/* Create Story Button */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white hover:from-primary-500 hover:to-primary-700 transition-all"
        >
          <FiPlus className="w-8 h-8" />
        </button>

        {/* Stories */}
        {stories.map((storyGroup: any) => (
          <StoryCard
            key={storyGroup.author._id}
            author={storyGroup.author}
            stories={storyGroup.stories}
          />
        ))}
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <CreateStoryForm
            onCreated={() => {
              setShowCreateForm(false);
              if (onStoryCreated) onStoryCreated();
            }}
          />
        </div>
      )}
    </div>
  );
}
