import { useEffect, useState } from "react";

const HudOverlay = () => {
  const [scanPosition, setScanPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanPosition((prev) => (prev + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 hud-grid opacity-30" />
      
      {/* Scanlines effect */}
      <div className="absolute inset-0 scanlines" />
      
      {/* Scanning beam */}
      <div 
        className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-primary to-transparent opacity-60"
        style={{ 
          top: `${scanPosition}%`,
          boxShadow: '0 0 30px 10px hsl(var(--primary))'
        }}
      />
      
      {/* Corner brackets */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Top Left */}
        <path
          d="M 20 60 L 20 20 L 60 20"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="animate-pulse-glow"
        />
        {/* Top Right */}
        <path
          d="M calc(100% - 60px) 20 L calc(100% - 20px) 20 L calc(100% - 20px) 60"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="animate-pulse-glow"
        />
        {/* Bottom Left */}
        <path
          d="M 20 calc(100% - 60px) L 20 calc(100% - 20px) L 60 calc(100% - 20px)"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="animate-pulse-glow"
        />
        {/* Bottom Right */}
        <path
          d="M calc(100% - 60px) calc(100% - 20px) L calc(100% - 20px) calc(100% - 20px) L calc(100% - 20px) calc(100% - 60px)"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="animate-pulse-glow"
        />
      </svg>

      {/* Center crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-24 h-24">
          <div className="absolute top-1/2 left-0 w-full h-px bg-primary/50" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-primary/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-primary rounded-full animate-pulse-glow" />
        </div>
      </div>

      {/* Top bar decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-2 mt-4">
        <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary" />
        <div className="w-2 h-2 rotate-45 border border-primary" />
        <div className="w-20 h-px bg-primary" />
        <div className="w-2 h-2 rotate-45 border border-primary" />
        <div className="w-8 h-px bg-gradient-to-l from-transparent to-primary" />
      </div>
    </div>
  );
};

export default HudOverlay;
