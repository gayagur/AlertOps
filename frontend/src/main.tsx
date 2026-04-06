import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LiveQueryProvider } from './lib/query-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LiveQueryProvider>
      <App />
    </LiveQueryProvider>
  </StrictMode>,
)
