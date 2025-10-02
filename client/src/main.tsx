import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

import '@/tools/i18n'

import '@/styles/dark.css'
import '@/styles/light.css'
import '@/styles/globals.sass'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)

document.documentElement.setAttribute('data-theme', 'dark')
