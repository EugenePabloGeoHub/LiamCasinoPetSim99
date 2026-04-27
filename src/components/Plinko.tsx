import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Play } from 'lucide-react';
import { GameSessionState } from '../types';
import { parseAmount } from '../lib/utils';

const ROWS = 8;
const PEGS: { x: number; y: number }[] = [];
for (let i = 0; i < ROWS; i++) {
  const rowY = 100 + i * 40;
  const numPegs = i + 3;
  const startX = 250 - (numPegs - 1) * 20;
  for (let j = 0; j < numPegs; j++) {
    PEGS.push({ x: startX + j * 40, y: rowY });
  }
}

const MULTIPLIERS = [10, 5, 1.5, 0.5, 0.2, 0.5, 1.5, 5, 10];

export default function Plinko({ onBack, state, setState }: { onBack: () => void; state: GameSessionState; setState: any }) {
  const [isDropping, setIsDropping] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 250, y: 50 });
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [betInput, setBetInput] = useState(state.bet.toString());

  const dropBall = async () => {
    const currentBet = parseAmount(betInput);
    if (isDropping || state.balance < currentBet || currentBet <= 0) return;

    setIsDropping(true);
    setResult(null);
    setMessage('');
    setState((s: any) => ({ ...s, balance: Math.max(0, s.balance - currentBet), bet: currentBet }));

    let currentX = 250;
    let currentY = 50;
    const path = [];

    for (let i = 0; i < ROWS; i++) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      currentX += direction * 20;
      currentY += 40;
      path.push({ x: currentX, y: currentY });
    }

    // currentX ranges from 90 to 410 with ROWS=8 (steps of +/- 20)
    const bucketIndex = Math.round((currentX - 90) / 40);
    const clampedIndex = Math.max(0, Math.min(MULTIPLIERS.length - 1, bucketIndex));
    const mult = MULTIPLIERS[clampedIndex];

    for (const pos of path) {
      setBallPos(pos);
      await new Promise(r => setTimeout(r, 80)); // Slightly faster drop
    }

    const winAmt = Math.floor(currentBet * mult);
    setState((s: any) => ({ ...s, balance: s.balance + winAmt }));
    setResult(mult);
    
    if (mult > 1) {
      setMessage(`${mult === 10 ? 'INSANE!' : 'JACKPOT!'} x${mult} - +${winAmt.toLocaleString()} GEMS! 🎉`);
    } else if (mult < 1) {
      setMessage(`UNLUCKY - You only got +${winAmt.toLocaleString()} GEMS back.`);
    } else {
      setMessage('Broke even - Returned all gems.');
    }

    setTimeout(() => {
      setIsDropping(false);
      setBallPos({ x: 250, y: 50 });
    }, 1000);
  };

  const handleBetChange = (val: string) => {
    setBetInput(val);
    const parsed = parseAmount(val);
    if (parsed > 0) {
      setState((s: any) => ({ ...s, bet: parsed }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 space-y-8 h-full bg-slate-900 rounded-3xl">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Gem Plinko</h2>
        <p className="text-slate-400 font-bold text-sm">Drop the gem and hit huge multipliers!</p>
        <p className="text-slate-600 font-bold text-[9px] uppercase tracking-tighter mt-1">House Edge: 8% | Up to 10x Multiplier</p>
      </div>

      <div className="relative w-full max-w-[500px] h-[500px] bg-slate-950 rounded-3xl border-8 border-slate-800 overflow-hidden shadow-inner font-bold">
        {/* Pegs */}
        {PEGS.map((peg, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-slate-800 rounded-full"
            style={{ left: peg.x - 4, top: peg.y - 4 }}
          />
        ))}

        {/* Multipliers */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-1">
          {MULTIPLIERS.map((m, i) => (
            <div
              key={i}
              className={`flex-1 py-3 text-center rounded-xl text-slate-950 text-xs font-black border-b-4 border-black/20 ${
                m >= 2 ? 'bg-emerald-400' : m >= 1 ? 'bg-ps-yellow' : 'bg-ps-pink'
              }`}
            >
              x{m}
            </div>
          ))}
        </div>

        {/* Ball */}
        <motion.div
          animate={{ x: ballPos.x - 10, y: ballPos.y - 10 }}
          transition={{ type: 'spring', damping: 10 }}
          className="absolute w-6 h-6 bg-ps-yellow rounded-full shadow-2xl border-2 border-white flex items-center justify-center text-xs z-10"
        >
          💎
        </motion.div>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="h-8 text-center px-4">
          <AnimatePresence>
            {message && (
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className={`font-black text-lg block uppercase italic ${result && result >= 1 ? 'text-ps-blue-light' : 'text-ps-pink'}`}
              >
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

        <button 
          onClick={dropBall} 
          disabled={isDropping || state.balance < parseAmount(betInput)} 
          className="pet-button w-full flex items-center justify-center gap-2 py-4"
        >
          <Play className="w-6 h-6" />
          <span className="text-xl">Drop Ball ({parseAmount(betInput).toLocaleString()})</span>
        </button>

        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 font-bold transition-colors flex items-center justify-center uppercase text-xs tracking-widest">
          <ChevronLeft className="w-5 h-5 mr-1" /> Exit Game
        </button>
      </div>
    </div>
  );
}
