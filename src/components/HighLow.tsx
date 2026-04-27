import { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { GameSessionState } from '../types';
import { parseAmount } from '../lib/utils';

const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export default function HighLow({ onBack, state, setState }: { onBack: () => void, state: GameSessionState, setState: Dispatch<SetStateAction<GameSessionState>> }) {
  const [current, setCurrent] = useState(VALUES[Math.floor(Math.random() * VALUES.length)]);
  const [next, setNext] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [message, setMessage] = useState('');
  const [betInput, setBetInput] = useState(state.bet.toString());

  const guess = (type: 'higher' | 'lower') => {
    const currentBet = parseAmount(betInput);
    if (isRevealing || state.balance < currentBet || currentBet <= 0) return;

    setIsRevealing(true);
    setMessage('');
    setState(s => ({ ...s, balance: Math.max(0, s.balance - currentBet), bet: currentBet }));

    const mystery = VALUES[Math.floor(Math.random() * VALUES.length)];
    setNext(mystery);

    setTimeout(() => {
      const win = type === 'higher' ? mystery > current : mystery < current;
      
      if (win) {
        const winAmt = Math.floor(currentBet * 1.9);
        setState(s => ({ ...s, balance: s.balance + winAmt }));
        setMessage(`WINNER! +${winAmt.toLocaleString()} GEMS! 🎉`);
      } else {
        setMessage('Unlucky! Try again.');
      }

      setTimeout(() => {
        setCurrent(mystery);
        setNext(null);
        setIsRevealing(false);
      }, 1500);
    }, 800);
  };

  const handleBetChange = (val: string) => {
    setBetInput(val);
    const parsed = parseAmount(val);
    if (parsed > 0) {
      setState(s => ({ ...s, bet: parsed }));
    }
  };

  const getLabel = (v: number) => {
    if (v <= 10) return v.toString();
    if (v === 11) return 'J';
    if (v === 12) return 'Q';
    if (v === 13) return 'K';
    if (v === 14) return 'A';
    return v.toString();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 space-y-8 h-full bg-slate-900 rounded-3xl">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">High or Low</h2>
        <p className="text-slate-400 font-bold text-sm">Predict if the next mystery card is bigger or smaller!</p>
        <p className="text-slate-600 font-bold text-[9px] uppercase tracking-tighter mt-1">Payout: 1.9x | House Edge: 5% (Ties lose)</p>
      </div>

      <div className="flex items-center space-x-6 sm:space-x-12">
        <div className="w-28 sm:w-32 h-40 sm:h-48 rounded-[2rem] border-4 flex flex-col items-center justify-center relative bg-slate-800 border-ps-blue-light shadow-2xl">
            <span className="text-5xl sm:text-6xl font-black text-ps-blue-light">{getLabel(current)}</span>
            <span className="absolute bottom-3 text-[10px] font-black text-slate-500 uppercase italic">Current</span>
        </div>

        <div className="text-ps-pink font-black text-2xl uppercase italic">VS</div>

        <div className="w-28 sm:w-32 h-40 sm:h-48 rounded-[2rem] border-4 flex items-center justify-center relative bg-slate-950 border-dashed border-slate-700">
            <AnimatePresence mode="wait">
                {next === null ? (
                    <motion.span key="q" className="text-5xl font-black text-slate-800">?</motion.span>
                ) : (
                    <motion.span key="v" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl sm:text-6xl font-black text-ps-pink italic">{getLabel(next)}</motion.span>
                )}
            </AnimatePresence>
            <span className="absolute bottom-3 text-[10px] font-black text-slate-500 uppercase italic">Next</span>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
        <div className="h-8 text-center px-4">
            <AnimatePresence>
                {message && (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-black text-ps-pink text-lg block uppercase italic">
                        {message}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button onClick={() => guess('higher')} disabled={isRevealing || state.balance < parseAmount(betInput)} className="pet-button bg-ps-blue-light border-sky-400 text-slate-900 shadow-[0_4px_0_rgb(7,89,133)] flex flex-col items-center space-y-2">
            <ArrowUp className="w-6 h-6" />
            <span>Higher</span>
          </button>
          <button onClick={() => guess('lower')} disabled={isRevealing || state.balance < parseAmount(betInput)} className="pet-button bg-ps-pink flex flex-col items-center space-y-2 text-white border-pink-700 shadow-[0_4px_0_rgb(190,24,93)]">
            <ArrowDown className="w-6 h-6" />
            <span>Lower</span>
          </button>
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

        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 font-bold transition-colors flex items-center uppercase text-xs tracking-widest">
          <ChevronLeft className="w-5 h-5 mr-1" /> Exit Game
        </button>
      </div>
    </div>
  );
}
