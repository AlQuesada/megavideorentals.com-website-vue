<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Movie } from '@/types/movie'
import { getMovieCoverGradient, getPosterUrl } from '@/data/movies'
import { useCart } from '@/composables/useCart'

const props = defineProps<{
  movie: Movie
}>()

const emit = defineEmits<{
  (e: 'select', movie: Movie): void
}>()

const cart = useCart()

// Track if poster failed to load
const posterError = ref(false)

const posterUrl = computed(() => getPosterUrl(props.movie, 'w342'))
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
</script>

<template>
  <div class="vhs-card" @click="emit('select', movie)">
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
          :alt="movie.title" 
          class="vhs-poster"
          loading="lazy"
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
      <div class="vhs-bottom">
        <span class="vhs-rating">{{ movie.rating || 'NR' }}</span>
        <span class="vhs-runtime">{{ movie.runtime || '-- min' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Show overlay text more prominently when no poster */
.vhs-cover-overlay.no-poster {
  opacity: 1;
  background: transparent;
}
</style>
