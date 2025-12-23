import type { Movie } from './movie'

/**
 * Member account information
 */
export interface Member {
  id: string
  memberNumber: string  // Format: 'MV-1987-0042'
  name: string
  memberSince: number   // Year they "joined" (1985-1989)
}

/**
 * Review data attached to a cart item
 */
export interface CartReview {
  rating: number  // 1-5 stars
  text: string    // Max 500 characters
}

/**
 * Cart item with optional review
 */
export interface CartItem {
  movie: Movie
  review?: CartReview
}

/**
 * Data structure for submitting rentals to Supabase
 */
export interface RentalSubmission {
  tmdb_movie_id: number
  movie_title: string
  movie_year: number
  movie_poster: string
  rating?: number
  review_text?: string
}

/**
 * Response from submit_rental RPC
 */
export interface RentalResult {
  success: boolean
  rentals_count: number
  reviews_count: number
}

