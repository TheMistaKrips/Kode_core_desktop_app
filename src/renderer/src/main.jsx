import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // ❗️ Вот эта строка включает всю магию Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)