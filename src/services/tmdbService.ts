import { config } from '@/config/env';
import type {
  Movie,
  TMDBMovie,
  TMDBMovieDetails,
  TMDBMovieResponse,
  TMDBMovieDetailsWithReleaseDates,
  CacheEntry,
  CachedMovieDetails,
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

// =============================================================================
// CACHING LAYER - localStorage with 24h TTL
// =============================================================================

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_PREFIX = 'tmdb_cache_';

// In-memory cache for current session (faster than localStorage lookups)
const memoryCache = new Map<string, CacheEntry<unknown>>();

function getCacheKey(type: string, id: string | number): string {
  return `${CACHE_PREFIX}${type}_${id}`;
}

function getFromCache<T>(key: string): T | null {
  // Check memory cache first
  const memCached = memoryCache.get(key);
  if (memCached && Date.now() - memCached.timestamp < CACHE_TTL) {
    return memCached.data as T;
  }

  // Fall back to localStorage
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const entry: CacheEntry<T> = JSON.parse(cached);
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        // Populate memory cache
        memoryCache.set(key, entry);
        return entry.data;
      }
      // Expired, remove from localStorage
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage not available or parse error
  }
  return null;
}

function saveToCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  
  // Always save to memory cache
  memoryCache.set(key, entry as CacheEntry<unknown>);
  
  // Try to save to localStorage
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or not available - memory cache still works
  }
}

/**
 * Clear all TMDB caches
 */
export function clearCache(): void {
  memoryCache.clear();
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch {
    // localStorage not available
  }
}

// =============================================================================
// RATE LIMITING - Optimized with parallel batching
// =============================================================================

const REQUEST_DELAY = 100; // Reduced from 250ms - 10 requests/second
const BATCH_SIZE = 5; // Process 5 concurrent requests per batch
const BATCH_DELAY = 300; // Delay between batches

// Simple queue for individual requests
const REQUEST_QUEUE: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

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

/**
 * Batch fetch helper - processes items in parallel batches
 */
export async function batchFetch<TItem, TResult>(
  items: TItem[],
  fetchFn: (item: TItem) => Promise<TResult>,
  batchSize: number = BATCH_SIZE
): Promise<Map<TItem, TResult>> {
  const results = new Map<TItem, TResult>();
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          const result = await fetchFn(item);
          return [item, result] as const;
        } catch {
          return null;
        }
      })
    );
    
    batchResults.forEach(result => {
      if (result) {
        results.set(result[0], result[1]);
      }
    });
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }
  
  return results;
}

// =============================================================================
// CORE API FUNCTIONS
// =============================================================================

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
 * Extract US certification from release dates response
 */
function extractUSCertification(releaseDates?: { results: Array<{ iso_3166_1: string; release_dates: Array<{ certification: string }> }> }): string {
  if (!releaseDates?.results) return 'NR';
  
  const usRelease = releaseDates.results.find(r => r.iso_3166_1 === 'US');
  if (usRelease && usRelease.release_dates.length > 0) {
    const certification = usRelease.release_dates.find(rd => rd.certification)?.certification;
    if (certification) {
      return certification;
    }
  }
  
  return 'NR';
}

/**
 * Get movie details with certification using append_to_response (single API call)
 * This combines what was previously 2 separate API calls into 1
 */
export async function getMovieDetailsWithCertification(movieId: number): Promise<CachedMovieDetails> {
  const cacheKey = getCacheKey('movie_details', movieId);
  
  // Check cache first
  const cached = getFromCache<CachedMovieDetails>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch with append_to_response to get both details and release_dates in one call
  const response = await fetchTMDBQueued<TMDBMovieDetailsWithReleaseDates>(
    `/movie/${movieId}`,
    {
      append_to_response: 'release_dates',
      language: 'en-US',
    }
  );
  
  const certification = extractUSCertification(response.release_dates);
  
  // Remove release_dates from details to match TMDBMovieDetails type
  const { release_dates: _, ...details } = response;
  
  const result: CachedMovieDetails = {
    details: details as TMDBMovieDetails,
    certification,
  };
  
  // Save to cache
  saveToCache(cacheKey, result);
  
  return result;
}

/**
 * Prefetch movie details (fire and forget, for hover states)
 */
export function prefetchMovieDetails(movieId: number): void {
  const cacheKey = getCacheKey('movie_details', movieId);
  
  // Skip if already cached
  if (getFromCache<CachedMovieDetails>(cacheKey)) {
    return;
  }
  
  // Fire and forget - don't await
  getMovieDetailsWithCertification(movieId).catch(() => {
    // Silently ignore prefetch errors
  });
}

/**
 * Get movie details including tagline and runtime (legacy - now uses combined fetch)
 */
export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  const { details } = await getMovieDetailsWithCertification(movieId);
  return details;
}

/**
 * Get US certification for a movie (legacy - now uses combined fetch)
 */
