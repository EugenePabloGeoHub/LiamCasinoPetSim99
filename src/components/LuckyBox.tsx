import { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Box, Sparkles } from 'lucide-react';
import { GameSessionState } from '../types';
import { parseAmount } from '../lib/utils';

const ITEMS = [
  { name: 'Huge Dragon', emoji: '🐲', chance: 0.005, mult: 50 },
  { name: 'Titanic Gem', emoji: '💎', chance: 0.015, mult: 10 },
  { name: 'Golden Gift', emoji: '🎁', chance: 0.04, mult: 5 },
  { name: 'Crystal Key', emoji: '🔑', chance: 0.10, mult: 2 },
  { name: 'Magic Potion', emoji: '🧪', chance: 0.84, mult: 0.1 }
];

export default function LuckyBox({ onBack, state, setState }: { onBack: () => void, state: GameSessionState, setState: Dispatch<SetStateAction<GameSessionState>> }) {
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [betInput, setBetInput] = useState(state.bet.toString());

  const openBox = async () => {
    const currentBet = parseAmount(betInput);
    if (opening || state.balance < currentBet || currentBet <= 0) return;

    setOpening(true);
    setResult(null);
    setMessage('');
    
    // Deduct bet immediately
    setState(s => ({ ...s, balance: Math.max(0, s.balance - currentBet), bet: currentBet }));

    await new Promise(r => setTimeout(r, 1500));

    const rand = Math.random();
    let cumulative = 0;
    let selectedItem = ITEMS[ITEMS.length - 1];

    for (const item of ITEMS) {
      cumulative += item.chance;
      if (rand <= cumulative) {
        selectedItem = item;
        break;
      }
    }

    setResult(selectedItem);
    const winAmt = Math.floor(currentBet * selectedItem.mult);
    setState(s => ({ ...s, balance: s.balance + winAmt }));
    setOpening(false);

    if (selectedItem.mult >= 5) {
      setMessage(`INSANE! You pulled a ${selectedItem.name}! 💎`);
    } else if (selectedItem.mult >= 1) {
      setMessage(`Nice! You got a ${selectedItem.name}.`);
    } else {
      setMessage(`Ouch... just a ${selectedItem.name}.`);
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
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Lucky Box</h2>
        <p className="text-slate-400 font-bold text-sm">Open crates for huge rewards!</p>
        <p className="text-slate-600 font-bold text-[9px] uppercase tracking-tighter mt-1">House Edge: 11.6% | Huge Dragon 0.5% Chance</p>
      </div>

      <div className="relative h-64 w-full flex items-center justify-center bg-slate-950 rounded-3xl border-8 border-slate-800 shadow-inner overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent"></div>
        
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="box"
              animate={opening ? { 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, -5, 5, 0],
                y: [0, -10, 0]
              } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="relative"
            >
              <Box className={`w-32 h-32 ${opening ? 'text-ps-yellow' : 'text-slate-700'}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">?</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1.5, rotate: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                <span className="text-6xl">{result.emoji}</span>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <div className="text-white font-black uppercase text-xl italic">{result.name}</div>
                <div className="text-ps-blue-light font-bold">x{result.mult} Multiplier</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {opening && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-x-0 bottom-8 flex justify-center"
          >
             <div className="flex gap-2">
                <div className="w-2 h-2 bg-ps-yellow rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-ps-yellow rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-ps-yellow rounded-full animate-bounce delay-300"></div>
             </div>
          </motion.div>
        )}
      </div>

      <div className="w-full max-w-md grid grid-cols-2 gap-2 text-[9px] font-black uppercase text-slate-500 bg-slate-800/30 p-4 rounded-xl">
        {ITEMS.map(item => (
          <div key={item.name} className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-800">
             <span>{item.emoji} {item.name}</span>
             <span className={item.mult >= 1 ? 'text-ps-yellow' : 'text-ps-pink'}>{(item.chance * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
        <div className="h-8 text-center">
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

        <button onClick={openBox} disabled={opening || state.balance < parseAmount(betInput)} className="pet-button w-full flex items-center justify-center gap-3 py-5">
          <Sparkles className="w-6 h-6" />
          <span className="text-xl">OPEN BOX ({parseAmount(betInput).toLocaleString()})</span>
        </button>

        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 font-bold transition-colors flex items-center uppercase text-xs tracking-widest">
           <ChevronLeft className="w-5 h-5 mr-1" /> Exit Game
        </button>
      </div>
    </div>
  );
}
