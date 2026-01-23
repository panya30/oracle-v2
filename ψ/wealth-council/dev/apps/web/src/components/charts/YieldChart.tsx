'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, LineSeries, Time } from 'lightweight-charts'

interface YieldChartProps {
  title?: string
  height?: number
  showLegend?: boolean
}

interface LineDataPoint {
  time: Time
  value: number
}

// Generate mock historical yield data (will be replaced with real API)
function generateYieldHistory(days: number = 90): {
  tenYear: LineDataPoint[]
  thirtyYear: LineDataPoint[]
  twoYear: LineDataPoint[]
} {
  const now = new Date()
  const tenYear: LineDataPoint[] = []
  const thirtyYear: LineDataPoint[] = []
  const twoYear: LineDataPoint[] = []

  // Starting values
  let y10 = 4.0
  let y30 = 4.5
  let y2 = 4.2

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const time = (date.getTime() / 1000) as Time

    // Random walk with drift upward (thesis: yields rising)
    y10 += (Math.random() - 0.45) * 0.03
    y30 += (Math.random() - 0.45) * 0.025
    y2 += (Math.random() - 0.48) * 0.035

    // Bounds
    y10 = Math.max(3.5, Math.min(5.0, y10))
    y30 = Math.max(4.0, Math.min(5.5, y30))
    y2 = Math.max(3.8, Math.min(5.2, y2))

    tenYear.push({ time, value: parseFloat(y10.toFixed(3)) })
    thirtyYear.push({ time, value: parseFloat(y30.toFixed(3)) })
    twoYear.push({ time, value: parseFloat(y2.toFixed(3)) })
  }

  return { tenYear, thirtyYear, twoYear }
}

export default function YieldChart({ title = 'Treasury Yields', height = 300, showLegend = true }: YieldChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [currentYields, setCurrentYields] = useState({ y2: 0, y10: 0, y30: 0 })

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
        scaleMargins: { top: 0.1, bottom: 0.1 },
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
    const { tenYear, thirtyYear, twoYear } = generateYieldHistory(90)

    // Add series using v5 API
    const tenYearSeries = chart.addSeries(LineSeries, {
      color: '#00d4ff',
      lineWidth: 2,
      title: '10Y',
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    })
    tenYearSeries.setData(tenYear)

    const thirtyYearSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: '30Y',
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    })
    thirtyYearSeries.setData(thirtyYear)

    const twoYearSeries = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 2,
      title: '2Y',
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    })
    twoYearSeries.setData(twoYear)

    // Set current values
    setCurrentYields({
      y2: twoYear[twoYear.length - 1]?.value || 0,
      y10: tenYear[tenYear.length - 1]?.value || 0,
      y30: thirtyYear[thirtyYear.length - 1]?.value || 0,
    })

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
  }, [height])

  return (
    <div className="w-full">
      {showLegend && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#8b5cf6]" />
              <span className="text-text-muted">2Y:</span>
              <span className="font-mono text-[#8b5cf6]">{currentYields.y2.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#00d4ff]" />
              <span className="text-text-muted">10Y:</span>
              <span className="font-mono text-[#00d4ff]">{currentYields.y10.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#f59e0b]" />
              <span className="text-text-muted">30Y:</span>
              <span className="font-mono text-[#f59e0b]">{currentYields.y30.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
