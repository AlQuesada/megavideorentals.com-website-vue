<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Movie } from '@/types/movie'
import VhsCard from './VhsCard.vue'

const props = defineProps<{
  movies: Movie[]
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  (e: 'selectMovie', movie: Movie): void
  (e: 'loadMore'): void
  (e: 'addToCartRequest', movie: Movie): void
}>()

// Infinite scroll with Intersection Observer
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting && props.hasMore && !props.loadingMore && !props.loading) {
        emit('loadMore')
      }
    },
    {
      rootMargin: '200px', // Start loading 200px before reaching the trigger
      threshold: 0.1,
    }
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}

onMounted(() => {
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Manual load more button handler
const handleLoadMore = () => {
  if (props.hasMore && !props.loadingMore) {
    emit('loadMore')
  }
}
</script>

<template>
  <div class="movie-grid-container">
    <!-- Loading State (Initial) -->
    <div v-if="loading && movies.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">LOADING MOVIES...</p>
      <p class="loading-sub">Rewinding the tapes...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && movies.length === 0" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-text">TRACKING ERROR</p>
      <p class="error-sub">{{ error }}</p>
      <p class="error-hint">Check your API key configuration</p>
    </div>

    <!-- Movies Grid -->
    <template v-else>
      <div class="movie-grid">
        <template v-if="movies.length > 0">
          <VhsCard 
            v-for="movie in movies" 
            :key="movie.id" 
            :movie="movie"
            @select="emit('selectMovie', $event)"
            @add-to-cart-request="emit('addToCartRequest', $event)"
          />
        </template>
        <div v-else class="no-movies">
          <div class="no-movies-icon">📼</div>
          <p class="no-movies-text">NO MOVIES FOUND</p>
          <p class="no-movies-sub">Try a different search or genre!</p>
        </div>
      </div>

      <!-- Load More Section -->
      <div 
        v-if="movies.length > 0" 
        ref="loadMoreTrigger" 
        class="load-more-section"
      >
        <!-- Loading More Indicator -->
        <div v-if="loadingMore" class="loading-more">
          <div class="loading-spinner small"></div>
          <span>Loading more movies...</span>
        </div>

        <!-- Load More Button (fallback for manual loading) -->
        <button 
          v-else-if="hasMore"
          class="load-more-btn"
          @click="handleLoadMore"
        >
          LOAD MORE TAPES
        </button>

        <!-- End of Results -->
        <div v-else class="end-of-results">
          <span>— END OF CATALOG —</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.movie-grid-container {
  width: 100%;
}

/* Loading State */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--neon-cyan, #00ffff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border-width: 3px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.error-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: var(--neon-cyan, #00ffff);
  margin-top: 1.5rem;
  text-shadow: 0 0 10px var(--neon-cyan, #00ffff);
}

.loading-sub,
.error-sub {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-hint {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  color: var(--neon-pink, #ff00ff);
  margin-top: 1rem;
}

/* Load More Section */
.load-more-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  min-height: 100px;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: var(--neon-cyan, #00ffff);
}

.load-more-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  padding: 1rem 2rem;
  background: linear-gradient(180deg, #333 0%, #111 100%);
  border: 2px solid var(--neon-cyan, #00ffff);
  color: var(--neon-cyan, #00ffff);
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 0 5px var(--neon-cyan, #00ffff);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.load-more-btn:hover {
  background: linear-gradient(180deg, #444 0%, #222 100%);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  transform: scale(1.05);
}

.load-more-btn:active {
  transform: scale(0.98);
}

.end-of-results {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}
</style>
