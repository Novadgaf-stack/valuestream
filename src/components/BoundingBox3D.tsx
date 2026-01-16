import { useState, useCallback } from "react";
import { Check, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DetectedObject {
  id: string;
  object: string;
  value: number;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isDamaged: boolean;
  bearValue?: number;
  bullValue?: number;
  consensus?: string;
  priceSource?: string;
}

interface BoundingBox3DProps {
  item: DetectedObject;
  containerWidth: number;
  containerHeight: number;
  onTap?: (item: DetectedObject) => void;
}

const BoundingBox3D = ({ item, containerWidth, containerHeight, onTap }: BoundingBox3DProps) => {
  const [tapped, setTapped] = useState(false);
  const [showPriceTag, setShowPriceTag] = useState(false);

  const handleTap = useCallback(() => {
    setTapped(true);
    setShowPriceTag(true);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    onTap?.(item);
    
    setTimeout(() => {
      setTapped(false);
    }, 2000);
    
    setTimeout(() => {
      setShowPriceTag(false);
    }, 4000);
  }, [item, onTap]);

  const left = (item.x / 100) * containerWidth;
  const top = (item.y / 100) * containerHeight;
  const width = (item.w / 100) * containerWidth;
  const height = (item.h / 100) * containerHeight;

  const borderColor = item.isDamaged 
    ? "rgb(251, 191, 36)" // amber-400
    : tapped 
      ? "rgb(34, 211, 238)" // cyan-400
      : "rgb(59, 130, 246)"; // blue-500

  const glowColor = item.isDamaged
    ? "rgba(251, 191, 36, 0.4)"
    : tapped
      ? "rgba(34, 211, 238, 0.6)"
      : "rgba(59, 130, 246, 0.3)";

  return (
    <div
      className={cn(
        "absolute pointer-events-auto cursor-pointer transition-all duration-300",
        tapped && "z-50"
      )}
      style={{
        left,
        top,
        width,
        height,
        perspective: "1000px",
      }}
      onClick={handleTap}
    >
      {/* 3D Box effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg transition-all duration-300",
          tapped && "scale-105"
        )}
        style={{
          border: `2px solid ${borderColor}`,
          boxShadow: `
            0 0 20px ${glowColor},
            inset 0 0 20px ${glowColor},
            0 4px 30px rgba(0, 0, 0, 0.3)
          `,
          background: `linear-gradient(135deg, ${glowColor} 0%, transparent 50%)`,
          transform: tapped ? "rotateX(-5deg) rotateY(5deg)" : "none",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Corner accents - 3D effect */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor }} />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor }} />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor }} />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor }} />

        {/* Scan lines */}
        {tapped && (
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div
              className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
              style={{
                animation: "scanLine 1s ease-in-out infinite",
              }}
            />
          </div>
        )}
      </div>

      {/* Confidence indicator */}
      <div
        className="absolute -bottom-1 left-0 h-1 rounded-full"
        style={{
          width: `${item.confidence * 100}%`,
          background: `linear-gradient(90deg, ${borderColor}, transparent)`,
        }}
      />

      {/* Floating price tag */}
      {showPriceTag && (
        <div
          className={cn(
            "absolute -top-14 left-1/2 -translate-x-1/2 animate-fade-in z-50"
          )}
        >
          <div className="relative">
            {/* Main tag */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/50 rounded-lg px-3 py-2 shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-400 uppercase truncate max-w-32">
                  {item.object}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-white font-mono">
                  ${item.value.toLocaleString()}
                </span>
                <Check className="w-4 h-4 text-green-400" />
              </div>
              
              {/* Bear/Bull range if available */}
              {item.bearValue !== undefined && item.bullValue !== undefined && (
                <div className="flex items-center justify-center gap-2 mt-1 text-[10px] font-mono">
                  <span className="text-red-400">${item.bearValue}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="text-green-400">${item.bullValue}</span>
                </div>
              )}
            </div>
            
            {/* Arrow pointing down */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800" />
          </div>
        </div>
      )}

      {/* Ripple effect on tap */}
      {tapped && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            animation: "ripple 0.6s ease-out",
            border: `2px solid ${borderColor}`,
          }}
        />
      )}

      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default BoundingBox3D;
