import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SceneLiquidityProps {
  liquidity: number;
  isDebating: boolean;
  bearTotal: number;
  bullTotal: number;
  consensusTotal: number;
}

const SceneLiquidity = ({ 
  liquidity, 
  isDebating, 
  bearTotal, 
  bullTotal, 
  consensusTotal 
}: SceneLiquidityProps) => {
  const [displayLiquidity, setDisplayLiquidity] = useState(liquidity);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");

  useEffect(() => {
    if (isDebating) {
      // Simulate fluctuation during debate
      const interval = setInterval(() => {
        const fluctuation = (Math.random() - 0.5) * 20;
        setDisplayLiquidity((prev) => Math.max(0, Math.min(100, prev + fluctuation)));
        setTrend(fluctuation > 2 ? "up" : fluctuation < -2 ? "down" : "stable");
      }, 300);
      return () => clearInterval(interval);
    } else {
      setDisplayLiquidity(liquidity);
    }
  }, [isDebating, liquidity]);

  const getLiquidityColor = () => {
    if (displayLiquidity >= 70) return "text-green-400";
    if (displayLiquidity >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getLiquidityLabel = () => {
    if (displayLiquidity >= 70) return "HIGH";
    if (displayLiquidity >= 40) return "MEDIUM";
    return "LOW";
  };

  return (
    <div className="glass-dark rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={cn(
            "w-4 h-4",
            isDebating ? "text-cyan-400 animate-pulse" : "text-muted-foreground"
          )} />
          <span className="text-xs font-mono uppercase tracking-wider text-foreground/80">
            Scene Liquidity
          </span>
        </div>
        <div className="flex items-center gap-1">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
          <span className={cn("text-xs font-mono font-bold", getLiquidityColor())}>
            {getLiquidityLabel()}
          </span>
        </div>
      </div>

      {/* Liquidity bar */}
      <div className="relative h-3 bg-background/50 rounded-full overflow-hidden mb-4">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
            displayLiquidity >= 70 ? "bg-green-500" :
            displayLiquidity >= 40 ? "bg-yellow-500" : "bg-red-500",
            isDebating && "animate-pulse"
          )}
          style={{ width: `${displayLiquidity}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono font-bold text-white drop-shadow-lg">
            {Math.round(displayLiquidity)}%
          </span>
        </div>
      </div>

      {/* Agent valuations */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="text-[10px] font-mono text-red-400 mb-1">BEAR</div>
          <div className="text-sm font-bold text-red-400 font-mono">
            ${bearTotal.toLocaleString()}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <div className="text-[10px] font-mono text-cyan-400 mb-1">FAIR</div>
          <div className="text-sm font-bold text-cyan-400 font-mono">
            ${consensusTotal.toLocaleString()}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="text-[10px] font-mono text-green-400 mb-1">BULL</div>
          <div className="text-sm font-bold text-green-400 font-mono">
            ${bullTotal.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SceneLiquidity;
