import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Ultra minimal test component
const UltraMinimalHomePage: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
        🎱 SABO Pool Arena
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
        Production Ready - Optimized Build
      </p>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '10px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <p style={{ margin: '10px 0' }}>⚡ Load Time: {new Date().toLocaleString()}</p>
        <p style={{ margin: '10px 0' }}>🚀 Status: Active</p>
        <p style={{ margin: '10px 0' }}>📱 Device: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        style={{
          marginTop: '2rem',
          padding: '12px 24px',
          fontSize: '16px',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '25px',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        🔄 Reload Page
      </button>
    </div>
  );
};

// Ultra minimal App without ANY providers or heavy deps
const UltraMinimalApp: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path='*' element={<UltraMinimalHomePage />} />
      </Routes>
    </Router>
  );
};

export default UltraMinimalApp;
