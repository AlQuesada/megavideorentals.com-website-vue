<script setup lang="ts">
import { useAudio } from '@/composables/useAudio'
import { useAuth } from '@/composables/useAuth'

defineProps<{
  cartCount: number
}>()

const emit = defineEmits<{
  (e: 'toggleCart'): void
  (e: 'update:search', value: string): void
}>()

const audio = useAudio()
const auth = useAuth()

const handleMuteToggle = () => {
  audio.toggleMute()
}

const handleLogout = () => {
  auth.logout()
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
        <!-- Member Card Display -->
        <div v-if="auth.isLoggedIn.value" class="member-badge">
          <span class="member-icon">🎫</span>
          <div class="member-info">
            <span class="member-name">{{ auth.memberName.value }}</span>
            <span class="member-number">{{ auth.memberNumber.value }}</span>
          </div>
          <button class="logout-btn" title="Log out" @click="handleLogout">
            ✕
          </button>
        </div>
        
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

<style scoped>
.member-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, var(--dark-purple) 0%, var(--vhs-black) 100%);
  border: 2px solid var(--neon-cyan);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.member-icon {
  font-size: 1.2rem;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.member-name {
  font-family: var(--font-retro);
  font-size: 1rem;
  color: var(--neon-yellow);
  text-transform: uppercase;
}

.member-number {
  font-family: var(--font-pixel);
  font-size: 0.4rem;
  color: var(--neon-cyan);
  letter-spacing: 1px;
}

.logout-btn {
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 0.25rem;
}

.logout-btn:hover {
  background: rgba(255, 65, 54, 0.2);
  border-color: #ff4136;
  color: #ff4136;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .member-badge {
    order: 1;
  }
  
  .member-info {
    display: none;
  }
  
  .member-icon {
    font-size: 1.5rem;
  }
  
  .logout-btn {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .member-badge {
    padding: 0.4rem 0.5rem;
  }
}
</style>
