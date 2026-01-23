'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Sparkles, X, Loader2, Copy, Check, BookOpen, GripHorizontal } from 'lucide-react'

interface Position {
  x: number
  y: number
}

export function ExplainPopup() {
  const [selectedText, setSelectedText] = useState('')
  const [position, setPosition] = useState<Position | null>(null)
  const [popupPosition, setPopupPosition] = useState<Position | null>(null)
  const [showButton, setShowButton] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  // Handle text selection
  const handleSelection = useCallback(() => {
    // Don't process selection if we're dragging or showing explanation
    if (isDragging || showExplanation) return

    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text && text.length > 2 && text.length < 500) {
      const range = selection?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()

      if (rect) {
        setSelectedText(text)
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        })
        setShowButton(true)
      }
    } else {
      setShowButton(false)
    }
  }, [showExplanation, isDragging])

  // Handle click outside - only hide the button, NOT the explanation popup
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (isDragging || showExplanation) return // Don't close explanation on click outside
    const target = e.target as Node
    if (
      buttonRef.current && !buttonRef.current.contains(target)
    ) {
      setShowButton(false)
    }
  }, [isDragging, showExplanation])

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (!popupRef.current) return

    const rect = popupRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }, [])

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const popupWidth = popupRef.current?.offsetWidth || 384 // w-96 = 384px
    const popupHeight = popupRef.current?.offsetHeight || 320

    // Calculate new position (top-left corner)
    let newX = e.clientX - dragOffset.x
    let newY = e.clientY - dragOffset.y

    // Constrain to viewport with padding
    const padding = 10
    newX = Math.max(padding, Math.min(newX, window.innerWidth - popupWidth - padding))
    newY = Math.max(padding, Math.min(newY, window.innerHeight - popupHeight - padding))

    setPopupPosition({ x: newX, y: newY })
  }, [isDragging, dragOffset])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleSelection, handleClickOutside])

  // Drag event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Fetch explanation
  const fetchExplanation = async () => {
    if (!selectedText || !position) return

    setLoading(true)
    setShowExplanation(true)
    setShowButton(false)

    // Initialize popup position - center horizontally near selection, ensure fully visible
    const popupWidth = 384 // w-96 = 384px
    const popupHeight = 320
    const padding = 10

    let initialX = position.x - popupWidth / 2
    let initialY = position.y - popupHeight - 10 // Above selection

    // If would go above viewport, show below selection instead
    if (initialY < padding) {
      initialY = position.y + 30
    }

    // Constrain horizontally
    initialX = Math.max(padding, Math.min(initialX, window.innerWidth - popupWidth - padding))
    // Constrain vertically
    initialY = Math.max(padding, Math.min(initialY, window.innerHeight - popupHeight - padding))

    setPopupPosition({ x: initialX, y: initialY })

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText }),
      })

      const data = await response.json()
      if (data.success) {
        setExplanation(data.explanation)
      } else {
        setExplanation('Unable to generate explanation. Please try again.')
      }
    } catch (error) {
      setExplanation('Error connecting to the explanation service.')
    } finally {
      setLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(explanation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Close explanation
  const close = () => {
    setShowButton(false)
    setShowExplanation(false)
    setExplanation('')
    setSelectedText('')
    setPopupPosition(null)
    setIsDragging(false)
  }

  if (!position) return null

  return (
    <>
      {/* Explain Button */}
      {showButton && (
        <div
          ref={buttonRef}
          className="fixed z-50 animate-in"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button
            onClick={fetchExplanation}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-cyan text-palantir-bg rounded-lg shadow-lg hover:bg-accent-cyan/90 transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Explain
          </button>
        </div>
      )}

      {/* Explanation Popup */}
      {showExplanation && popupPosition && (
        <div
          ref={popupRef}
          className={`fixed z-50 ${isDragging ? '' : 'animate-in'}`}
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            cursor: isDragging ? 'grabbing' : 'default',
          }}
        >
          <div className="w-96 max-h-80 bg-palantir-bg-elevated border border-palantir-border rounded-lg shadow-2xl overflow-hidden">
            {/* Header - Draggable */}
            <div
              onMouseDown={handleDragStart}
              className="flex items-center justify-between px-4 py-2 border-b border-palantir-border bg-palantir-bg-card cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-text-muted" />
                <BookOpen className="w-4 h-4 text-accent-cyan" />
                <span className="text-sm font-medium">ATHENA Explains</span>
              </div>
              <button
                onClick={close}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1 hover:bg-palantir-bg-hover rounded transition-colors"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            {/* Selected Text */}
            <div className="px-4 py-2 bg-palantir-bg border-b border-palantir-border">
              <p className="text-xs text-text-muted mb-1">Selected text:</p>
              <p className="text-sm text-accent-cyan font-medium line-clamp-2">"{selectedText}"</p>
            </div>

            {/* Content */}
            <div className="p-4 max-h-48 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
                  <span className="ml-2 text-sm text-text-muted">Analyzing...</span>
                </div>
              ) : (
                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && explanation && (
              <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-palantir-border bg-palantir-bg-card">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-status-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
