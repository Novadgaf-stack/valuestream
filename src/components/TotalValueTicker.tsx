import { useEffect, useState } from "react";

interface TotalValueTickerProps {
  value: number;
  isAnalyzing: boolean;
}

const TotalValueTicker = ({ value, isAnalyzing }: TotalValueTickerProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animate counting up to the new value
    const duration = 500; // ms
    const startValue = displayValue;
    const difference = value - startValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + difference * easeOutQuart;
      
      setDisplayValue(Math.round(currentValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const formatValue = (val: number) => {
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
      <div className="glass px-8 py-4 text-center">
        <div className="text-xs tracking-[0.3em] text-muted-foreground mb-1">
          TOTAL SCENE VALUE
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-5xl md:text-7xl font-mono text-glow-intense text-primary animate-countup-glow">
            ${formatValue(displayValue)}
          </span>
          {isAnalyzing && (
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse ml-2" />
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-2 tracking-wider">
          USD ESTIMATED VALUE
        </div>
      </div>
    </div>
  );
};

export default TotalValueTicker;
