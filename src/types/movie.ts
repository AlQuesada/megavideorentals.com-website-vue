// Application Movie interface (transformed from TMDB data)
export interface Movie {
  id: number;
  title: string;
  year: number;
  genre: string[];
  tagline: string;
  rating: string;        // US certification: PG, R, PG-13, G, NR, NC-17
  runtime: string;
  available: boolean;
  poster: string;        // TMDB poster path (e.g., /abc123.jpg)
  backdrop?: string;     // TMDB backdrop path (e.g., /xyz789.jpg)
  tmdbRating?: number;   // TMDB score (1-10)
  overview?: string;     // Movie description
}

// TMDB API Response Types
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface TMDBMovieDetails extends TMDBMovie {
  tagline: string;
  runtime: number | null;
  genres: TMDBGenre[];
  status: string;
  budget: number;
  revenue: number;
  imdb_id: string | null;
}

export interface TMDBMovieResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBGenreResponse {
  genres: TMDBGenre[];
}

// Release dates for US certification
export interface TMDBReleaseDateResult {
  iso_3166_1: string;
  release_dates: TMDBReleaseDate[];
}

export interface TMDBReleaseDate {
  certification: string;
  descriptors: string[];
  iso_639_1: string;
  note: string;
  release_date: string;
  type: number;
}

export interface TMDBReleaseDatesResponse {
  id: number;
  results: TMDBReleaseDateResult[];
}

// Combined response type when using append_to_response
export interface TMDBMovieDetailsWithReleaseDates extends TMDBMovieDetails {
  release_dates: TMDBReleaseDatesResponse;
}

// Cache entry type for localStorage persistence
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cached movie details with certification
export interface CachedMovieDetails {
  details: TMDBMovieDetails;
  certification: string;
}

// TMDB Genre ID to Name mapping
export const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Reverse mapping: Name to ID
export const GENRE_TO_TMDB_ID: Record<string, number> = Object.fromEntries(
  Object.entries(TMDB_GENRE_MAP).map(([id, name]) => [name, parseInt(id)])
);
