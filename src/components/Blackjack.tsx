import { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, History, Coins } from 'lucide-react';
import { GameSessionState } from '../types';
import { parseAmount } from '../lib/utils';

const SUITS = ['♠', '♣', '♥', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

interface Card {
  rank: string;
  suit: string;
  value: number;
}

const createDeck = () => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = parseInt(rank);
      if (['J', 'Q', 'K'].includes(rank)) value = 10;
      if (rank === 'A') value = 11;
      deck.push({ rank, suit, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateHand = (hand: Card[]) => {
  let total = hand.reduce((acc, card) => acc + card.value, 0);
  let aces = hand.filter(card => card.rank === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
};

const CardView = ({ card, hidden }: { card: Card; hidden?: boolean }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    className={`w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-xl border-2 border-slate-300 flex flex-col justify-between p-2 shadow-lg relative overflow-hidden ${
      hidden ? 'bg-indigo-600 border-indigo-400' : ''
    }`}
  >
    {hidden ? (
      <div className="w-full h-full flex items-center justify-center">
        <Coins className="text-white/20 w-8 h-8 rotate-12" />
      </div>
    ) : (
      <>
        <div
          className={`text-lg sm:text-xl font-black leading-none ${
            ['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-900'
          }`}
        >
          {card.rank}
        </div>
        <div
          className={`text-2xl sm:text-4xl self-center ${
            ['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-900'
          }`}
        >
          {card.suit}
        </div>
        <div
          className={`text-lg sm:text-xl font-black leading-none self-end scale-y-[-1] scale-x-[-1] ${
            ['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-900'
          }`}
        >
          {card.rank}
        </div>
      </>
    )}
  </motion.div>
);

export default function Blackjack({ onBack, state, setState }: { onBack: () => void, state: GameSessionState, setState: Dispatch<SetStateAction<GameSessionState>> }) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'dealerTurn' | 'gameOver'>('betting');
  const [message, setMessage] = useState('');
  const [betInput, setBetInput] = useState(state.bet.toString());

  const handleGameOver = (pHand: Card[], dHand: Card[], specialMessage?: string) => {
    const pTotal = calculateHand(pHand);
    const dTotal = calculateHand(dHand);
    const currentBet = parseAmount(betInput);

    let winAmt = 0;
    let endMsg = '';

    if (pTotal > 21) {
      endMsg = 'DEALER WINS (BUST)';
    } else if (dTotal > 21 || pTotal > dTotal) {
      winAmt = Math.floor(currentBet * (pTotal === 21 && pHand.length === 2 ? 2.5 : 2));
      endMsg = pTotal === 21 && pHand.length === 2 ? 'BLACKJACK!' : 'YOU WIN!';
    } else if (pTotal === dTotal) {
      winAmt = currentBet;
      endMsg = 'TIE (Push)';
    } else {
      endMsg = 'DEALER WINS';
    }

    setGameStatus('gameOver');
    setMessage(specialMessage || endMsg);
    if (winAmt > 0) {
      setState(s => ({ ...s, balance: s.balance + winAmt }));
    }
  };

  const startGame = () => {
    const currentBet = parseAmount(betInput);
    if (state.balance < currentBet || currentBet <= 0) return;

    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameStatus('playing');
    setMessage('');
    setState(s => ({ ...s, balance: s.balance - currentBet, bet: currentBet }));

    if (calculateHand(pHand) === 21) {
      handleGameOver(pHand, dHand, 'Blackjack!');
    }
  };

  const hit = () => {
    const newHand = [...playerHand, deck.pop()!];
    setPlayerHand(newHand);
    if (calculateHand(newHand) > 21) {
      handleGameOver(newHand, dealerHand, 'Bust!');
    }
  };

  const stand = async () => {
    setGameStatus('dealerTurn');
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];

    while (calculateHand(currentDealerHand) < 17) {
      currentDealerHand.push(currentDeck.pop()!);
      setDealerHand([...currentDealerHand]);
      await new Promise(r => setTimeout(r, 600));
    }

    handleGameOver(playerHand, currentDealerHand);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 space-y-8 h-full bg-slate-900 rounded-3xl min-h-[600px]">
      <div className="text-center">
        <h2 className="text-4xl sm:text-6xl font-black text-ps-yellow italic uppercase flex items-center gap-4">
          <History className="w-10 h-10" /> Blackjack
        </h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Dealer stands on 17. 2.5x Blackjack, 2x Win, Push on Tie.</p>
      </div>

      <div className="flex-1 w-full flex flex-col justify-around py-8">
        <div className="space-y-4">
          <div className="flex justify-center gap-1">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Dealer {gameStatus === 'playing' ? '?' : calculateHand(dealerHand)}</span>
          </div>
          <div className="flex justify-center -space-x-8">
            {dealerHand.map((card, idx) => (
              <div key={idx}>
                <CardView card={card} hidden={gameStatus === 'playing' && idx === 0} />
              </div>
            ))}
          </div>
        </div>

        <div className="h-12 flex items-center justify-center">
           <AnimatePresence mode="wait">
             {message && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 className="text-2xl font-black text-ps-blue-light uppercase italic bg-white/5 px-6 py-2 rounded-2xl border border-white/10 backdrop-blur-md"
               >
                 {message}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center -space-x-8">
            {playerHand.map((card, idx) => (
              <div key={idx}>
                <CardView card={card} />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1">
             <span className="text-[10px] font-black bg-ps-blue-light text-slate-900 uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">You: {calculateHand(playerHand)}</span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-6">
        <div className="flex flex-col w-full space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Wager Amount</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={betInput} 
              disabled={gameStatus !== 'betting' && gameStatus !== 'gameOver'}
              onChange={(e) => setBetInput(e.target.value)}
              className="flex-1 bg-slate-950 border-4 border-slate-800 rounded-xl px-4 py-2 text-white font-black text-lg focus:border-ps-blue-light outline-none transition-all disabled:opacity-50"
            />
            <div className="flex gap-1">
              <button 
                onClick={() => {
                   const curr = parseAmount(betInput);
                   setBetInput(Math.floor(curr / 2).toString());
                }} 
                disabled={gameStatus !== 'betting' && gameStatus !== 'gameOver'}
                className="px-3 bg-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-colors text-xs border-2 border-slate-700 uppercase disabled:opacity-50"
              >1/2</button>
              <button 
                onClick={() => {
                   const curr = parseAmount(betInput);
                   setBetInput((curr * 2).toString());
                }} 
                disabled={gameStatus !== 'betting' && gameStatus !== 'gameOver'}
                className="px-3 bg-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-colors text-xs border-2 border-slate-700 uppercase disabled:opacity-50"
              >x2</button>
              <button 
                onClick={() => setBetInput(state.balance.toString())} 
                disabled={gameStatus !== 'betting' && gameStatus !== 'gameOver'}
                className="px-3 bg-slate-800 rounded-xl font-black text-slate-400 hover:text-white transition-colors text-xs border-2 border-slate-700 uppercase disabled:opacity-50"
              >Max</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {gameStatus === 'betting' || gameStatus === 'gameOver' ? (
            <button 
              onClick={startGame} 
              disabled={state.balance < parseAmount(betInput) || parseAmount(betInput) <= 0}
              className="col-span-2 pet-button bg-ps-yellow text-slate-900 py-4 text-xl border-yellow-600 shadow-[0_6px_0_rgb(161,121,5)]"
            >
              Deal Cards
            </button>
          ) : (
            <>
              <button 
                onClick={hit} 
                disabled={gameStatus !== 'playing'}
                className="pet-button bg-ps-blue-light text-slate-900 py-4 text-xl border-sky-400 shadow-[0_6px_0_rgb(7,89,133)]"
              >
                Hit
              </button>
              <button 
                onClick={stand} 
                disabled={gameStatus !== 'playing'}
                className="pet-button bg-white text-slate-900 py-4 text-xl border-slate-300 shadow-[0_6px_0_rgb(100,116,139)]"
              >
                Stand
              </button>
            </>
          )}
        </div>
      </div>

      <button onClick={onBack} className="text-slate-500 hover:text-slate-300 font-bold transition-colors flex items-center uppercase text-xs tracking-widest">
        <ChevronLeft className="w-4 h-4 mr-1" /> Lobby
      </button>
    </div>
  );
}
