<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Movie } from '@/types/movie'
import { getMovieCoverGradient, getPosterUrl } from '@/data/movies'
import { useCart } from '@/composables/useCart'

const props = defineProps<{
  movie: Movie
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const cart = useCart()

// Track if poster failed to load
const posterError = ref(false)

const posterUrl = computed(() => getPosterUrl(props.movie, 'w500'))
const coverGradient = computed(() => getMovieCoverGradient(props.movie))
const isInCart = computed(() => cart.isInCart(props.movie.id))

// Show poster if URL exists and hasn't errored
const showPoster = computed(() => posterUrl.value && !posterError.value)

const buttonText = computed(() => {
  if (!props.movie.available) return 'RENTED OUT'
  return isInCart.value ? 'IN CART ✓' : 'ADD TO CART - $2.99'
})

const buttonClass = computed(() => {
  if (!props.movie.available) return ''
  return isInCart.value ? 'in-cart' : ''
})

const handleCartClick = () => {
  if (!props.movie.available) return
  
  if (isInCart.value) {
    cart.remove(props.movie.id)
  } else {
    cart.add(props.movie)
  }
}

const handleOverlayClick = (e: Event) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

const handlePosterError = () => {
  posterError.value = true
}

// Format TMDB rating if available
const tmdbRatingDisplay = computed(() => {
  if (props.movie.tmdbRating) {
    return `★ ${props.movie.tmdbRating.toFixed(1)}`
  }
  return null
})
</script>

<template>
  <div class="modal-overlay open" @click="handleOverlayClick">
    <div class="modal">
      <button class="modal-close" @click="emit('close')">✕</button>
      <div class="modal-content">
        <div class="tv-frame">
          <div class="tv-screen">
            <div class="modal-cover" :style="{ background: coverGradient }">
              <img 
                v-if="showPoster"
                :src="posterUrl" 
                :alt="movie.title" 
                class="modal-poster"
                @error="handlePosterError"
              />
              <!-- Fallback when no poster -->
              <div v-else class="modal-poster-fallback">
                <span class="fallback-title">{{ movie.title }}</span>
                <span class="fallback-year">{{ movie.year }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-info">
          <h2 class="modal-title">{{ movie.title }}</h2>
          <div class="modal-meta">
            <span>{{ movie.year }}</span>
            <span>•</span>
            <span>{{ movie.rating || 'NR' }}</span>
            <span v-if="movie.runtime">•</span>
            <span v-if="movie.runtime">{{ movie.runtime }}</span>
            <span v-if="tmdbRatingDisplay">•</span>
            <span v-if="tmdbRatingDisplay" class="tmdb-rating">{{ tmdbRatingDisplay }}</span>
          </div>
          <p v-if="movie.tagline" class="modal-tagline">"{{ movie.tagline }}"</p>
          <p v-if="movie.overview" class="modal-overview">{{ movie.overview }}</p>
          <div class="modal-genres">
            <span 
              v-for="genre in movie.genre" 
              :key="genre" 
              class="modal-genre-tag"
            >
              {{ genre }}
            </span>
          </div>
        </div>
        <div class="modal-actions">
          <button 
            class="modal-rent-btn"
            :class="buttonClass"
            :disabled="!movie.available"
            @click="handleCartClick"
          >
            {{ buttonText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-poster-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1rem;
  text-align: center;
}

.fallback-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 0.5rem;
}

.fallback-year {
  font-family: 'VT323', monospace;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.modal-overview {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  color: rgba(15, 14, 14, 0.8);
  line-height: 1.4;
  margin: 0.5rem 0 1rem;
  max-height: 100px;
  overflow-y: auto;
}

.tmdb-rating {
  color: var(--sunset-orange, #ff5100);
}
</style>
