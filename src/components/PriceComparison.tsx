import { useState } from "react";
import { ExternalLink, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Listing {
  title: string;
  url: string;
  price: number | null;
  source: string;
}

interface Validation {
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  estimatedValue: number;
  differencePercent: number;
  isAccurate: boolean;
}

interface PriceComparisonProps {
  itemName: string;
  estimatedValue: number;
  onClose: () => void;
}

const PriceComparison = ({ itemName, estimatedValue, onClose }: PriceComparisonProps) => {
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const searchPrices = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("compare-prices", {
        body: { itemName, estimatedValue },
      });

      if (fnError) throw fnError;

      if (data.success) {
        setListings(data.listings || []);
        setValidation(data.validation);
      } else {
        setError(data.error || "Failed to fetch prices");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare prices");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg text-primary text-glow">Price Comparison</h2>
            <p className="text-muted-foreground text-sm truncate max-w-[280px]">{itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-primary text-xl"
          >
            ×
          </button>
        </div>

        {/* AI Estimate */}
        <div className="mb-4 p-3 border border-primary/30 rounded">
          <div className="text-xs text-muted-foreground mb-1">AI ESTIMATE</div>
          <div className="text-2xl text-hud-price font-mono">${estimatedValue.toLocaleString()}</div>
        </div>

        {!searched && (
          <Button
            onClick={searchPrices}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Searching eBay...
              </>
            ) : (
              "Compare with eBay Listings"
            )}
          </Button>
        )}

        {error && (
          <div className="mt-4 p-3 border border-destructive/50 rounded flex items-center gap-2 text-destructive">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Validation Result */}
        {validation && (
          <div
            className={`mt-4 p-4 rounded border ${
              validation.isAccurate
                ? "border-hud-price/50 bg-hud-price/5"
                : "border-warning/50 bg-warning/5"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {validation.isAccurate ? (
                <>
                  <CheckCircle size={20} className="text-hud-price" />
                  <span className="text-hud-price font-medium">Estimate Validated</span>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-warning" />
                  <span className="text-warning font-medium">Price Discrepancy</span>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Market Average:</div>
              <div className="text-foreground font-mono">${validation.averagePrice.toLocaleString()}</div>
              <div className="text-muted-foreground">Price Range:</div>
              <div className="text-foreground font-mono">
                ${validation.minPrice.toLocaleString()} - ${validation.maxPrice.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Difference:</div>
              <div
                className={`font-mono ${
                  validation.differencePercent > 0 ? "text-hud-price" : "text-warning"
                }`}
              >
                {validation.differencePercent > 0 ? "+" : ""}
                {validation.differencePercent}%
              </div>
            </div>
          </div>
        )}

        {/* Listings */}
        {listings.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs tracking-[0.2em] text-primary mb-2">SIMILAR LISTINGS</h3>
            <div className="space-y-2">
              {listings.map((listing, i) => (
                <a
                  key={i}
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border border-primary/10 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{listing.title}</div>
                      <div className="text-xs text-muted-foreground">{listing.source}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.price && (
                        <span className="text-hud-price font-mono">${listing.price.toLocaleString()}</span>
                      )}
                      <ExternalLink size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {searched && listings.length === 0 && !error && (
          <div className="mt-4 text-center text-muted-foreground text-sm">
            No similar listings found
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceComparison;
