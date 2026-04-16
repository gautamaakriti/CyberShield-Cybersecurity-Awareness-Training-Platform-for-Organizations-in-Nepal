import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('React is loading...')

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

ReactDOM.createRoot(rootElement!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
