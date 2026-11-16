import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';
import { EntropyPool, EntropyState } from '../utils/entropy.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface EntropyHarvesterProps {
  onEntropyReady: (salt: Uint8Array, iv: Uint8Array) => void;
  onReset?: () => void;
}

export const EntropyHarvester: React.FC<EntropyHarvesterProps> = ({
  onEntropyReady,
  onReset
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const entropyPoolRef = useRef<EntropyPool>(new EntropyPool());
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const [state, setState] = useState<EntropyState>({
    samplesCount: 0,
    maxSamples: 350,
    percentage: 0,
    isComplete: false,
    collectedBits: 0,
  });

  const colors = ['#38BDF8', '#06B6D4', '#2563EB', '#60A5FA', '#10B981'];

  // Handle pointer movement (Mouse & Touch)
  const handlePointerMove = useCallback(async (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Spawn 2-3 glowing particles
    for (let i = 0; i < 2; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 0.5,
        life: 1,
        maxLife: 20 + Math.random() * 20,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    if (particlesRef.current.length > 80) {
      particlesRef.current.splice(0, 10);
    }

    const nextState = entropyPoolRef.current.addSample(x, y);
    setState(nextState);

    if (nextState.isComplete) {
      const { salt, iv } = await entropyPoolRef.current.generateHybridSaltAndIV();
      onEntropyReady(salt, iv);
    }
  }, [onEntropyReady]);

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.isComplete) return;
    handlePointerMove(e.clientX, e.clientY);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (state.isComplete) return;
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleReset = () => {
    entropyPoolRef.current.reset();
    particlesRef.current = [];
    setState(entropyPoolRef.current.getState());
    if (onReset) onReset();
  };

  // Canvas particle animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;

      // Dark fade background
      ctx.fillStyle = 'rgba(7, 11, 25, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update & Draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-sky-500/20 backdrop-blur-xl">
      {/* Header Widget */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-white font-mono">
            Pengumpul Entropi Fisik Mouse (Wajib)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            {state.collectedBits} / 256 bit
          </span>
          {state.percentage > 0 && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset pengumpulan entropi fisik"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Reset Pengumpulan Entropi"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Dinamis (Amber -> Sky -> Emerald) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400">
            {state.isComplete
              ? 'Entropi Fisik Terkumpul Penuh (100%)'
              : state.percentage >= 40
              ? 'Bagus, terus gerakkan mouse secara acak...'
              : state.percentage > 0
              ? 'Mulai mengumpulkan keacakan fisik...'
              : 'Gerakkan kursor terus-menerus di kanvas:'}
          </span>
          <span className={`font-bold ${
            state.isComplete 
              ? 'text-emerald-400' 
              : state.percentage >= 40 
              ? 'text-sky-400' 
              : 'text-amber-400'
          }`}>
            {state.percentage}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-150 rounded-full ${
              state.isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-teal-300 shadow-glow-emerald'
                : state.percentage >= 40
                ? 'bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300'
                : 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-400'
            }`}
            style={{ width: `${state.percentage}%` }}
          />
        </div>
      </div>

      {/* Glowing Interactive Particle Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#070B19] group">
        <canvas
          ref={canvasRef}
          width={400}
          height={100}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
          className="w-full h-24 cursor-crosshair block touch-none"
        />

        {/* Overlay Prompt */}
        {!state.isComplete && state.percentage === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 text-xs font-mono">
            <span>Gerakkan kursor terus-menerus di area ini</span>
          </div>
        )}

        {state.isComplete && (
          <div className="absolute inset-0 bg-[#070B19]/80 backdrop-blur-xs flex items-center justify-center pointer-events-none animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Dual-Source Hybrid Entropy Terkunci (CSPRNG ⊕ Human)</span>
            </div>
          </div>
        )}
      </div>

      {/* Educational Micro-Footnote */}
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-sky-400" />
          <span>Sumber: Keacakan Gerak Tangan ⊕ CSPRNG Hardware</span>
        </span>
        <span className="font-mono text-sky-400">XOR Diffused SHA-256</span>
      </div>
    </div>
  );
};
