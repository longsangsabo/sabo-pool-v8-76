import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Back to optimized main app

// eslint-disable-next-line no-console
console.log('🚀 Starting application...');

// Simple error handling
window.addEventListener('error', event => {
  // eslint-disable-next-line no-console
  console.error('Global error:', event.error?.message || event.message);
});

window.addEventListener('unhandledrejection', event => {
  // eslint-disable-next-line no-console
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  // eslint-disable-next-line no-console
  console.error('Root element not found!');
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial; color: red;">
      <h1>Critical Error: Root element not found!</h1>
    </div>
  `;
  throw new Error('Root element not found');
}

try {
  // ✅ Development logging only
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('🚀 Creating React root...');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('✅ App rendered successfully!');
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to render app:', error);

  // Show user-friendly error
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial; text-align: center;">
        <div>
          <h1 style="color: red;">Application Failed to Load</h1>
          <p>Please refresh the page or contact support.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px;">Reload Page</button>
        </div>
      </div>
    `;
  }
}
