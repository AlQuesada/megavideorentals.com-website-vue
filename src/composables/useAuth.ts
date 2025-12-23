import { ref, computed } from 'vue'
import type { Member } from '@/types/member'
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient'

// Shared state - reactive across all components
const currentMember = ref<Member | null>(null)

const STORAGE_KEY = 'mega_video_member'

export function useAuth() {
  const isLoggedIn = computed(() => currentMember.value !== null)
  const memberNumber = computed(() => currentMember.value?.memberNumber ?? '')
  const memberName = computed(() => currentMember.value?.name ?? '')
  const memberId = computed(() => currentMember.value?.id ?? '')

  /**
   * Sign up a new member
   * @param name - Member's name (first name is fine)
   * @param pin - 4-digit PIN
   * @returns The new member's data including their card number
   */
  const signup = async (name: string, pin: string): Promise<Member> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await supabase.rpc('signup_member', {
      p_name: name.trim(),
      p_pin: pin
    })

    if (error) {
      console.error('Signup error:', error)
      throw new Error(error.message || 'Failed to create account')
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create account')
    }

    const memberData = data[0]
    const member: Member = {
      id: memberData.id,
      memberNumber: memberData.member_number,
      name: memberData.name,
      memberSince: memberData.member_since
    }

    currentMember.value = member
    saveToStorage(member)

    return member
  }

  /**
   * Log in an existing member
   * @param memberNum - Member card number (e.g., 'MV-1987-0042')
   * @param pin - 4-digit PIN
   * @returns The member's data
   */
  const login = async (memberNum: string, pin: string): Promise<Member> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured')
    }

    const { data, error } = await supabase.rpc('login_member', {
      p_member_number: memberNum.toUpperCase().trim(),
      p_pin: pin
    })

    if (error) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }

    if (!data || data.length === 0) {
      throw new Error('Invalid member number or PIN')
    }

    const memberData = data[0]
    const member: Member = {
      id: memberData.id,
      memberNumber: memberData.member_number,
      name: memberData.name,
      memberSince: memberData.member_since
    }

    currentMember.value = member
    saveToStorage(member)

    return member
  }

  /**
   * Log out the current member
   */
  const logout = (): void => {
    currentMember.value = null
    removeFromStorage()
  }

  /**
   * Restore session from localStorage (call on app mount)
   */
  const restoreSession = (): void => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const member = JSON.parse(stored) as Member
        // Basic validation
        if (member.id && member.memberNumber && member.name) {
          currentMember.value = member
        } else {
          removeFromStorage()
        }
      } catch {
        removeFromStorage()
      }
    }
  }

  // Helper functions for localStorage
  const saveToStorage = (member: Member): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(member))
    } catch {
      // localStorage might be full or disabled
    }
  }

  const removeFromStorage = (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore errors
    }
  }

  return {
    // State
    currentMember,
    isLoggedIn,
    memberNumber,
    memberName,
    memberId,
    // Actions
    signup,
    login,
    logout,
    restoreSession
  }
}

