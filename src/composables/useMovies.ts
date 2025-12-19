import { ref, computed } from 'vue';
import type { Movie } from '@/types/movie';
import { TMDB_GENRE_MAP, GENRE_TO_TMDB_ID } from '@/types/movie';
import {
  fetchMoviesBasic,
  searchMoviesBasic,
  enrichMovieWithDetails,
  prefetchNextPage,
  prefetchMovieDetails,
  clearCache as clearTMDBCache,
} from '@/services/tmdbService';

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function useMovies() {
  // State
  const movies = ref<Movie[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const loadingDetails = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const totalPages = ref(0);
  const totalResults = ref(0);
  const currentGenre = ref('All');
  const searchQuery = ref('');

  // Computed
  const hasMore = computed(() => currentPage.value < totalPages.value);
  
  const filteredMovies = computed(() => {
    // Client-side genre filtering when searching (TMDB search doesn't filter by genre)
    if (searchQuery.value && currentGenre.value !== 'All') {
      return movies.value.filter(movie => 
        movie.genre.includes(currentGenre.value)
      );
    }
    return movies.value;
  });

  // Get current genre ID
  function getCurrentGenreId(): number | undefined {
    return currentGenre.value !== 'All' 
      ? GENRE_TO_TMDB_ID[currentGenre.value] 
      : undefined;
  }

  // Fetch movies with BASIC info (fast - single API call)
  async function fetchMovies(page: number = 1, append: boolean = false): Promise<void> {
    const isSearch = searchQuery.value.trim().length > 0;
    const genreId = getCurrentGenreId();

    // Set loading state
    if (append) {
      loadingMore.value = true;
    } else {
      loading.value = true;
      error.value = null;
    }

    try {
      let result;
      
      if (isSearch) {
        result = await searchMoviesBasic(
          searchQuery.value,
          page,
          TMDB_GENRE_MAP
        );
      } else {
        result = await fetchMoviesBasic(
          page,
          genreId,
          TMDB_GENRE_MAP
        );
      }

      // Update state
      if (append) {
        movies.value = [...movies.value, ...result.movies];
      } else {
        movies.value = result.movies;
      }
      
      totalPages.value = result.totalPages;
      totalResults.value = result.totalResults;
      currentPage.value = page;

      // Prefetch next page in background for instant pagination
      if (result.totalPages > page) {
        prefetchNextPage(
          page,
          result.totalPages,
          genreId,
          isSearch ? searchQuery.value : undefined,
          TMDB_GENRE_MAP
        );
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch movies';
      console.error('Error fetching movies:', err);
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  }

  // Load more movies (pagination)
  async function loadMore(): Promise<void> {
    if (loadingMore.value || !hasMore.value) return;
    await fetchMovies(currentPage.value + 1, true);
  }

  // Reset and fetch
  async function resetAndFetch(): Promise<void> {
    currentPage.value = 1;
    movies.value = [];
    await fetchMovies(1, false);
  }

  // Set genre filter
  function setGenre(genre: string): void {
    if (currentGenre.value === genre) return;
    currentGenre.value = genre;
    resetAndFetch();
  }

  // Set search query (debounced)
  const debouncedSearch = debounce((query: string) => {
    searchQuery.value = query;
    resetAndFetch();
  }, 300);

  function setSearchQuery(query: string): void {
    debouncedSearch(query);
  }

  // Clear search
  function clearSearch(): void {
    searchQuery.value = '';
    resetAndFetch();
  }

  // ==========================================================================
  // LAZY LOADING: Get full movie details on demand (e.g., when modal opens)
  // ==========================================================================

  /**
   * Get enriched movie with full details (tagline, runtime, certification)
   * Called when user opens a movie modal
   */
  async function getMovieWithDetails(movieId: number): Promise<Movie | null> {
    const movie = movies.value.find(m => m.id === movieId);
    if (!movie) return null;

    // If already has details (runtime is set), return immediately
    if (movie.runtime && movie.runtime !== '') {
      return movie;
    }

    loadingDetails.value = true;
    try {
      const enrichedMovie = await enrichMovieWithDetails(movie);
      
      // Update the movie in our list
      const index = movies.value.findIndex(m => m.id === movieId);
      if (index !== -1) {
        movies.value[index] = enrichedMovie;
      }
      
      return enrichedMovie;
    } catch (err) {
      console.error('Error fetching movie details:', err);
      return movie; // Return basic movie on error
    } finally {
      loadingDetails.value = false;
    }
  }

  /**
   * Prefetch movie details on hover (fire and forget)
   * Makes modal open feel instant
   */
  function onMovieHover(movieId: number): void {
    prefetchMovieDetails(movieId);
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * Clear all caches (composable + service layer)
   */
  function clearCache(): void {
    clearTMDBCache();
  }

  // Initialize - fetch first page
  async function init(): Promise<void> {
    await fetchMovies(1, false);
  }

  return {
    // State (readonly)
    movies: filteredMovies,
    allMovies: movies,
    loading,
    loadingMore,
    loadingDetails,
    error,
    currentPage,
    totalPages,
    totalResults,
    hasMore,
    currentGenre,
    searchQuery,
    
    // Actions
    init,
    loadMore,
    setGenre,
    setSearchQuery,
    clearSearch,
    clearCache,
    refresh: resetAndFetch,
    
    // Lazy loading actions
    getMovieWithDetails,
    onMovieHover,
  };
}

// Singleton instance for shared state across components
let moviesInstance: ReturnType<typeof useMovies> | null = null;

export function useMoviesStore() {
  if (!moviesInstance) {
    moviesInstance = useMovies();
  }
  return moviesInstance;
}
