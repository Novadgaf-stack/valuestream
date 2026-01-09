import { useEffect, useState } from "react";

interface BackoffWarningProps {
  pauseUntil: Date | null;
  reason: string;
}

const BackoffWarning = ({ pauseUntil, reason }: BackoffWarningProps) => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!pauseUntil) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((pauseUntil.getTime() - now) / 1000));
      setSecondsLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pauseUntil]);

  if (!pauseUntil || secondsLeft <= 0) return null;

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30">
      <div className="glass border-warning/50 px-6 py-3 flex items-center gap-4 animate-pulse">
        {/* Warning icon */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-warning rotate-45" />
          <span className="text-warning text-lg">!</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-warning tracking-[0.2em]">
            ANALYSIS PAUSED
          </span>
          <span className="text-xs text-muted-foreground">
            {reason}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-mono text-warning text-glow">
            {secondsLeft}s
          </span>
          <span className="text-xs text-muted-foreground">
            remaining
          </span>
        </div>
      </div>
    </div>
  );
};

export default BackoffWarning;
