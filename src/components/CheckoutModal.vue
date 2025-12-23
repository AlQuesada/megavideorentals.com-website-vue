<script setup lang="ts">
defineProps<{
  movieCount: number
  totalPrice: string
  reviewCount: number
  memberNumber: string
  memberName: string
}>()

const emit = defineEmits<{
  (e: 'done'): void
}>()

const handleOverlayClick = (e: Event) => {
  if (e.target === e.currentTarget) {
    emit('done')
  }
}
</script>

<template>
  <div class="modal-overlay open" @click="handleOverlayClick">
    <div class="modal">
      <div class="modal-content">
        <div class="checkout-success">
          <div class="checkout-icon">📼</div>
          <h2 class="checkout-title">THANKS FOR RENTING!</h2>
          
          <!-- Member Card Display -->
          <div v-if="memberNumber" class="checkout-member">
            <span class="member-label">MEMBER:</span>
            <span class="member-name">{{ memberName }}</span>
            <span class="member-card">{{ memberNumber }}</span>
          </div>
          
          <div class="checkout-details">
            <div class="checkout-count">{{ movieCount }} MOVIE{{ movieCount > 1 ? 'S' : '' }}</div>
            <div class="checkout-total">TOTAL: ${{ totalPrice }}</div>
            <div v-if="reviewCount > 0" class="checkout-reviews">
              {{ reviewCount }} REVIEW{{ reviewCount > 1 ? 'S' : '' }} SUBMITTED ★
            </div>
          </div>
          <div class="checkout-receipt">
            <p class="checkout-due">DUE BACK: <span>MONDAY</span></p>
            <p class="checkout-late">Late fee: $1.00/day</p>
          </div>
          <div class="checkout-tagline">BE KIND, REWIND! 📼</div>
          <button class="checkout-done-btn" @click="emit('done')">GOT IT!</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-member {
  background: linear-gradient(135deg, var(--dark-purple) 0%, var(--vhs-black) 100%);
  border: 2px solid var(--neon-cyan);
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  text-align: center;
}

.member-label {
  display: block;
  font-family: var(--font-pixel);
  font-size: 0.35rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.25rem;
}

.member-name {
  display: block;
  font-family: var(--font-retro);
  font-size: 1.3rem;
  color: var(--neon-yellow);
  text-transform: uppercase;
}

.member-card {
  display: block;
  font-family: var(--font-pixel);
  font-size: 0.5rem;
  color: var(--neon-cyan);
  text-shadow: var(--glow-cyan);
  letter-spacing: 1px;
  margin-top: 0.25rem;
}

.checkout-reviews {
  font-family: var(--font-pixel);
  font-size: 0.5rem;
  color: var(--sunset-orange);
  margin-top: 0.5rem;
}
</style>
