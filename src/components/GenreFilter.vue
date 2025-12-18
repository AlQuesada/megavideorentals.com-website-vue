<script setup lang="ts">
defineProps<{
  genres: string[]
  selected: string
}>()

const emit = defineEmits<{
  (e: 'update:selected', value: string): void
}>()
</script>

<template>
  <nav class="filter-bar">
    <div class="filter-content">
      <button 
        v-for="genre in genres" 
        :key="genre"
        class="genre-btn"
        :class="{ active: genre === selected }"
        @click="emit('update:selected', genre)"
      >
        {{ genre }}
      </button>
    </div>
  </nav>
</template>

