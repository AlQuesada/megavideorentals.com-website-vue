<script setup lang="ts">
defineProps<{
  movieCount: number
  totalPrice: string
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
          <div class="checkout-details">
            <div class="checkout-count">{{ movieCount }} MOVIE{{ movieCount > 1 ? 'S' : '' }}</div>
            <div class="checkout-total">TOTAL: ${{ totalPrice }}</div>
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

