import type { Movie } from '@/types/movie';

// TMDB image base URL
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Available genres for filtering
export const genres = [
  "All",
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Drama",
  "Family",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi"
];

// Generate a deterministic color based on movie ID and genre (used as fallback)
export function getMovieCoverGradient(movie: Movie): string {
  const colorSchemes: Record<string, [string, string]> = {
    "Action": ["#ff4136", "#ff851b"],
    "Adventure": ["#2ecc40", "#01ff70"],
    "Animation": ["#ff69b4", "#ffd700"],
    "Comedy": ["#ffdc00", "#ff851b"],
    "Drama": ["#b10dc9", "#85144b"],
    "Family": ["#7fdbff", "#39cccc"],
    "Fantasy": ["#9b59b6", "#3498db"],
    "Horror": ["#111", "#8b0000"],
    "Mystery": ["#2c3e50", "#9b59b6"],
    "Romance": ["#ff69b4", "#ff1493"],
    "Sci-Fi": ["#00ffff", "#0074d9"]
  };
  
  const primaryGenre = movie.genre[0] || "Drama";
  const colors = colorSchemes[primaryGenre] || ["#666", "#999"];
  
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
}

// Get poster URL from TMDB path
export function getPosterUrl(movie: Movie, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'): string {
  if (!movie.poster) {
    return ''; // Return empty, component should handle fallback with gradient
  }
  return `${TMDB_IMAGE_BASE}/${size}${movie.poster}`;
}

// Get backdrop URL from TMDB path
export function getBackdropUrl(movie: Movie, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w780'): string {
  if (!movie.backdrop) {
    return ''; // Return empty, component should handle fallback with gradient
  }
  return `${TMDB_IMAGE_BASE}/${size}${movie.backdrop}`;
}

// Get poster srcset for responsive images
export function getPosterSrcSet(movie: Movie): string {
  if (!movie.poster) return '';
  return `${TMDB_IMAGE_BASE}/w185${movie.poster} 185w, ${TMDB_IMAGE_BASE}/w342${movie.poster} 342w, ${TMDB_IMAGE_BASE}/w500${movie.poster} 500w`;
}

// Get backdrop srcset for responsive images
export function getBackdropSrcSet(movie: Movie): string {
  if (!movie.backdrop) return '';
  return `${TMDB_IMAGE_BASE}/w300${movie.backdrop} 300w, ${TMDB_IMAGE_BASE}/w780${movie.backdrop} 780w, ${TMDB_IMAGE_BASE}/w1280${movie.backdrop} 1280w`;
}