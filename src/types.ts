export type UserRole = 'player' | 'admin';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  robloxUsername?: string;
  amount: number;
  status: 'pending' | 'completed';
  timestamp: number;
}

export interface CasinoUser {
  id: string;
  email: string;
  balance: number;
  role: UserRole;
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
  status: 'pending' | 'completed';
  timestamp: number;
}

export type CasinoRoom = 'lobby' | 'login' | 'slots' | 'coinflip' | 'plinko' | 'blackjack' | 'towers' | 'admin' | 'admin-auth' | 'withdraw' | 'deposit';
