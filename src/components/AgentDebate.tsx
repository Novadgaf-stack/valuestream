import React, { useEffect, useState } from 'react';

interface AgentDebateProps {
  bbox: { x: number; y: number; w: number; h: number } | null;
  pessimistText: string;
  hypemanText: string;
  finalPrice: number;
  lowballPrice: number;
  highballPrice: number;
  isPriceSettled: boolean;
  objectName: string;
  volatilityScore?: number;
}

const AgentDebate: React.FC<AgentDebateProps> = ({
  bbox,
  pessimistText,
  hypemanText,
  finalPrice,
  lowballPrice,
  highballPrice,
  isPriceSettled,
  objectName,
  volatilityScore = 0,
}) => {
  const [displayedPrice, setDisplayedPrice] = useState(0);
  const [isFlickering, setIsFlickering] = useState(false);

  // Price animation - flicker between values then settle
  useEffect(() => {
    if (!isPriceSettled && lowballPrice > 0 && highballPrice > 0) {
      setIsFlickering(true);
      const interval = setInterval(() => {
        const randomPrice = Math.floor(
          lowballPrice + Math.random() * (highballPrice - lowballPrice)
        );
        setDisplayedPrice(randomPrice);
      }, 100);
      
      return () => clearInterval(interval);
    } else if (isPriceSettled && finalPrice > 0) {
      setIsFlickering(false);
      setDisplayedPrice(finalPrice);
    }
  }, [isPriceSettled, finalPrice, lowballPrice, highballPrice]);

  if (!bbox) return null;

  const isHighVolatility = volatilityScore > 75;
  const isModerateVolatility = volatilityScore > 50 && volatilityScore <= 75;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get shake intensity based on volatility
  const getShakeClass = () => {
    if (isHighVolatility) return 'animate-volatility-shake-intense';
    if (isModerateVolatility) return 'animate-volatility-shake';
    return '';
  };

  const getBorderColor = () => {
    if (isHighVolatility) return 'border-warning';
    if (isPriceSettled) return 'border-hud-consensus';
    return 'border-primary';
  };

  // Extract key points from agent text
  const extractPoints = (text: string, type: 'deductions' | 'premiums'): string[] => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed[type] || [];
      }
    } catch {
      // Fallback: extract bullet-like points
      const points = text.match(/[-+]\d+%[^,\n]*/g) || [];
      return points.slice(0, 3);
    }
    return [];
  };

  const pessimistPoints = extractPoints(pessimistText, 'deductions');
  const hypemanPoints = extractPoints(hypemanText, 'premiums');

  return (
    <div 
      className={`absolute pointer-events-none ${getShakeClass()}`}
      style={{
        left: `${bbox.x}%`,
        top: `${bbox.y}%`,
        width: `${bbox.w}%`,
        height: `${bbox.h}%`,
      }}
    >
      {/* Volatility warning indicator */}
      {isHighVolatility && (
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-warning/20 border border-warning px-3 py-1 rounded animate-pulse">
          <span className="text-xs font-mono text-warning uppercase tracking-wider">
            ⚠️ HIGH VOLATILITY: {volatilityScore}%
          </span>
        </div>
      )}

      {/* Bounding box */}
      <div className={`
        absolute inset-0 
        border-2 ${getBorderColor()}
        ${isHighVolatility ? 'box-glow-warning' : isPriceSettled ? 'box-glow-consensus' : 'box-glow'}
        transition-all duration-500
        ${isHighVolatility ? 'animate-flicker-border' : ''}
      `}>
        {/* Corner accents */}
        <div className={`absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 ${getBorderColor()}`} />
        <div className={`absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 ${getBorderColor()}`} />
        <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 ${getBorderColor()}`} />
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 ${getBorderColor()}`} />
      </div>

      {/* Object name - above box */}
      <div className="absolute -top-10 left-0 right-0 flex justify-center">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider bg-background/80 px-2 py-1 rounded">
          {objectName}
        </span>
      </div>

      {/* Final Price - top of box */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2">
        <div className={`
          px-4 py-2 glass-dark rounded
          ${isFlickering ? 'animate-price-flicker' : isPriceSettled ? 'animate-price-settle' : ''}
        `}>
          <span className={`
            text-2xl font-bold font-mono mono-numbers
            ${isPriceSettled ? 'text-judge text-glow-gold' : 'text-hud-price'}
          `}>
            {formatPrice(displayedPrice)}
          </span>
        </div>
      </div>

      {/* Pessimist critique - left of box (red) */}
      <div 
        className="absolute right-full top-0 mr-3 w-48 max-h-full overflow-hidden"
        style={{ maxWidth: `${bbox.x - 5}%` }}
      >
        <div className="glass-dark rounded p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-agent-pessimist animate-pulse" />
            <span className="text-xs font-mono text-agent-pessimist uppercase tracking-wider">
              PESSIMIST
            </span>
          </div>
          <div className="space-y-1">
            {pessimistPoints.length > 0 ? (
              pessimistPoints.map((point, i) => (
                <p key={i} className="text-xs font-mono text-pessimist leading-relaxed">
                  {point}
                </p>
              ))
            ) : (
              <p className="text-xs font-mono text-pessimist leading-relaxed typewriter-text">
                {pessimistText.slice(0, 150)}
              </p>
            )}
          </div>
          {lowballPrice > 0 && (
            <div className="pt-2 border-t border-agent-pessimist/30">
              <span className="text-sm font-bold font-mono text-pessimist mono-numbers">
                {formatPrice(lowballPrice)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hype Man praise - right of box (green) */}
      <div 
        className="absolute left-full top-0 ml-3 w-48 max-h-full overflow-hidden"
        style={{ maxWidth: `${100 - bbox.x - bbox.w - 5}%` }}
      >
        <div className="glass-dark rounded p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-agent-hypeman animate-pulse" />
            <span className="text-xs font-mono text-agent-hypeman uppercase tracking-wider">
              HYPE MAN
            </span>
          </div>
          <div className="space-y-1">
            {hypemanPoints.length > 0 ? (
              hypemanPoints.map((point, i) => (
                <p key={i} className="text-xs font-mono text-hypeman leading-relaxed">
                  {point}
                </p>
              ))
            ) : (
              <p className="text-xs font-mono text-hypeman leading-relaxed typewriter-text">
                {hypemanText.slice(0, 150)}
              </p>
            )}
          </div>
          {highballPrice > 0 && (
            <div className="pt-2 border-t border-agent-hypeman/30">
              <span className="text-sm font-bold font-mono text-hypeman mono-numbers">
                {formatPrice(highballPrice)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDebate;
