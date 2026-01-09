import React from 'react';

const AnimatedGrid: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Horizontal lines */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full h-px bg-primary/10"
            style={{
              top: `${(i + 1) * 5}%`,
              animation: `grid-pulse 4s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>
      
      {/* Vertical lines */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full w-px bg-primary/10"
            style={{
              left: `${(i + 1) * 5}%`,
              animation: `grid-pulse 4s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Moving scan beam */}
      <div 
        className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        style={{
          animation: 'scan-vertical 6s linear infinite',
        }}
      />

      {/* Corner vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
        }}
      />
    </div>
  );
};

export default AnimatedGrid;
