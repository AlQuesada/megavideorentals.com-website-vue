<script setup lang="ts">
import type { Movie } from '@/types/movie'
import { getMovieCoverGradient, getPosterUrl } from '@/data/movies'

defineProps<{
  open: boolean
  items: Movie[]
  total: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'remove', movieId: number): void
  (e: 'checkout'): void
}>()
</script>

<template>
  <aside class="cart-sidebar" :class="{ open }">
    <div class="cart-header">
      <h2>YOUR RENTALS</h2>
      <button class="cart-close" @click="emit('close')">✕</button>
    </div>
    <div class="cart-items">
      <template v-if="items.length > 0">
        <div 
          v-for="movie in items" 
          :key="movie.id" 
          class="cart-item"
        >
          <div 
            class="cart-item-cover" 
            :style="{ background: getMovieCoverGradient(movie) }"
          >
            <img 
              :src="getPosterUrl(movie, 'w185')" 
              :alt="movie.title" 
              class="cart-item-poster"
              loading="lazy"
              decoding="async"
              width="185"
              height="278"
            />
          </div>
          <div class="cart-item-info">
            <div class="cart-item-title">{{ movie.title }}</div>
            <div class="cart-item-year">{{ movie.year }}</div>
            <div class="cart-item-price">$2.99</div>
          </div>
          <button 
            class="cart-item-remove" 
            @click="emit('remove', movie.id)"
          >
            ✕
          </button>
        </div>
      </template>
      <div v-else class="cart-empty">
        <div class="cart-empty-icon">📼</div>
        <p class="cart-empty-text">Your cart is empty!</p>
        <p class="cart-empty-text">Add some movies to rent!</p>
      </div>
    </div>
    <div class="cart-footer">
      <div class="cart-total">
        <span>WEEKEND TOTAL:</span>
        <span class="total-price">${{ total }}</span>
      </div>
      <p class="rental-terms">$2.99 per tape • Due back Monday!</p>
      <button class="checkout-btn" @click="emit('checkout')">
        RENT NOW!
      </button>
    </div>
  </aside>
</template>

