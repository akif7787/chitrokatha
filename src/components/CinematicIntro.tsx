import React, { useState, useEffect } from 'react';
import { Film, Sparkles, Volume2, VolumeX, ArrowRight } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'countdown' | 'logo' | 'shimmer' | 'fadeout'>('countdown');
  const [countdown, setCountdown] = useState(3);

  // Play subtle cinematic synth hum using Web Audio API safely
  const playCinematicSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.1);
    } catch {
      // Audio playback can be quietly ignored if browser blocks autoplay
    }
  };

  useEffect(() => {
    playCinematicSound();

    // Sequence timer
    const countTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countTimer);
          setPhase('logo');
          return 0;
        }
        return prev - 1;
      });
    }, 550);

    const logoTimer = setTimeout(() => {
      setPhase('shimmer');
    }, 1300);

    const finishTimer = setTimeout(() => {
      setPhase('fadeout');
      setTimeout(onComplete, 500);
    }, 2400);

    return () => {
      clearInterval(countTimer);
      clearTimeout(logoTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#050608] flex flex-col items-center justify-center p-4 transition-opacity duration-700 select-none overflow-hidden ${
        phase === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Animated Spotlight Radiance */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-r from-rose-900/30 via-amber-600/20 to-transparent blur-3xl animate-pulse" />
      </div>

      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all z-20 border border-white/10 backdrop-blur-md active:scale-95"
      >
        <span>স্কিপ করুন (Skip)</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Center Cinematic Stage */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-lg">
        {phase === 'countdown' ? (
          /* Countdown Reel Animation */
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Spinning Reel Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-rose-500/50 animate-spin" />
            <div className="absolute inset-2 rounded-full border border-white/20" />
            <span className="font-cinzel text-5xl font-black text-white font-mono animate-ping">
              {countdown}
            </span>
          </div>
        ) : (
          /* Brand Logo Reveal */
          <div className="space-y-4 animate-in zoom-in-75 duration-700">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-rose-700 via-rose-600 to-amber-500 flex items-center justify-center text-white font-cinzel font-bold text-2xl shadow-2xl shadow-rose-950/80 border border-white/20">
              চ
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 font-cinzel drop-shadow-2xl">
                CHITROKATHA
              </h1>
              <p className="text-sm font-semibold tracking-wider text-rose-400 font-cinzel">
                চিত্রকথা · সিনেমাটিক ডিজিটাল আর্কাইভ
              </p>
            </div>

            <p className="text-xs text-slate-400 font-light tracking-widest uppercase">
              The Ultimate Streaming Experience
            </p>
          </div>
        )}
      </div>

      {/* Bottom Audio / Filmstrip Accent */}
      <div className="absolute bottom-6 flex items-center gap-2 text-[10px] font-mono text-slate-500">
        <Film className="w-3.5 h-3.5 text-rose-500" />
        <span>CINEMA DIGITAL MASTERING · 4K UHD · DOLBY AUDIO</span>
      </div>
    </div>
  );
};
