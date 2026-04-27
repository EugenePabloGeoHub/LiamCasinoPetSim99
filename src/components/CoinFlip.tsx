import { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { GameSessionState } from '../types';
import { parseAmount } from '../lib/utils';

export default function CoinFlip({ onBack, state, setState }: { onBack: () => void, state: GameSessionState, setState: Dispatch<SetStateAction<GameSessionState>> }) {
  const [flipping, setFlipping] = useState(false);
  const [side, setSide] = useState<'heads' | 'tails'>('heads');
  const [message, setMessage] = useState('');
  const [betInput, setBetInput] = useState(state.bet.toString());

  const flip = async (choice: 'heads' | 'tails') => {
    const currentBet = parseAmount(betInput);
    if (flipping || state.balance < currentBet || currentBet <= 0) return;

    setFlipping(true);
    setMessage('');
    setState(s => ({ ...s, balance: Math.max(0, s.balance - currentBet), bet: currentBet }));

    const spins = 10;
    for (let i = 0; i < spins; i++) {
      setSide(Math.random() > 0.5 ? 'heads' : 'tails');
      await new Promise(r => setTimeout(r, 100));
    }

    const result = Math.random() > 0.5 ? 'heads' : 'tails';
    setSide(result);
    setFlipping(false);

    if (choice === result) {
      const win = Math.floor(currentBet * 1.9);
      setState(s => ({ ...s, balance: s.balance + win }));
      setMessage(`YOU WON ${win.toLocaleString()} GEMS! 🎉`);
    } else {
      setMessage('Unlucky! Try again.');
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
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Coin Flip</h2>
        <p className="text-slate-400 font-bold text-sm">Heads or Tails? (1.9x Payout)</p>
        <p className="text-slate-600 font-bold text-[9px] uppercase tracking-tighter mt-1">House Edge: 5% | Provably Fair: 50% chance</p>
      </div>

      <div className="relative h-48 w-48">
        <motion.div
          animate={flipping ? { rotateY: 360 * 5, scale: [1, 1.2, 1] } : { rotateY: 0, scale: 1 }}
          transition={{ duration: 1 }}
          className="w-full h-full bg-ps-yellow rounded-full border-[10px] border-yellow-600 flex items-center justify-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
          <span className="text-8xl font-black text-slate-900 drop-shadow-2xl">{side === 'heads' ? 'H' : 'T'}</span>
        </motion.div>
      </div>

      <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
        <div className="h-8 text-center px-4">
          <AnimatePresence>
            {message && (
              <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-black text-ps-pink text-xl uppercase italic">
                {message}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button onClick={() => flip('heads')} disabled={flipping || state.balance < parseAmount(betInput)} className="pet-button bg-ps-blue-light text-slate-900 border-sky-400 shadow-[0_4px_0_rgb(7,89,133)]">
            Heads
          </button>
          <button onClick={() => flip('tails')} disabled={flipping || state.balance < parseAmount(betInput)} className="pet-button bg-ps-pink text-white border-pink-700 shadow-[0_4px_0_rgb(190,24,93)]">
            Tails
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
