import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";

interface TotalValueTickerProps {
  value: number;
  isAnalyzing: boolean;
}

const TotalValueTicker = ({ value, isAnalyzing }: TotalValueTickerProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 500;
    const startValue = displayValue;
    const difference = value - startValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + difference * easeOutQuart;
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatValue = (val: number) => {
    return val.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
      <div className="glass-premium rounded-2xl px-6 py-4 text-center min-w-[200px]">
        <div className="flex items-center justify-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Total Value
          </span>
          {isAnalyzing && (
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <div className="flex items-center justify-center">
          <span className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight">
            ${formatValue(displayValue)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TotalValueTicker;
