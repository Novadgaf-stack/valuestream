import { Volume2 } from "lucide-react";

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
  onTap?: (item: DetectedObject) => void;
}

const BoundingBox = ({ item, containerWidth, containerHeight, onTap }: BoundingBoxProps) => {
  const x = (item.x / 100) * containerWidth;
  const y = (item.y / 100) * containerHeight;
  const width = (item.w / 100) * containerWidth;
  const height = (item.h / 100) * containerHeight;

  const clampedX = Math.max(0, Math.min(x, containerWidth - width));
  const clampedY = Math.max(80, Math.min(y, containerHeight - height - 40));
  const clampedW = Math.min(width, containerWidth - clampedX);
  const clampedH = Math.min(height, containerHeight - clampedY);

  const handleClick = () => {
    if (onTap) {
      onTap(item);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="absolute cursor-pointer group"
      style={{
        left: clampedX,
        top: clampedY,
        width: clampedW,
        height: clampedH,
      }}
    >
      {/* Bounding box overlay */}
      <div 
        className={`absolute inset-0 rounded-lg border-2 transition-all ${
          item.isDamaged 
            ? "border-amber-500 bg-amber-500/10" 
            : "border-primary bg-primary/10"
        } group-hover:bg-primary/20`}
      />

      {/* Corner indicators */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 rounded-tl-lg ${
        item.isDamaged ? "border-amber-500" : "border-primary"
      }`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 rounded-tr-lg ${
        item.isDamaged ? "border-amber-500" : "border-primary"
      }`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 rounded-bl-lg ${
        item.isDamaged ? "border-amber-500" : "border-primary"
      }`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 rounded-br-lg ${
        item.isDamaged ? "border-amber-500" : "border-primary"
      }`} />

      {/* Label pill */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div className="glass-premium px-3 py-1 rounded-full flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{item.object}</span>
          <Volume2 className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Price tag */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
        <div 
          className={`glass-premium px-4 py-1.5 rounded-full font-semibold ${
            item.isDamaged ? "text-amber-500" : "text-green-500"
          }`}
        >
          ${item.value.toLocaleString()}
        </div>
      </div>

      {/* Confidence badge */}
      <div className="absolute -right-12 top-1/2 -translate-y-1/2">
        <div className="glass-premium px-2 py-1 rounded-md">
          <span className="text-xs text-muted-foreground">
            {Math.round(item.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Tap indicator on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="glass-premium p-2 rounded-full">
          <Volume2 className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default BoundingBox;
export type { DetectedObject };