export async function getMovieCertification(movieId: number): Promise<string> {
  try {
    const { certification } = await getMovieDetailsWithCertification(movieId);
    return certification;
  } catch {
    return 'NR';
  }
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
 * Fetch movies with BASIC info only (fast initial load - no extra API calls)
 * Details are loaded lazily when modal opens
 */
export async function fetchMoviesBasic(
  page: number = 1,
  genreId?: number,
  genreMap: Record<number, string> = {}
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  // Check page cache first
  const cacheKey = getCacheKey('discover_page', `${page}_${genreId || 'all'}`);
  const cached = getFromCache<{ movies: Movie[]; totalPages: number; totalResults: number }>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get discover results - only 1 API call!
  const response = await discoverMovies(page, genreId);
  
  if (response.results.length === 0) {
    return { movies: [], totalPages: 0, totalResults: 0 };
  }

  // Transform to application format WITHOUT details (fast)
  const movies = response.results.map(tmdbMovie => 
    transformTMDBMovie(tmdbMovie, genreMap)
  );

  const result = {
    movies,
    totalPages: response.total_pages,
    totalResults: response.total_results,
  };

  // Cache the results
  saveToCache(cacheKey, result);

  return result;
}

/**
 * Search movies with BASIC info only (fast initial load)
 */
export async function searchMoviesBasic(
  query: string,
  page: number = 1,
  genreMap: Record<number, string> = {}
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  // Check cache first
  const cacheKey = getCacheKey('search_page', `${query}_${page}`);
  const cached = getFromCache<{ movies: Movie[]; totalPages: number; totalResults: number }>(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await searchMovies(query, page);
  
  if (response.results.length === 0) {
    return { movies: [], totalPages: 0, totalResults: 0 };
  }

  // Transform without details (fast)
  const movies = response.results.map(tmdbMovie => 
    transformTMDBMovie(tmdbMovie, genreMap)
  );

  const result = {
    movies,
    totalPages: response.total_pages,
    totalResults: response.total_results,
  };

  // Cache results
  saveToCache(cacheKey, result);

  return result;
}

/**
 * Enrich a single movie with full details (called on modal open)
 */
export async function enrichMovieWithDetails(
  movie: Movie,
  genreMap: Record<number, string> = {}
): Promise<Movie> {
  try {
    const { details, certification } = await getMovieDetailsWithCertification(movie.id);
    
    return {
      ...movie,
      tagline: details.tagline || movie.tagline,
      runtime: details.runtime ? `${details.runtime} min` : movie.runtime,
      rating: certification,
      genre: details.genres?.length > 0 
        ? details.genres.map(g => g.name) 
        : movie.genre,
    };
  } catch {
    return movie; // Return original if fetch fails
  }
}

/**
 * Prefetch next page of results (fire and forget)
 */
export function prefetchNextPage(
  currentPage: number,
  totalPages: number,
  genreId?: number,
  searchQuery?: string,
  genreMap: Record<number, string> = {}
): void {
  if (currentPage >= totalPages) return;
  
  const nextPage = currentPage + 1;
  
  // Fire and forget
  if (searchQuery) {
    searchMoviesBasic(searchQuery, nextPage, genreMap).catch(() => {});
  } else {
    fetchMoviesBasic(nextPage, genreId, genreMap).catch(() => {});
  }
}

/**
 * Fetch and transform movies with all details (legacy - kept for compatibility)
 * NOTE: For better performance, use fetchMoviesBasic + enrichMovieWithDetails
 */
export async function fetchMoviesWithDetails(
  page: number = 1,
  genreId?: number,
  genreMap: Record<number, string> = {}
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  // Get basic movies first
  const result = await fetchMoviesBasic(page, genreId, genreMap);
  
  if (result.movies.length === 0) {
    return result;
  }

  // Batch fetch details using optimized combined endpoint
  const enrichedMovies = await batchFetch(
    result.movies,
    async (movie) => enrichMovieWithDetails(movie, genreMap)
  );

  // Replace with enriched versions
  const movies = result.movies.map(movie => 
    enrichedMovies.get(movie) || movie
  );

  return {
    movies,
    totalPages: result.totalPages,
    totalResults: result.totalResults,
  };
}

/**
 * Search and transform movies with details (legacy - kept for compatibility)
 * NOTE: For better performance, use searchMoviesBasic + enrichMovieWithDetails
 */
export async function searchMoviesWithDetails(
  query: string,
  page: number = 1,
  genreMap: Record<number, string> = {}
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  // Get basic movies first
  const result = await searchMoviesBasic(query, page, genreMap);
  
  if (result.movies.length === 0) {
    return result;
  }

  // Batch fetch details using optimized combined endpoint
  const enrichedMovies = await batchFetch(
    result.movies,
    async (movie) => enrichMovieWithDetails(movie, genreMap)
  );

  // Replace with enriched versions
  const movies = result.movies.map(movie => 
    enrichedMovies.get(movie) || movie
  );

  return {
    movies,
    totalPages: result.totalPages,
    totalResults: result.totalResults,
  };
}

