interface AnalyzingIndicatorProps {
  isActive: boolean;
}

const AnalyzingIndicator = ({ isActive }: AnalyzingIndicatorProps) => {
  if (!isActive) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className="glass px-6 py-3 flex items-center gap-4">
        {/* Radar animation */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border border-primary/30 rounded-full" />
          <div className="absolute inset-1 border border-primary/50 rounded-full" />
          <div className="absolute inset-2 border border-primary/70 rounded-full" />
          <div 
            className="absolute inset-0 origin-center animate-radar"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary)) 30deg, transparent 60deg)',
              borderRadius: '50%'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-primary" />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <span className="text-xs text-primary tracking-[0.2em] animate-pulse">
            ANALYZING FRAME
          </span>
          <span className="text-xs text-muted-foreground">
            Gemini 3 Vision Active
          </span>
        </div>

        {/* Pulse dots */}
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
};

export default AnalyzingIndicator;
