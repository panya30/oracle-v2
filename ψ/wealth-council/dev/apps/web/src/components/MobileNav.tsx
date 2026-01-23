'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  LayoutDashboard,
  TrendingUp,
  Shield,
  Bell,
  Settings,
  Activity,
  Newspaper,
  Calendar,
  BookOpen,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Positions', href: '/positions', icon: TrendingUp },
  { name: 'Signals', href: '/signals', icon: Activity },
  { name: 'Research', href: '/research', icon: Newspaper },
  { name: 'Risk', href: '/risk', icon: Shield },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'How to Use', href: '/guide', icon: BookOpen },
]

const agents = [
  { name: 'PLUTUS', status: 'active', role: 'CIO' },
  { name: 'HERMES', status: 'active', role: 'Research' },
  { name: 'DELPHI', status: 'idle', role: 'Signals' },
  { name: 'TYCHE', status: 'active', role: 'Risk' },
  { name: 'ARGUS', status: 'active', role: 'Monitor' },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-palantir-bg-elevated border-b border-palantir-border flex items-center justify-between px-4">
        {/* Logo */}
        <Image
          src="/RobotFC Logo Mobile.png"
          alt="Logo"
          width={120}
          height={40}
          className="object-contain"
        />

        {/* Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-palantir-bg-hover rounded-lg transition-colors"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute top-14 left-0 right-0 bottom-0 bg-palantir-bg-elevated overflow-y-auto animate-in">
            {/* Navigation */}
            <nav className="p-4 space-y-1">
              <p className="text-xs uppercase tracking-wider text-text-muted mb-3 px-4">
                Navigation
              </p>
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Agent Status */}
            <div className="p-4 border-t border-palantir-border">
              <p className="text-xs uppercase tracking-wider text-text-muted mb-3 px-2">
                Agents
              </p>
              <div className="grid grid-cols-2 gap-2">
                {agents.map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-palantir-bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`status-dot ${
                          agent.status === 'active'
                            ? 'status-dot-success'
                            : 'bg-text-muted'
                        }`}
                      />
                      <span className="text-sm font-medium">{agent.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="p-4 border-t border-palantir-border">
              <Link href="/settings" className="sidebar-link">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
