/**
 * useSpeech - Text-to-Speech Hook
 *
 * Custom hook for Web Speech API with Thai and English support.
 * Used by MorningBriefCard for audio playback.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export type SpeechLanguage = 'th-TH' | 'en-US'
export type SpeechRate = 0.75 | 1 | 1.25 | 1.5

interface UseSpeechOptions {
  defaultLang?: SpeechLanguage
  defaultRate?: SpeechRate
}

interface UseSpeechReturn {
  // Actions
  speak: (text: string, lang?: SpeechLanguage) => void
  pause: () => void
  resume: () => void
  stop: () => void

  // State
  isPlaying: boolean
  isPaused: boolean
  isSpeaking: boolean
  isSupported: boolean

  // Settings
  rate: SpeechRate
  setRate: (rate: SpeechRate) => void
  lang: SpeechLanguage
  setLang: (lang: SpeechLanguage) => void

  // Voices
  voices: SpeechSynthesisVoice[]
  currentVoice: SpeechSynthesisVoice | null
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const { defaultLang = 'en-US', defaultRate = 1 } = options

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [rate, setRate] = useState<SpeechRate>(defaultRate)
  const [lang, setLang] = useState<SpeechLanguage>(defaultLang)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check if Web Speech API is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Load available voices
  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)

      // Find best voice for current language
      const langVoices = availableVoices.filter(v => v.lang.startsWith(lang.slice(0, 2)))
      if (langVoices.length > 0) {
        // Prefer local voices over network voices
        const localVoice = langVoices.find(v => v.localService)
        setCurrentVoice(localVoice || langVoices[0])
      }
    }

    loadVoices()

    // Voices may load asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [isSupported, lang])

  // Update voice when language changes
  useEffect(() => {
    if (!isSupported || voices.length === 0) return

    const langVoices = voices.filter(v => v.lang.startsWith(lang.slice(0, 2)))
    if (langVoices.length > 0) {
      const localVoice = langVoices.find(v => v.localService)
      setCurrentVoice(localVoice || langVoices[0])
    }
  }, [lang, voices, isSupported])

  // Speak text
  const speak = useCallback((text: string, overrideLang?: SpeechLanguage) => {
    if (!isSupported) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const targetLang = overrideLang || lang

    // Set language
    utterance.lang = targetLang

    // Find voice for this language
    const langVoices = voices.filter(v => v.lang.startsWith(targetLang.slice(0, 2)))
    if (langVoices.length > 0) {
      const localVoice = langVoices.find(v => v.localService)
      utterance.voice = localVoice || langVoices[0]
    }

    // Set rate
    utterance.rate = rate
    utterance.pitch = 1
    utterance.volume = 1

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true)
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onerror = (event) => {
      console.error('Speech error:', event.error)
      setIsPlaying(false)
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onpause = () => {
      setIsPaused(true)
      setIsSpeaking(false)
    }

    utterance.onresume = () => {
      setIsPaused(false)
      setIsSpeaking(true)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [isSupported, lang, rate, voices])

  // Pause speech
  const pause = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.pause()
    setIsPaused(true)
    setIsSpeaking(false)
  }, [isSupported])

  // Resume speech
  const resume = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.resume()
    setIsPaused(false)
    setIsSpeaking(true)
  }, [isSupported])

  // Stop speech
  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsSpeaking(false)
    setIsPaused(false)
    utteranceRef.current = null
  }, [isSupported])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    isSpeaking,
    isSupported,
    rate,
    setRate,
    lang,
    setLang,
    voices,
    currentVoice,
  }
}
