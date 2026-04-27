import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp,
  PlusCircle,
  Coins, 
  Terminal, 
  ChevronLeft, 
  LayoutGrid, 
  Wallet, 
  History, 
  Settings, 
  Gamepad2,
  Trophy,
  ArrowRight,
  User as UserIcon,
  LogOut,
  Lock
} from 'lucide-react';
import { CasinoRoom, CasinoUser, WithdrawalRequest, DepositRequest } from './types';
import { parseAmount } from './lib/utils';
import SlotMachine from './components/SlotMachine';
import CoinFlip from './components/CoinFlip';
import Plinko from './components/Plinko';
import Blackjack from './components/Blackjack';
import Towers from './components/Towers';

const ADMIN_PASSWORD = 'nugget';

export default function App() {
  const [room, setRoom] = useState<CasinoRoom>('lobby');
  const [user, setUser] = useState<CasinoUser | null>(() => {
    const saved = localStorage.getItem('ps99_v4_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [allUsers, setAllUsers] = useState<CasinoUser[]>(() => {
    const saved = localStorage.getItem('ps99_v4_all_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('ps99_v4_withdrawals');
    return saved ? JSON.parse(saved) : [];
  });

  const [deposits, setDeposits] = useState<DepositRequest[]>(() => {
    const saved = localStorage.getItem('ps99_v4_deposits');
    return saved ? JSON.parse(saved) : [];
  });

  const [betAmount, setBetAmount] = useState(1000);
  const [adminAuthInput, setAdminAuthInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Persistence
  useEffect(() => {
    if (user) {
      localStorage.setItem('ps99_v4_current_user', JSON.stringify(user));
      setAllUsers(prev => {
        const index = prev.findIndex(u => u.id === user.id);
        if (index > -1) {
          const next = [...prev];
          next[index] = user;
          return next;
        } else {
          return [...prev, user];
        }
      });
    } else {
      localStorage.removeItem('ps99_v4_current_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ps99_v4_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('ps99_v4_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem('ps99_v4_deposits', JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    // Auto-login if only one account exists or last used
    if (!user && allUsers.length > 0) {
      const savedUser = localStorage.getItem('ps99_v4_current_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, [allUsers, user]);

  const login = (email: string) => {
    const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setUser(existingUser);
    } else {
      const newUser: CasinoUser = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        email,
        balance: 500000, // Updated starting bonus
        role: 'player'
      };
      setAllUsers(prev => [...prev, newUser]);
      setUser(newUser);
    }
    setRoom('lobby');
  };

  const logout = () => {
    setUser(null);
    setRoom('lobby');
    setIsAdminAuthenticated(false);
  };

  const resetAllData = () => {
    if (confirm('ARE YOU ABSOLUTELY SURE? This will permanently DELETE ALL accounts, balances, and request histories for EVERYONE.')) {
      setAllUsers([]);
      setUser(null);
      setWithdrawals([]);
      setDeposits([]);
      localStorage.removeItem('ps99_v3_current_user');
      localStorage.removeItem('ps99_v3_all_users');
      localStorage.removeItem('ps99_v3_withdrawals');
      localStorage.removeItem('ps99_v3_deposits');
      setRoom('lobby');
      setIsAdminAuthenticated(false);
      alert('DATABASE PURGED. All accounts have been reset.');
    }
  };

  const updateBalance = (userId: string, amount: number) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, balance: Math.max(0, u.balance + amount) };
        if (user && user.id === userId) setUser(updated);
        return updated;
      }
      return u;
    }));
  };

  const requestWithdrawal = (amount: number, robloxUsername?: string) => {
    if (!user || user.balance < amount || amount <= 0) return;
    if (!robloxUsername) {
      alert('Roblox username is required for withdrawal!');
      return;
    }
    
    const newReq: WithdrawalRequest = {
      id: 'req_' + Date.now(),
      userId: user.id,
      userEmail: user.email,
      robloxUsername,
      amount,
      status: 'pending',
      timestamp: Date.now()
    };

    setWithdrawals(prev => [newReq, ...prev]);
    setUser(prev => prev ? { ...prev, balance: prev.balance - amount } : null);
    alert('Withdrawal request sent! The admin will send your gems to your mailbox.');
  };

  const requestDeposit = (amount: number, robloxUsername?: string) => {
    if (!user || amount <= 0) return;
    if (!robloxUsername) {
      alert('Roblox username is required for deposit tracking!');
      return;
    }
    
    const newReq: DepositRequest = {
      id: 'dep_' + Date.now(),
      userId: user.id,
      userEmail: user.email,
      robloxUsername,
      amount,
      status: 'pending',
      timestamp: Date.now()
    };

    setDeposits(prev => [newReq, ...prev]);
    alert('Deposit request sent! Mail the gems to "LiamPetSim99MailBox" to be credited.');
  };

  const completeWithdrawal = (reqId: string) => {
    setWithdrawals(prev => prev.map(r => r.id === reqId ? { ...r, status: 'completed' } : r));
  };

  const completeDeposit = (depId: string) => {
    setDeposits(prev => prev.map(d => {
      if (d.id === depId && d.status === 'pending') {
        updateBalance(d.userId, d.amount);
        return { ...d, status: 'completed' };
      }
      return d;
    }));
  };

  const handleAdminAuth = () => {
    if (adminAuthInput === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setRoom('admin');
      setAdminAuthInput('');
    } else {
      alert('Wrong password!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-ps-yellow selection:text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full p-4 bg-slate-900 border-b-4 border-slate-800 z-50 flex justify-between items-center shadow-2xl px-4 sm:px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRoom('lobby')}>
          <div className="w-10 h-10 bg-ps-yellow rounded-xl flex items-center justify-center shadow-[0_3px_0_rgb(202,138,4)] transition-transform hover:scale-110">
            <Gamepad2 className="w-6 h-6 text-slate-900" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-white leading-none italic uppercase">GEM STATION</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Pet Simulator 99 Casino</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8">
          {user && (
            <div className="bg-slate-800 border-4 border-slate-700 rounded-[2rem] px-8 py-3 flex flex-col items-center shadow-xl hover:scale-105 transition-transform cursor-pointer" onClick={() => setRoom('deposit')}>
              <span className="text-[10px] font-black text-ps-blue-light uppercase tracking-widest leading-none mb-1">Total Gems</span>
              <span className="text-3xl font-black text-white leading-none tracking-tighter">💎 {user.balance.toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex gap-4">
            <button 
              onClick={() => {
                if (isAdminAuthenticated) setRoom('admin');
                else setRoom('admin-auth');
              }} 
              className={`p-4 border-4 rounded-2xl transition-all ${room === 'admin' ? 'bg-ps-yellow border-yellow-500 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}
            >
              <Terminal className="w-8 h-8" />
            </button>
            
            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={logout} className="p-4 bg-slate-900 border-4 border-slate-700 rounded-2xl text-ps-pink hover:border-ps-pink transition-colors shadow-lg">
                  <LogOut className="w-8 h-8" />
                </button>
              </div>
            ) : (
              <button onClick={() => setRoom('login')} className="pet-button px-10 py-4 text-xl bg-ps-yellow text-slate-900 border-yellow-600 shadow-[0_6px_0_rgb(161,121,5)]">LOGIN</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <AnimatePresence mode="wait">
          {/* Welcome / Login Screen */}
          {!user && room !== 'login' && room !== 'admin-auth' && (
            <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center border-4 border-slate-800 shadow-2xl mb-4">
                <Trophy className="w-12 h-12 text-ps-yellow" />
              </div>
              <h2 className="text-4xl font-black text-white uppercase italic">Welcome to Gem Station</h2>
              <p className="text-slate-400 font-bold max-w-md">The most advanced Pet Simulator 99 gambling platform. Large wins, instant (manual) payouts!</p>
              <button onClick={() => setRoom('login')} className="pet-button px-10 py-4 text-xl">Start Playing 💎</button>
            </motion.div>
          )}

          {room === 'login' && (
             <motion.div key="login" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card max-w-md mx-auto space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase italic text-center leading-none">Choose Your Account ID</h2>
                  <div className="bg-ps-pink/10 border-2 border-ps-pink/30 p-4 rounded-2xl">
                    <p className="text-ps-pink font-black text-[10px] uppercase tracking-widest text-center leading-tight">
                      ⚠️ SECURITY WARNING: Pick a super unique username! Anyone can log into your account with just your username. Passwords are very complicated to store.
                    </p>
                  </div>
                </div>
                <input 
                  type="text" 
                  id="login_email" 
                  className="pet-input w-full text-center text-xl" 
                  placeholder="Super Unique Name..." 
                  onKeyDown={(e) => e.key === 'Enter' && login((e.target as HTMLInputElement).value)}
                />
                <button onClick={() => {
                  const val = (document.getElementById('login_email') as HTMLInputElement).value;
                  if (val) login(val);
                }} className="pet-button w-full">Enter Casino</button>
                <button onClick={() => setRoom('lobby')} className="w-full text-slate-500 font-bold text-sm hover:text-slate-300">Cancel</button>
             </motion.div>
          )}

          {room === 'admin-auth' && (
            <motion.div key="admin-auth" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card max-w-md mx-auto space-y-6">
               <div className="flex flex-col items-center gap-4">
                 <div className="w-16 h-16 bg-ps-yellow rounded-2xl flex items-center justify-center border-4 border-yellow-600 shadow-lg">
                   <Lock className="w-8 h-8 text-slate-900" />
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase italic">Admin Access</h2>
               </div>
               <input 
                 type="password" 
                 className="pet-input w-full text-center text-xl" 
                 placeholder="Secret Code..." 
                 value={adminAuthInput}
                 onChange={(e) => setAdminAuthInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
               />
               <button onClick={handleAdminAuth} className="pet-button w-full bg-ps-yellow border-yellow-600 shadow-[0_4px_0_rgb(161,121,5)]">Unlock Console</button>
               <button onClick={() => setRoom('lobby')} className="w-full text-slate-500 font-bold text-sm hover:text-slate-300 transition-colors">Go Back</button>
            </motion.div>
          )}

          {user && room === 'lobby' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12"
            >
              {/* Hero Section - Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div 
                  onClick={() => setRoom('deposit')}
                  className="bg-emerald-500 rounded-[2.5rem] p-8 text-white flex flex-col items-center justify-center text-center space-y-4 border-b-[8px] border-emerald-700 cursor-pointer hover:scale-105 transition-transform shadow-2xl"
                >
                  <PlusCircle className="w-16 h-16" />
                  <h2 className="text-4xl font-black italic uppercase">Deposit Gems</h2>
                  <p className="font-bold opacity-80 uppercase text-xs tracking-widest">Add gems to your balance</p>
                </div>
                <div 
                  onClick={() => setRoom('withdraw')}
                  className="bg-ps-pink rounded-[2.5rem] p-8 text-white flex flex-col items-center justify-center text-center space-y-4 border-b-[8px] border-pink-700 cursor-pointer hover:scale-105 transition-transform shadow-2xl"
                >
                  <Wallet className="w-16 h-16" />
                  <h2 className="text-4xl font-black italic uppercase">Withdraw Gems</h2>
                  <p className="font-bold opacity-80 uppercase text-xs tracking-widest">Get gems in your mailbox</p>
                </div>
              </div>

              {/* Game Grid */}
              <div className="space-y-8">
                <h3 className="text-3xl font-black text-white uppercase italic text-center">Featured Games</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  <GameCard title="Emerald Reels" desc="Match 3 symbols! Up to 80x." icon="💎" bg="bg-emerald-600" shadow="shadow-[0_8px_0_rgb(6,95,70)]" onClick={() => setRoom('slots')} isNewHelp="Popular!" />
                  <GameCard title="Blackjack" desc="Classic 21. Beat the dealer! (2.2x)" icon="♠️" bg="bg-rose-600" shadow="shadow-[0_8px_0_rgb(159,18,57)]" onClick={() => setRoom('blackjack')} isNewHelp="Hot!" />
                  <GameCard title="Towers" desc="Climb to 100x! High risk, mega rewards." icon="🏰" bg="bg-amber-600" shadow="shadow-[0_8px_0_rgb(180,83,9)]" onClick={() => setRoom('towers')} isNewHelp="Bento!" />
                  <GameCard title="Coin Flip" desc="Double or nothing? (1.8x)" icon="🪙" bg="bg-sky-600" shadow="shadow-[0_8px_0_rgb(7,89,133)]" onClick={() => setRoom('coinflip')} />
                  <GameCard title="Gem Plinko" desc="Watch gems drop up to 6x!" icon="🥎" bg="bg-emerald-600" shadow="shadow-[0_8px_0_rgb(6,95,70)]" onClick={() => setRoom('plinko')} />
                </div>
              </div>
            </motion.div>
          )}

          {user && room === 'slots' && (
            <motion.div key="slots" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card">
              <SlotMachine onBack={() => setRoom('lobby')} state={{ balance: user.balance, bet: betAmount, lastWin: 0 }} setState={(s: any) => {
                const newState = typeof s === 'function' ? s({ balance: user.balance, bet: betAmount, lastWin: 0 }) : s;
                setUser(prev => prev ? { ...prev, balance: newState.balance } : null);
                if (newState.bet) setBetAmount(newState.bet);
              }} />
            </motion.div>
          )}

          {user && room === 'coinflip' && (
            <motion.div key="coinflip" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card">
              <CoinFlip onBack={() => setRoom('lobby')} state={{ balance: user.balance, bet: betAmount, lastWin: 0 }} setState={(s: any) => {
                const newState = typeof s === 'function' ? s({ balance: user.balance, bet: betAmount, lastWin: 0 }) : s;
                setUser(prev => prev ? { ...prev, balance: newState.balance } : null);
                if (newState.bet) setBetAmount(newState.bet);
              }} />
            </motion.div>
          )}

          {user && room === 'plinko' && (
            <motion.div key="plinko" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card">
              <Plinko onBack={() => setRoom('lobby')} state={{ balance: user.balance, bet: betAmount, lastWin: 0 }} setState={(s: any) => {
                const newState = typeof s === 'function' ? s({ balance: user.balance, bet: betAmount, lastWin: 0 }) : s;
                setUser(prev => prev ? { ...prev, balance: newState.balance } : null);
                if (newState.bet) setBetAmount(newState.bet);
              }} />
            </motion.div>
          )}

          {user && room === 'blackjack' && (
            <motion.div key="blackjack" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card">
              <Blackjack onBack={() => setRoom('lobby')} state={{ balance: user.balance, bet: betAmount, lastWin: 0 }} setState={(s: any) => {
                const newState = typeof s === 'function' ? s({ balance: user.balance, bet: betAmount, lastWin: 0 }) : s;
                setUser(prev => prev ? { ...prev, balance: newState.balance } : null);
                if (newState.bet) setBetAmount(newState.bet);
              }} />
            </motion.div>
          )}

          {user && room === 'towers' && (
            <motion.div key="towers" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card">
              <Towers onBack={() => setRoom('lobby')} state={{ balance: user.balance, bet: betAmount, lastWin: 0 }} setState={(s: any) => {
                const newState = typeof s === 'function' ? s({ balance: user.balance, bet: betAmount, lastWin: 0 }) : s;
                setUser(prev => prev ? { ...prev, balance: newState.balance } : null);
                if (newState.bet) setBetAmount(newState.bet);
              }} />
            </motion.div>
          )}

          {user && room === 'deposit' && (
            <div className="space-y-8 max-w-2xl mx-auto">
               <div className="pet-card space-y-6">
                <h2 className="text-3xl font-black text-emerald-400 uppercase italic text-center">Deposit</h2>
                <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-4 rounded-2xl space-y-2">
                    <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest text-center leading-tight">
                      📬 MAIL GEMS TO: <span className="text-white text-xs underline">LiamPetSim99MailBox</span>
                    </p>
                    <p className="text-slate-400 font-bold text-center text-[10px] uppercase italic">
                      Gems are credited manually after the mail is received.
                    </p>
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Roblox Username</label>
                       <input type="text" id="deposit_roblox" className="pet-input w-full text-center text-xl" placeholder="Username (For Tracking)..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Deposit Amount</label>
                       <input 
                         type="text" 
                         id="deposit_amt" 
                         className="pet-input w-full text-center text-2xl" 
                         placeholder="Amount (e.g. 50k, 10m)..." 
                       />
                    </div>
                    <button onClick={() => {
                        const robloxUser = (document.getElementById('deposit_roblox') as HTMLInputElement).value;
                        const input = (document.getElementById('deposit_amt') as HTMLInputElement).value;
                        const amt = parseAmount(input);
                        if (amt > 0) requestDeposit(amt, robloxUser);
                    }} className="pet-button w-full py-4 text-xl bg-emerald-500 border-emerald-700 shadow-[0_4px_0_rgb(5,150,105)]">Confirm Deposit Request</button>
                </div>
               </div>

               <div className="pet-card">
                  <h3 className="font-black text-white uppercase italic mb-4">Request History</h3>
                  <div className="space-y-3">
                    {deposits.filter(r => r.userId === user.id).map(r => (
                      <div key={r.id} className="p-4 bg-slate-800 rounded-xl flex justify-between items-center border border-slate-700">
                         <div>
                           <div className="font-bold text-white">💎 {r.amount.toLocaleString()}</div>
                           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(r.timestamp).toLocaleString()}</div>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-ps-yellow/20 text-ps-yellow'}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <button onClick={() => setRoom('lobby')} className="w-full text-center text-slate-500 font-bold hover:text-slate-300">Go Back</button>
            </div>
          )}

          {user && room === 'withdraw' && (
            <div className="space-y-8 max-w-2xl mx-auto">
               <div className="pet-card space-y-6">
                <h2 className="text-3xl font-black text-ps-pink uppercase italic text-center">Withdrawal</h2>
                <div className="bg-ps-pink/10 border-2 border-ps-pink/30 p-4 rounded-2xl">
                    <p className="text-ps-pink font-black text-[10px] uppercase tracking-widest text-center leading-tight">
                      ⚠️ WARNING: Any typos in usernames that result in a loss of gems are not my fault. Double check your Roblox username!
                    </p>
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-700 flex justify-between items-center">
                       <div>
                         <p className="text-[10px] font-bold text-slate-500 uppercase">Available Gems</p>
                         <p className="text-3xl font-black text-ps-blue-light">💎 {user.balance.toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Roblox Username</label>
                       <input type="text" id="withdraw_roblox" className="pet-input w-full text-center text-xl" placeholder="Roblox Username..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Withdraw Amount</label>
                       <input type="text" id="withdraw_amt" className="pet-input w-full text-center text-2xl" placeholder="Amount (e.g. 100k, 50m)..." />
                    </div>
                    <button onClick={() => {
                        const robloxUser = (document.getElementById('withdraw_roblox') as HTMLInputElement).value;
                        const input = (document.getElementById('withdraw_amt') as HTMLInputElement).value;
                        const amt = parseAmount(input);
                        if (amt > 0) requestWithdrawal(amt, robloxUser);
                    }} className="pet-button w-full py-4 text-xl">Confirm Request</button>
                </div>
               </div>

               <div className="pet-card">
                  <h3 className="font-black text-white uppercase italic mb-4">Request History</h3>
                  <div className="space-y-3">
                    {withdrawals.filter(r => r.userId === user.id).map(r => (
                      <div key={r.id} className="p-4 bg-slate-800 rounded-xl flex justify-between items-center border border-slate-700">
                         <div>
                           <div className="font-bold text-white">💎 {r.amount.toLocaleString()}</div>
                           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(r.timestamp).toLocaleString()}</div>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-ps-yellow/20 text-ps-yellow'}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <button onClick={() => setRoom('lobby')} className="w-full text-center text-slate-500 font-bold hover:text-slate-300">Go Back</button>
            </div>
          )}

          {room === 'admin' && isAdminAuthenticated && (
            <div className="space-y-8 max-w-4xl mx-auto">
               <div className="pet-card">
                  <h2 className="text-2xl font-black text-white uppercase italic mb-6">Admin Console: Users</h2>
                  <div className="space-y-4">
                    {allUsers.map(u => (
                      <div key={u.id} className="p-4 bg-slate-800 rounded-2xl flex justify-between items-center border-2 border-slate-700">
                        <div>
                          <p className="font-bold text-slate-300">{u.email}</p>
                          <p className="text-xl font-bold text-ps-blue-light">💎 {u.balance.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                           <input 
                             type="number" 
                             id={`admin_amt_${u.id}`} 
                             className="pet-input !py-1 !px-2 w-24 text-xs" 
                             placeholder="Amount..."
                           />
                           <button onClick={() => {
                             const amt = parseInt((document.getElementById(`admin_amt_${u.id}`) as HTMLInputElement).value);
                             if (!isNaN(amt)) updateBalance(u.id, -amt);
                           }} className="pet-button bg-ps-pink border-pink-700 shadow-[0_2px_0_rgb(190,24,93)] py-1 px-3 text-xs">-</button>
                           <button onClick={() => {
                             const amt = parseInt((document.getElementById(`admin_amt_${u.id}`) as HTMLInputElement).value);
                             if (!isNaN(amt)) updateBalance(u.id, amt);
                           }} className="pet-button bg-emerald-500 border-emerald-600 shadow-[0_2px_0_rgb(6,95,70)] py-1 px-3 text-xs">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="pet-card">
                  <h2 className="text-2xl font-black text-emerald-400 uppercase italic mb-6">Pending Deposits</h2>
                  <div className="space-y-3">
                    {deposits.filter(r => r.status === 'pending').map(r => (
                       <div key={r.id} className="p-4 bg-slate-800 border-2 border-slate-700 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-300">{r.userEmail}</p>
                            {r.robloxUsername && <p className="text-xs font-black text-ps-yellow uppercase">Roblox: {r.robloxUsername}</p>}
                            <p className="text-xl font-black text-white">💎 {r.amount.toLocaleString()}</p>
                          </div>
                          <button onClick={() => completeDeposit(r.id)} className="pet-button bg-emerald-500 py-2 px-4 text-xs border-emerald-600 shadow-[0_4px_0_rgb(6,95,70)]">Credit User</button>
                       </div>
                    ))}
                  </div>
               </div>

               <div className="pet-card">
                  <h2 className="text-2xl font-black text-ps-pink uppercase italic mb-6">Pending Mailbox Tasks</h2>
                  <div className="space-y-3">
                    {withdrawals.filter(r => r.status === 'pending').map(r => (
                       <div key={r.id} className="p-4 bg-slate-800 border-2 border-slate-700 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-300">{r.userEmail}</p>
                            {r.robloxUsername && <p className="text-xs font-black text-ps-yellow uppercase">Roblox: {r.robloxUsername}</p>}
                            <p className="text-xl font-black text-white">💎 {r.amount.toLocaleString()}</p>
                          </div>
                          <button onClick={() => completeWithdrawal(r.id)} className="pet-button bg-emerald-500 py-2 px-4 text-xs border-emerald-600 shadow-[0_4px_0_rgb(6,95,70)]">Mark Done</button>
                       </div>
                    ))}
                  </div>
               </div>
               <button onClick={() => setRoom('lobby')} className="w-full text-slate-500 font-bold hover:text-slate-300">Exit Admin Console</button>
               <div className="pt-8 border-t border-slate-800">
                  <button onClick={resetAllData} className="w-full text-[10px] font-black text-ps-pink/30 hover:text-ps-pink uppercase tracking-[0.3em] transition-colors">
                    Emergency Database Purge
                  </button>
               </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 w-full p-4 flex justify-between items-center bg-slate-900/60 backdrop-blur-md border-t-2 border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] z-40">
        <span>Station ID: LOCAL_STORAGE_DB</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Local Sync: Active</span>
        </div>
      </footer>
    </div>
  );
}

function GameCard({ title, desc, icon, bg, shadow, onClick, isNewHelp }: any) {
  return (
    <button onClick={onClick} className={`group pet-card border-4 border-slate-800 p-8 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 ${bg} ${shadow} hover:-translate-y-2 hover:brightness-105 active:translate-y-1 active:shadow-none`}>
       {isNewHelp && (
        <div className="absolute top-4 right-[-20px] rotate-45 bg-ps-yellow px-8 py-1 shadow-md text-[8px] font-black uppercase text-slate-900 border-b-2 border-yellow-600">
          {isNewHelp}
        </div>
      )}
      <div className="text-6xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-xl">{icon}</div>
      <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2 leading-none">{title}</h3>
      <p className="text-white/80 font-bold text-[10px] uppercase tracking-widest">{desc}</p>
    </button>
  );
}
