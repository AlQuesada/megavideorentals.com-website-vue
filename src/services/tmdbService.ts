import { config } from '@/config/env';
import type {
  Movie,
  TMDBMovie,
  TMDBMovieDetails,
  TMDBMovieResponse,
  TMDBReleaseDatesResponse,
} from '@/types/movie';

const API_KEY = config.tmdb.apiKey;
const BASE_URL = config.tmdb.baseUrl;
const IMAGE_BASE = config.tmdb.imageBase;

// Image sizes available from TMDB
export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original',
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original',
  },
} as const;

// Rate limiting: TMDB allows 40 requests per 10 seconds
const REQUEST_QUEUE: Array<() => Promise<void>> = [];
let isProcessingQueue = false;
const REQUEST_DELAY = 250; // 250ms between requests = 4 requests/second (safe margin)

async function processQueue(): Promise<void> {
  if (isProcessingQueue || REQUEST_QUEUE.length === 0) return;
  
  isProcessingQueue = true;
  
  while (REQUEST_QUEUE.length > 0) {
    const request = REQUEST_QUEUE.shift();
    if (request) {
      await request();
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }
  }
  
  isProcessingQueue = false;
}

function queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    REQUEST_QUEUE.push(async () => {
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processQueue();
  });
}

// Generic fetch wrapper with error handling
async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Queued version of fetchTMDB for rate limiting
function fetchTMDBQueued<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  return queueRequest(() => fetchTMDB<T>(endpoint, params));
}

/**
 * Get poster URL from TMDB path
 */
export function getPosterUrl(posterPath: string | null, size: keyof typeof IMAGE_SIZES.poster = 'medium'): string {
  if (!posterPath) {
    return ''; // Return empty, component should handle fallback
  }
  return `${IMAGE_BASE}/${IMAGE_SIZES.poster[size]}${posterPath}`;
}

/**
 * Get backdrop URL from TMDB path
 */
export function getBackdropUrl(backdropPath: string | null, size: keyof typeof IMAGE_SIZES.backdrop = 'medium'): string {
  if (!backdropPath) {
    return '';
  }
  return `${IMAGE_BASE}/${IMAGE_SIZES.backdrop[size]}${backdropPath}`;
}

/**
 * Discover 1980s movies with pagination
 */
export async function discoverMovies(
  page: number = 1,
  genreId?: number,
  sortBy: string = 'popularity.desc'
): Promise<TMDBMovieResponse> {
  const params: Record<string, string> = {
    page: page.toString(),
    sort_by: sortBy,
    'primary_release_date.gte': '1980-01-01',
    'primary_release_date.lte': '1989-12-31',
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
  };

  if (genreId) {
    params.with_genres = genreId.toString();
  }

  return fetchTMDB<TMDBMovieResponse>('/discover/movie', params);
}

/**
 * Search movies by query (limited to 1980s)
 */
export async function searchMovies(
  query: string,
  page: number = 1
): Promise<TMDBMovieResponse> {
  const params: Record<string, string> = {
    query,
    page: page.toString(),
    include_adult: 'false',
    language: 'en-US',
    'primary_release_year': '', // We'll filter client-side for 1980s
  };

  const response = await fetchTMDB<TMDBMovieResponse>('/search/movie', params);
  
  // Filter results to only include 1980s movies
  response.results = response.results.filter(movie => {
    const year = new Date(movie.release_date).getFullYear();
    return year >= 1980 && year <= 1989;
  });
  
  return response;
}

/**
 * Get movie details including tagline and runtime
 */
export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  return fetchTMDBQueued<TMDBMovieDetails>(`/movie/${movieId}`, {
    language: 'en-US',
  });
}

/**
 * Get US certification for a movie
 */
export async function getMovieCertification(movieId: number): Promise<string> {
  try {
    const response = await fetchTMDBQueued<TMDBReleaseDatesResponse>(
      `/movie/${movieId}/release_dates`
    );
    
    // Find US release
    const usRelease = response.results.find(r => r.iso_3166_1 === 'US');
    if (usRelease && usRelease.release_dates.length > 0) {
      // Get the first certification that's not empty
      const certification = usRelease.release_dates.find(rd => rd.certification)?.certification;
      if (certification) {
        return certification;
      }
    }
    
    return 'NR'; // Not Rated if no US certification found
  } catch {
    return 'NR';
  }
}

