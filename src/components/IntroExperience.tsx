'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, ChevronRight, ChevronLeft, X, ShieldAlert, Sparkles, Brain, Bot, FileText, Activity, Map } from 'lucide-react';

interface IntroExperienceProps {
  onClose: () => void;
}

// Browser programmatically synthesized ambient audio generator (Web Audio API)
class AmbientSynth {
  private ctx: AudioContext | null = null;
  private nodes: { oscillator: OscillatorNode; gainNode: GainNode }[] = [];
  private filter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Lowpass filter for warm/soft sound
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // Create a chord pad (Cmaj9 chord detuned slightly for spatial feel)
      const freqs = [65.41, 98.0, 130.81, 164.81, 196.0, 246.94];
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.filter) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Slow LFO for frequency detune modulation (spatial choral effect)
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 0.15 + Math.random() * 0.1;
        lfoGain.gain.value = 0.6 + Math.random() * 0.4;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        // Balanced individual gain
        oscGain.gain.setValueAtTime(0.04 / freqs.length, this.ctx.currentTime);
        
        osc.connect(oscGain);
        oscGain.connect(this.filter);
        osc.start();

        this.nodes.push({ oscillator: osc, gainNode: oscGain });
      });

      // Fade in master volume
      this.masterGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 3.0);
      this.isPlaying = true;
    } catch (e) {
      console.warn('Web Audio API initialized with warnings or blocked:', e);
    }
  }

  playUIBeep(freq: number) {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.3);
    }
  }

  stop() {
    if (!this.isPlaying) return;
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          this.nodes.forEach(n => {
            try { n.oscillator.stop(); } catch(e) {}
          });
          try { this.ctx?.close(); } catch(e) {}
          this.nodes = [];
          this.isPlaying = false;
        }, 800);
      } catch (e) {}
    }
  }
}

