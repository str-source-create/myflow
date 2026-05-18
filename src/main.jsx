/**
 * main.jsx
 * Source file for the cleanflow application.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './app/App.jsx'
import { initSentry, Sentry } from './sentry'

// Must initialise before React renders so all errors are captured from the start
initSentry()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Sentry error boundary: catches React render errors and shows a friendly fallback */}
      <Sentry.ErrorBoundary fallback={
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',
          justifyContent:'center',minHeight:'100vh',padding:'24px',
          fontFamily:'sans-serif',background:'#f8fafc'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>⚠️</div>
          <h1 style={{fontSize:'20px',fontWeight:'600',color:'#0f172a',marginBottom:'8px'}}>
            Something went wrong
          </h1>
          <p style={{color:'#64748b',textAlign:'center',marginBottom:'24px'}}>
            Our team has been notified. Please refresh the page.
          </p>
          <button onClick={() => window.location.reload()}
            style={{background:'#2563eb',color:'white',border:'none',
              padding:'12px 24px',borderRadius:'12px',cursor:'pointer',
              fontSize:'14px',fontWeight:'600'}}>
            Refresh Page
          </button>
        </div>
      }>
        <App />
      </Sentry.ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)

