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
  Lock,
  Send,
  Shield,
  Megaphone,
  Radio
} from 'lucide-react';
import { CasinoRoom, CasinoUser, WithdrawalRequest, DepositRequest, ChatMessage } from './types';
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
    const saved = localStorage.getItem('ps99_v6_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [allUsers, setAllUsers] = useState<CasinoUser[]>(() => {
    const saved = localStorage.getItem('ps99_v6_all_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('ps99_v6_withdrawals');
    return saved ? JSON.parse(saved) : [];
  });

  const [deposits, setDeposits] = useState<DepositRequest[]>(() => {
    const saved = localStorage.getItem('ps99_v6_deposits');
    return saved ? JSON.parse(saved) : [];
  });

  const [betAmount, setBetAmount] = useState(1000);
  const [adminAuthInput, setAdminAuthInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<{id: string, type: 'withdrawal' | 'deposit'} | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [tipTarget, setTipTarget] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [leaderboardTab, setLeaderboardTab] = useState<'wagered' | 'balance'>('wagered');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ps99_v6_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentChatRoom, setCurrentChatRoom] = useState('public');
  const [chatInput, setChatInput] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [banningUser, setBanningUser] = useState<string | null>(null);
  const [banDurationDays, setBanDurationDays] = useState('1');
  const [banReason, setBanReason] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem('ps99_v6_maintenance') === 'true';
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('ps99_v6_maintenance', maintenanceMode.toString());
  }, [maintenanceMode]);

  useEffect(() => {
    localStorage.setItem('ps99_v6_chat', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ps99_v6_current_user', JSON.stringify(user));
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
      localStorage.removeItem('ps99_v6_current_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ps99_v6_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('ps99_v6_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem('ps99_v6_deposits', JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    // Auto-login if only one account exists or last used
    if (!user && allUsers.length > 0) {
      const savedUser = localStorage.getItem('ps99_v6_current_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, [allUsers, user]);

  const handleAppeal = (appealText: string) => {
    if (!appealText.trim()) return;
    const email = (document.getElementById('login_email') as HTMLInputElement).value;
    setAllUsers(prev => prev.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase() && u.banInfo) {
        return { 
          ...u, 
          banInfo: { ...u.banInfo, appeal: { text: appealText, timestamp: Date.now() } }
        };
      }
      return u;
    }));
    alert('Appeal sent. An admin will review it.');
  };

  const handleAuth = (email: string, password?: string) => {
    const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (authMode === 'login') {
      if (!existingUser) {
        alert('ACCOUNT NOT FOUND! Did you mean to Sign Up?');
        return;
      }
      if (maintenanceMode && existingUser.role === 'player') {
        alert('SERVER UNDER MAINTENANCE! Please check back later.');
        return;
      }
      if (existingUser.banInfo && existingUser.banInfo.until > Date.now()) {
        const date = new Date(existingUser.banInfo.until).toLocaleString();
        const appealBox = prompt(`ACCESS DENIED until ${date}.\nReason: ${existingUser.banInfo.reason}\n\nType your appeal here:`, existingUser.banInfo.appeal?.text || '');
        if (appealBox !== null) handleAppeal(appealBox);
        return;
      }
      if (!password) {
        alert('Password required!');
        return;
      }
      if (existingUser.password && existingUser.password !== password) {
        alert('INCORRECT PASSWORD!');
        return;
      }
      setUser(existingUser);
    } else {
      if (existingUser) {
        alert('USERNAME TAKEN! Please choose another or Log In.');
        return;
      }
      if (!password || password.length < 4) {
        alert('Password must be at least 4 characters!');
        return;
      }
      const newUser: CasinoUser = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        email,
        password,
        balance: 500000, 
        role: 'player'
      };
      setAllUsers(prev => [...prev, newUser]);
      setUser(newUser);
    }
    setRoom('lobby');
    setLoginPassword('');
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
      localStorage.removeItem('ps99_v6_current_user');
      localStorage.removeItem('ps99_v6_all_users');
      localStorage.removeItem('ps99_v6_withdrawals');
      localStorage.removeItem('ps99_v6_deposits');
      setRoom('lobby');
      setIsAdminAuthenticated(false);
      alert('DATABASE PURGED. All accounts have been reset.');
    }
  };

  const updateBalance = (userId: string, amount: number, wagerAmount: number = 0) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { 
          ...u, 
          balance: Math.max(0, u.balance + amount),
          totalWagered: (u.totalWagered || 0) + wagerAmount
        };
        if (user && user.id === userId) setUser(updated);
        return updated;
      }
      return u;
    }));
  };

  const handleTip = () => {
    if (!user || !tipTarget || !tipAmount) return;
    const amount = parseAmount(tipAmount);
    if (amount <= 0 || amount > user.balance) {
      alert('Invalid tip amount!');
      return;
    }

    const targetUser = allUsers.find(u => u.email.toLowerCase() === tipTarget.toLowerCase());
    if (!targetUser) {
      alert('User not found!');
      return;
    }
    if (targetUser.id === user.id) {
      alert('You cannot tip yourself!');
      return;
    }

    updateBalance(user.id, -amount);
    updateBalance(targetUser.id, amount);
    notifyUser(targetUser.id, `${user.email} tipped you ${amount.toLocaleString()} GEMS!`, 'info');
    alert(`Successfully tipped ${amount.toLocaleString()} GEMS to ${targetUser.email}`);
    setTipTarget('');
    setTipAmount('');
  };

  const sendChatMessage = () => {
    if (!user || !chatInput.trim()) return;
    
    if (user.banInfo && user.banInfo.until > Date.now()) {
      alert('You are currently banned from chat.');
      return;
    }

    const newMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userEmail: user.email,
      text: chatInput,
      roomCode: currentChatRoom,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev.slice(-100), newMessage]);
    setChatInput('');
  };

  const broadcastAnnouncement = (text: string) => {
    if (!isAdminAuthenticated) return;
    const newMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      userId: 'system',
      userEmail: '📢 ANNOUNCEMENT',
      text: text.toUpperCase(),
      roomCode: 'public',
      timestamp: Date.now(),
      isSystem: true
    };
    setMessages(prev => [...prev.slice(-100), newMessage]);
    alert('Announcement broadcasted!');
  };

  const toggleModStatus = (userId: string) => {
    if (!isAdminAuthenticated) return;
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newRole = u.role === 'mod' ? 'player' : 'mod';
        alert(`User ${u.email} is now a ${newRole.toUpperCase()}`);
        return { ...u, role: newRole as any };
      }
      return u;
    }));
  };

  const clearLeaderboard = () => {
    if (!isAdminAuthenticated) return;
    if (confirm('Are you sure you want to crystal clear all player wager stats? This cannot be undone.')) {
      setAllUsers(prev => prev.map(u => ({ ...u, totalWagered: 0 })));
      alert('Leaderboard reset!');
    }
  };

  const awardAllUsers = (amount: number) => {
    if (!isAdminAuthenticated) return;
    if (confirm(`Are you sure you want to award ${amount.toLocaleString()} GEMS to EVERY user?`)) {
      setAllUsers(prev => prev.map(u => ({ ...u, balance: u.balance + amount })));
      broadcastAnnouncement(`🎊 HOLIDAY EVENT! Everyone has been awarded ${amount.toLocaleString()} GEMS! 🎊`);
    }
  };

  const joinPrivateRoom = () => {
    if (!roomCodeInput.trim()) return;
    setCurrentChatRoom(roomCodeInput.trim().toLowerCase());
    setRoomCodeInput('');
  };

  const banUser = (userId: string) => {
    if (!isAdminAuthenticated) return;
    const days = parseInt(banDurationDays);
    if (isNaN(days) || days < 1) {
      alert('Invalid duration');
      return;
    }

    const until = Date.now() + (days * 24 * 60 * 60 * 1000);
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, banInfo: { until, reason: banReason || 'No reason specified' } };
      }
      return u;
    }));
    
    // Force logout if banned user is current user (for testing)
    if (user && user.id === userId) {
      logout();
      alert('You have been banned by an admin.');
    } else {
      alert('User banned successfully.');
    }

    setBanningUser(null);
    setBanDurationDays('1');
    setBanReason('');
  };

  const unbanUser = (userId: string) => {
    if (!isAdminAuthenticated) return;
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const { banInfo, ...rest } = u;
        return rest;
      }
      return u;
    }));
    alert('User unbanned.');
  };

  const notifyUser = (userId: string, message: string, type: 'info' | 'rejection' = 'info') => {
    const notification = { id: Math.random().toString(36).substr(2, 9), message, type };
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, notifications: [...(u.notifications || []), notification] };
        if (user && user.id === userId) setUser(updated);
        return updated;
      }
      return u;
    }));
  };

  const clearNotifications = () => {
    if (!user) return;
    const updated = { ...user, notifications: [] };
    setUser(updated);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updated : u));
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
    const req = withdrawals.find(r => r.id === reqId);
    if (!req) return;
    setWithdrawals(prev => prev.map(r => r.id === reqId ? { ...r, status: 'completed' } : r));
    notifyUser(req.userId, "An Admin Reviewed Your Request Check Your Mailbox In Pet Sim 99!", 'info');
  };

  const rejectWithdrawal = (reqId: string, reason: string) => {
    const req = withdrawals.find(r => r.id === reqId);
    if (!req) return;

    setWithdrawals(prev => prev.map(r => r.id === reqId ? { ...r, status: 'rejected', rejectionReason: reason } : r));
    // Refund balance
    updateBalance(req.userId, req.amount);
    notifyUser(req.userId, `Your withdrawal request of ${req.amount.toLocaleString()} GEMS was REJECTED. Reason: ${reason || 'No reason provided.'}`, 'rejection');
    setRejectingRequest(null);
    setRejectionReason('');
  };

  const completeDeposit = (depId: string) => {
    setDeposits(prev => prev.map(d => {
      if (d.id === depId && d.status === 'pending') {
        updateBalance(d.userId, d.amount);
        notifyUser(d.userId, "An Admin Reviewed Your Request Check Your Mailbox In Pet Sim 99!", 'info');
        return { ...d, status: 'completed' };
      }
      return d;
    }));
  };

  const rejectDeposit = (depId: string, reason: string) => {
    const dep = deposits.find(d => d.id === depId);
    if (!dep) return;

    setDeposits(prev => prev.map(d => d.id === depId ? { ...d, status: 'rejected', rejectionReason: reason } : d));
    notifyUser(dep.userId, `Your deposit request of ${dep.amount.toLocaleString()} GEMS was REJECTED. Reason: ${reason || 'No reason provided.'}`, 'rejection');
    setRejectingRequest(null);
    setRejectionReason('');
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
      {/* Notification Overlay */}
      <AnimatePresence>
        {user && user.notifications && user.notifications.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-xl w-full pet-card border-8 border-ps-yellow bg-slate-900 space-y-8 p-12 shadow-[0_0_100px_rgba(252,211,77,0.2)]"
            >
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-ps-yellow rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                  <Trophy className="w-12 h-12 text-slate-900" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-ps-yellow italic uppercase leading-none tracking-tighter">Admin Notification</h2>
                <div className="p-6 bg-slate-800 rounded-3xl border-4 border-slate-700">
                  <p className="text-xl font-black text-white uppercase italic leading-tight">
                    {user.notifications[0].message}
                  </p>
                </div>
              </div>
              <button 
                onClick={clearNotifications}
                className="pet-button w-full py-6 text-2xl"
              >
                GOT IT!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                if (isAdminAuthenticated || (user && user.role === 'mod')) setRoom('admin');
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

      <div className={`pt-28 pb-16 px-6 ${user ? 'max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8' : 'max-w-6xl mx-auto'}`}>
        {user && (
          <aside className="space-y-6">
            <div className="pet-card h-[600px] flex flex-col p-0 overflow-hidden border-4">
              <div className="p-4 bg-slate-900 border-b-4 border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-ps-yellow" />
                  <h3 className="font-black text-white uppercase italic text-sm">Chat: {currentChatRoom}</h3>
                </div>
                {currentChatRoom !== 'public' && (
                  <button onClick={() => setCurrentChatRoom('public')} className="text-[10px] font-black text-ps-pink uppercase hover:underline">Exit Room</button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.filter(m => m.roomCode === currentChatRoom).map(m => (
                  <div key={m.id} className="group">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-[10px] font-black uppercase italic ${m.isSystem ? 'text-amber-400' : m.userId === user.id ? 'text-ps-yellow' : 'text-ps-blue-light'}`}>
                        {m.userEmail}
                      </span>
                      <span className="text-[9px] font-bold text-slate-600">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className={`text-xs font-bold p-2 rounded-lg border break-words ${m.isSystem ? 'text-amber-200 bg-amber-950/30 border-amber-900/50 italic' : 'text-slate-300 bg-slate-900/50 border-slate-800'}`}>
                      {m.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-900 border-t-4 border-slate-800 space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:border-ps-yellow outline-none"
                  />
                  <button onClick={sendChatMessage} className="pet-button p-2 bg-ps-yellow border-yellow-600 shadow-[0_3px_0_rgb(161,121,5)]">
                    <Send className="w-4 h-4 text-slate-950" />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    placeholder="Room Code..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-[10px] font-bold outline-none"
                  />
                  <button onClick={joinPrivateRoom} className="px-3 py-1 bg-slate-800 border-2 border-slate-700 rounded-lg text-[10px] font-black uppercase hover:border-ps-yellow transition-all">Join</button>
                </div>
              </div>
            </div>
          </aside>
        )}

        <main>
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
                <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl border-2 border-slate-800">
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-3 font-black uppercase italic rounded-xl transition-all ${authMode === 'login' ? 'bg-ps-yellow text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-3 font-black uppercase italic rounded-xl transition-all ${authMode === 'signup' ? 'bg-ps-yellow text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    Sign Up
                  </button>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase italic text-center leading-none">
                    {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
                  </h2>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest text-center">
                    {authMode === 'login' ? 'Enter your details to access your gems.' : 'Join the elite and get 500k starting gems!'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                    <input 
                      type="text" 
                      id="login_email" 
                      className="pet-input w-full text-center text-xl" 
                      placeholder="Username..." 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                    <input 
                      type="password" 
                      className="pet-input w-full text-center text-xl" 
                      placeholder="••••••••" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const userVal = (document.getElementById('login_email') as HTMLInputElement).value;
                          if (userVal) handleAuth(userVal, loginPassword);
                        }
                      }}
                    />
                  </div>
                </div>
                <button onClick={() => {
                  const val = (document.getElementById('login_email') as HTMLInputElement).value;
                  if (val) handleAuth(val, loginPassword);
                }} className="pet-button w-full">
                  {authMode === 'login' ? 'Login Now' : 'Sign Up Free'}
                </button>
                <button onClick={() => { setRoom('lobby'); setLoginPassword(''); }} className="w-full text-slate-500 font-bold text-sm hover:text-slate-300">Cancel</button>
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
              {maintenanceMode && user.role === 'player' && (
                <div className="bg-ps-pink p-8 rounded-[3rem] border-8 border-pink-700 text-white text-center space-y-4 shadow-2xl animate-pulse">
                  <Radio className="w-16 h-16 mx-auto" />
                  <h2 className="text-4xl font-black italic uppercase">System Maintenance</h2>
                  <p className="font-bold text-xl">Games are currently disabled while we upgrade the station. Your gems are safe! 💎</p>
                </div>
              )}

              {/* Hero Section - Quick Actions */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${maintenanceMode && user.role === 'player' ? 'opacity-50 pointer-events-none' : ''}`}>
                <div 
                  onClick={() => setRoom('deposit')}
                  className="bg-emerald-500 rounded-[2rem] p-6 text-white flex flex-col items-center justify-center text-center space-y-2 border-b-[6px] border-emerald-700 cursor-pointer hover:scale-105 transition-transform shadow-xl"
                >
                  <PlusCircle className="w-10 h-10" />
                  <h2 className="text-2xl font-black italic uppercase">Deposit</h2>
                  <p className="font-bold opacity-80 uppercase text-[9px] tracking-widest leading-none">Add Gems</p>
                </div>
                <div 
                  onClick={() => setRoom('withdraw')}
                  className="bg-ps-pink rounded-[2rem] p-6 text-white flex flex-col items-center justify-center text-center space-y-2 border-b-[6px] border-pink-700 cursor-pointer hover:scale-105 transition-transform shadow-xl"
                >
                  <Wallet className="w-10 h-10" />
                  <h2 className="text-2xl font-black italic uppercase">Withdraw</h2>
                  <p className="font-bold opacity-80 uppercase text-[9px] tracking-widest leading-none">Get Gems</p>
                </div>
                <div 
                  onClick={() => setRoom('leaderboard')}
                  className="bg-ps-yellow rounded-[2rem] p-6 text-slate-900 flex flex-col items-center justify-center text-center space-y-2 border-b-[6px] border-yellow-600 cursor-pointer hover:scale-105 transition-transform shadow-xl"
                >
                  <Trophy className="w-10 h-10" />
                  <h2 className="text-2xl font-black italic uppercase">Leaderboard</h2>
                  <p className="font-bold opacity-80 uppercase text-[9px] tracking-widest leading-none">Top Players</p>
                </div>
                <div 
                  className="bg-slate-800 rounded-[2rem] p-6 text-white flex flex-col items-center justify-center text-center space-y-3 border-b-[6px] border-slate-700 shadow-xl"
                >
                  <div className="flex gap-2 w-full">
                    <input 
                      type="text" 
                      placeholder="User..." 
                      value={tipTarget}
                      onChange={(e) => setTipTarget(e.target.value)}
                      className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold focus:border-ps-yellow outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Amt..." 
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold focus:border-ps-yellow outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleTip}
                    className="w-full bg-ps-yellow text-slate-900 py-2 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md"
                  >
                    <Send className="w-3 h-3" /> Tip Player
                  </button>
                </div>
              </div>

              {/* Game Grid */}
              <div className={`space-y-8 ${maintenanceMode && user.role === 'player' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
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
                const balanceDiff = newState.balance - user.balance;
                // If it's a spin (balance decreased by bet), track wager
                const wager = balanceDiff < 0 ? Math.abs(balanceDiff) : 0;
                updateBalance(user.id, balanceDiff, wager);
                if (newState.bet) setBetAmount(newState.bet);
              }} />
            </motion.div>
          )}

          {user && room === 'coinflip' && (
            <motion.div key="coinflip" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card">
              <CoinFlip onBack={() => setRoom('lobby')} state={{ balance: user.balance, bet: betAmount, lastWin: 0 }} setState={(s: any) => {
                const newState = typeof s === 'function' ? s({ balance: user.balance, bet: betAmount, lastWin: 0 }) : s;
                const balanceDiff = newState.balance - user.balance;
                const wager = balanceDiff < 0 ? Math.abs(balanceDiff) : 0;
                updateBalance(user.id, balanceDiff, wager);
                if (newState.bet) setBetAmount(newState.bet);
              }} />
            </motion.div>
          )}

          {user && room === 'plinko' && (
            <motion.div key="plinko" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card">
              <Plinko onBack={() => setRoom('lobby')} state={{ balance: user.balance, bet: betAmount, lastWin: 0 }} setState={(s: any) => {
                const newState = typeof s === 'function' ? s({ balance: user.balance, bet: betAmount, lastWin: 0 }) : s;
                const balanceDiff = newState.balance - user.balance;
                const wager = balanceDiff < 0 ? Math.abs(balanceDiff) : 0;
                updateBalance(user.id, balanceDiff, wager);
                if (newState.bet) setBetAmount(newState.bet);
              }} />
            </motion.div>
          )}

          {user && room === 'blackjack' && (
            <motion.div key="blackjack" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card">
              <Blackjack onBack={() => setRoom('lobby')} state={{ balance: user.balance, bet: betAmount, lastWin: 0 }} setState={(s: any) => {
                const newState = typeof s === 'function' ? s({ balance: user.balance, bet: betAmount, lastWin: 0 }) : s;
                const balanceDiff = newState.balance - user.balance;
                const wager = balanceDiff < 0 ? Math.abs(balanceDiff) : 0;
                updateBalance(user.id, balanceDiff, wager);
                if (newState.bet) setBetAmount(newState.bet);
              }} />
            </motion.div>
          )}

          {user && room === 'towers' && (
            <motion.div key="towers" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pet-card">
              <Towers onBack={() => setRoom('lobby')} state={{ balance: user.balance, bet: betAmount, lastWin: 0 }} setState={(s: any) => {
                const newState = typeof s === 'function' ? s({ balance: user.balance, bet: betAmount, lastWin: 0 }) : s;
                const balanceDiff = newState.balance - user.balance;
                const wager = balanceDiff < 0 ? Math.abs(balanceDiff) : 0;
                updateBalance(user.id, balanceDiff, wager);
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
                  <div className="space-y-3 font-bold text-[10px]">
                    {deposits.filter(r => r.userId === user.id).map(r => (
                      <div key={r.id} className="p-4 bg-slate-800 rounded-xl space-y-2 border border-slate-700">
                         <div className="flex justify-between items-center">
                           <div>
                               <div className="text-xs font-black text-white">💎 {r.amount.toLocaleString()}</div>
                               <div className="text-slate-500 uppercase tracking-widest">{new Date(r.timestamp).toLocaleString()}</div>
                           </div>
                           <span className={`px-3 py-1 rounded-full uppercase ${r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : r.status === 'rejected' ? 'bg-ps-pink/20 text-ps-pink' : 'bg-ps-yellow/20 text-ps-yellow'}`}>{r.status}</span>
                         </div>
                         {r.rejectionReason && (
                           <div className="p-2 bg-ps-pink/5 border border-ps-pink/20 rounded-lg text-ps-pink">
                              REASON: {r.rejectionReason}
                           </div>
                         )}
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
                  <div className="space-y-3 font-bold text-[10px]">
                    {withdrawals.filter(r => r.userId === user.id).map(r => (
                      <div key={r.id} className="p-4 bg-slate-800 rounded-xl space-y-2 border border-slate-700">
                         <div className="flex justify-between items-center">
                           <div>
                               <div className="text-xs font-black text-white">💎 {r.amount.toLocaleString()}</div>
                               <div className="text-slate-500 uppercase tracking-widest">{new Date(r.timestamp).toLocaleString()}</div>
                           </div>
                           <span className={`px-3 py-1 rounded-full uppercase ${r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : r.status === 'rejected' ? 'bg-ps-pink/20 text-ps-pink' : 'bg-ps-yellow/20 text-ps-yellow'}`}>{r.status}</span>
                         </div>
                         {r.rejectionReason && (
                           <div className="p-2 bg-ps-pink/5 border border-ps-pink/20 rounded-lg text-ps-pink">
                              REASON: {r.rejectionReason}
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
               </div>
               <button onClick={() => setRoom('lobby')} className="w-full text-center text-slate-500 font-bold hover:text-slate-300">Go Back</button>
            </div>
          )}

          {user && room === 'leaderboard' && (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="pet-card space-y-6">
                <div className="flex flex-col items-center gap-2">
                  <Trophy className="w-12 h-12 text-ps-yellow" />
                  <h2 className="text-3xl font-black text-white uppercase italic">Elite Players</h2>
                </div>

                <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl border-2 border-slate-800">
                  <button 
                    onClick={() => setLeaderboardTab('wagered')}
                    className={`flex-1 py-3 font-black uppercase italic rounded-xl transition-all ${leaderboardTab === 'wagered' ? 'bg-ps-yellow text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    High Rollers
                  </button>
                  <button 
                    onClick={() => setLeaderboardTab('balance')}
                    className={`flex-1 py-3 font-black uppercase italic rounded-xl transition-all ${leaderboardTab === 'balance' ? 'bg-ps-yellow text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    Richest
                  </button>
                </div>

                <div className="space-y-3">
                  {[...allUsers].sort((a, b) => {
                    if (leaderboardTab === 'wagered') return (b.totalWagered || 0) - (a.totalWagered || 0);
                    return b.balance - a.balance;
                  }).slice(0, 10).map((u, i) => (
                    <div key={u.id} className={`p-4 rounded-2xl flex justify-between items-center border-2 ${u.id === user.id ? 'bg-ps-yellow/10 border-ps-yellow' : 'bg-slate-800 border-slate-700'}`}>
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic ${i === 0 ? 'bg-ps-yellow text-slate-900' : i === 1 ? 'bg-slate-300 text-slate-900' : i === 2 ? 'bg-amber-700 text-white' : 'text-slate-500'}`}>
                          #{i + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white uppercase italic text-sm">{u.email}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {leaderboardTab === 'wagered' ? `${(u.totalWagered || 0).toLocaleString()} Wagered` : 'Currently Holding'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-ps-blue-light">💎 {leaderboardTab === 'balance' ? u.balance.toLocaleString() : (u.totalWagered || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setRoom('lobby')} className="w-full text-center text-slate-500 font-bold hover:text-slate-300">Go Back</button>
            </div>
          )}

          {room === 'admin' && (isAdminAuthenticated || (user && user.role === 'mod')) && (
            <div className="space-y-8 max-w-4xl mx-auto">
               {/* Global Admin Tools */}
               {isAdminAuthenticated && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="pet-card space-y-4">
                   <div className="flex items-center gap-2">
                     <Radio className={`w-6 h-6 ${maintenanceMode ? 'text-ps-pink animate-pulse' : 'text-emerald-400'}`} />
                     <h3 className="text-xl font-black text-white uppercase italic">System Status</h3>
                   </div>
                   <button 
                     onClick={() => setMaintenanceMode(!maintenanceMode)}
                     className={`w-full pet-button ${maintenanceMode ? 'bg-emerald-500 border-emerald-600' : 'bg-ps-pink border-pink-700'} py-4 flex flex-col items-center`}
                   >
                     <span className="text-sm font-black uppercase">{maintenanceMode ? 'End Maintenance' : 'Start Maintenance'}</span>
                     <span className="text-[10px] opacity-80">{maintenanceMode ? 'Resume all player access' : 'Lock all non-admins out'}</span>
                   </button>
                   <button 
                     onClick={clearLeaderboard}
                     className="w-full py-3 bg-slate-900 border-2 border-slate-700 rounded-2xl text-[10px] font-black uppercase text-ps-yellow hover:border-ps-yellow transition-all"
                   >
                     Reset Leaderboard (Clear Wagers)
                   </button>
                   <button 
                     onClick={() => awardAllUsers(10000)}
                     className="w-full py-3 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl text-[10px] font-black uppercase text-emerald-400 hover:border-emerald-500 transition-all flex items-center justify-center gap-2"
                   >
                     <PlusCircle className="w-3 h-3" /> Award 10K to All Users
                   </button>
                 </div>

                 <div className="pet-card space-y-4">
                   <div className="flex items-center gap-2">
                     <Megaphone className="w-6 h-6 text-ps-blue-light" />
                     <h3 className="text-xl font-black text-white uppercase italic">Broadcast Message</h3>
                   </div>
                   <textarea 
                     id="broadcast_input"
                     placeholder="Type something important..."
                     className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-xs font-bold focus:border-ps-yellow outline-none h-24"
                   ></textarea>
                   <button 
                     onClick={() => {
                        const val = (document.getElementById('broadcast_input') as HTMLTextAreaElement).value;
                        if (val) {
                          broadcastAnnouncement(val);
                          (document.getElementById('broadcast_input') as HTMLTextAreaElement).value = '';
                        }
                     }}
                     className="w-full pet-button bg-ps-blue-light border-blue-600 py-3 text-sm font-black italic"
                   >
                     Send Global Announcement
                   </button>
                 </div>
               </div>
               )}

               <div className="pet-card">
                  <h2 className="text-2xl font-black text-white uppercase italic mb-6">Admin Console: Users</h2>
                  <div className="space-y-4">
                    {allUsers.filter(u => u.email.toLowerCase().includes(adminSearch.toLowerCase())).map(u => (
                      <div key={u.id} className="p-4 bg-slate-800 rounded-2xl flex justify-between items-center border-2 border-slate-700">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-300">{u.email}</p>
                            {u.role === 'admin' && <span className="bg-ps-yellow text-slate-900 px-2 py-0.5 rounded text-[8px] font-black uppercase">Admin</span>}
                            {u.role === 'mod' && <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">Mod</span>}
                          </div>
                          <p className="text-xl font-bold text-ps-blue-light">💎 {u.balance.toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col gap-4 min-w-[320px]">
                           {/* Add Mod Toggle */}
                           {u.role !== 'admin' && (
                             <button 
                               onClick={() => toggleModStatus(u.id)}
                               className={`w-full py-3 rounded-xl border-4 text-xs font-black uppercase italic transition-all flex items-center justify-center gap-2 ${u.role === 'mod' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-ps-yellow'}`}
                             >
                               <Shield className="w-4 h-4" />
                               {u.role === 'mod' ? 'Remove Moderator' : 'Make All Time Mod'}
                             </button>
                           )}

                           <div className="flex gap-3 items-center">
                              <input 
                                type="number" 
                                id={`admin_amt_${u.id}`} 
                                className="pet-input !py-4 !px-6 w-36 text-lg font-black" 
                                placeholder="0"
                              />
                              <button onClick={() => {
                                const amt = parseInt((document.getElementById(`admin_amt_${u.id}`) as HTMLInputElement).value);
                                if (!isNaN(amt)) updateBalance(u.id, -amt);
                              }} className="pet-button bg-ps-pink border-pink-700 shadow-[0_6px_0_rgb(190,24,93)] py-4 px-8 text-xl font-black active:shadow-none active:translate-y-1 transition-all">-</button>
                              <button onClick={() => {
                                const amt = parseInt((document.getElementById(`admin_amt_${u.id}`) as HTMLInputElement).value);
                                if (!isNaN(amt)) updateBalance(u.id, amt);
                              }} className="pet-button bg-emerald-500 border-emerald-600 shadow-[0_6px_0_rgb(6,95,70)] py-4 px-8 text-xl font-black active:shadow-none active:translate-y-1 transition-all">+</button>
                           </div>
                           
                           <div className="flex gap-2">
                             {u.banInfo && u.banInfo.until > Date.now() ? (
                               <div className="flex-1 flex flex-col gap-3 p-4 bg-ps-pink/10 border-4 border-ps-pink/30 rounded-2xl shadow-inner">
                                 <div className="flex justify-between items-center gap-4">
                                   <div className="flex flex-col">
                                     <span className="text-[10px] font-black text-ps-pink uppercase tracking-widest">Banned User</span>
                                     <span className="text-sm font-black text-white uppercase italic">Ends {new Date(u.banInfo.until).toLocaleDateString()}</span>
                                   </div>
                                   <button onClick={() => unbanUser(u.id)} className="pet-button bg-ps-pink py-3 px-6 text-xs border-pink-700 shadow-[0_4px_0_rgb(190,24,93)] active:shadow-none active:translate-y-1">UNBAN PLAYER</button>
                                 </div>
                                 {u.banInfo.appeal && (
                                   <div className="mt-2 p-3 bg-slate-950 rounded-xl border-2 border-ps-pink/20 shadow-lg">
                                     <div className="flex items-center gap-2 mb-2">
                                       <div className="w-2 h-2 rounded-full bg-ps-pink animate-pulse"></div>
                                       <p className="text-[10px] font-black text-ps-pink uppercase tracking-widest">APPEAL SUBMITTED</p>
                                     </div>
                                     <p className="text-sm text-slate-300 font-bold italic leading-relaxed">"{u.banInfo.appeal.text}"</p>
                                   </div>
                                 )}
                               </div>
                             ) : (
                               <button 
                                 onClick={() => setBanningUser(banningUser === u.id ? null : u.id)} 
                                 className="flex-1 py-4 px-6 bg-slate-900 border-4 border-slate-700 rounded-2xl text-sm font-black uppercase text-ps-pink hover:border-ps-pink transition-all shadow-xl hover:scale-[1.02] active:scale-95"
                               >
                                 {banningUser === u.id ? 'Cancel Ban Dialog' : '⚠️ Ban Player Account'}
                               </button>
                             )}
                           </div>
                           
                           {banningUser === u.id && (
                             <div className="p-4 bg-slate-900 rounded-xl border-2 border-ps-pink space-y-3 mt-1 shadow-2xl">
                               <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1">
                                   <label className="text-[10px] font-black text-slate-500 uppercase">Days</label>
                                   <input 
                                     type="number" 
                                     value={banDurationDays} 
                                     onChange={(e) => setBanDurationDays(e.target.value)}
                                     className="w-full bg-slate-800 rounded-lg border-2 border-slate-700 p-2 text-sm font-bold outline-none focus:border-ps-pink"
                                   />
                                 </div>
                                 <div className="space-y-1">
                                   <label className="text-[10px] font-black text-slate-500 uppercase">Reason</label>
                                   <input 
                                     type="text" 
                                     value={banReason} 
                                     onChange={(e) => setBanReason(e.target.value)}
                                     placeholder="Reason..."
                                     className="w-full bg-slate-800 rounded-lg border-2 border-slate-700 p-2 text-sm font-bold outline-none focus:border-ps-pink"
                                   />
                                 </div>
                               </div>
                               <button onClick={() => banUser(u.id)} className="w-full pet-button bg-ps-pink py-3 text-sm font-black italic">Confirm Ban</button>
                             </div>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="pet-card">
                  <h2 className="text-2xl font-black text-emerald-400 uppercase italic mb-6">Pending Deposits</h2>
                  <div className="space-y-3">
                    {deposits.filter(r => r.status === 'pending').map(r => (
                       <div key={r.id} className="p-4 bg-slate-800 border-2 border-slate-700 rounded-xl flex flex-col space-y-4">
                          <div className="flex justify-between items-center">
                             <div>
                               <p className="font-bold text-slate-300">{r.userEmail}</p>
                               {r.robloxUsername && <p className="text-xs font-black text-ps-yellow uppercase">Roblox: {r.robloxUsername}</p>}
                               <p className="text-xl font-black text-white">💎 {r.amount.toLocaleString()}</p>
                             </div>
                             <div className="flex gap-2">
                               {rejectingRequest?.id === r.id ? (
                                 <button onClick={() => { setRejectingRequest(null); setRejectionReason(''); }} className="pet-button bg-slate-700 py-3 px-6 text-sm font-black italic">Cancel</button>
                               ) : (
                                 <button onClick={() => setRejectingRequest({id: r.id, type: 'deposit'})} className="pet-button bg-ps-pink py-3 px-6 text-sm font-black italic border-pink-700 shadow-[0_4px_0_rgb(190,24,93)]">Reject</button>
                               )}
                               <button onClick={() => completeDeposit(r.id)} className="pet-button bg-emerald-500 py-3 px-6 text-sm font-black italic border-emerald-600 shadow-[0_4px_0_rgb(6,95,70)]">Credit User</button>
                             </div>
                          </div>
                          {rejectingRequest?.id === r.id && rejectingRequest.type === 'deposit' && (
                            <div className="mt-2 p-4 bg-slate-900 rounded-xl border-2 border-ps-pink space-y-3">
                              <p className="text-[10px] font-black text-ps-pink uppercase">Rejection Reason:</p>
                              <input 
                                type="text" 
                                value={rejectionReason} 
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="pet-input w-full"
                                placeholder="Reason (e.g. Gems not received)..."
                              />
                              <button onClick={() => rejectDeposit(r.id, rejectionReason)} className="w-full pet-button bg-ps-pink text-xs">Confirm Reject</button>
                            </div>
                          )}
                       </div>
                    ))}
                  </div>
               </div>

               <div className="pet-card">
                  <h2 className="text-2xl font-black text-ps-pink uppercase italic mb-6">Pending Mailbox Tasks</h2>
                  <div className="space-y-3">
                    {withdrawals.filter(r => r.status === 'pending').map(r => (
                       <div key={r.id} className="p-4 bg-slate-800 border-2 border-slate-700 rounded-xl flex flex-col space-y-4">
                          <div className="flex justify-between items-center">
                             <div>
                               <p className="font-bold text-slate-300">{r.userEmail}</p>
                               {r.robloxUsername && <p className="text-xs font-black text-ps-yellow uppercase">Roblox: {r.robloxUsername}</p>}
                               <p className="text-xl font-black text-white">💎 {r.amount.toLocaleString()}</p>
                             </div>
                             <div className="flex gap-2">
                                {rejectingRequest?.id === r.id ? (
                                  <button onClick={() => { setRejectingRequest(null); setRejectionReason(''); }} className="pet-button bg-slate-700 py-2 px-4 text-xs">Cancel</button>
                                ) : (
                                  <button onClick={() => setRejectingRequest({id: r.id, type: 'withdrawal'})} className="pet-button bg-ps-pink py-2 px-4 text-xs border-pink-700 shadow-[0_4px_0_rgb(190,24,93)]">Reject</button>
                                )}
                                <button onClick={() => completeWithdrawal(r.id)} className="pet-button bg-emerald-500 py-2 px-4 text-xs border-emerald-600 shadow-[0_4px_0_rgb(6,95,70)]">Mark Done</button>
                             </div>
                          </div>
                          {rejectingRequest?.id === r.id && rejectingRequest.type === 'withdrawal' && (
                            <div className="mt-2 p-4 bg-slate-900 rounded-xl border-2 border-ps-pink space-y-3">
                              <p className="text-[10px] font-black text-ps-pink uppercase">Rejection Reason:</p>
                              <input 
                                type="text" 
                                value={rejectionReason} 
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="pet-input w-full"
                                placeholder="Reason (e.g. Mailbox full)..."
                              />
                              <button onClick={() => rejectWithdrawal(r.id, rejectionReason)} className="w-full pet-button bg-ps-pink text-xs">Confirm Reject</button>
                            </div>
                          )}
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
    </div>

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
