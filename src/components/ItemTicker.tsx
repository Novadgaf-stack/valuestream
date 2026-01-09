import { useEffect, useRef, useState } from "react";

interface TickerItem {
  id: string;
  objectName: string;
  value: number;
  timestamp: Date;
  isDamaged?: boolean;
}

interface ItemTickerProps {
  items: TickerItem[];
}

const ItemTicker = ({ items }: ItemTickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animatedItems, setAnimatedItems] = useState<TickerItem[]>([]);

  // Add new items with staggered animation
  useEffect(() => {
    const newItems = items.filter(
      (item) => !animatedItems.find((a) => a.id === item.id)
    );
    
    if (newItems.length > 0) {
      setAnimatedItems((prev) => [...prev, ...newItems].slice(-20)); // Keep last 20
    }
  }, [items, animatedItems]);

  // Format time since detection
  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  if (animatedItems.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-0 right-0 z-20 overflow-hidden">
      {/* Background bar */}
      <div className="relative bg-background/80 backdrop-blur-sm border-t border-b border-primary/30">
        {/* Gradient edges for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
        
        {/* Scrolling container */}
        <div 
          ref={containerRef}
          className="flex items-center gap-6 py-2 px-4 animate-ticker"
          style={{
            animation: `ticker ${Math.max(animatedItems.length * 3, 15)}s linear infinite`,
          }}
        >
          {/* Double the items for seamless loop */}
          {[...animatedItems, ...animatedItems].map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-3 shrink-0"
            >
              {/* Status indicator */}
              <div 
                className={`w-2 h-2 rounded-full ${
                  item.isDamaged 
                    ? "bg-warning animate-pulse" 
                    : "bg-primary"
                }`}
              />
              
              {/* Item info */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {item.objectName}
                </span>
                <span 
                  className={`text-sm font-bold ${
                    item.isDamaged ? "text-warning" : "text-hud-price"
                  }`}
                  style={{
                    textShadow: item.isDamaged 
                      ? "0 0 8px hsl(var(--warning))" 
                      : "0 0 8px hsl(var(--hud-price))"
                  }}
                >
                  ${item.value.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  {formatTimeSince(item.timestamp)}
                </span>
              </div>

              {/* Separator */}
              <div className="w-px h-4 bg-primary/30" />
            </div>
          ))}
        </div>

        {/* Ticker label */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/90 px-2 py-0.5 border border-primary/50">
          <span className="text-[10px] text-primary tracking-widest font-mono">
            LIVE FEED
          </span>
        </div>
      </div>
    </div>
  );
};

export default ItemTicker;
export type { TickerItem };
