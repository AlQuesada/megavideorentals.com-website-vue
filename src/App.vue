<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { genres } from '@/data/movies'
import type { Movie } from '@/types/movie'
import type { CartReview } from '@/types/member'
import { useCart } from '@/composables/useCart'
import { useAudio } from '@/composables/useAudio'
import { useMoviesStore } from '@/composables/useMovies'
import { useAuth } from '@/composables/useAuth'
import { submitRentals } from '@/services/rentalService'
import { isSupabaseConfigured } from '@/services/supabaseClient'

import SplashScreen from '@/components/SplashScreen.vue'
import AppHeader from '@/components/AppHeader.vue'
import GenreFilter from '@/components/GenreFilter.vue'
import MovieGrid from '@/components/MovieGrid.vue'
import CartSidebar from '@/components/CartSidebar.vue'
import MovieModal from '@/components/MovieModal.vue'
import ReviewModal from '@/components/ReviewModal.vue'
import MemberLoginModal from '@/components/MemberLoginModal.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import AppFooter from '@/components/AppFooter.vue'

const cart = useCart()
const audio = useAudio()
const moviesStore = useMoviesStore()
const auth = useAuth()

// State
const showSplash = ref(true)
const cartOpen = ref(false)
const selectedMovie = ref<Movie | null>(null)
const showCheckout = ref(false)
const checkoutData = ref({ count: 0, total: '0.00', reviewCount: 0 })

// Review Modal State
const showReviewModal = ref(false)
const movieForReview = ref<Movie | null>(null)

// Login Modal State
const showLoginModal = ref(false)
const pendingCheckout = ref(false)

// Methods
const dismissSplash = () => {
  showSplash.value = false
  audio.init()
  audio.play()
  // Initialize movies fetch when splash is dismissed
  moviesStore.init()
}

const openMovie = async (movie: Movie) => {
  // Set the movie immediately (shows basic info right away)
  selectedMovie.value = movie
  audio.pause()
  document.body.style.overflow = 'hidden'
  
  // Fetch full details in background (lazy loading)
  const enrichedMovie = await moviesStore.getMovieWithDetails(movie.id)
  if (enrichedMovie && selectedMovie.value?.id === movie.id) {
    // Update with enriched details if modal is still showing this movie
    selectedMovie.value = enrichedMovie
  }
}

const closeModal = () => {
  selectedMovie.value = null
  document.body.style.overflow = ''
  if (!cartOpen.value && !showReviewModal.value) {
    audio.play()
  }
}

const toggleCart = () => {
  cartOpen.value = !cartOpen.value
  if (cartOpen.value) {
    audio.pause()
  } else if (!selectedMovie.value && !showReviewModal.value) {
    audio.play()
  }
}

// Handle add-to-cart request - show review modal
const handleAddToCartRequest = (movie: Movie) => {
  movieForReview.value = movie
  showReviewModal.value = true
  // Close movie modal if open
  if (selectedMovie.value) {
    selectedMovie.value = null
  }
  audio.pause()
  document.body.style.overflow = 'hidden'
}

// Handle review submission
const handleReviewSubmit = (review: CartReview | null) => {
  if (movieForReview.value) {
    cart.add(movieForReview.value, review || undefined)
  }
  closeReviewModal()
}

const closeReviewModal = () => {
  showReviewModal.value = false
  movieForReview.value = null
  document.body.style.overflow = ''
  if (!cartOpen.value) {
    audio.play()
  }
}

// Handle checkout request
const handleCheckout = async () => {
  if (cart.count.value === 0) return
  
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    // Skip authentication if Supabase not configured (demo mode)
    console.warn('Supabase not configured - running in demo mode')
    completeCheckout()
    return
  }
  
  // If not logged in, show login modal first
  if (!auth.isLoggedIn.value) {
    pendingCheckout.value = true
    showLoginModal.value = true
    audio.pause()
    return
  }
  
  // Already logged in, proceed to submit
  await submitAndShowCheckout()
}

// Called after successful login
const handleLoginSuccess = async () => {
  showLoginModal.value = false
  
  if (pendingCheckout.value) {
    pendingCheckout.value = false
    await submitAndShowCheckout()
  }
}

const closeLoginModal = () => {
  showLoginModal.value = false
  pendingCheckout.value = false
  if (!cartOpen.value) {
    audio.play()
  }
}

