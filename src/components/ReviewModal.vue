<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Movie } from '@/types/movie'
import type { CartReview } from '@/types/member'
import { getPosterUrl, getMovieCoverGradient } from '@/data/movies'

const props = defineProps<{
  movie: Movie
}>()

const emit = defineEmits<{
  (e: 'submit', review: CartReview | null): void
  (e: 'close'): void
}>()

const rating = ref(0)
const reviewText = ref('')
const hoveredStar = ref(0)

const maxChars = 500
const charCount = computed(() => reviewText.value.length)
const charsRemaining = computed(() => maxChars - charCount.value)

const posterUrl = computed(() => getPosterUrl(props.movie, 'w185'))
const coverGradient = computed(() => getMovieCoverGradient(props.movie))

const ratingLabels = ['', 'AWFUL', 'MEH', 'GOOD', 'GREAT', 'RADICAL!']

const handleStarClick = (star: number) => {
  // Toggle off if clicking same star
  rating.value = rating.value === star ? 0 : star
}

const handleStarHover = (star: number) => {
  hoveredStar.value = star
}

const handleStarLeave = () => {
  hoveredStar.value = 0
}

const handleSubmit = () => {
  if (rating.value > 0) {
    emit('submit', {
      rating: rating.value,
      text: reviewText.value.trim()
    })
  } else {
    // No rating = skip review
    emit('submit', null)
  }
}

const handleSkip = () => {
  emit('submit', null)
}

const handleOverlayClick = (e: Event) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <div class="modal-overlay open" @click="handleOverlayClick">
    <div class="review-modal">
      <button class="modal-close" @click="emit('close')">✕</button>
      
      <div class="review-header">
        <div class="review-movie-info">
          <div class="review-poster" :style="{ background: coverGradient }">
            <img v-if="posterUrl" :src="posterUrl" :alt="movie.title" />
          </div>
          <div class="review-movie-details">
            <h2>{{ movie.title }}</h2>
            <span class="review-year">{{ movie.year }}</span>
          </div>
        </div>
        <div class="review-prompt">
          <span class="prompt-icon">📼</span>
          <span class="prompt-text">SEEN THIS ONE?</span>
        </div>
      </div>

      <div class="review-content">
        <div class="star-rating">
          <span class="rating-label">YOUR RATING:</span>
          <div class="stars">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="star-btn"
              :class="{ 
                'filled': star <= (hoveredStar || rating),
                'hovered': star <= hoveredStar
              }"
              @click="handleStarClick(star)"
              @mouseenter="handleStarHover(star)"
              @mouseleave="handleStarLeave"
            >
              ★
            </button>
          </div>
          <span class="rating-text" v-if="rating > 0">
            {{ ratingLabels[rating] }}
          </span>
        </div>

        <div class="review-text-section">
          <label class="review-label">QUICK REVIEW (OPTIONAL):</label>
          <textarea
            v-model="reviewText"
            :maxlength="maxChars"
            placeholder="What did you think? No spoilers!"
            class="review-textarea"
          ></textarea>
          <div class="char-counter" :class="{ 'warning': charsRemaining < 50 }">
            {{ charsRemaining }} CHARS LEFT
          </div>
        </div>
      </div>

      <div class="review-actions">
        <button type="button" class="skip-btn" @click="handleSkip">
          SKIP
        </button>
        <button type="button" class="submit-btn" @click="handleSubmit">
          ADD TO CART
          <span v-if="rating > 0" class="submit-note">WITH REVIEW</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-modal {
  position: relative;
  width: 90%;
  max-width: 480px;
  background: var(--vhs-black);
  border: 4px solid var(--neon-pink);
  box-shadow: 
    0 0 0 4px var(--vhs-gray),
    0 0 60px rgba(255, 0, 255, 0.4);
  transform: scale(1);
}

