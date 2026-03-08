import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, GameProgress, LevelData } from './types';
import { LEVELS } from './game/levels';
import { Play, Home, RotateCcw, Pause, Star, Key } from 'lucide-react';
import { GameEngine } from './game/engine';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// --- Components ---

const DetailedCheetah = ({ className = "", color = "#d4a356", spots = "#332211", flip = false, style = {} }: { className?: string, color?: string, spots?: string, flip?: boolean, style?: React.CSSProperties }) => (
  <motion.svg 
    viewBox="0 0 100 60" 
    className={`${className} ${flip ? '-scale-x-100' : ''}`}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    animate={{ y: [0, -5, 0] }}
    transition={{ repeat: Infinity, duration: 0.8 }}
  >
    {/* Legs (Back Set) */}
    <motion.path 
      d="M25 40L20 55" 
      stroke={color} 
      strokeWidth="5" 
      strokeLinecap="round" 
      animate={{ d: ["M25 40L20 55", "M25 40L30 50", "M25 40L20 55"] }}
      transition={{ repeat: Infinity, duration: 0.8 }}
    />
    <motion.path 
      d="M75 40L80 55" 
      stroke={color} 
      strokeWidth="5" 
      strokeLinecap="round" 
      animate={{ d: ["M75 40L80 55", "M75 40L70 50", "M75 40L80 55"] }}
      transition={{ repeat: Infinity, duration: 0.8 }}
    />

    {/* Tail */}
    <motion.path 
      d="M15 28C5 25 -5 35 0 50" 
      stroke={color} 
      strokeWidth="4" 
      strokeLinecap="round" 
      fill="none" 
      animate={{ rotate: [0, 10, 0] }}
      transition={{ repeat: Infinity, duration: 1.2 }}
    />
    <path 
      d="M10 28C5 28 0 32 2 40" 
      stroke={spots} 
      strokeWidth="4" 
      strokeDasharray="4 4"
      strokeLinecap="round" 
      fill="none" 
    />

    {/* Body */}
    <path 
      d="M15 30C15 15 85 15 85 30C85 45 15 45 15 30Z" 
      fill={color} 
    />
    {/* White Belly */}
    <path 
      d="M25 38C25 38 50 42 75 38C60 40 40 40 25 38Z" 
      fill="#fdf5e6" 
    />

    {/* Head */}
    <circle cx="85" cy="20" r="12" fill={color} />
    {/* Ears */}
    <ellipse cx="80" cy="10" rx="4" ry="6" fill={color} transform="rotate(-20 80 10)" />
    <ellipse cx="88" cy="10" rx="4" ry="5" fill={color} transform="rotate(10 88 10)" />
    
    {/* Muzzle */}
    <ellipse cx="92" cy="24" rx="7" ry="6" fill="#fdf5e6" />
    
    {/* Tear Marks */}
    <path d="M88 18Q90 22 92 26" stroke={spots} strokeWidth="1.5" strokeLinecap="round" />

    {/* Nose & Eye */}
    <circle cx="96" cy="24" r="1.5" fill="black" />
    <circle cx="88" cy="18" r="1.5" fill="black" />

    {/* Legs (Front Set) */}
    <motion.path 
      d="M35 40L40 55" 
      stroke={color} 
      strokeWidth="5" 
      strokeLinecap="round" 
      animate={{ d: ["M35 40L40 55", "M35 40L35 50", "M35 40L40 55"] }}
      transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
    />
    <motion.path 
      d="M65 40L60 55" 
      stroke={color} 
      strokeWidth="5" 
      strokeLinecap="round" 
      animate={{ d: ["M65 40L60 55", "M65 40L65 50", "M65 40L60 55"] }}
      transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
    />

    {/* Spots */}
    {[...Array(15)].map((_, i) => (
      <circle 
        key={i} 
        cx={25 + (i * 4) % 50} 
        cy={25 + Math.sin(i * 1.7) * 8} 
        r="1.2" 
        fill={spots} 
      />
    ))}
  </motion.svg>
);

