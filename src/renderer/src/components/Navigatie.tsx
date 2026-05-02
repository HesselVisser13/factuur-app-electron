// src/renderer/src/components/Navigatie.tsx

import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { appApi } from '../api'

const links = [
  { href: '/', label: '📊 Dashboard' },
  { href: '/transacties', label: '💶 Transacties' },
  { href: '/btw-aangifte', label: '🏛️ BTW-aangifte' },
  { href: '/instellingen', label: '⚙️ Instellingen' }
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
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">🔧 BTW App</span>
            {version && <span className="text-xs text-gray-400 font-mono">v{version}</span>}
          </div>
          <div className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
