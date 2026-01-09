import React, { useState, useEffect } from 'react';

interface Props {
  trigger: boolean;
  onComplete: () => void;
}

const ScreenFlash: React.FC<Props> = ({ trigger, onComplete }) => {
  const [phase, setPhase] = useState<'idle' | 'flash' | 'fade'>('idle');

  useEffect(() => {
    if (trigger && phase === 'idle') {
      setPhase('flash');
      
      setTimeout(() => {
        setPhase('fade');
      }, 150);

      setTimeout(() => {
        onComplete();
      }, 600);
    }
  }, [trigger, phase, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div 
      className={`
        fixed inset-0 z-50 pointer-events-none
        ${phase === 'flash' ? 'bg-white' : 'bg-transparent'}
        transition-all duration-500
      `}
      style={{
        opacity: phase === 'flash' ? 1 : 0,
      }}
    />
  );
};

export default ScreenFlash;
