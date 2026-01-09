import React, { useState, useCallback } from 'react';
import { useBootAudio } from '@/hooks/useBootAudio';

interface Props {
  onClick: () => void;
  children: React.ReactNode;
}

const HoloButton: React.FC<Props> = ({ onClick, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { playBeep, playInitialize } = useBootAudio();

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    playBeep(600, 0.05, 'sine');
  }, [playBeep]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    playInitialize();
    onClick();
  }, [onClick, playInitialize]);

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative px-12 py-6 text-xl md:text-2xl tracking-[0.2em] font-mono uppercase
        border-2 border-primary bg-transparent text-primary
        transition-all duration-300 overflow-hidden
        ${isHovered ? 'holo-glitch' : ''}
      `}
      style={{
        textShadow: isHovered 
          ? '2px 0 #ff0040, -2px 0 #00ff41, 0 0 20px hsl(var(--primary))' 
          : '0 0 10px hsl(var(--primary))',
        boxShadow: isHovered
          ? '0 0 30px hsl(var(--primary) / 0.5), inset 0 0 30px hsl(var(--primary) / 0.1)'
          : '0 0 15px hsl(var(--primary) / 0.3), inset 0 0 15px hsl(var(--primary) / 0.05)',
      }}
    >
      {/* Chromatic aberration layers */}
      {isHovered && (
        <>
          <span 
            className="absolute inset-0 flex items-center justify-center text-[#ff0040] opacity-70"
            style={{ transform: 'translateX(-3px)', mixBlendMode: 'screen' }}
          >
            {children}
          </span>
          <span 
            className="absolute inset-0 flex items-center justify-center text-[#00ff41] opacity-70"
            style={{ transform: 'translateX(3px)', mixBlendMode: 'screen' }}
          >
            {children}
          </span>
        </>
      )}
      
      {/* Main text */}
      <span className="relative z-10">{children}</span>
      
      {/* Scanning line effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: isHovered 
            ? 'linear-gradient(transparent 45%, hsl(var(--primary)) 50%, transparent 55%)'
            : 'none',
          animation: isHovered ? 'scan-line 0.5s linear infinite' : 'none',
        }}
      />
      
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary" />

      {/* Pulse ring */}
      <div 
        className="absolute inset-0 border-2 border-primary opacity-50 animate-pulse"
        style={{ 
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
    </button>
  );
};

export default HoloButton;
