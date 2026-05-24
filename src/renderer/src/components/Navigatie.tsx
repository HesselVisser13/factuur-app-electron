// src/renderer/src/components/Navigatie.tsx

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Calculator,
  FileText,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon
} from 'lucide-react'

import { appApi } from '../api'

interface NavLink {
  href: string
  label: string
  icon: LucideIcon
}

const links: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/transacties', label: 'Transacties', icon: Receipt },
  { href: '/facturen', label: 'Facturen', icon: FileText },
  { href: '/klanten', label: 'Klanten', icon: Users },
  { href: '/cashflow', label: 'Cashflow', icon: TrendingUp },
  { href: '/btw-aangifte', label: 'BTW-aangifte', icon: Calculator },
  { href: '/instellingen', label: 'Instellingen', icon: Settings }
]

export function Navigatie() {
  const location = useLocation()
  const [version, setVersion] = useState('')

  useEffect(() => {
    appApi.getVersion().then(setVersion)
  }, [])

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <Wrench
              className="w-5 h-5 text-blue-600 group-hover:text-blue-700"
              aria-hidden="true"
            />
            <span className="font-bold text-lg">BTW App</span>
            {version && (
              <span
                className="text-xs text-gray-400 font-mono"
                title={`Versie ${version}`}
                aria-label={`Versie ${version}`}
              >
                v{version}
              </span>
            )}
          </Link>

          <div className="flex gap-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.href

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
