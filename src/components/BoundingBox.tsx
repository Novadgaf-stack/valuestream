interface DetectedObject {
  id: string;
  object: string;
  value: number;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isDamaged?: boolean;
}

interface BoundingBoxProps {
  item: DetectedObject;
  containerWidth: number;
  containerHeight: number;
}

const BoundingBox = ({ item, containerWidth, containerHeight }: BoundingBoxProps) => {
  // Calculate position and size based on percentages
  const x = (item.x / 100) * containerWidth;
  const y = (item.y / 100) * containerHeight;
  const width = (item.w / 100) * containerWidth;
  const height = (item.h / 100) * containerHeight;

  // Clamp to screen bounds
  const clampedX = Math.max(0, Math.min(x, containerWidth - width));
  const clampedY = Math.max(80, Math.min(y, containerHeight - height - 40));
  const clampedW = Math.min(width, containerWidth - clampedX);
  const clampedH = Math.min(height, containerHeight - clampedY);

  const boxColor = item.isDamaged ? "hsl(var(--hud-damaged))" : "hsl(var(--hud-box))";
  const textColor = item.isDamaged ? "text-warning" : "text-primary";

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: clampedX,
        top: clampedY,
        width: clampedW,
        height: clampedH,
      }}
    >
      {/* Full bounding box with corners */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {/* Full border (subtle) */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="none"
          stroke={boxColor}
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.4"
        />
        
        {/* Corner brackets - Top left */}
        <path
          d="M 0 20 L 0 0 L 20 0"
          fill="none"
          stroke={boxColor}
          strokeWidth="3"
        />
        {/* Top right */}
        <path
          d={`M ${clampedW - 20} 0 L ${clampedW} 0 L ${clampedW} 20`}
          fill="none"
          stroke={boxColor}
          strokeWidth="3"
        />
        {/* Bottom left */}
        <path
          d={`M 0 ${clampedH - 20} L 0 ${clampedH} L 20 ${clampedH}`}
          fill="none"
          stroke={boxColor}
          strokeWidth="3"
        />
        {/* Bottom right */}
        <path
          d={`M ${clampedW - 20} ${clampedH} L ${clampedW} ${clampedH} L ${clampedW} ${clampedH - 20}`}
          fill="none"
          stroke={boxColor}
          strokeWidth="3"
        />
      </svg>

      {/* Object label */}
      <div className="absolute -top-6 left-0 right-0 text-center">
        <span className={`text-xs ${textColor} text-glow tracking-wider uppercase bg-background/80 px-2 py-0.5`}>
          {item.object}
        </span>
      </div>

      {/* Price tag */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
        <div 
          className="px-3 py-1 text-sm font-bold text-glow-intense bg-background/60"
          style={{ 
            color: item.isDamaged ? "hsl(var(--hud-damaged))" : "hsl(var(--hud-price))",
            textShadow: `0 0 10px ${item.isDamaged ? "hsl(var(--hud-damaged))" : "hsl(var(--hud-price))"}`
          }}
        >
          ${item.value.toLocaleString()}
        </div>
      </div>

      {/* Confidence indicator */}
      <div className="absolute -right-14 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background/60 px-1">
        {Math.round(item.confidence * 100)}%
      </div>
    </div>
  );
};

export default BoundingBox;
export type { DetectedObject };
