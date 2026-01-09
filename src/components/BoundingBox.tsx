interface DetectedObject {
  id: string;
  object: string;
  value: number;
  confidence: number;
  x: number;
  y: number;
  isDamaged?: boolean;
}

interface BoundingBoxProps {
  item: DetectedObject;
  containerWidth: number;
  containerHeight: number;
}

const BoundingBox = ({ item, containerWidth, containerHeight }: BoundingBoxProps) => {
  // Calculate position based on percentages
  const boxWidth = 120;
  const boxHeight = 80;
  const x = (item.x / 100) * containerWidth - boxWidth / 2;
  const y = (item.y / 100) * containerHeight - boxHeight / 2;

  const boxColor = item.isDamaged ? "hsl(var(--hud-damaged))" : "hsl(var(--hud-box))";
  const textColor = item.isDamaged ? "text-warning" : "text-primary";

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: Math.max(10, Math.min(x, containerWidth - boxWidth - 10)),
        top: Math.max(80, Math.min(y, containerHeight - boxHeight - 10)),
        width: boxWidth,
        height: boxHeight,
      }}
    >
      {/* Bounding box corners */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {/* Top left */}
        <path
          d="M 0 20 L 0 0 L 20 0"
          fill="none"
          stroke={boxColor}
          strokeWidth="2"
        />
        {/* Top right */}
        <path
          d="M 100 0 L 120 0 L 120 20"
          fill="none"
          stroke={boxColor}
          strokeWidth="2"
        />
        {/* Bottom left */}
        <path
          d="M 0 60 L 0 80 L 20 80"
          fill="none"
          stroke={boxColor}
          strokeWidth="2"
        />
        {/* Bottom right */}
        <path
          d="M 100 80 L 120 80 L 120 60"
          fill="none"
          stroke={boxColor}
          strokeWidth="2"
        />
        
        {/* Connecting lines (subtle) */}
        <line x1="20" y1="0" x2="100" y2="0" stroke={boxColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <line x1="20" y1="80" x2="100" y2="80" stroke={boxColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <line x1="0" y1="20" x2="0" y2="60" stroke={boxColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <line x1="120" y1="20" x2="120" y2="60" stroke={boxColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      </svg>

      {/* Object label */}
      <div 
        className="absolute -top-6 left-0 right-0 text-center"
      >
        <span className={`text-xs ${textColor} text-glow tracking-wider uppercase bg-background/80 px-2 py-0.5`}>
          {item.object}
        </span>
      </div>

      {/* Price tag */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
        <div 
          className="px-3 py-1 text-sm font-bold text-glow-intense"
          style={{ 
            color: item.isDamaged ? "hsl(var(--hud-damaged))" : "hsl(var(--hud-price))",
            textShadow: `0 0 10px ${item.isDamaged ? "hsl(var(--hud-damaged))" : "hsl(var(--hud-price))"}`
          }}
        >
          ${item.value.toLocaleString()}
        </div>
      </div>

      {/* Confidence indicator */}
      <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {Math.round(item.confidence * 100)}%
      </div>
    </div>
  );
};

export default BoundingBox;
export type { DetectedObject };
