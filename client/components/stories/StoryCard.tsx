"use client";

import { useState } from "react";
import { getAvatarUrl } from "@/lib/imageUtils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";

interface StoryCardProps {
  author: any;
  stories: any[];
}

export default function StoryCard({ author, stories }: StoryCardProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const currentStory = stories[currentStoryIndex];

  if (!currentStory) return null;

  const timeRemaining = formatDistanceToNow(new Date(currentStory.expiresAt), {
    addSuffix: false,
    locale: fr,
  });

  return (
    <div className="flex-shrink-0 w-20 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 p-1">
          <img
            src={getAvatarUrl(author.avatar)}
            alt={author.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        {stories.length > 1 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {stories.length}
          </div>
        )}
      </div>
      <p className="text-xs mt-2 truncate">{author.username}</p>
      <p className="text-xs text-gray-500">{timeRemaining}</p>
    </div>
  );
}