// Submit rentals to Supabase and show checkout
const submitAndShowCheckout = async () => {
  try {
    // Submit to Supabase
    const result = await submitRentals(auth.memberId.value, cart.items.value)
    console.log('Rental submitted:', result)
  } catch (error) {
    console.error('Failed to submit rental:', error)
    // Continue to checkout anyway (could show error toast in future)
  }
  
  completeCheckout()
}

// Complete checkout (show success modal)
const completeCheckout = () => {
  checkoutData.value = {
    count: cart.count.value,
    total: cart.totalPrice.value,
    reviewCount: cart.reviewCount.value
  }
  showCheckout.value = true
  audio.pause()
}

const handleCheckoutDone = () => {
  cart.clear()
  showCheckout.value = false
  cartOpen.value = false
  document.body.style.overflow = ''
  audio.play()
}

// Genre filter handler
const handleGenreChange = (genre: string) => {
  moviesStore.setGenre(genre)
}

// Search handler
const handleSearch = (query: string) => {
  moviesStore.setSearchQuery(query)
}

// Keyboard event handler
const handleKeydown = (e: KeyboardEvent) => {
  // Dismiss splash on any key
  if (showSplash.value) {
    dismissSplash()
    return
  }
  
  // Escape key to close modals (in priority order)
  if (e.key === 'Escape') {
    if (showCheckout.value) {
      handleCheckoutDone()
    } else if (showLoginModal.value) {
      closeLoginModal()
    } else if (showReviewModal.value) {
      closeReviewModal()
    } else if (selectedMovie.value) {
      closeModal()
    } else if (cartOpen.value) {
      toggleCart()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // Restore auth session from localStorage
  auth.restoreSession()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- Splash Screen -->
  <SplashScreen v-if="showSplash" @dismiss="dismissSplash" />
  
  <!-- CRT Scanline Overlay -->
  <div class="crt-overlay"></div>
  
  <!-- VHS Tracking Lines -->
  <div class="vhs-tracking"></div>

  <div id="app">
    <!-- Header -->
    <AppHeader 
      :cart-count="cart.count.value"
      @toggle-cart="toggleCart"
      @update:search="handleSearch"
    />
    
    <!-- Genre Filter Bar -->
    <GenreFilter 
      :genres="genres"
      :selected="moviesStore.currentGenre.value"
      @update:selected="handleGenreChange"
    />
    
    <!-- Main Content -->
    <main class="main-content">
      <MovieGrid 
        :movies="moviesStore.movies.value"
        :loading="moviesStore.loading.value"
        :loading-more="moviesStore.loadingMore.value"
        :has-more="moviesStore.hasMore.value"
        :error="moviesStore.error.value"
        @select-movie="openMovie"
        @load-more="moviesStore.loadMore"
        @add-to-cart-request="handleAddToCartRequest"
      />
    </main>
    
    <!-- Cart Sidebar -->
    <CartSidebar 
      :open="cartOpen"
      :items="cart.items.value"
      :total="cart.totalPrice.value"
      :review-count="cart.reviewCount.value"
      @close="toggleCart"
      @remove="cart.remove"
      @checkout="handleCheckout"
    />
    
    <!-- Movie Detail Modal -->
    <MovieModal 
      v-if="selectedMovie"
      :movie="selectedMovie"
      @close="closeModal"
      @add-to-cart-request="handleAddToCartRequest"
    />
    
    <!-- Review Modal -->
    <ReviewModal
      v-if="showReviewModal && movieForReview"
      :movie="movieForReview"
      @submit="handleReviewSubmit"
      @close="closeReviewModal"
    />
    
    <!-- Member Login Modal -->
    <MemberLoginModal
      v-if="showLoginModal"
      @success="handleLoginSuccess"
      @close="closeLoginModal"
    />
    
    <!-- Checkout Modal -->
    <CheckoutModal 
      v-if="showCheckout"
      :movie-count="checkoutData.count"
      :total-price="checkoutData.total"
      :review-count="checkoutData.reviewCount"
      :member-number="auth.memberNumber.value"
      :member-name="auth.memberName.value"
      @done="handleCheckoutDone"
    />
    
    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<style>
@import '@/assets/style.css';
</style>
