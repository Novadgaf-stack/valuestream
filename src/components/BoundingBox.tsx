import { useState } from "react";
import { Volume2, Check } from "lucide-react";

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
  const [isSelected, setIsSelected] = useState(false);

  const x = (item.x / 100) * containerWidth;
  const y = (item.y / 100) * containerHeight;
  const width = (item.w / 100) * containerWidth;
  const height = (item.h / 100) * containerHeight;

  const clampedX = Math.max(0, Math.min(x, containerWidth - width));
  const clampedY = Math.max(80, Math.min(y, containerHeight - height - 40));
  const clampedW = Math.min(width, containerWidth - clampedX);
  const clampedH = Math.min(height, containerHeight - clampedY);

  const handleClick = () => {
    setIsSelected(true);
    if (onTap) {
      onTap(item);
    }
    // Reset selection after 2 seconds
    setTimeout(() => setIsSelected(false), 2000);
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
        className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
          isSelected
            ? "border-primary bg-primary/25 ring-4 ring-primary/30"
            : item.isDamaged 
              ? "border-amber-500 bg-amber-500/10" 
              : "border-primary/70 bg-primary/5"
        } group-hover:bg-primary/15 group-hover:border-primary`}
      />

      {/* Corner indicators */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 rounded-tl-lg transition-colors ${
        isSelected ? "border-primary" : item.isDamaged ? "border-amber-500" : "border-primary/70"
      } group-hover:border-primary`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 rounded-tr-lg transition-colors ${
        isSelected ? "border-primary" : item.isDamaged ? "border-amber-500" : "border-primary/70"
      } group-hover:border-primary`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 rounded-bl-lg transition-colors ${
        isSelected ? "border-primary" : item.isDamaged ? "border-amber-500" : "border-primary/70"
      } group-hover:border-primary`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 rounded-br-lg transition-colors ${
        isSelected ? "border-primary" : item.isDamaged ? "border-amber-500" : "border-primary/70"
      } group-hover:border-primary`} />

      {/* Label pill */}
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div className={`glass-premium px-3 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300 ${
          isSelected ? "bg-primary text-primary-foreground shadow-lg scale-105" : ""
        }`}>
          <span className={`text-xs font-semibold ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
            {item.object}
          </span>
          {isSelected && <Check className="w-3 h-3" />}
        </div>
      </div>

      {/* Price tag - prominent when selected */}
      <div className="absolute -bottom-11 left-1/2 -translate-x-1/2">
        <div 
          className={`glass-premium px-4 py-2 rounded-full font-bold transition-all duration-300 ${
            isSelected 
              ? "bg-primary text-primary-foreground shadow-xl scale-110 animate-pulse" 
              : item.isDamaged 
                ? "text-amber-500" 
                : "text-green-600 dark:text-green-400"
          }`}
        >
          ${item.value.toLocaleString()}
        </div>
      </div>

      {/* Tap to hear indicator */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}>
        <div className={`p-3 rounded-full transition-all duration-300 ${
          isSelected 
            ? "bg-primary shadow-lg scale-110" 
            : "glass-premium"
        }`}>
          <Volume2 className={`w-6 h-6 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
        </div>
      </div>

      {/* Selection ripple effect */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl animate-ping bg-primary/20 pointer-events-none" />
      )}
    </div>
  );
};

export default BoundingBox;
export type { DetectedObject };
