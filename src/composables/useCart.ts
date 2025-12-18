import { ref, computed } from 'vue'
import type { Movie } from '@/types/movie'

// Shared state - reactive across all components
const items = ref<Movie[]>([])

export function useCart() {
  const add = (movie: Movie): boolean => {
    if (items.value.find(m => m.id === movie.id)) return false
    items.value.push(movie)
    return true
  }

  const remove = (movieId: number): void => {
    items.value = items.value.filter(m => m.id !== movieId)
  }

  const clear = (): void => {
    items.value = []
  }

  const isInCart = (movieId: number): boolean => {
    return items.value.some(m => m.id === movieId)
  }

  const count = computed(() => items.value.length)

  const totalPrice = computed(() => (items.value.length * 2.99).toFixed(2))

  return {
    items,
    add,
    remove,
    clear,
    isInCart,
    count,
    totalPrice
  }
}

