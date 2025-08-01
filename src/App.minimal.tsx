import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Minimal test component
const MinimalHomePage: React.FC = () => {
  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>🎱 SABO Pool Arena</h1>
      <p>Deployment test page</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    </div>
  );
};

// Minimal App without heavy providers
const MinimalApp: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path='*' element={<MinimalHomePage />} />
      </Routes>
    </Router>
  );
};

export default MinimalApp;
