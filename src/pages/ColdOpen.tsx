import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedGrid from '@/components/AnimatedGrid';
import HoloButton from '@/components/HoloButton';
import BootTerminal from '@/components/BootTerminal';
import ScreenFlash from '@/components/ScreenFlash';
import { useBootAudio } from '@/hooks/useBootAudio';

type Phase = 'hero' | 'boot' | 'camera' | 'flash' | 'scanner';

const ColdOpen: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('hero');
  const [heroVisible, setHeroVisible] = useState(true);
  const [cameraGranted, setCameraGranted] = useState(false);
  const { playSystemOnline } = useBootAudio();

  const handleInitialize = useCallback(() => {
    setHeroVisible(false);
    setTimeout(() => setPhase('boot'), 500);
  }, []);

  const handleBootComplete = useCallback(async () => {
    setPhase('camera');
    
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
      
      setCameraGranted(true);
      playSystemOnline();
      
      // Trigger flash transition
      setTimeout(() => setPhase('flash'), 500);
    } catch (error) {
      console.error('Camera access denied:', error);
      // Still proceed but show error state
      setPhase('flash');
    }
  }, [playSystemOnline]);

  const handleFlashComplete = useCallback(() => {
    setPhase('scanner');
    navigate('/');
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <AnimatedGrid />
      
      {/* Hero Phase */}
      <div 
        className={`
          absolute inset-0 flex flex-col items-center justify-center z-10
          transition-all duration-500
          ${heroVisible && phase === 'hero' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Status indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-3 h-3 rounded-full bg-agent-pessimist animate-pulse" />
          <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
            System Standby
          </span>
        </div>

        {/* Main title */}
        <h1 
          className="text-3xl md:text-5xl lg:text-6xl text-center px-4 mb-4 tracking-[0.15em]"
          style={{
            fontFamily: "'Share Tech Mono', 'JetBrains Mono', monospace",
            color: 'hsl(var(--primary))',
            textShadow: '0 0 30px hsl(var(--primary) / 0.5)',
          }}
        >
          MARKETFORCE
        </h1>
        
        <h2 
          className="text-lg md:text-2xl text-center text-muted-foreground tracking-[0.2em] mb-12"
          style={{
            fontFamily: "'Share Tech Mono', 'JetBrains Mono', monospace",
          }}
        >
          REALITY CONSENSUS <span className="text-agent-pessimist">[OFFLINE]</span>
        </h2>

        {/* Initialize button */}
        <HoloButton onClick={handleInitialize}>
          [ INITIALIZE SYSTEM ]
        </HoloButton>

        {/* Version info */}
        <div className="absolute bottom-8 text-xs text-muted-foreground/50 tracking-widest">
          v2.0.0 • MULTI-AGENT CONSENSUS ENGINE
        </div>
      </div>

      {/* Boot Phase - Terminal */}
      <div 
        className={`
          absolute inset-0 flex items-center justify-center z-10 p-8
          transition-all duration-500
          ${phase === 'boot' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div className="w-full max-w-2xl glass-dark p-6 md:p-8 rounded border border-primary/30">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-primary/20">
            <div className="w-3 h-3 rounded-full bg-agent-pessimist" />
            <div className="w-3 h-3 rounded-full bg-hud-price" />
            <div className="w-3 h-3 rounded-full bg-hud-consensus" />
            <span className="ml-4 text-xs text-muted-foreground tracking-widest">
              MARKETFORCE BOOT SEQUENCE
            </span>
          </div>
          
          <BootTerminal onComplete={handleBootComplete} />
        </div>
      </div>

      {/* Camera Phase - Waiting indicator */}
      <div 
        className={`
          absolute inset-0 flex flex-col items-center justify-center z-10
          transition-all duration-300
          ${phase === 'camera' && !cameraGranted ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
        <p className="text-primary tracking-widest text-sm">AWAITING SENSOR ACCESS...</p>
      </div>

      {/* Flash transition */}
      <ScreenFlash 
        trigger={phase === 'flash'} 
        onComplete={handleFlashComplete}
      />

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/30" />
    </div>
  );
};

export default ColdOpen;