.review-header {
  background: linear-gradient(90deg, var(--hot-pink) 0%, var(--purple-haze) 100%);
  padding: 1.5rem;
}

.review-movie-info {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.review-poster {
  width: 60px;
  height: 90px;
  border: 2px solid rgba(255,255,255,0.3);
  overflow: hidden;
  flex-shrink: 0;
}

.review-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-movie-details h2 {
  font-family: var(--font-pixel);
  font-size: 0.7rem;
  color: white;
  margin-bottom: 0.25rem;
  line-height: 1.4;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
}

.review-year {
  font-family: var(--font-retro);
  font-size: 1.2rem;
  color: var(--neon-yellow);
}

.review-prompt {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.prompt-icon {
  font-size: 1.5rem;
}

.prompt-text {
  font-family: var(--font-pixel);
  font-size: 0.6rem;
  color: white;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
}

.review-content {
  padding: 1.5rem;
  background: var(--tape-label);
}

.star-rating {
  text-align: center;
  margin-bottom: 1.5rem;
}

.rating-label {
  display: block;
  font-family: var(--font-pixel);
  font-size: 0.5rem;
  color: #333;
  margin-bottom: 0.75rem;
}

.stars {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.star-btn {
  font-size: 2.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #ddd;
  transition: all 0.15s ease;
  text-shadow: 1px 1px 0 #999;
  padding: 0;
  line-height: 1;
}

.star-btn.filled {
  color: var(--sunset-orange);
  text-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
}

.star-btn.hovered {
  transform: scale(1.2);
}

.star-btn:hover {
  transform: scale(1.2);
}

.rating-text {
  font-family: var(--font-pixel);
  font-size: 0.5rem;
  color: var(--hot-pink);
  min-height: 1.2em;
}

.review-text-section {
  margin-top: 1rem;
}

.review-label {
  display: block;
  font-family: var(--font-pixel);
  font-size: 0.45rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.review-textarea {
  width: 100%;
  height: 100px;
  padding: 0.75rem;
  font-family: var(--font-retro);
  font-size: 1.2rem;
  background: white;
  border: 2px solid #333;
  resize: none;
  color: #333;
}

.review-textarea:focus {
  outline: none;
  border-color: var(--neon-pink);
}

.review-textarea::placeholder {
  color: #999;
}

.char-counter {
  text-align: right;
  font-family: var(--font-retro);
  font-size: 1rem;
  color: #666;
  margin-top: 0.25rem;
}

.char-counter.warning {
  color: var(--hot-pink);
}

.review-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--vhs-gray);
}

.skip-btn {
  flex: 0 0 auto;
  padding: 1rem 1.5rem;
  font-family: var(--font-pixel);
  font-size: 0.5rem;
  background: transparent;
  border: 2px solid rgba(255,255,255,0.5);
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.skip-btn:hover {
  border-color: white;
  color: white;
}

.submit-btn {
  flex: 1;
  padding: 1rem;
  font-family: var(--font-pixel);
  font-size: 0.5rem;
  background: var(--neon-pink);
  border: 3px solid white;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:hover {
  background: var(--hot-pink);
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
}

.submit-note {
  display: block;
  font-size: 0.4rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .review-modal {
    width: 95%;
  }
  
  .review-header {
    padding: 1rem;
  }
  
  .review-poster {
    width: 50px;
    height: 75px;
  }
  
  .review-movie-details h2 {
    font-size: 0.55rem;
  }
  
  .prompt-text {
    font-size: 0.5rem;
  }
  
  .review-content {
    padding: 1rem;
  }
  
  .star-btn {
    font-size: 2rem;
  }
  
  .review-textarea {
    height: 80px;
    font-size: 1rem;
  }
  
  .review-actions {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }
  
  .skip-btn {
    padding: 0.75rem 1rem;
    font-size: 0.45rem;
  }
  
  .submit-btn {
    padding: 0.75rem;
    font-size: 0.45rem;
  }
}
</style>

