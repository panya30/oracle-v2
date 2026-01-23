'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Shield,
  Bell,
  Settings,
  Activity,
  Newspaper,
  Calendar,
  BookOpen,
  Users,
} from 'lucide-react'

const navSections = [
  {
    label: 'Portfolio',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Positions', href: '/positions', icon: TrendingUp },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { name: 'Council', href: '/council', icon: Users },
      { name: 'Signals', href: '/signals', icon: Activity },
      { name: 'Research', href: '/research', icon: Newspaper },
      { name: 'Risk', href: '/risk', icon: Shield },
    ],
  },
  {
    label: 'Planning',
    items: [
      { name: 'Calendar', href: '/calendar', icon: Calendar },
      { name: 'Alerts', href: '/alerts', icon: Bell },
    ],
  },
]

const systemNav = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'How to Use', href: '/guide', icon: BookOpen },
]

const agents = [
  { name: 'PLUTUS', status: 'active', role: 'CIO' },
  { name: 'HERMES', status: 'active', role: 'Research' },
  { name: 'DELPHI', status: 'active', role: 'Signals' },
  { name: 'TYCHE', status: 'active', role: 'Risk' },
  { name: 'ARGUS', status: 'active', role: 'Monitor' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 bg-palantir-bg-elevated border-r border-palantir-border flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-palantir-border">
        <Link href="/">
          <Image
            src="/RobotFC Logo.png"
            alt="Robot Wealth Council"
            width={120}
            height={120}
            className="rounded-2xl hover:opacity-90 transition-opacity"
          />
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 px-3">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Agent Status */}
      <div className="p-3 border-t border-palantir-border">
        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 px-2">Agents</p>
        <div className="space-y-1">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-palantir-bg-card"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    agent.status === 'active'
                      ? 'bg-status-success'
                      : 'bg-text-muted'
                  }`}
                />
                <span className="text-xs font-medium">{agent.name}</span>
              </div>
              <span className="text-[10px] text-text-muted uppercase">{agent.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Navigation */}
      <div className="p-3 border-t border-palantir-border">
        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 px-3">System</p>
        <div className="space-y-0.5">
          {systemNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
