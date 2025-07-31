module.exports = {
  // Build configuration
  build: {
    command: 'npm run build',
    output: 'dist',
    install: 'npm install'
  },

  // Development server
  dev: {
    command: 'npm run dev',
    port: 3000
  },

  // Environment variables
  env: {
    NODE_ENV: 'production',
    PORT: '3000'
  },

  // Build optimization
  optimization: {
    minify: true,
    sourcemap: false,
    treeShaking: true
  },

  // Headers for security and performance
  headers: {
    '/*': {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    },
    '/api/*': {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },

  // Redirects
  redirects: [
    {
      source: '/home',
      destination: '/',
      permanent: true
    }
  ],

  // Custom domains (if needed)
  domains: [
    'sabo-pool-arena-hub.lovable.dev'
  ],

  // Features
  features: {
    autoDeploy: true,
    previewDeployments: true,
    customDomains: true,
    ssl: true,
    analytics: true
  }
}; 