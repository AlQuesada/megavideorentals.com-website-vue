import { ref, computed } from 'vue';
import type { Movie } from '@/types/movie';
import { TMDB_GENRE_MAP, GENRE_TO_TMDB_ID } from '@/types/movie';
import {
  fetchMoviesWithDetails,
  searchMoviesWithDetails,
} from '@/services/tmdbService';

// Cache for fetched movies by page and genre
const movieCache = new Map<string, Movie[]>();

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

  // Generate cache key
  function getCacheKey(page: number, genre: string, query: string): string {
    return `${page}-${genre}-${query}`;
  }

  // Fetch movies (discover or search)
  async function fetchMovies(page: number = 1, append: boolean = false): Promise<void> {
    const isSearch = searchQuery.value.trim().length > 0;
    const genreId = currentGenre.value !== 'All' 
      ? GENRE_TO_TMDB_ID[currentGenre.value] 
      : undefined;

    // Check cache
    const cacheKey = getCacheKey(page, currentGenre.value, searchQuery.value);
    const cached = movieCache.get(cacheKey);
    
    if (cached && !append) {
      movies.value = cached;
      return;
    }

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
        result = await searchMoviesWithDetails(
          searchQuery.value,
          page,
          TMDB_GENRE_MAP
        );
      } else {
        result = await fetchMoviesWithDetails(
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

      // Cache results
      movieCache.set(cacheKey, append ? movies.value : result.movies);
      
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

  // Clear cache (useful for forcing refresh)
  function clearCache(): void {
    movieCache.clear();
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

