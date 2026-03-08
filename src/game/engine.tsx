import React, { useEffect, useRef, useState } from 'react';
import { LevelData, GameState } from '../types';
import { Cheetah, Meat, Platform, Enemy } from './entities';
import { Pause, Home, RotateCcw, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameEngineProps {
  level: LevelData;
  isPaused: boolean;
  onComplete: (meat: number, time: number) => void;
  onHome: () => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ level, isPaused, onComplete, onHome }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalPaused, setInternalPaused] = useState(false);
  const [meatCount, setMeatCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.timeLimit);
  
  const gameStateRef = useRef({
    cheetah: new Cheetah(100, 100),
    meats: [] as Meat[],
    platforms: [] as Platform[],
    enemies: [] as Enemy[],
    keys: {} as Record<string, boolean>,
    meatCollected: 0,
    timeRemaining: level.timeLimit,
    lastTime: 0,
    worldWidth: 12000,
    worldHeight: 1200,
  });

  // Initialize level
  useEffect(() => {
    const state = gameStateRef.current;
    state.cheetah = new Cheetah(100, 400);
    state.meatCollected = 0;
    state.timeRemaining = level.timeLimit;
    setMeatCount(0);
    setTimeLeft(level.timeLimit);

    state.platforms = level.platforms.map(p => new Platform(p));
    state.enemies = (level.enemies || []).map(en => new Enemy(en));

    // Create meat on platforms
    state.meats = [];
    const meatPerPlatform = Math.ceil(level.meatToCollect / level.platforms.length);
    
    level.platforms.forEach(p => {
      for (let i = 0; i < meatPerPlatform; i++) {
        if (state.meats.length >= level.meatToCollect) break;
        const x = p.x + Math.random() * p.width;
        const y = p.y - 50 - Math.random() * 100;
        state.meats.push(new Meat(x, y));
      }
    });

    // Fill remaining meat randomly if needed
    while (state.meats.length < level.meatToCollect) {
      const x = Math.random() * state.worldWidth;
      const y = Math.random() * (state.worldHeight - 100);
      state.meats.push(new Meat(x, y));
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      state.keys[e.code] = true;
      if (e.code === 'Escape') setInternalPaused(p => !p);
    };
    const handleKeyUp = (e: KeyboardEvent) => state.keys[e.code] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [level]);

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      if (!isPaused && !internalPaused) {
        const deltaTime = (time - gameStateRef.current.lastTime) / 1000;
        gameStateRef.current.lastTime = time;

        update();
        
        // Timer update
        gameStateRef.current.timeRemaining -= deltaTime;
        if (gameStateRef.current.timeRemaining <= 0) {
          onComplete(gameStateRef.current.meatCollected, 0);
        }
        setTimeLeft(Math.max(0, Math.floor(gameStateRef.current.timeRemaining)));
      }

      draw(ctx);
      animationFrameId = requestAnimationFrame(loop);
    };

    const update = () => {
      const state = gameStateRef.current;
      
      state.cheetah.update(state.keys, level.platforms);

      // World boundaries
      state.cheetah.x = Math.max(0, Math.min(state.cheetah.x, state.worldWidth - state.cheetah.width));
      if (state.cheetah.y > state.worldHeight) {
        // Fell off
        state.cheetah.x = 100;
        state.cheetah.y = 100;
        state.cheetah.vy = 0;
      }

      // Meat collection
      for (const meat of state.meats) {
        if (!meat.collected && state.cheetah.collidesWith(meat)) {
          meat.collected = true;
          state.meatCollected++;
          setMeatCount(state.meatCollected);
          if (state.meatCollected >= level.meatToCollect) {
            onComplete(state.meatCollected, Math.floor(state.timeRemaining));
          }
        }
      }

      // Enemy collision
      for (const enemy of state.enemies) {
        enemy.update();
        if (state.cheetah.collidesWith(enemy)) {
          state.cheetah.x = 100;
          state.cheetah.y = 100;
          state.cheetah.vy = 0;
        }
      }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      const state = gameStateRef.current;
      const canvas = canvasRef.current!;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Camera logic
      const camX = Math.max(0, Math.min(state.cheetah.x - canvas.width / 2, state.worldWidth - canvas.width));
      const camY = Math.max(0, Math.min(state.cheetah.y - canvas.height / 2, state.worldHeight - canvas.height));

      ctx.save();
      ctx.translate(-camX, -camY);

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, state.worldHeight);
      skyGrad.addColorStop(0, level.skyColor);
      skyGrad.addColorStop(1, '#FFF');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, state.worldWidth, state.worldHeight);

      // Sun/Moon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(state.worldWidth - 200, 100, 80, 0, Math.PI * 2);
      ctx.fill();

      // Clouds (Simple)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for(let i=0; i<10; i++) {
        const cx = (i * 300) % state.worldWidth;
        const cy = (i * 50) % 200 + 50;
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.arc(cx + 20, cy - 10, 25, 0, Math.PI * 2);
        ctx.arc(cx + 40, cy, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      state.platforms.forEach(p => p.draw(ctx));
      state.meats.forEach(m => m.draw(ctx));
      state.enemies.forEach(e => e.draw(ctx));
      state.cheetah.draw(ctx);

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, internalPaused, level, onComplete]);

  return (
    <div className="relative w-full h-full bg-gray-900">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="w-full h-full"
      />

      {/* HUD */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-lg border-b-4 border-orange-200 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-400 rounded-full flex items-center justify-center text-xl">🥩</div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-orange-400 uppercase leading-none">Meat</span>
              <span className="text-2xl font-black text-gray-800">{meatCount}/100</span>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-lg border-b-4 border-blue-200 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-xl text-white">⏱️</div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-blue-400 uppercase leading-none">Time</span>
              <span className="text-2xl font-black text-gray-800">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setInternalPaused(true)}
          className="pointer-events-auto w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-colors border-b-4 border-orange-200"
        >
          <Pause size={32} />
        </button>
      </div>

      {/* Pause Menu */}
      <AnimatePresence>
        {internalPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-10 rounded-[3rem] text-center shadow-2xl border-8 border-orange-400 w-full max-w-sm"
            >
              <h2 className="text-4xl font-black text-gray-800 mb-8">PAUSED</h2>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setInternalPaused(false)}
                  className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={24} /> RESUME
                </button>
                <button
                  onClick={() => {
                    setInternalPaused(false);
                    onHome();
                  }}
                  className="w-full py-4 bg-orange-100 text-orange-600 rounded-2xl font-bold text-xl hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Home size={24} /> HOME
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={24} /> RESTART
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
