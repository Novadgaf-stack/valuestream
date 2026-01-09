import React, { useState, useEffect, useCallback } from 'react';
import { useBootAudio } from '@/hooks/useBootAudio';

interface BootLine {
  prefix: string;
  message: string;
  status: string;
  statusColor: 'cyan' | 'green' | 'gold';
}

const BOOT_SEQUENCE: BootLine[] = [
  { prefix: '[KERNEL]', message: 'Allocating Neural Buffers', status: 'OK', statusColor: 'green' },
  { prefix: '[UPLINK]', message: 'Connecting to Gemini 1.5 Flash', status: 'SECURE', statusColor: 'cyan' },
  { prefix: '[AGENTS]', message: "Waking 'The Bear' (Risk Analyst)", status: 'ONLINE', statusColor: 'green' },
  { prefix: '[AGENTS]', message: "Waking 'The Bull' (Asset Speculator)", status: 'ONLINE', statusColor: 'green' },
  { prefix: '[AGENTS]', message: "Waking 'The Judge' (Final Arbiter)", status: 'ONLINE', statusColor: 'gold' },
  { prefix: '[SENSORS]', message: 'Requesting Optical Feed', status: 'AWAIT', statusColor: 'cyan' },
];

interface Props {
  onComplete: () => void;
}

const BootTerminal: React.FC<Props> = ({ onComplete }) => {
  const [lines, setLines] = useState<{ text: string; complete: boolean }[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const { playTypingKey, playSuccess } = useBootAudio();

  const getStatusColorClass = (color: 'cyan' | 'green' | 'gold') => {
    switch (color) {
      case 'cyan': return 'text-primary';
      case 'green': return 'text-hud-consensus';
      case 'gold': return 'text-hud-price';
    }
  };

  useEffect(() => {
    if (currentLineIndex >= BOOT_SEQUENCE.length) {
      // All lines complete, wait and trigger callback
      const timer = setTimeout(() => {
        playSuccess();
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }

    const line = BOOT_SEQUENCE[currentLineIndex];
    const fullText = `${line.prefix} ${line.message}...`;

    if (currentCharIndex === 0) {
      // Start new line
      setLines(prev => [...prev, { text: '', complete: false }]);
    }

    if (currentCharIndex < fullText.length) {
      const timer = setTimeout(() => {
        setLines(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            text: fullText.slice(0, currentCharIndex + 1),
            complete: false
          };
          return updated;
        });
        if (currentCharIndex % 2 === 0) playTypingKey();
        setCurrentCharIndex(prev => prev + 1);
      }, 15 + Math.random() * 20);
      return () => clearTimeout(timer);
    } else {
      // Line complete, show status
      const timer = setTimeout(() => {
        setLines(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            text: fullText,
            complete: true
          };
          return updated;
        });
        playSuccess();
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, currentCharIndex, playTypingKey, playSuccess, onComplete]);

  return (
    <div className="font-mono text-sm md:text-base leading-relaxed">
      {lines.map((line, i) => {
        const bootLine = BOOT_SEQUENCE[i];
        return (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="text-muted-foreground">&gt;</span>
            <span className="text-hud-consensus">{line.text}</span>
            {line.complete && bootLine && (
              <span className={`ml-auto ${getStatusColorClass(bootLine.statusColor)} animate-fade-in`}>
                [{bootLine.status}]
              </span>
            )}
            {!line.complete && (
              <span className="animate-typewriter-cursor text-hud-consensus">▋</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BootTerminal;
