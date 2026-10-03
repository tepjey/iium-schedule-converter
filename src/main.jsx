// Must stay first: imports settings carried over from the old address before the app reads them.
import './utils/migrate'
// Before analytics: takes Stripe Checkout's session id out of the address.
import './pro/checkoutReturn'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initAnalytics } from './utils/analytics'

initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
