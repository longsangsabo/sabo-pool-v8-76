export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  TOURNAMENT_CONFIRMATION: 'tournament_confirmation',
  MATCH_RESULT: 'match_result',
  RANKING_UPDATE: 'ranking_update',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  PASSWORD_RESET: 'password_reset',
} as const;

export const EMAIL_TRIGGERS = {
  USER_SIGNUP: 'user_signup',
  TOURNAMENT_JOIN: 'tournament_join',
  MATCH_COMPLETE: 'match_complete',
  RANK_CHANGE: 'rank_change',
  PAYMENT_SUCCESS: 'payment_success',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
} as const;

export const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'noreply@saboarena.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
};

export const EMAIL_SETTINGS = {
  from: {
    name: 'SABO ARENA',
    email: 'noreply@saboarena.com',
  },
  replyTo: 'support@saboarena.com',
  unsubscribe: 'https://saboarena.com/unsubscribe',
  baseUrl:
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://saboarena.com',
};

// Auto-email triggers configuration
export const AUTO_EMAIL_CONFIG = {
  welcome_email: {
    enabled: true,
    delay: 2000, // 2 seconds after signup
    template: EMAIL_TEMPLATES.WELCOME,
  },
  tournament_confirmation: {
    enabled: true,
    delay: 1000, // 1 second after tournament join
    template: EMAIL_TEMPLATES.TOURNAMENT_CONFIRMATION,
  },
  payment_confirmation: {
    enabled: true,
    delay: 500, // 0.5 seconds after payment success
    template: EMAIL_TEMPLATES.PAYMENT_CONFIRMATION,
  },
  ranking_notification: {
    enabled: true,
    delay: 3000, // 3 seconds after rank change
    template: EMAIL_TEMPLATES.RANKING_UPDATE,
  },
};

console.log('✅ Email system configuration loaded');
console.log('📧 Auto-email triggers:', Object.keys(AUTO_EMAIL_CONFIG));
console.log('🎯 System ready for Vietnamese Billiards Platform');
