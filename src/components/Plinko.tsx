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

const MULTIPLIERS = [10, 4, 1.5, 0.4, 0.1, 0.4, 1.5, 4, 10];

export default function Plinko({ onBack, state, setState }: { onBack: () => void; state: GameSessionState; setState: any }) {
  const [activeBalls, setActiveBalls] = useState<{ id: number; pathX: number[]; pathY: number[]; bet: number; mult: number }[]>([]);
  const [message, setMessage] = useState('');
  const [betInput, setBetInput] = useState(state.bet.toString());
  const ballIdCounter = useRef(0);

  const dropBall = () => {
    const currentBet = parseAmount(betInput);
    if (state.balance < currentBet || currentBet <= 0) return;

    setMessage('');
    setState((s: any) => ({ ...s, balance: Math.max(0, s.balance - currentBet), bet: currentBet }));

    let currentX = 250;
    let currentY = 50;
    const pathX = [currentX];
    const pathY = [currentY];

    for (let i = 0; i < ROWS; i++) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      currentX += direction * 20;
      currentY += 40;
      pathX.push(currentX);
      pathY.push(currentY);
    }

    // End point jitter for bucket landing
    const finalX = currentX + (Math.random() * 10 - 5);
    const finalY = currentY + 30;
    pathX.push(finalX);
    pathY.push(finalY);

    const bucketIndex = Math.round((currentX - 90) / 40);
    const clampedIndex = Math.max(0, Math.min(MULTIPLIERS.length - 1, bucketIndex));
    const mult = MULTIPLIERS[clampedIndex];

    const newBall = {
      id: ballIdCounter.current++,
      pathX,
      pathY,
      bet: currentBet,
      mult
    };

    setActiveBalls(prev => [...prev, newBall]);
  };

  const onBallComplete = (ballId: number, mult: number, bet: number) => {
    const winAmt = Math.floor(bet * mult);
    setState((s: any) => ({ ...s, balance: s.balance + winAmt }));
    
    if (mult > 1) {
      setMessage(`WIN x${mult}! +${winAmt.toLocaleString()} 🎉`);
    } else if (mult < 1) {
      setMessage(`- ${Math.floor(bet - winAmt).toLocaleString()} GEMS`);
    } else {
      setMessage('Even split 🤝');
    }

    // Remove ball after a short delay
    setTimeout(() => {
      setActiveBalls(prev => prev.filter(b => b.id !== ballId));
    }, 500);
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
        <p className="text-slate-400 font-bold text-sm">Drop gems and hit multipliers up to 12x!</p>
        <p className="text-slate-600 font-bold text-[9px] uppercase tracking-tighter mt-1">Provably Fair: Random Path</p>
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

        {/* Balls */}
        <AnimatePresence>
          {activeBalls.map((ball) => (
            <motion.div
              key={ball.id}
              initial={{ x: ball.pathX[0] - 10, y: ball.pathY[0] - 10 }}
              animate={{ 
                x: ball.pathX.map(x => x - 10),
                y: ball.pathY.map(y => y - 10)
              }}
              transition={{ 
                duration: 1.5, 
                ease: "linear",
                times: ball.pathX.map((_, i) => i / (ball.pathX.length - 1))
              }}
              onAnimationComplete={() => onBallComplete(ball.id, ball.mult, ball.bet)}
              className="absolute w-6 h-6 bg-ps-yellow rounded-full shadow-2xl border-2 border-white flex items-center justify-center text-xs z-10"
            >
              💎
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="h-8 text-center px-4">
          <AnimatePresence mode="wait">
            {message && (
              <motion.span 
                key={message}
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ opacity: 0 }}
                className={`font-black text-lg block uppercase italic ${!message.includes('-') ? 'text-ps-blue-light' : 'text-ps-pink'}`}
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
          disabled={state.balance < parseAmount(betInput)} 
          className="pet-button w-full flex items-center justify-center gap-2 py-4 active:scale-95 transition-transform"
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
