/**
 * Environment configuration for TMDB API and Supabase
 * 
 * Create a .env file in the project root with:
 * VITE_TMDB_API_KEY=your_api_key_here
 * VITE_SUPABASE_URL=your_supabase_project_url
 * VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
 * 
 * Get your TMDB API key from https://www.themoviedb.org/settings/api
 * Get your Supabase credentials from https://supabase.com/dashboard/project/_/settings/api
 */

export const config = {
  tmdb: {
    apiKey: import.meta.env.VITE_TMDB_API_KEY as string || '',
    baseUrl: import.meta.env.VITE_TMDB_BASE_URL as string || 'https://api.themoviedb.org/3',
    imageBase: import.meta.env.VITE_TMDB_IMAGE_BASE as string || 'https://image.tmdb.org/t/p',
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string || '',
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

if (config.isDev && (!config.supabase.url || !config.supabase.anonKey)) {
  console.warn(
    '⚠️ Supabase not configured. Add to your .env file:\n' +
    'VITE_SUPABASE_URL=your_supabase_project_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n' +
    'Get your credentials from https://supabase.com/dashboard/project/_/settings/api'
  );
}
