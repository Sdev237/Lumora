/**
 * Image URL Utilities
 * Helper functions for image URLs
 */

/**
 * Get full image URL
 */
export const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) return "";

  // If already a full URL, return as is
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Build URL relative to backend server
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";
  const path = imagePath.startsWith("/") ? imagePath : "/" + imagePath;

  return `${baseUrl}${path}`;
};

/**
 * Get user avatar URL
 */
export const getAvatarUrl = (avatar: string | undefined | null): string => {
  if (!avatar) return "";
  return getImageUrl(avatar);
};
