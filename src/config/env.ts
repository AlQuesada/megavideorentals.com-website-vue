/**
 * Environment configuration for TMDB API
 * 
 * Create a .env file in the project root with:
 * VITE_TMDB_API_KEY=your_api_key_here
 * 
 * Get your API key from https://www.themoviedb.org/settings/api
 */

export const config = {
  tmdb: {
    apiKey: import.meta.env.VITE_TMDB_API_KEY as string || '',
    baseUrl: import.meta.env.VITE_TMDB_BASE_URL as string || 'https://api.themoviedb.org/3',
    imageBase: import.meta.env.VITE_TMDB_IMAGE_BASE as string || 'https://image.tmdb.org/t/p',
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

// Validate required environment variables in development
if (config.isDev && !config.tmdb.apiKey) {
  console.warn(
    '⚠️ TMDB API key not configured. Create a .env file with:\n' +
    'VITE_TMDB_API_KEY=your_api_key_here\n\n' +
    'Get your API key from https://www.themoviedb.org/settings/api'
  );
}

