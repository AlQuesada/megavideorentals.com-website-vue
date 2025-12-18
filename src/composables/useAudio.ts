import { ref } from 'vue'
import { audio } from '@/data/audio'

const isMutedRef = ref(false)

export function useAudio() {
  const init = () => audio.init()
  
  const play = () => audio.play()
  
  const pause = () => audio.pause()
  
  const toggleMute = (): boolean => {
    isMutedRef.value = audio.toggleMute()
    return isMutedRef.value
  }
  
  const isEnabled = () => audio.isEnabled()
  
  const isMuted = () => isMutedRef.value

  return {
    init,
    play,
    pause,
    toggleMute,
    isEnabled,
    isMuted,
    isMutedRef
  }
}

