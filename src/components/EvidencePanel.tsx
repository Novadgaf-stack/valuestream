import { useState } from "react";
import { X, Search } from "lucide-react";
import PriceComparison from "./PriceComparison";

export interface EvidenceItem {
  id: string;
  objectName: string;
  value: number;
  confidence: number;
  snapshotData: string;
  detectedAt: Date;
  confidenceHistory: number[];
}

interface EvidencePanelProps {
  items: EvidenceItem[];
  onClose: () => void;
}

const EvidencePanel = ({ items, onClose }: EvidencePanelProps) => {
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(
    items.length > 0 ? items[0] : null
  );
  const [comparingItem, setComparingItem] = useState<EvidenceItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="absolute left-4 top-32 bottom-4 w-72 z-20 glass">
        <div className="p-4 border-b border-primary/30 flex items-center justify-between">
          <span className="text-xs tracking-[0.2em] text-primary">EVIDENCE LOG</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">
            <X size={16} />
          </button>
        </div>
        <div className="p-8 text-center text-muted-foreground text-sm">
          No evidence collected yet
        </div>
      </div>
    );
  }

  // Calculate price range estimate
  const getPriceRange = (value: number) => {
    const low = Math.round(value * 0.75);
    const high = Math.round(value * 1.25);
    return { low, high };
  };

  // Simple confidence trend visualization
  const getConfidenceTrend = (history: number[]) => {
    if (history.length < 2) return "stable";
    const recent = history.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const first = recent[0];
    if (avg > first + 0.05) return "up";
    if (avg < first - 0.05) return "down";
    return "stable";
  };

  return (
    <>
      <div className="absolute left-4 top-32 bottom-4 w-80 z-20 glass flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-primary/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-hud-price rounded-full animate-pulse" />
            <span className="text-xs tracking-[0.2em] text-primary">EVIDENCE LOG</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">
            <X size={16} />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {items.map((item) => {
            const priceRange = getPriceRange(item.value);
            const trend = getConfidenceTrend(item.confidenceHistory);
            const isSelected = selectedItem?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-3 border-b border-primary/10 cursor-pointer transition-all ${
                  isSelected ? "bg-primary/10" : "hover:bg-primary/5"
                }`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  {item.snapshotData ? (
                    <img
                      src={item.snapshotData}
                      alt={item.objectName}
                      className="w-16 h-16 object-cover border border-primary/30"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted border border-primary/30 flex items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">{item.objectName}</div>
                    
                    {/* Value */}
                    <div className="text-lg text-hud-price text-glow font-mono">
                      ${item.value.toLocaleString()}
                    </div>
                    
                    {/* Price range */}
                    <div className="text-xs text-muted-foreground">
                      Range: ${priceRange.low} - ${priceRange.high}
                    </div>

                    {/* Confidence with trend */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-muted-foreground">
                        Conf: {Math.round(item.confidence * 100)}%
                      </div>
                      <div className={`text-xs ${
                        trend === "up" ? "text-hud-price" : 
                        trend === "down" ? "text-warning" : 
                        "text-muted-foreground"
                      }`}>
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setComparingItem(item);
                        }}
                        className="ml-auto text-primary hover:text-primary/80"
                        title="Compare prices on eBay"
                      >
                        <Search size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="p-3 border-t border-primary/30 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Items: {items.length}</span>
            <span>Total: ${items.reduce((sum, i) => sum + i.value, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Price Comparison Modal */}
      {comparingItem && (
        <PriceComparison
          itemName={comparingItem.objectName}
          estimatedValue={comparingItem.value}
          onClose={() => setComparingItem(null)}
        />
      )}
    </>
  );
};

export default EvidencePanel;
