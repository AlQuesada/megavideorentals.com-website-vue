<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { genres } from '@/data/movies'
import type { Movie } from '@/types/movie'
import { useCart } from '@/composables/useCart'
import { useAudio } from '@/composables/useAudio'
import { useMoviesStore } from '@/composables/useMovies'

import SplashScreen from '@/components/SplashScreen.vue'
import AppHeader from '@/components/AppHeader.vue'
import GenreFilter from '@/components/GenreFilter.vue'
import MovieGrid from '@/components/MovieGrid.vue'
import CartSidebar from '@/components/CartSidebar.vue'
import MovieModal from '@/components/MovieModal.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import AppFooter from '@/components/AppFooter.vue'

const cart = useCart()
const audio = useAudio()
const moviesStore = useMoviesStore()

// State
const showSplash = ref(true)
const cartOpen = ref(false)
const selectedMovie = ref<Movie | null>(null)
const showCheckout = ref(false)
const checkoutData = ref({ count: 0, total: '0.00' })

// Methods
const dismissSplash = () => {
  showSplash.value = false
  audio.init()
  audio.play()
  // Initialize movies fetch when splash is dismissed
  moviesStore.init()
}

const openMovie = (movie: Movie) => {
  selectedMovie.value = movie
  audio.pause()
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  selectedMovie.value = null
  document.body.style.overflow = ''
  if (!cartOpen.value) {
    audio.play()
  }
}

const toggleCart = () => {
  cartOpen.value = !cartOpen.value
  if (cartOpen.value) {
    audio.pause()
  } else if (!selectedMovie.value) {
    audio.play()
  }
}

const handleCheckout = () => {
  if (cart.count.value > 0) {
    checkoutData.value = {
      count: cart.count.value,
      total: cart.totalPrice.value
    }
    showCheckout.value = true
    audio.pause()
  }
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
  
  // Escape key to close modals
  if (e.key === 'Escape') {
    if (showCheckout.value) {
      handleCheckoutDone()
    } else if (selectedMovie.value) {
      closeModal()
    } else if (cartOpen.value) {
      toggleCart()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
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
      />
    </main>
    
    <!-- Cart Sidebar -->
    <CartSidebar 
      :open="cartOpen"
      :items="cart.items.value"
      :total="cart.totalPrice.value"
      @close="toggleCart"
      @remove="cart.remove"
      @checkout="handleCheckout"
    />
    
    <!-- Movie Detail Modal -->
    <MovieModal 
      v-if="selectedMovie"
      :movie="selectedMovie"
      @close="closeModal"
    />
    
    <!-- Checkout Modal -->
    <CheckoutModal 
      v-if="showCheckout"
      :movie-count="checkoutData.count"
      :total-price="checkoutData.total"
      @done="handleCheckoutDone"
    />
    
    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<style>
@import '@/assets/style.css';
</style>