const IntroCutscene = ({ onComplete }: { onComplete: () => void, key?: string }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 2) setStep(step + 1);
      else onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  return (
    <div className="fixed inset-0 bg-orange-100 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="w-96 h-64 bg-green-200 rounded-[4rem] mb-8 mx-auto relative overflow-hidden flex items-end justify-center pb-8">
              <DetailedCheetah className="w-48 h-auto" flip />
            </div>
            <h2 className="text-2xl font-bold text-orange-800 italic">Watching the sunset...</h2>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center relative"
          >
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 bg-white p-6 rounded-3xl shadow-xl border-4 border-orange-200 w-48">
              <div className="flex items-center gap-4">
                <DetailedCheetah className="w-12 h-auto" color="#FBBF24" />
                <span className="text-xl font-bold text-orange-600">👋 Friend!</span>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-r-4 border-b-4 border-orange-200 rotate-45" />
            </div>
            <DetailedCheetah className="w-64 h-auto mx-auto" />
            <p className="mt-8 text-xl font-medium text-orange-900 max-w-md mx-auto">"I haven't seen my friend in a long time… I should go find them!"</p>
            <p className="mt-2 text-sm font-bold text-orange-600 uppercase tracking-widest animate-pulse">Tip: Press UP to JUMP and SPACE to DASH!</p>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="text-center"
          >
            <DetailedCheetah className="w-64 h-auto mx-auto animate-bounce" />
            <h2 className="text-4xl font-black text-orange-600 mt-8 tracking-widest uppercase">Let's Go!</h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FinalCutscene = ({ onComplete }: { onComplete: () => void, key?: string }) => {
  return (
    <div className="fixed inset-0 bg-orange-50 flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="flex gap-12 mb-12 items-end"
      >
        <DetailedCheetah className="w-48 h-auto animate-bounce" />
        <DetailedCheetah className="w-48 h-auto animate-bounce" color="#FBBF24" flip style={{ animationDelay: '0.2s' }} />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-5xl font-black text-orange-600 mb-4"
      >
        REUNITED!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-2xl text-orange-800 italic mb-12"
      >
        "Adventure is better with friends."
      </motion.p>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={onComplete}
        className="px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-xl shadow-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
      >
        <Home size={24} /> Back to Menu
      </motion.button>
    </div>
  );
};

