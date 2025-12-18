<script setup lang="ts">
import { useAudio } from '@/composables/useAudio'

const props = defineProps<{
  cartCount: number
}>()

const emit = defineEmits<{
  (e: 'toggleCart'): void
  (e: 'update:search', value: string): void
}>()

const audio = useAudio()

const handleMuteToggle = () => {
  audio.toggleMute()
}
</script>

<template>
  <header class="header">
    <div class="header-content">
      <div class="logo-section">
        <h1 class="logo">
          <span class="logo-accent">░▒▓</span>
          MEGA VIDEO
          <span class="logo-accent">▓▒░</span>
        </h1>
        <p class="tagline">BE KIND, REWIND!</p>
      </div>
      
      <div class="search-section">
        <input 
          type="text" 
          class="search-input" 
          placeholder="Search movies..."
          autocomplete="off"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        />
      </div>
      
      <div class="header-buttons">
        <button 
          v-if="audio.isEnabled()"
          class="mute-button" 
          :class="{ muted: audio.isMutedRef.value }"
          title="Toggle Music"
          @click="handleMuteToggle"
        >
          <span class="mute-icon">{{ audio.isMutedRef.value ? '🔇' : '🔊' }}</span>
        </button>
        <button class="cart-button" @click="emit('toggleCart')">
          <span class="cart-icon">📼</span>
          <span class="cart-text">RENTALS</span>
          <span class="cart-count">{{ cartCount }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

