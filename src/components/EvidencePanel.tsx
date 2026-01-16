import { useState } from "react";
import { X, Search, Volume2 } from "lucide-react";
import PriceComparison from "./PriceComparison";
import { Button } from "@/components/ui/button";

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
  onSpeakItem?: (name: string, value: number) => void;
}

const EvidencePanel = ({ items, onClose, onSpeakItem }: EvidencePanelProps) => {
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(
    items.length > 0 ? items[0] : null
  );
  const [comparingItem, setComparingItem] = useState<EvidenceItem | null>(null);

  const handleItemClick = (item: EvidenceItem) => {
    setSelectedItem(item);
    // Speak the item when tapped
    if (onSpeakItem) {
      onSpeakItem(item.objectName, item.value);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Detected Items</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground text-center">
            No items detected yet.<br />
            Tap the scan button to start.
          </p>
        </div>
      </div>
    );
  }

  const getPriceRange = (value: number) => {
    const low = Math.round(value * 0.8);
    const high = Math.round(value * 1.2);
    return { low, high };
  };

  const getConfidenceTrend = (history: number[]) => {
    if (history.length < 2) return "stable";
    const recent = history.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const first = recent[0];
    if (avg > first + 0.05) return "up";
    if (avg < first - 0.05) return "down";
    return "stable";
  };

  const totalValue = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <>
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-foreground">Detected Items</h2>
            <p className="text-sm text-muted-foreground">Tap an item to hear its value</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
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
                onClick={() => handleItemClick(item)}
                className={`p-4 border-b border-border cursor-pointer transition-all card-interactive ${
                  isSelected ? "bg-primary/5" : "hover:bg-secondary/50"
                }`}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {item.snapshotData ? (
                    <img
                      src={item.snapshotData}
                      alt={item.objectName}
                      className="w-16 h-16 object-cover rounded-xl border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-secondary rounded-xl border border-border flex items-center justify-center shrink-0">
                      <span className="text-xs text-muted-foreground">No img</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-foreground truncate">{item.objectName}</div>
                        <div className="text-2xl font-semibold text-primary">
                          ${item.value.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSpeakItem) {
                              onSpeakItem(item.objectName, item.value);
                            }
                          }}
                          className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                          title="Speak price"
                        >
                          <Volume2 className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setComparingItem(item);
                          }}
                          className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                          title="Compare prices"
                        >
                          <Search className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Range: ${priceRange.low} - ${priceRange.high}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(item.confidence * 100)}% conf
                      </span>
                      <span className={`text-xs ${
                        trend === "up" ? "text-green-500" : 
                        trend === "down" ? "text-amber-500" : 
                        "text-muted-foreground"
                      }`}>
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="p-4 border-t border-border bg-secondary/30 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{items.length} items</span>
            <span className="text-lg font-semibold text-foreground">
              Total: ${totalValue.toLocaleString()}
            </span>
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
