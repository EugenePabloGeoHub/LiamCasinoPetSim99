import { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Flag, ShieldAlert, TrendingUp, Skull } from 'lucide-react';
import { GameSessionState } from '../types';
import { parseAmount } from '../lib/utils';

const LEVELS = 8;
const MULTIPLIERS = [1.5, 2.3, 3.5, 5.5, 8.5, 13, 20, 32];

export default function Towers({ onBack, state, setState }: { onBack: () => void, state: GameSessionState, setState: Dispatch<SetStateAction<GameSessionState>> }) {
  const [level, setLevel] = useState(0);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'gameOver' | 'win'>('betting');
  const [history, setHistory] = useState<{ choice: number, bomb: number }[]>([]);
  const [betInput, setBetInput] = useState(state.bet.toString());
  const [message, setMessage] = useState('');

  const startGame = () => {
    const currentBet = parseAmount(betInput);
    if (state.balance < currentBet || currentBet <= 0) return;

    setLevel(0);
    setHistory([]);
    setGameStatus('playing');
    setMessage('');
    setState(s => ({ ...s, balance: s.balance - currentBet, bet: currentBet }));
  };

  const selectTile = (choice: number) => {
    if (gameStatus !== 'playing') return;

    const bomb = Math.floor(Math.random() * 3);
    const newHistory = [...history, { choice, bomb }];
    setHistory(newHistory);

    if (choice === bomb) {
      setGameStatus('gameOver');
      setMessage('KA-BOOM! 💥');
    } else {
      const nextLevel = level + 1;
      if (nextLevel === LEVELS) {
        cashOut(newHistory);
      } else {
        setLevel(nextLevel);
      }
    }
  };

  const cashOut = (finalHistory = history) => {
    if (gameStatus !== 'playing' && finalHistory.length === 0) return;
    
    const currentBet = parseAmount(betInput);
    const winMult = MULTIPLIERS[finalHistory.length - 1];
    const winAmt = Math.floor(currentBet * winMult);

    setState(s => ({ ...s, balance: s.balance + winAmt }));
    setGameStatus('win');
    setMessage(`CASHED OUT! +${winAmt.toLocaleString()} GEMS! 🎉`);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 space-y-8 h-full bg-slate-900 rounded-3xl min-h-[700px]">
      <div className="text-center">
        <h2 className="text-4xl sm:text-6xl font-black text-ps-yellow italic uppercase flex items-center gap-4">
          <TrendingUp className="w-10 h-10" /> Towers
        </h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Climb the tower for massive multipliers. 1 in 3 tiles is a bomb!</p>
      </div>

      <div className="flex-1 w-full flex flex-col-reverse justify-start overflow-y-auto no-scrollbar py-4 gap-2">
        {Array.from({ length: LEVELS }).map((_, idx) => {
          const isActive = idx === level && gameStatus === 'playing';
          const isPast = idx < history.length;
          const levelHistory = history[idx];

          return (
            <motion.div 
              key={idx}
              className={`flex items-center gap-2 p-2 rounded-2xl border-2 transition-all duration-500 ${
                isActive ? 'bg-white/10 border-ps-blue-light scale-105' : 
                isPast ? 'bg-slate-800 border-slate-700 opacity-60' : 'bg-slate-900 border-slate-800 opacity-20'
              }`}
            >
              <div className="w-16 text-center font-black text-slate-500 text-[10px] uppercase">
                {MULTIPLIERS[idx]}x
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                {[0, 1, 2].map(tileIdx => {
                  const isSelected = levelHistory?.choice === tileIdx;
                  const isBomb = levelHistory?.bomb === tileIdx;
                  
                  return (
                    <button
                      key={tileIdx}
                      disabled={!isActive}
                      onClick={() => selectTile(tileIdx)}
                      className={`h-12 rounded-xl border-2 transition-all flex items-center justify-center text-xl ${
                        isActive ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 active:scale-95' :
                        isSelected && isBomb ? 'bg-ps-pink border-pink-700' :
                        isSelected ? 'bg-emerald-500 border-emerald-700' :
                        levelHistory && isBomb ? 'bg-ps-pink/30 border-pink-900/50' :
                        'bg-slate-900 border-slate-800'
                      }`}
                    >
                      {levelHistory && isSelected && isBomb ? <Skull className="w-6 h-6 text-white" /> :
                       levelHistory && isSelected ? '💎' :
                       levelHistory && isBomb ? <Flag className="w-4 h-4 text-pink-500/50" /> : ''}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="w-full space-y-6">
        <AnimatePresence mode="wait">
          {message && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className={`text-center py-4 rounded-2xl font-black uppercase italic text-xl ${gameStatus === 'gameOver' ? 'bg-ps-pink/20 text-ps-pink' : 'bg-emerald-500/20 text-emerald-400'}`}
            >
               {message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col w-full space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Wager Amount</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={betInput} 
              disabled={gameStatus === 'playing'}
              onChange={(e) => setBetInput(e.target.value)}
              className="flex-1 bg-slate-950 border-4 border-slate-800 rounded-xl px-4 py-2 text-white font-black text-lg focus:border-ps-blue-light outline-none transition-all disabled:opacity-50"
            />
            <div className="flex gap-1">
              <button 
                onClick={() => setBetInput(Math.floor(parseAmount(betInput) / 2).toString())} 
                className="px-3 bg-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-colors text-xs border-2 border-slate-700 uppercase"
                disabled={gameStatus === 'playing'}
              >1/2</button>
              <button 
                onClick={() => setBetInput((parseAmount(betInput) * 2).toString())} 
                className="px-3 bg-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-colors text-xs border-2 border-slate-700 uppercase"
                disabled={gameStatus === 'playing'}
              >x2</button>
              <button 
                onClick={() => setBetInput(state.balance.toString())} 
                className="px-3 bg-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-colors text-xs border-2 border-slate-700 uppercase"
                disabled={gameStatus === 'playing'}
              >Max</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={startGame} 
            disabled={gameStatus === 'playing' || state.balance < parseAmount(betInput) || parseAmount(betInput) <= 0}
            className={`pet-button py-4 text-xl ${gameStatus === 'playing' ? 'bg-slate-800 opacity-50' : 'bg-ps-yellow text-slate-900 border-yellow-600 shadow-[0_6px_0_rgb(161,121,5)]'}`}
          >
            Start Climb
          </button>
          <button 
            onClick={() => cashOut()} 
            disabled={gameStatus !== 'playing' || level === 0}
            className={`pet-button py-4 text-xl ${gameStatus !== 'playing' || level === 0 ? 'bg-slate-800 opacity-50' : 'bg-emerald-500 text-white border-emerald-700 shadow-[0_6px_0_rgb(6,95,70)]'}`}
          >
            Cashout ({MULTIPLIERS[level-1] || 0}x)
          </button>
        </div>
      </div>

      <button onClick={onBack} className="text-slate-500 hover:text-slate-300 font-bold transition-colors flex items-center uppercase text-xs tracking-widest">
        <ChevronLeft className="w-4 h-4 mr-1" /> Lobby
      </button>
    </div>
  );
}
