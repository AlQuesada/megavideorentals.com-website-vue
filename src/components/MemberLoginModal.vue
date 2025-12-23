<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'close'): void
}>()

const auth = useAuth()

const mode = ref<'login' | 'signup'>('login')
const memberNumber = ref('')
const name = ref('')
const pin = ref('')
const confirmPin = ref('')
const error = ref('')
const loading = ref(false)

// Store the new member card number after signup to display it
const newMemberCard = ref('')

const isValidPin = computed(() => /^\d{4}$/.test(pin.value))
const pinsMatch = computed(() => pin.value === confirmPin.value)

const isValid = computed(() => {
  if (mode.value === 'login') {
    return memberNumber.value.trim().length > 0 && isValidPin.value
  }
  return name.value.trim().length > 0 && isValidPin.value && pinsMatch.value
})

const handleSubmit = async () => {
  if (!isValid.value || loading.value) return
  
  error.value = ''
  loading.value = true
  
  try {
    if (mode.value === 'login') {
      await auth.login(memberNumber.value, pin.value)
      emit('success')
    } else {
      const member = await auth.signup(name.value, pin.value)
      // Show the new member card number
      newMemberCard.value = member.memberNumber
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}

const handleContinue = () => {
  // After viewing their new card, continue to checkout
  emit('success')
}

const toggleMode = () => {
  mode.value = mode.value === 'login' ? 'signup' : 'login'
  error.value = ''
  newMemberCard.value = ''
}

const handleOverlayClick = (e: Event) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

const formatPinInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  input.value = input.value.replace(/\D/g, '').slice(0, 4)
}
</script>

<template>
  <div class="modal-overlay open" @click="handleOverlayClick">
    <div class="login-modal">
      <button class="modal-close" @click="emit('close')">✕</button>
      
      <!-- New Member Card Display (after signup) -->
      <template v-if="newMemberCard">
        <div class="new-card-header">
          <div class="card-icon">🎫</div>
          <h2>WELCOME TO MEGA VIDEO!</h2>
        </div>
        
        <div class="new-card-content">
          <div class="member-card">
            <div class="card-label">YOUR MEMBER CARD</div>
            <div class="card-number">{{ newMemberCard }}</div>
            <div class="card-name">{{ name }}</div>
          </div>
          
          <p class="card-note">
            Write this down! You'll need your card number and PIN to rent again.
          </p>
        </div>
        
        <div class="new-card-actions">
          <button type="button" class="continue-btn" @click="handleContinue">
            CONTINUE TO CHECKOUT
          </button>
        </div>
      </template>
      
      <!-- Login/Signup Form -->
      <template v-else>
        <div class="login-header">
          <div class="member-card-icon">🎫</div>
          <h2>{{ mode === 'login' ? 'MEMBER LOGIN' : 'NEW MEMBER' }}</h2>
          <p class="login-subtitle">
            {{ mode === 'login' ? 'Enter your card details' : 'Get your membership card!' }}
          </p>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit">
          <!-- Login Mode -->
          <template v-if="mode === 'login'">
            <div class="form-group">
              <label>MEMBER CARD #</label>
              <input
                v-model="memberNumber"
                type="text"
                placeholder="MV-1987-0001"
                class="form-input"
                autocomplete="off"
              />
            </div>
          </template>

          <!-- Signup Mode -->
          <template v-else>
            <div class="form-group">
              <label>YOUR NAME</label>
              <input
                v-model="name"
                type="text"
                placeholder="Johnny"
                class="form-input"
                maxlength="50"
                autocomplete="off"
              />
            </div>
          </template>

          <div class="form-group">
            <label>{{ mode === 'signup' ? 'CHOOSE A ' : '' }}4-DIGIT PIN</label>
            <input
              v-model="pin"
              type="password"
              placeholder="••••"
              class="form-input pin-input"
              maxlength="4"
              inputmode="numeric"
              @input="formatPinInput"
            />
          </div>

          <div v-if="mode === 'signup'" class="form-group">
            <label>CONFIRM PIN</label>
            <input
              v-model="confirmPin"
              type="password"
              placeholder="••••"
              class="form-input pin-input"
              :class="{ 'error': confirmPin && !pinsMatch }"
              maxlength="4"
              inputmode="numeric"
              @input="formatPinInput"
            />
            <span v-if="confirmPin && !pinsMatch" class="field-error">
              PINs don't match
            </span>
          </div>

          <div v-if="error" class="error-message">
            ⚠️ {{ error }}
          </div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="!isValid || loading"
          >
            {{ loading ? 'PLEASE WAIT...' : (mode === 'login' ? 'LOG IN' : 'GET MY CARD!') }}
          </button>
        </form>

        <div class="login-footer">
          <button type="button" class="toggle-mode-btn" @click="toggleMode">
            {{ mode === 'login' ? "Don't have a card? Sign up!" : 'Already a member? Log in!' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.login-modal {
  position: relative;
  width: 90%;
  max-width: 400px;
  background: var(--vhs-black);
  border: 4px solid var(--neon-cyan);
  box-shadow: 
    0 0 0 4px var(--vhs-gray),
    0 0 60px rgba(0, 255, 255, 0.4);
}

.login-header {
  background: linear-gradient(180deg, var(--dark-purple) 0%, var(--vhs-black) 100%);
  padding: 2rem 1.5rem;
  text-align: center;
  border-bottom: 2px solid var(--neon-cyan);
}

.member-card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.login-header h2 {
  font-family: var(--font-pixel);
  font-size: 0.8rem;
  color: var(--neon-cyan);
  text-shadow: var(--glow-cyan);
  margin-bottom: 0.5rem;
}

.login-subtitle {
  font-family: var(--font-retro);
  font-size: 1.2rem;
  color: rgba(255,255,255,0.6);
}

.login-form {
  padding: 1.5rem;
  background: var(--tape-label);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-family: var(--font-pixel);
  font-size: 0.45rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  font-family: var(--font-retro);
  font-size: 1.4rem;
  background: white;
  border: 2px solid #333;
  color: #333;
}

.form-input:focus {
  outline: none;
  border-color: var(--neon-pink);
}

.form-input.error {
  border-color: #ff4136;
}

.pin-input {
  letter-spacing: 0.5rem;
  text-align: center;
  font-size: 1.8rem;
}

.field-error {
  display: block;
  font-family: var(--font-retro);
  font-size: 0.9rem;
  color: #ff4136;
  margin-top: 0.25rem;
}

.error-message {
  font-family: var(--font-retro);
  font-size: 1.1rem;
  color: #ff4136;
  background: rgba(255, 65, 54, 0.1);
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-left: 3px solid #ff4136;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  font-family: var(--font-pixel);
  font-size: 0.6rem;
  background: linear-gradient(180deg, var(--crt-green) 0%, #00cc00 100%);
  border: 3px solid #00ff00;
  color: black;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 0 #009900, 0 0 20px rgba(0, 255, 0, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #009900, 0 0 30px rgba(0, 255, 0, 0.5);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #009900;
}

.submit-btn:disabled {
  background: #666;
  border-color: #888;
  box-shadow: none;
  cursor: not-allowed;
}

.login-footer {
  padding: 1rem 1.5rem;
  background: var(--vhs-gray);
  text-align: center;
}

.toggle-mode-btn {
  font-family: var(--font-retro);
  font-size: 1.1rem;
  color: var(--neon-cyan);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.toggle-mode-btn:hover {
  color: var(--neon-pink);
}

/* New Card Display Styles */
.new-card-header {
  background: linear-gradient(180deg, var(--dark-purple) 0%, var(--vhs-black) 100%);
  padding: 2rem 1.5rem;
  text-align: center;
  border-bottom: 2px solid var(--neon-cyan);
}

.new-card-header .card-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.new-card-header h2 {
  font-family: var(--font-pixel);
  font-size: 0.7rem;
  color: var(--neon-pink);
  text-shadow: var(--glow-pink);
}

.new-card-content {
  padding: 1.5rem;
  background: var(--tape-label);
  text-align: center;
}

.member-card {
  background: linear-gradient(135deg, #2c1654 0%, #1a0a2e 100%);
  border: 3px solid var(--neon-cyan);
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.card-label {
  font-family: var(--font-pixel);
  font-size: 0.4rem;
  color: rgba(255,255,255,0.6);
  margin-bottom: 0.5rem;
}

.card-number {
  font-family: var(--font-pixel);
  font-size: 0.9rem;
  color: var(--neon-cyan);
  text-shadow: var(--glow-cyan);
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
}

.card-name {
  font-family: var(--font-retro);
  font-size: 1.5rem;
  color: var(--neon-yellow);
  text-transform: uppercase;
}

.card-note {
  font-family: var(--font-retro);
  font-size: 1.1rem;
  color: #666;
  padding: 0.75rem;
  background: rgba(0,0,0,0.05);
  border-left: 3px solid var(--hot-pink);
}

.new-card-actions {
  padding: 1rem 1.5rem;
  background: var(--vhs-gray);
}

.continue-btn {
  width: 100%;
  padding: 1rem;
  font-family: var(--font-pixel);
  font-size: 0.55rem;
  background: linear-gradient(180deg, var(--crt-green) 0%, #00cc00 100%);
  border: 3px solid #00ff00;
  color: black;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 0 #009900, 0 0 20px rgba(0, 255, 0, 0.3);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #009900, 0 0 30px rgba(0, 255, 0, 0.5);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .login-modal {
    width: 95%;
  }
  
  .login-header,
  .new-card-header {
    padding: 1.5rem 1rem;
  }
  
  .login-header h2 {
    font-size: 0.65rem;
  }
  
  .login-form,
  .new-card-content {
    padding: 1rem;
  }
  
  .form-input {
    font-size: 1.2rem;
  }
  
  .pin-input {
    font-size: 1.5rem;
  }
  
  .submit-btn,
  .continue-btn {
    font-size: 0.5rem;
    padding: 0.8rem;
  }
  
  .card-number {
    font-size: 0.7rem;
  }
}
</style>

