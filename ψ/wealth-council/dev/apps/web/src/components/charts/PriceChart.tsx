'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, CandlestickData, Time, CandlestickSeries, HistogramSeries } from 'lightweight-charts'

interface PriceChartProps {
  ticker: string
  title?: string
  height?: number
  showVolume?: boolean
}

// Generate mock candlestick data
function generateCandlestickData(ticker: string, days: number = 90): CandlestickData[] {
  const now = new Date()
  const data: CandlestickData[] = []

  // Starting prices based on ticker
  const startPrices: Record<string, number> = {
    TMV: 38,
    TBT: 26,
    TBF: 18,
    TLT: 92,
  }

  let price = startPrices[ticker] || 40
  const isInverse = ticker !== 'TLT' // TMV, TBT, TBF are inverse (go up when yields rise)
  const drift = isInverse ? 0.001 : -0.001 // Slight upward drift for inverse ETFs

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const time = (date.getTime() / 1000) as Time

    // Daily volatility
    const volatility = price * 0.02 // 2% daily volatility
    const change = (Math.random() - 0.5 + drift) * volatility * 2

    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5

    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    })

    price = close
  }

  return data
}

export default function PriceChart({ ticker, title, height = 300, showVolume = true }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange, setPriceChange] = useState(0)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b9cb3',
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(42, 55, 72, 0.5)' },
        horzLines: { color: 'rgba(42, 55, 72, 0.5)' },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      rightPriceScale: {
        borderColor: '#2a3748',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#2a3748',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: '#00d4ff', width: 1, style: 2 },
        horzLine: { color: '#00d4ff', width: 1, style: 2 },
      },
    })

    chartRef.current = chart

    // Generate data
    const candleData = generateCandlestickData(ticker, 90)

    // Add candlestick series using v5 API
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })
    candleSeries.setData(candleData)

    // Add volume if enabled
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#00d4ff',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      })

      // Generate volume data
      const volumeData = candleData.map((candle) => ({
        time: candle.time,
        value: Math.floor(Math.random() * 5000000) + 1000000,
        color: candle.close >= candle.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }))
      volumeSeries.setData(volumeData)
    }

    // Calculate current price and change
    const lastCandle = candleData[candleData.length - 1]
    const prevCandle = candleData[candleData.length - 2]
    if (lastCandle && prevCandle) {
      setCurrentPrice(lastCandle.close)
      setPriceChange(((lastCandle.close - prevCandle.close) / prevCandle.close) * 100)
    }

    // Fit content
    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [ticker, height, showVolume])

  const isPositive = priceChange >= 0

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-text-primary">{title || ticker}</h3>
          <span className="text-2xl font-mono font-semibold">${currentPrice.toFixed(2)}</span>
          <span className={`text-sm font-mono ${isPositive ? 'text-status-success' : 'text-status-danger'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
