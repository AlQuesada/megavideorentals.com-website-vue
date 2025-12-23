<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Movie } from '@/types/movie'
import { getMovieCoverGradient, getPosterUrl, getPosterSrcSet, getBackdropUrl } from '@/data/movies'
import { useCart } from '@/composables/useCart'
import { useMoviesStore } from '@/composables/useMovies'

const props = defineProps<{
  movie: Movie
}>()

const emit = defineEmits<{
  (e: 'select', movie: Movie): void
}>()

const cart = useCart()
const moviesStore = useMoviesStore()

// Track if poster failed to load and loaded state for fade-in
const posterError = ref(false)
const posterLoaded = ref(false)

const posterUrl = computed(() => getPosterUrl(props.movie, 'w342'))
const posterSrcSet = computed(() => getPosterSrcSet(props.movie))
const coverGradient = computed(() => getMovieCoverGradient(props.movie))
const isInCart = computed(() => cart.isInCart(props.movie.id))

// Show poster if URL exists and hasn't errored
const showPoster = computed(() => posterUrl.value && !posterError.value)

const buttonText = computed(() => {
  if (!props.movie.available) return 'RENTED OUT'
  return isInCart.value ? 'IN CART ✓' : 'ADD TO CART'
})

const buttonClass = computed(() => {
  if (!props.movie.available) return ''
  return isInCart.value ? 'in-cart' : ''
})

const handleCartClick = (e: Event) => {
  e.stopPropagation()
  if (!props.movie.available) return
  
  if (isInCart.value) {
    cart.remove(props.movie.id)
  } else {
    cart.add(props.movie)
  }
}

const handlePosterError = () => {
  posterError.value = true
}

const handlePosterLoad = () => {
  posterLoaded.value = true
}

// Prefetch movie details and preload modal images on hover
const handleMouseEnter = () => {
  moviesStore.onMovieHover(props.movie.id)
  // Preload modal images for instant modal opening
  const preload = (src: string) => {
    if (!src) return
    const img = new Image()
    img.src = src
  }
  preload(getBackdropUrl(props.movie, 'w780'))
  preload(getPosterUrl(props.movie, 'w342'))
}
</script>

<template>
  <div class="vhs-card" @click="emit('select', movie)" @mouseenter="handleMouseEnter">
    <div class="vhs-tape">
      <div class="vhs-spine"></div>
      <span 
        class="rental-status" 
        :class="movie.available ? 'available' : 'rented'"
      >
        {{ movie.available ? 'IN STOCK' : 'RENTED' }}
      </span>
      <div class="vhs-cover" :style="{ background: coverGradient }">
        <img 
          v-if="showPoster"
          :src="posterUrl"
          :srcset="posterSrcSet"
          sizes="(max-width: 480px) 185px, 342px"
          :alt="movie.title" 
          class="vhs-poster"
          :class="{ 'loaded': posterLoaded }"
          loading="lazy"
          decoding="async"
          width="342"
          height="513"
          @load="handlePosterLoad"
          @error="handlePosterError"
        />
        <div class="vhs-cover-overlay" :class="{ 'no-poster': !showPoster }">
          <h3 class="vhs-title">{{ movie.title }}</h3>
          <div class="vhs-year">{{ movie.year }}</div>
          <div class="vhs-genre">{{ movie.genre[0] || 'Unknown' }}</div>
        </div>
      </div>
      <button 
        class="add-to-cart-btn"
        :class="buttonClass"
        :disabled="!movie.available"
        @click="handleCartClick"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Show overlay text more prominently when no poster */
.vhs-cover-overlay.no-poster {
  opacity: 1;
  background: transparent;
}

/* Fade-in transition for poster images */
.vhs-poster {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.vhs-poster.loaded {
  opacity: 1;
}
</style>