/**
 * Batch fetch certifications for multiple movies
 */
export async function batchGetCertifications(movieIds: number[]): Promise<Map<number, string>> {
  const certifications = new Map<number, string>();
  
  // Process in parallel but with rate limiting via queue
  const promises = movieIds.map(async (id) => {
    const cert = await getMovieCertification(id);
    certifications.set(id, cert);
  });
  
  await Promise.all(promises);
  return certifications;
}

/**
 * Convert TMDB genre IDs to genre names
 */
export function mapGenreIds(genreIds: number[], genreMap: Record<number, string>): string[] {
  return genreIds
    .map(id => genreMap[id])
    .filter((name): name is string => name !== undefined);
}

/**
 * Transform TMDB movie to application Movie format
 */
export function transformTMDBMovie(
  tmdbMovie: TMDBMovie,
  genreMap: Record<number, string>,
  certification: string = 'NR',
  details?: TMDBMovieDetails
): Movie {
  const year = tmdbMovie.release_date 
    ? new Date(tmdbMovie.release_date).getFullYear() 
    : 0;
  
  const runtime = details?.runtime 
    ? `${details.runtime} min` 
    : '';
  
  const tagline = details?.tagline || '';

  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title,
    year,
    genre: mapGenreIds(tmdbMovie.genre_ids, genreMap),
    tagline,
    rating: certification,
    runtime,
    available: Math.random() > 0.1, // 90% available (simulated)
    poster: tmdbMovie.poster_path || '',
    tmdbRating: tmdbMovie.vote_average,
    overview: tmdbMovie.overview,
  };
}

/**
 * Fetch and transform movies with all details
 */
export async function fetchMoviesWithDetails(
  page: number = 1,
  genreId?: number,
  genreMap: Record<number, string> = {}
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  // Get discover results
  const response = await discoverMovies(page, genreId);
  
  if (response.results.length === 0) {
    return { movies: [], totalPages: 0, totalResults: 0 };
  }

  // Batch fetch certifications
  const movieIds = response.results.map(m => m.id);
  const certifications = await batchGetCertifications(movieIds);

  // Fetch details for taglines and runtimes (in parallel with rate limiting)
  const detailsPromises = response.results.map(movie => 
    getMovieDetails(movie.id).catch(() => undefined)
  );
  const detailsResults = await Promise.all(detailsPromises);
  const detailsMap = new Map<number, TMDBMovieDetails>();
  detailsResults.forEach((details, index) => {
    const movie = response.results[index];
    if (details && movie) {
      detailsMap.set(movie.id, details);
    }
  });

  // Transform to application format
  const movies = response.results.map(tmdbMovie => 
    transformTMDBMovie(
      tmdbMovie,
      genreMap,
      certifications.get(tmdbMovie.id) || 'NR',
      detailsMap.get(tmdbMovie.id)
    )
  );

  return {
    movies,
    totalPages: response.total_pages,
    totalResults: response.total_results,
  };
}

/**
 * Search and transform movies with details
 */
export async function searchMoviesWithDetails(
  query: string,
  page: number = 1,
  genreMap: Record<number, string> = {}
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  const response = await searchMovies(query, page);
  
  if (response.results.length === 0) {
    return { movies: [], totalPages: 0, totalResults: 0 };
  }

  // Batch fetch certifications
  const movieIds = response.results.map(m => m.id);
  const certifications = await batchGetCertifications(movieIds);

  // Fetch details for taglines and runtimes
  const detailsPromises = response.results.map(movie => 
    getMovieDetails(movie.id).catch(() => undefined)
  );
  const detailsResults = await Promise.all(detailsPromises);
  const detailsMap = new Map<number, TMDBMovieDetails>();
  detailsResults.forEach((details, index) => {
    const movie = response.results[index];
    if (details && movie) {
      detailsMap.set(movie.id, details);
    }
  });

  // Transform to application format
  const movies = response.results.map(tmdbMovie => 
    transformTMDBMovie(
      tmdbMovie,
      genreMap,
      certifications.get(tmdbMovie.id) || 'NR',
      detailsMap.get(tmdbMovie.id)
    )
  );

  return {
    movies,
    totalPages: response.total_pages,
    totalResults: response.total_results,
  };
}

