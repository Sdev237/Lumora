"use client";

import { FiMapPin, FiTrendingUp, FiClock, FiTag } from "react-icons/fi";

interface ExploreFiltersProps {
  filters: {
    location: string;
    popularity: string;
    interests: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function ExploreFilters({
  filters,
  onFiltersChange,
}: ExploreFiltersProps) {
  const handleChange = (field: string, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Filtres</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FiMapPin className="w-4 h-4 mr-2" />
            Localisation
          </label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="Ville..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Popularity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FiTrendingUp className="w-4 h-4 mr-2" />
            Popularité
          </label>
          <select
            value={filters.popularity}
            onChange={(e) => handleChange("popularity", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="recent">Récent</option>
            <option value="trending">Tendance</option>
            <option value="popular">Populaire</option>
          </select>
        </div>

        {/* Interests Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FiTag className="w-4 h-4 mr-2" />
            Intérêts
          </label>
          <input
            type="text"
            value={filters.interests}
            onChange={(e) => handleChange("interests", e.target.value)}
            placeholder="aventure, culture, nature..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
