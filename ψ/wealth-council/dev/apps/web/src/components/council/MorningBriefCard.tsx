'use client'

/**
 * MorningBriefCard - Daily Market Brief with TTS
 *
 * Displays morning market brief with text-to-speech support
 * in Thai and English languages.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Sun,
  Play,
  Pause,
  Square,
  Volume2,
  ChevronDown,
  Loader2,
  RefreshCw,
  Sparkles,
  Lightbulb,
} from 'lucide-react'
import { useSpeech, type SpeechLanguage, type SpeechRate } from '@/hooks/useSpeech'

interface MorningBriefData {
  date: string
  language: SpeechLanguage
  yields: {
    y10: number
    y10Change: number
    y30: number
    y30Change: number
    curveStatus: 'steepening' | 'flattening' | 'stable'
  }
  portfolio: {
    totalValue: number
    positions: Array<{
      symbol: string
      qty: number
      pnlToday: number
    }>
    totalPnlToday: number
  }
  events: Array<{
    name: string
    daysUntil: number
  }>
  strategy: 'HOLD' | 'BUY' | 'SELL' | 'WAIT'
  briefText: string
  insights?: string[]
  aiGenerated?: boolean
}

const SPEED_OPTIONS: { value: SpeechRate; label: string }[] = [
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
]

export function MorningBriefCard() {
  const [language, setLanguage] = useState<SpeechLanguage>('en-US')
  const [briefData, setBriefData] = useState<MorningBriefData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)

  const {
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
    setLang,
  } = useSpeech({ defaultLang: language, defaultRate: 1 })

  // Fetch morning brief
  const fetchBrief = useCallback(async (lang: SpeechLanguage) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'morning-brief',
          language: lang,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setBriefData(data.data)
      } else {
        setError(data.error || 'Failed to fetch brief')
      }
    } catch (e) {
      console.error('Failed to fetch morning brief:', e)
      setError('Failed to fetch morning brief')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load brief on mount and language change
  useEffect(() => {
    fetchBrief(language)
    setLang(language)
  }, [language, fetchBrief, setLang])

  // Handle play button
  const handlePlay = () => {
    if (!briefData) return

    if (isPaused) {
      resume()
    } else if (isPlaying) {
      pause()
    } else {
      speak(briefData.briefText, language)
    }
  }

  // Handle stop button
  const handleStop = () => {
    stop()
  }

  // Handle language toggle
  const handleLanguageToggle = (newLang: SpeechLanguage) => {
    stop() // Stop current playback
    setLanguage(newLang)
  }

  // Handle speed change
  const handleSpeedChange = (newRate: SpeechRate) => {
    setRate(newRate)
    setShowSpeedMenu(false)
    // If currently playing, restart with new rate
    if (isPlaying && briefData) {
      stop()
      setTimeout(() => speak(briefData.briefText, language), 100)
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(language === 'th-TH' ? 'th-TH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-surface-primary rounded-xl border border-palantir-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-palantir-border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">
            {language === 'th-TH' ? 'สรุปตลาดเช้านี้' : 'Morning Brief'}
          </span>
          {briefData?.aiGenerated && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          )}
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-1">
          <button
            onClick={() => handleLanguageToggle('th-TH')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              language === 'th-TH'
                ? 'bg-accent-cyan text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            TH
          </button>
          <button
            onClick={() => handleLanguageToggle('en-US')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              language === 'en-US'
                ? 'bg-accent-cyan text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            <span className="ml-2 text-text-muted">
              {language === 'th-TH' ? 'กำลังโหลด...' : 'Loading brief...'}
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={() => fetchBrief(language)}
              className="text-accent-cyan text-sm hover:underline flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              {language === 'th-TH' ? 'ลองใหม่' : 'Try again'}
            </button>
          </div>
        ) : briefData ? (
          <>
            {/* Playback Controls */}
            <div className="flex items-center gap-3 mb-4">
              {/* Play/Pause */}
              <button
                onClick={handlePlay}
                disabled={!isSupported}
                className="w-10 h-10 flex items-center justify-center bg-accent-cyan hover:bg-accent-cyan/90 disabled:bg-surface-secondary disabled:text-text-muted text-white rounded-full transition-colors"
                title={isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'}
              >
                {isPlaying && !isPaused ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              {/* Stop */}
              <button
                onClick={handleStop}
                disabled={!isPlaying}
                className="w-10 h-10 flex items-center justify-center bg-surface-secondary hover:bg-surface-tertiary disabled:opacity-50 rounded-full transition-colors"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>

              {/* Speed Control */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="flex items-center gap-1 px-3 py-2 bg-surface-secondary hover:bg-surface-tertiary rounded-lg transition-colors text-sm"
                >
                  <Volume2 className="w-4 h-4" />
                  {rate}x
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showSpeedMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-surface-secondary border border-palantir-border rounded-lg shadow-lg z-10 overflow-hidden">
                    {SPEED_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSpeedChange(option.value)}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-surface-tertiary transition-colors ${
                          rate === option.value ? 'text-accent-cyan' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="flex items-center gap-1 text-accent-cyan text-sm">
                  <span className="flex gap-0.5">
                    <span className="w-1 h-4 bg-accent-cyan rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-accent-cyan rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-1 h-4 bg-accent-cyan rounded-full animate-pulse [animation-delay:300ms]" />
                  </span>
                  <span>{language === 'th-TH' ? 'กำลังพูด...' : 'Speaking...'}</span>
                </div>
              )}

              {/* Refresh button */}
              <button
                onClick={() => fetchBrief(language)}
                disabled={loading}
                className="ml-auto p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                title={language === 'th-TH' ? 'รีเฟรช' : 'Refresh'}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-palantir-border my-3" />

            {/* Brief Text */}
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                {briefData.briefText}
              </p>
            </div>

            {/* Quick Stats */}
            {briefData.yields && (
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="bg-surface-secondary rounded-lg p-2">
                  <div className="text-xs text-text-muted">10Y</div>
                  <div className="text-sm font-medium">{briefData.yields.y10.toFixed(2)}%</div>
                  <div className={`text-xs ${briefData.yields.y10Change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {briefData.yields.y10Change >= 0 ? '+' : ''}{(briefData.yields.y10Change * 100).toFixed(0)} bps
                  </div>
                </div>
                <div className="bg-surface-secondary rounded-lg p-2">
                  <div className="text-xs text-text-muted">30Y</div>
                  <div className="text-sm font-medium">{briefData.yields.y30.toFixed(2)}%</div>
                  <div className={`text-xs ${briefData.yields.y30Change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {briefData.yields.y30Change >= 0 ? '+' : ''}{(briefData.yields.y30Change * 100).toFixed(0)} bps
                  </div>
                </div>
                <div className="bg-surface-secondary rounded-lg p-2">
                  <div className="text-xs text-text-muted">
                    {language === 'th-TH' ? 'กลยุทธ์' : 'Strategy'}
                  </div>
                  <div className={`text-sm font-medium ${
                    briefData.strategy === 'BUY' ? 'text-green-400' :
                    briefData.strategy === 'SELL' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {language === 'th-TH'
                      ? briefData.strategy === 'BUY' ? 'ซื้อ'
                        : briefData.strategy === 'SELL' ? 'ขาย'
                        : briefData.strategy === 'HOLD' ? 'ถือ' : 'รอ'
                      : briefData.strategy}
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights */}
            {briefData.insights && briefData.insights.length > 0 && (
              <div className="mt-4 bg-purple-500/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                  <Lightbulb className="w-4 h-4" />
                  {language === 'th-TH' ? 'ข้อสังเกตจาก AI' : 'AI Insights'}
                </div>
                <ul className="space-y-1">
                  {briefData.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Not supported warning */}
            {!isSupported && (
              <div className="mt-3 text-xs text-yellow-400 bg-yellow-400/10 rounded-lg p-2 text-center">
                {language === 'th-TH'
                  ? 'เบราว์เซอร์ไม่รองรับ Text-to-Speech'
                  : 'Text-to-Speech not supported in this browser'}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
