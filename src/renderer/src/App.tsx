// src/renderer/src/App.tsx

import { HashRouter, Routes, Route } from 'react-router-dom'
import { Navigatie } from './components/Navigatie'
import { Dashboard } from './pages/Dashboard'
import { Transacties } from './pages/Transacties'
import { BtwAangifte } from './pages/BtwAangifte'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigatie />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transacties" element={<Transacties />} />
            <Route path="/btw-aangifte" element={<BtwAangifte />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
