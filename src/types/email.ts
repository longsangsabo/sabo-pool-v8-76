// Email Service Types
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailConfig {
  from: string;
  fromName: string;
  replyTo?: string;
}

export interface MatchResult {
  winner?: string;
  opponent?: string;
  score?: string;
  date?: string;
  duration?: number;
  tournament?: string;
}

export interface PaymentDetails {
  transactionId?: string;
  service?: string;
  amount?: number;
  currency?: string;
  method?: string;
  status?: 'pending' | 'completed' | 'failed';
  date?: string;
}

export interface EmailLogEntry {
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  error?: string;
}

export interface TournamentEmailData {
  name: string;
  startDate?: string;
  venue?: string;
  entryFee?: number;
  prizePool?: number;
  registrationDeadline?: string;
}

export interface RankingUpdateData {
  newRank: string;
  oldRank: string;
  userName: string;
  eloChange?: number;
  reason?: string;
}
