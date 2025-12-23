<script setup lang="ts">
import type { CartItem } from '@/types/member'
import { getMovieCoverGradient, getPosterUrl } from '@/data/movies'

defineProps<{
  open: boolean
  items: CartItem[]
  total: string
  reviewCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'remove', movieId: number): void
  (e: 'checkout'): void
}>()

// Generate star display for a rating
const getStarDisplay = (rating: number): string => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
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
          v-for="item in items" 
          :key="item.movie.id" 
          class="cart-item"
        >
          <div 
            class="cart-item-cover" 
            :style="{ background: getMovieCoverGradient(item.movie) }"
          >
            <img 
              :src="getPosterUrl(item.movie, 'w185')" 
              :alt="item.movie.title" 
              class="cart-item-poster"
              loading="lazy"
              decoding="async"
              width="185"
              height="278"
            />
          </div>
          <div class="cart-item-info">
            <div class="cart-item-title">{{ item.movie.title }}</div>
            <div class="cart-item-year">{{ item.movie.year }}</div>
            <div class="cart-item-price">$2.99</div>
            <!-- Review indicator -->
            <div v-if="item.review && item.review.rating > 0" class="cart-item-review">
              <span class="review-stars">{{ getStarDisplay(item.review.rating) }}</span>
            </div>
          </div>
          <button 
            class="cart-item-remove" 
            @click="emit('remove', item.movie.id)"
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
      <p v-if="reviewCount > 0" class="review-count">
        {{ reviewCount }} review{{ reviewCount > 1 ? 's' : '' }} ready to submit
      </p>
      <button class="checkout-btn" :disabled="items.length === 0" @click="emit('checkout')">
        RENT NOW!
      </button>
    </div>
  </aside>
</template>

<style scoped>
.cart-item-review {
  margin-top: 0.25rem;
}

.review-stars {
  font-size: 0.8rem;
  color: var(--sunset-orange, #ff6b35);
  letter-spacing: 1px;
}

.review-count {
  font-family: var(--font-retro);
  font-size: 0.9rem;
  color: var(--neon-yellow);
  margin-bottom: 0.5rem;
  text-align: center;
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
