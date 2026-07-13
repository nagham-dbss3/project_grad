import React from 'react'
import ReactDOM from 'react-dom/client'
import { hydrateAuthSession } from '@/lib/authStorage'
import { App } from './app/App'
import './index.css'

hydrateAuthSession()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
