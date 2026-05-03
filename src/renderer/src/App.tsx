// src/renderer/src/App.tsx

import { HashRouter, Routes, Route } from 'react-router-dom'
import { Navigatie } from './components/Navigatie'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/ConfirmDialog'
import { Dashboard } from './pages/Dashboard'
import { Transacties } from './pages/Transacties'
import { BtwAangifte } from './pages/BtwAangifte'
import { Instellingen } from './pages/Instellingen'
import { Klanten } from './pages/Klanten'
import { Facturen } from './pages/Facturen'
import { FactuurFormulier } from './pages/FactuurFormulier'

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <HashRouter>
          <div className="min-h-screen bg-gray-50">
            <Navigatie />
            <main className="max-w-5xl mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transacties" element={<Transacties />} />
                <Route path="/btw-aangifte" element={<BtwAangifte />} />
                <Route path="/instellingen" element={<Instellingen />} />
                <Route path="/klanten" element={<Klanten />} />
                <Route path="/facturen" element={<Facturen />} />
                <Route path="/facturen/nieuw" element={<FactuurFormulier />} />
                <Route path="/facturen/:id" element={<FactuurFormulier />} />
              </Routes>
            </main>
          </div>
        </HashRouter>
      </ConfirmProvider>
    </ToastProvider>
  )
}