export default function IntroExperience({ onClose }: IntroExperienceProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<AmbientSynth | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = 45; // 45 seconds

  // Initialize Synth
  useEffect(() => {
    synthRef.current = new AmbientSynth();

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  // Sync mute state with synth volume
  useEffect(() => {
    if (!synthRef.current) return;
    if (muted) {
      synthRef.current.setVolume(0);
    } else {
      synthRef.current.start();
      synthRef.current.setVolume(0.5);
    }
  }, [muted]);

  // Audio trigger on scene advance
  const triggerTransitionBeep = (sceneNum: number) => {
    if (!muted && synthRef.current) {
      synthRef.current.playUIBeep(261.63 * (1 + sceneNum * 0.15)); // Harmonious step
    }
  };

  // Keyboard navigation & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.key === 'm' || e.key === 'M') {
        setMuted(m => !m);
      } else if (e.key === 'ArrowRight' && currentTime < totalDuration) {
        setCurrentTime(c => Math.min(totalDuration, c + 5));
      } else if (e.key === 'ArrowLeft' && currentTime > 0) {
        setCurrentTime(c => Math.max(0, c - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime]);

  // Canvas particle background rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    class Particle {
      x = Math.random() * width;
      y = Math.random() * height;
      vx = (Math.random() - 0.2) * 1.6; // subtle rightward drift
      vy = (Math.random() - 0.5) * 0.4;
      radius = Math.random() * 2 + 1;
      color = `rgba(${Math.random() > 0.5 ? '56, 189, 248' : '20, 184, 166'}, ${Math.random() * 0.35 + 0.1})`;

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0;
        if (this.y < 0) this.y = height;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
      }
    }

    const particlesCount = Math.min(50, Math.floor((width * height) / 25000));
    const particles: Particle[] = [];
    for (let i = 0; i < particlesCount; i++) {
      particles.push(new Particle());
    }

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle dynamic grid backdrop
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.05)';
      ctx.lineWidth = 0.5;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      // Render networking links between adjacent particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(20, 184, 166, ${0.12 * (1 - dist / 120)})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [reducedMotion]);

  // Main playback timer
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setCurrentTime(curr => {
        if (curr >= totalDuration) {
          setIsPlaying(false);
          if (timerRef.current) clearInterval(timerRef.current);
          return totalDuration;
        }
        return curr + 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Derive scene thresholds
  const getActiveScene = () => {
    if (currentTime < 6) return 1;
    if (currentTime < 12) return 2;
    if (currentTime < 22) return 3;
    if (currentTime < 36) return 4;
    if (currentTime < 42) return 5;
    return 6;
  };

  const scene = getActiveScene();

  const handleSkip = () => {
    if (synthRef.current) {
      synthRef.current.stop();
    }
    if (dontShowAgain) {
      localStorage.setItem('communitypulse_intro_seen', 'true');
    }
    onClose();
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
    triggerTransitionBeep(1);
  };

  const nextScene = () => {
    const nextTimes = [0, 6, 12, 22, 36, 42];
    const currentSceneIdx = scene - 1;
    if (currentSceneIdx < nextTimes.length - 1) {
      setCurrentTime(nextTimes[currentSceneIdx + 1]);
      triggerTransitionBeep(scene + 1);
    } else {
      setCurrentTime(totalDuration);
    }
  };

  const prevScene = () => {
    const nextTimes = [0, 0, 6, 12, 22, 36, 42];
    const currentSceneIdx = scene;
    if (currentSceneIdx > 1) {
      setCurrentTime(nextTimes[currentSceneIdx - 1]);
      triggerTransitionBeep(scene - 1);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#030303] text-white flex flex-col justify-between overflow-hidden font-sans select-none"
      role="dialog"
      aria-label="CommunityPulse AI Introduction Onboarding"
      aria-modal="true"
    >
      {/* Background Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Cyberpunk Glow Spots */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full pointer-events-none animate-pulse duration-5000" />
      <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-teal-500/10 dark:bg-teal-600/5 blur-[150px] rounded-full pointer-events-none animate-pulse duration-7000" />

      {/* Header controls */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
            <Activity className="h-4.5 w-4.5 text-black" />
          </div>
          <span className="font-bold text-xs tracking-wider text-zinc-400 font-mono uppercase">COMMUNITYPULSE AI</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mute Toggle */}
          <button
            onClick={() => setMuted(!muted)}
            className="p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 transition-colors flex items-center justify-center min-w-[38px] min-h-[38px]"
            title={muted ? 'Unmute Intro Audio' : 'Mute Intro Audio'}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-blue-400 animate-bounce" />}
          </button>

          {/* Quick Skip */}
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-zinc-900/80 hover:bg-zinc-850 text-zinc-100 hover:text-white border border-zinc-800 rounded-lg text-xs font-bold transition-all min-h-[38px] flex items-center gap-1 hover:border-zinc-700 active:scale-95 shadow-sm"
          >
            Skip Intro
            <X className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Central Storyboard Presentation Screen */}
      <div className="relative z-10 flex-grow w-full max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center overflow-hidden">
        
        {/* SCENE 1: The Challenge */}
        {scene === 1 && (
          <div className="flex flex-col items-center max-w-2xl animate-fade-in gap-5 md:gap-7">
            <div className="flex items-center gap-2 mb-2 animate-bounce">
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-500 rounded-full">
                <ShieldAlert className="h-6 w-6" />
              </div>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Sensing the Urban Strain
            </h2>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-mono">
              Modern cities generate enormous amounts of data—pollution haze, heatwaves, gridlocks, emergency clinic loads...
            </p>
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl max-w-md w-full text-left font-mono text-[10px] sm:text-xs text-rose-400 flex flex-col gap-1.5 shadow-xl glass">
              <div className="flex justify-between items-center text-zinc-500 border-b border-zinc-900 pb-1 mb-1 font-bold">
                <span>INCIDENT FEED POLLING</span>
                <span className="animate-pulse">● FEED FAULT</span>
              </div>
              <div className="flex justify-between"><span>🚨 PM2.5 AQI Peak threshold:</span> <span>188 μg/m³</span></div>
              <div className="flex justify-between"><span>🚨 Extreme heat wave anomaly:</span> <span>+1.8°C Delta</span></div>
              <div className="flex justify-between"><span>🚨 Central Business District delays:</span> <span>+24 min delay</span></div>
            </div>
            <p className="text-zinc-505 text-xs italic">
              "Turning raw sensor streams into actionable decisions in real-time is difficult."
            </p>
          </div>
        )}

        {/* SCENE 2: The Solution Appears */}
        {scene === 2 && (
          <div className="flex flex-col items-center animate-fade-in gap-5 md:gap-6">
            <div className="relative mb-2 flex items-center justify-center">
              <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full border border-blue-500/30 animate-ping duration-3000" />
              <div className="absolute w-16 h-16 bg-teal-500/10 rounded-full border border-teal-500/30 animate-pulse" />
              <div className="p-5 bg-gradient-to-tr from-blue-600 to-teal-500 rounded-2xl shadow-xl flex items-center justify-center relative z-10 border border-blue-400/20">
                <Activity className="h-10 w-10 text-black animate-pulse" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 text-transparent bg-clip-text drop-shadow-sm">
              CommunityPulse AI
            </h1>
            <h3 className="text-base md:text-xl font-bold tracking-wide text-zinc-200 mt-2 font-mono">
              AI-Powered Decision Intelligence Platform
            </h3>
            <p className="text-xs md:text-sm text-zinc-550 max-w-md mt-1 leading-relaxed">
              Bridging the gap between real-world environmental metrics and critical municipal resource deployments.
            </p>
          </div>
        )}

        {/* SCENE 3: How It Works */}
        {scene === 3 && (
          <div className="flex flex-col items-center w-full max-w-4xl animate-fade-in gap-6 md:gap-8">
            <div>
              <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-white">
                RAG-Grounded Data Pipeline
              </h2>
              <p className="text-xs md:text-sm text-zinc-400 font-mono mt-1">Parallel live feeds integrated into localized context.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 items-center w-full gap-4 relative">
              
              <div className="md:col-span-2 border border-zinc-800 bg-zinc-950/80 p-4 rounded-xl text-left text-xs flex flex-col gap-2 font-mono shadow-md glass">
                <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1.5 mb-1 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-400" />
                  Live Parallel Feeds
                </span>
                <div className="flex justify-between items-center">
                  <span>🌦️ Weather API</span> <span className="text-emerald-400 text-[10px] font-bold">🟢 POLLING</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>🍃 Air Quality Index</span> <span className="text-emerald-400 text-[10px] font-bold">🟢 POLLING</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>🚗 Transit Loop Sensors</span> <span className="text-blue-400 text-[10px] font-bold">🔵 SIMULATED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>💬 Citizen Complaints</span> <span className="text-blue-400 text-[10px] font-bold">🔵 RAG DB</span>
                </div>
              </div>

              <div className="md:col-span-1 flex flex-col items-center justify-center">
                <ChevronRight className="hidden md:block h-8 w-8 text-teal-500 animate-pulse" />
                <span className="md:hidden text-xs text-teal-400 font-mono py-1">Integrates Into →</span>
              </div>

              <div className="md:col-span-2 border border-blue-900/30 bg-zinc-950/85 p-5 rounded-xl text-center flex flex-col items-center gap-3 shadow-lg relative overflow-hidden border-l-2 border-l-blue-500">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-xl rounded-full" />
                <Brain className="h-8 w-8 text-blue-400 animate-pulse" />
                <div>
                  <h4 className="font-bold text-xs text-zinc-200">Gemini Reasoning Engine</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Reasoning is locked strictly within the retrieved context to guarantee complete explainability.</p>
                </div>
                <span className="text-[9px] bg-blue-950/50 text-blue-400 border border-blue-900/40 font-mono px-2 py-0.5 rounded font-bold">
                  GROUNDING: ACTIVE
                </span>
              </div>

            </div>

            <p className="text-zinc-550 text-xs italic max-w-lg leading-relaxed">
              "We query local variables, structure RAG prompts, and stream context to generate grounded decisions."
            </p>
          </div>
        )}

        {/* SCENE 4: Feature Showcase */}
        {scene === 4 && (
          <div className="flex flex-col items-center w-full max-w-4xl animate-fade-in gap-6">
            <div>
              <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-white">
                Platform Features Preview
              </h2>
              <p className="text-xs md:text-sm text-zinc-400 font-mono mt-1">Full-spectrum tools built for administrators, coordinators, and citizens.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full text-left">
              
              <div className="border border-zinc-800 bg-zinc-950/60 p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden border-t-2 border-t-blue-500">
                <div>
                  <Bot className="h-6 w-6 text-blue-400 mb-2.5" />
                  <h4 className="font-bold text-xs text-zinc-200">🤖 PulseCopilot AI</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Chat assistant explaining urban risk indexes, grounded in local data.</p>
                </div>
              </div>

              <div className="border border-zinc-800 bg-zinc-950/60 p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden border-t-2 border-t-purple-500">
                <div>
                  <Activity className="h-6 w-6 text-purple-400 mb-2.5" />
                  <h4 className="font-bold text-xs text-zinc-200">🧪 What-If Lab</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Model hypothetical stress patterns to test city emergency responses.</p>
                </div>
              </div>

              <div className="border border-zinc-800 bg-zinc-950/60 p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden border-t-2 border-t-emerald-500">
                <div>
                  <FileText className="h-6 w-6 text-emerald-400 mb-2.5" />
                  <h4 className="font-bold text-xs text-zinc-200">📄 AI Executive Brief</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Compile PDF situation reports clearly separating facts from forecasts.</p>
                </div>
              </div>

              <div className="border border-zinc-800 bg-zinc-950/60 p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden border-t-2 border-t-orange-500">
                <div>
                  <Map className="h-6 w-6 text-orange-400 mb-2.5" />
                  <h4 className="font-bold text-xs text-zinc-200">🌍 GIS Map Layers</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Dynamic geolocations reverse-coded with sub-region overlays.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SCENE 5: Impact */}
        {scene === 5 && (
          <div className="flex flex-col items-center max-w-2xl animate-fade-in gap-5">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 rounded-full animate-pulse">
              <Sparkles className="h-7 w-7" />
            </div>

            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Empowering Resilient Communities
            </h2>
            <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-mono">
              "Better Insights. Better Decisions. Better Communities."
            </p>
            <div className="grid grid-cols-3 gap-4 w-full mt-4 text-center font-mono">
              <div className="p-3 border border-zinc-900 bg-zinc-950/60 rounded-lg">
                <span className="block text-lg font-bold text-emerald-400">💨 -45%</span>
                <span className="text-[9px] text-zinc-500 uppercase">AQI Mitigation</span>
              </div>
              <div className="p-3 border border-zinc-900 bg-zinc-950/60 rounded-lg">
                <span className="block text-lg font-bold text-emerald-400">⏱️ +15m</span>
                <span className="text-[9px] text-zinc-500 uppercase">Response Safety</span>
              </div>
              <div className="p-3 border border-zinc-900 bg-zinc-950/60 rounded-lg">
                <span className="block text-lg font-bold text-emerald-400">🏥 24/7</span>
                <span className="text-[9px] text-zinc-500 uppercase">Active Auditing</span>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 6: Final Welcome CTA */}
        {scene === 6 && (
          <div className="bg-[#0c0c0f]/90 border border-zinc-800 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in flex flex-col items-center gap-6 glass">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-teal-500 rounded-xl text-black">
              <Activity className="h-6 w-6" />
            </div>
            
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">Welcome to CommunityPulse AI</h2>
              <p className="text-xs text-zinc-500 mt-1 font-mono">Decision intelligence is now configured for your district.</p>
            </div>

            <button
              onClick={handleSkip}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-black font-extrabold rounded-lg text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1 shadow-md"
            >
              Enter Platform
              <ChevronRight className="h-4 w-4" />
            </button>

            <label className="flex items-center gap-2 text-[10px] text-zinc-500 cursor-pointer font-mono border-t border-zinc-900 pt-4 w-full justify-center">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-950 text-blue-600 focus:ring-0 focus:ring-offset-0"
              />
              DON'T SHOW THIS INTRO ON NEXT VISIT
            </label>
          </div>
        )}

      </div>

      {/* Control panel and progress timeline */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 flex-shrink-0">
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all duration-100" 
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          />
        </div>

        {/* Lower control strip */}
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
              title={isPlaying ? 'Pause Presentation' : 'Play Presentation'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <span>
              {Math.floor(currentTime).toString().padStart(2, '0')}s / {totalDuration}s
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <span 
                key={i} 
                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                  scene === i ? 'bg-teal-400 w-3' : scene > i ? 'bg-zinc-700' : 'bg-zinc-850'
                }`} 
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevScene}
              disabled={scene === 1}
              className="p-1 border border-zinc-800 rounded bg-zinc-900/40 hover:bg-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900/40 text-zinc-400 hover:text-white"
              title="Previous Scene"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={nextScene}
              disabled={scene === 6}
              className="p-1 border border-zinc-800 rounded bg-zinc-900/40 hover:bg-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900/40 text-zinc-400 hover:text-white"
              title="Next Scene"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {scene === 6 && (
              <button
                onClick={handleRestart}
                className="px-2 py-1 border border-blue-900/30 bg-blue-950/20 hover:bg-blue-900/30 text-blue-400 rounded text-[10px] font-bold"
              >
                Replay
              </button>
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .glass {
          background: rgba(12, 12, 15, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
