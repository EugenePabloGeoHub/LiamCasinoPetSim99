export type UserRole = 'player' | 'admin' | 'mod';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  robloxUsername?: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userEmail: string;
  text: string;
  roomCode: string; // 'public' or a code
  timestamp: number;
  isSystem?: boolean;
}

export interface BanInfo {
  until: number;
  reason: string;
  appeal?: {
    text: string;
    timestamp: number;
  };
}

export interface CasinoUser {
  id: string;
  email: string;
  password?: string;
  balance: number;
  totalWagered?: number;
  role: UserRole;
  notifications?: { id: string; message: string; type: 'info' | 'rejection' }[];
  banInfo?: BanInfo;
}

export interface GameSessionState {
  balance: number;
  bet: number;
  lastWin: number;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  robloxUsername?: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
  timestamp: number;
}

export type CasinoRoom = 'lobby' | 'login' | 'slots' | 'coinflip' | 'plinko' | 'blackjack' | 'towers' | 'admin' | 'admin-auth' | 'withdraw' | 'deposit' | 'leaderboard';
