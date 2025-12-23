import { ref, computed } from 'vue'
import type { Movie } from '@/types/movie'
import type { CartItem, CartReview } from '@/types/member'

// Shared state - reactive across all components
const items = ref<CartItem[]>([])

export function useCart() {
  /**
   * Add a movie to the cart with an optional review
   */
  const add = (movie: Movie, review?: CartReview): boolean => {
    if (items.value.find(item => item.movie.id === movie.id)) return false
    items.value.push({ movie, review })
    return true
  }

  /**
   * Remove a movie from the cart
   */
  const remove = (movieId: number): void => {
    items.value = items.value.filter(item => item.movie.id !== movieId)
  }

  /**
   * Update or add a review for a movie already in the cart
   */
  const updateReview = (movieId: number, review: CartReview): void => {
    const item = items.value.find(item => item.movie.id === movieId)
    if (item) {
      item.review = review
    }
  }

  /**
   * Get the review for a specific movie in the cart
   */
  const getReview = (movieId: number): CartReview | undefined => {
    return items.value.find(item => item.movie.id === movieId)?.review
  }

  /**
   * Check if a movie has a review attached
   */
  const hasReview = (movieId: number): boolean => {
    const review = getReview(movieId)
    return Boolean(review && review.rating > 0)
  }

  /**
   * Clear all items from the cart
   */
  const clear = (): void => {
    items.value = []
  }

  /**
   * Check if a movie is in the cart
   */
  const isInCart = (movieId: number): boolean => {
    return items.value.some(item => item.movie.id === movieId)
  }

  /**
   * Total number of items in cart
   */
  const count = computed(() => items.value.length)

  /**
   * Number of items with reviews
   */
  const reviewCount = computed(() => 
    items.value.filter(item => item.review && item.review.rating > 0).length
  )

  /**
   * Total price formatted as string
   */
  const totalPrice = computed(() => (items.value.length * 2.99).toFixed(2))

  /**
   * Get just the movies array (backward compatibility)
   * @deprecated Use items.value instead for full cart item data
   */
  const movies = computed(() => items.value.map(item => item.movie))

  return {
    items,
    movies, // backward compatible
    add,
    remove,
    updateReview,
    getReview,
    hasReview,
    clear,
    isInCart,
    count,
    reviewCount,
    totalPrice
  }
}
