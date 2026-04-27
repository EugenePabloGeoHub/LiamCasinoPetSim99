import { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Zap, Coins } from 'lucide-react';
import { GameSessionState } from '../types';
import { parseAmount } from '../lib/utils';

const SYMBOLS = ['💎', '🍭', '🍕', '🐉', '🎁', '⚡', '👑'];
const PAYOUTS: Record<string, number> = {
  '👑': 100,
  '⚡': 50,
  '🐉': 25,
  '💎': 15,
  '🎁': 10,
  '🍕': 5,
  '🍭': 2
};

export default function SlotMachine({ onBack, state, setState }: { onBack: () => void, state: GameSessionState, setState: Dispatch<SetStateAction<GameSessionState>> }) {
  const [reels, setReels] = useState(['💎', '💎', '💎']);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [betInput, setBetInput] = useState(state.bet.toString());
  
  const spin = async () => {
    const currentBet = parseAmount(betInput);
    if (spinning || state.balance < currentBet || currentBet <= 0) return;

    setSpinning(true);
    setMessage('');
    setState(s => ({ ...s, balance: Math.max(0, s.balance - currentBet), bet: currentBet }));

    const rolls = 15;
    for (let i = 0; i < rolls; i++) {
        setReels([
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ]);
        await new Promise(r => setTimeout(r, 60 + (i * 15)));
    }

    const final = [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    ];
    setReels(final);
    setSpinning(false);

    if (final[0] === final[1] && final[1] === final[2]) {
      const win = currentBet * PAYOUTS[final[0]];
      setState(s => ({ ...s, balance: s.balance + win }));
      setMessage(`MEGA WIN! +${win.toLocaleString()} GEMS! 🎉`);
    } else if (new Set(final).size < 3) {
      // 2-match is a partial refund (0.8x) - usually a loss in casino terms
      const win = Math.floor(currentBet * 0.8);
      setState(s => ({ ...s, balance: s.balance + win }));
      setMessage(`Almost! Refunded ${win.toLocaleString()} GEMS.`);
    } else {
      setMessage('Unlucky! Spinning again?');
    }
  };

  const handleBetChange = (val: string) => {
    setBetInput(val);
    const parsed = parseAmount(val);
    if (parsed > 0) {
      setState(s => ({ ...s, bet: parsed }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 space-y-8 h-full bg-slate-900 rounded-3xl">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Emerald Reels</h2>
        <p className="text-slate-400 font-bold text-sm">Spin to match 3 symbols. Crowns pay 100x!</p>
        <p className="text-slate-600 font-bold text-[9px] uppercase tracking-tighter mt-1">House Edge: 8% | Favored Odds Disclaimed</p>
      </div>

      <div className="flex gap-4 p-6 bg-slate-800 rounded-3xl border-8 border-slate-700 shadow-inner">
        {reels.map((symbol, i) => (
          <motion.div 
            key={i} 
            animate={spinning ? { y: [0, -10, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.1 }}
            className="w-24 h-32 bg-slate-950 rounded-2xl flex items-center justify-center text-5xl shadow-2xl border-b-8 border-slate-900"
          >
            {symbol}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
         <div className="space-y-1">
            <p className="text-ps-yellow">👑 3x Crown: 100x</p>
            <p className="text-ps-blue-light">⚡ 3x Zap: 50x</p>
            <p className="text-emerald-400">🐉 3x Dragon: 25x</p>
         </div>
         <div className="space-y-1 text-right">
            <p>💎 3x Gem: 15x</p>
            <p>🎁 3x Gift: 10x</p>
            <p className="text-ps-pink">Any 2 Match: 0.8x</p>
         </div>
      </div>

      <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
        <div className="h-8 text-center px-4">
            <AnimatePresence>
                {message && (
                    <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-ps-pink block uppercase italic">
                        {message}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
        
        <div className="flex flex-col w-full space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Wager Amount</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={betInput} 
              onChange={(e) => handleBetChange(e.target.value)}
              className="flex-1 bg-slate-950 border-4 border-slate-800 rounded-xl px-4 py-2 text-white font-black text-lg focus:border-ps-blue-light outline-none transition-all"
              placeholder="e.g. 50k, 1m"
            />
            <div className="flex gap-1">
              <button onClick={() => handleBetChange((Math.floor(parseAmount(betInput) / 2)).toString())} className="px-3 bg-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-colors text-xs border-2 border-slate-700 uppercase">1/2</button>
              <button onClick={() => handleBetChange((parseAmount(betInput) * 2).toString())} className="px-3 bg-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-colors text-xs border-2 border-slate-700 uppercase">x2</button>
              <button onClick={() => handleBetChange(state.balance.toString())} className="px-3 bg-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-colors text-xs border-2 border-slate-700 uppercase">Max</button>
            </div>
          </div>
        </div>

        <button onClick={spin} disabled={spinning || state.balance < parseAmount(betInput)} className="pet-button w-full py-5 flex items-center justify-center gap-3">
          <Zap className={`w-6 h-6 ${spinning ? 'animate-pulse' : ''}`} />
          <span className="text-xl">SPIN ({parseAmount(betInput).toLocaleString()})</span>
        </button>

        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 font-bold transition-colors flex items-center uppercase text-xs tracking-widest">
           <ChevronLeft className="w-5 h-5 mr-1" /> Exit Game
        </button>
      </div>
    </div>
  );
}
