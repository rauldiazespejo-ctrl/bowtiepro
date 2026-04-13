import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './client.css'
import '@xyflow/react/dist/style.css'
import { App } from './App'
import { DemoPage } from './pages/DemoPage'
import { LoginPage } from './pages/LoginPage'

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/demo/:token" element={<DemoPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>,
  )
}
