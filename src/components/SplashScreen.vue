<script setup lang="ts">
defineEmits<{
  (e: 'dismiss'): void
}>()
</script>

<template>
  <div class="splash-overlay" @click="$emit('dismiss')">
    <div class="splash-content">
      <div class="splash-logo">
        <span class="splash-accent">░▒▓</span>
        MEGA VIDEO
        <span class="splash-accent">▓▒░</span>
      </div>
      <div class="splash-tagline">YOUR AWESOME 80s VIDEO RENTAL STORE</div>
      <div class="splash-vhs">📼</div>
      <button class="splash-start" @click.stop="$emit('dismiss')">
        <span class="splash-blink">▶ PRESS START ◀</span>
      </button>
      <p class="splash-hint">Click anywhere or press any key</p>
    </div>
  </div>
</template>

