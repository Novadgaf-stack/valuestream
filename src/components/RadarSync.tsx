import React from 'react';

interface RadarSyncProps {
  isScanning: boolean;
  hasConsensus: boolean;
}

const RadarSync: React.FC<RadarSyncProps> = ({ isScanning, hasConsensus }) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
      {/* Outer pulse rings */}
      {isScanning && (
        <>
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-primary/30 animate-radar-pulse"
            style={{ animationDelay: '0s' }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-primary/30 animate-radar-pulse"
            style={{ animationDelay: '0.5s' }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-primary/30 animate-radar-pulse"
            style={{ animationDelay: '1s' }}
          />
        </>
      )}
      
      {/* Central radar */}
      <div className={`
        relative w-20 h-20 rounded-full 
        ${hasConsensus ? 'bg-hud-consensus/10' : 'bg-primary/10'}
        border ${hasConsensus ? 'border-hud-consensus/50' : 'border-primary/50'}
        ${hasConsensus ? 'animate-consensus-glow' : ''}
        transition-colors duration-500
      `}>
        {/* Radar sweep line */}
        {isScanning && (
          <div className="absolute inset-0 animate-radar-sweep">
            <div 
              className={`
                absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left
                ${hasConsensus ? 'bg-gradient-to-r from-hud-consensus to-transparent' : 'bg-gradient-to-r from-primary to-transparent'}
              `}
            />
          </div>
        )}
        
        {/* Center dot */}
        <div className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
          w-3 h-3 rounded-full 
          ${hasConsensus ? 'bg-hud-consensus' : 'bg-primary'}
          ${isScanning ? 'animate-pulse-glow' : ''}
        `} />
        
        {/* Grid lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-full h-px ${hasConsensus ? 'bg-hud-consensus/30' : 'bg-primary/30'}`} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`h-full w-px ${hasConsensus ? 'bg-hud-consensus/30' : 'bg-primary/30'}`} />
        </div>
        
        {/* Circular gridlines */}
        <div className={`absolute inset-2 rounded-full border ${hasConsensus ? 'border-hud-consensus/20' : 'border-primary/20'}`} />
        <div className={`absolute inset-4 rounded-full border ${hasConsensus ? 'border-hud-consensus/20' : 'border-primary/20'}`} />
      </div>
      
      {/* Status text */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className={`
          text-xs font-mono uppercase tracking-wider
          ${hasConsensus ? 'text-hud-consensus text-glow' : 'text-primary/70'}
        `}>
          {hasConsensus ? '● CONSENSUS' : isScanning ? '◌ SYNCING...' : '○ STANDBY'}
        </span>
      </div>
    </div>
  );
};

export default RadarSync;
