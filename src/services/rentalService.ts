import { supabase, isSupabaseConfigured } from './supabaseClient'
import type { CartItem, RentalSubmission, RentalResult } from '@/types/member'

/**
 * Submit rentals and reviews to Supabase
 * @param memberId - The authenticated member's UUID
 * @param cartItems - Array of cart items with optional reviews
 * @returns Result with counts of rentals and reviews submitted
 */
export async function submitRentals(
  memberId: string,
  cartItems: CartItem[]
): Promise<RentalResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  // Transform cart items to rental submissions
  const movies: RentalSubmission[] = cartItems.map(item => ({
    tmdb_movie_id: item.movie.id,
    movie_title: item.movie.title,
    movie_year: item.movie.year,
    movie_poster: item.movie.poster,
    rating: item.review?.rating,
    review_text: item.review?.text
  }))

  const { data, error } = await supabase.rpc('submit_rental', {
    p_member_id: memberId,
    p_movies: movies
  })

  if (error) {
    console.error('Failed to submit rentals:', error)
    throw new Error(error.message || 'Failed to submit rentals')
  }

  // The RPC returns an array with one row
  const result = Array.isArray(data) ? data[0] : data

  return {
    success: result?.success ?? false,
    rentals_count: result?.rentals_count ?? 0,
    reviews_count: result?.reviews_count ?? 0
  }
}