const LevelSelect = ({ progress, onSelect }: { progress: GameProgress, onSelect: (level: LevelData) => void, key?: string }) => {
  return (
    <div className="min-h-screen bg-orange-50 p-8 flex flex-col items-center">
      <motion.h1
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="text-6xl font-black text-orange-600 mb-12 tracking-tight drop-shadow-sm"
      >
        CHEETAH QUEST
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {LEVELS.map((level) => {
          const levelProgress = progress.levels[level.id];
          const isLocked = !levelProgress?.unlocked && level.id !== 1;

          return (
            <motion.button
              key={level.id}
              whileHover={!isLocked ? { scale: 1.05 } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              onClick={() => !isLocked && onSelect(level)}
              disabled={isLocked}
              className={`relative p-8 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-4 shadow-xl ${
                isLocked
                  ? 'bg-gray-200 border-gray-300 opacity-50 cursor-not-allowed'
                  : 'bg-white border-orange-200 hover:border-orange-400'
              }`}
            >
              <div className="text-sm font-bold text-orange-400 uppercase tracking-widest">Level {level.id}</div>
              <h3 className="text-2xl font-black text-gray-800">{level.name}</h3>
              
              <div className="flex gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    size={24}
                    fill={(levelProgress?.stars || 0) >= s ? '#F59E0B' : 'none'}
                    color={(levelProgress?.stars || 0) >= s ? '#F59E0B' : '#D1D5DB'}
                  />
                ))}
              </div>

              <div className="text-xs font-bold px-3 py-1 bg-orange-100 text-orange-600 rounded-full">
                {level.difficulty}
              </div>

              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-[2rem]">
                  <span className="text-4xl">🔒</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const LevelStartOverlay = ({ level, onStart }: { level: LevelData, onStart: () => void }) => {
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTimer(true), 2000);
    const startTimer = setTimeout(() => onStart(), 3500);
    return () => {
      clearTimeout(timer);
      clearTimeout(startTimer);
    };
  }, [onStart]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        className="bg-white p-12 rounded-[3rem] text-center shadow-2xl border-8 border-orange-400"
      >
        {!showTimer ? (
          <>
            <h2 className="text-5xl font-black text-orange-600 mb-4">COLLECT 100 MEAT</h2>
            <p className="text-orange-400 font-bold mb-8 uppercase tracking-widest animate-pulse">Tip: Press UP to JUMP and SPACE to DASH!</p>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-24 h-24 bg-red-400 rounded-full mx-auto flex items-center justify-center text-4xl"
            >
              🥩
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-8xl font-black text-orange-600"
          >
            3:00
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

const LevelEndOverlay = ({ meat, time, stars, onHome, onRestart, onNext }: { 
  meat: number, 
  time: number, 
  stars: number, 
  onHome: () => void, 
  onRestart: () => void,
  onNext?: () => void
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md p-10 rounded-[3rem] text-center shadow-2xl border-8 border-orange-400"
      >
        <h2 className="text-4xl font-black text-gray-800 mb-6">LEVEL COMPLETE!</h2>
        
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 * s, type: 'spring' }}
            >
              <Star
                size={64}
                fill={stars >= s ? '#F59E0B' : 'none'}
                color={stars >= s ? '#F59E0B' : '#D1D5DB'}
              />
            </motion.div>
          ))}
        </div>

        <div className="space-y-4 mb-10">
          <div className="flex justify-between items-center text-xl font-bold text-gray-600 px-4">
            <span>Meat Collected:</span>
            <span className="text-orange-600 text-3xl">{meat}/100</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold text-gray-600 px-4">
            <span>Time Remaining:</span>
            <span className="text-blue-500 text-3xl">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button onClick={onHome} className="p-4 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors flex flex-col items-center gap-1">
            <Home size={24} />
            <span className="text-xs font-bold">HOME</span>
          </button>
          <button onClick={onRestart} className="p-4 bg-orange-100 rounded-2xl hover:bg-orange-200 transition-colors flex flex-col items-center gap-1">
            <RotateCcw size={24} />
            <span className="text-xs font-bold">RETRY</span>
          </button>
          {onNext && (
            <button onClick={onNext} className="p-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-colors flex flex-col items-center gap-1">
              <Play size={24} />
              <span className="text-xs font-bold">NEXT</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO_CUTSCENE);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [currentLevel, setCurrentLevel] = useState<LevelData | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };
  const [progress, setProgress] = useState<GameProgress>(() => {
    const saved = localStorage.getItem('cheetah_quest_progress');
    if (saved) return JSON.parse(saved);
    return {
      levels: {
        1: { stars: 0, unlocked: true, bestMeat: 0 },
        2: { stars: 0, unlocked: false, bestMeat: 0 },
        3: { stars: 0, unlocked: false, bestMeat: 0 },
        4: { stars: 0, unlocked: false, bestMeat: 0 },
      }
    };
  });

  const [levelResult, setLevelResult] = useState<{ meat: number, time: number, stars: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('cheetah_quest_progress', JSON.stringify(progress));
  }, [progress]);

  const handleLevelSelect = (level: LevelData) => {
    setCurrentLevel(level);
    setGameState(GameState.LEVEL_START);
  };

  const handleLevelComplete = (meat: number, timeRemaining: number) => {
    let stars = 0;
    if (meat === 100) stars = 3;
    else if (meat >= 76) stars = 2;
    else if (meat >= 26) stars = 1;

    setLevelResult({ meat, time: timeRemaining, stars });
    
    // Update progress
    if (currentLevel) {
      const nextLevelId = currentLevel.id + 1;
      const newProgress = { ...progress };
      
      // Update current level stars if better
      if (stars > (newProgress.levels[currentLevel.id]?.stars || 0)) {
        newProgress.levels[currentLevel.id].stars = stars;
      }
      if (meat > (newProgress.levels[currentLevel.id]?.bestMeat || 0)) {
        newProgress.levels[currentLevel.id].bestMeat = meat;
      }

      // Unlock next level
      if (nextLevelId <= 4) {
        newProgress.levels[nextLevelId].unlocked = true;
      }

      setProgress(newProgress);
    }

    setGameState(GameState.LEVEL_END);
  };

  const handleNextLevel = () => {
    if (currentLevel && currentLevel.id < 4) {
      const nextLevel = LEVELS.find(l => l.id === currentLevel.id + 1);
      if (nextLevel) {
        setCurrentLevel(nextLevel);
        setGameState(GameState.LEVEL_START);
        return;
      }
    }
    
    if (currentLevel?.id === 4 && levelResult?.meat === 100) {
      setGameState(GameState.FINAL_CUTSCENE);
    } else {
      setGameState(GameState.LEVEL_SELECT);
    }
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none font-sans">
      {!hasApiKey && (
        <div className="fixed inset-0 z-[100] bg-orange-900/90 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl border-4 border-orange-400"
          >
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Key className="text-orange-600" size={40} />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-4 uppercase tracking-tight">Unlock High Quality</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              To generate high-quality cheetah animations, you need to select a Gemini API key from a paid project.
            </p>
            <button
              onClick={handleOpenKey}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
            >
              Select API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-6 text-orange-600 font-bold hover:underline"
            >
              Learn about billing
            </a>
          </motion.div>
        </div>
      )}
      <AnimatePresence mode="wait">
        {gameState === GameState.INTRO_CUTSCENE && (
          <IntroCutscene key="intro" onComplete={() => setGameState(GameState.LEVEL_SELECT)} />
        )}

        {gameState === GameState.LEVEL_SELECT && (
          <LevelSelect 
            key="select" 
            progress={progress} 
            onSelect={handleLevelSelect} 
          />
        )}

        {(gameState === GameState.LEVEL_START || gameState === GameState.PLAYING || gameState === GameState.LEVEL_END) && currentLevel && (
          <div className="relative w-full h-full">
             {/* Game Engine Component will go here */}
             <GameEngine 
                level={currentLevel} 
                isPaused={gameState === GameState.LEVEL_START || gameState === GameState.LEVEL_END}
                onComplete={handleLevelComplete}
                onHome={() => setGameState(GameState.LEVEL_SELECT)}
             />

             {gameState === GameState.LEVEL_START && (
               <LevelStartOverlay 
                 level={currentLevel} 
                 onStart={() => setGameState(GameState.PLAYING)} 
               />
             )}

             {gameState === GameState.LEVEL_END && levelResult && (
               <LevelEndOverlay 
                 meat={levelResult.meat}
                 time={levelResult.time}
                 stars={levelResult.stars}
                 onHome={() => setGameState(GameState.LEVEL_SELECT)}
                 onRestart={() => setGameState(GameState.LEVEL_START)}
                 onNext={currentLevel.id < 4 ? handleNextLevel : (levelResult.meat === 100 ? handleNextLevel : undefined)}
               />
             )}
          </div>
        )}

        {gameState === GameState.FINAL_CUTSCENE && (
          <FinalCutscene key="final" onComplete={() => setGameState(GameState.LEVEL_SELECT)} />
        )}
      </AnimatePresence>
    </div>
  );
}

