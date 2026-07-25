import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Note: StrictMode is intentionally omitted — it double-invokes effects in
// dev, which would double-join Socket.io rooms / Agora calls and make
// testing confusing. Safe to add back if you refactor those to be idempotent.
createRoot(document.getElementById('root')).render(<App />)
