import { useEffect, useRef } from "react";

export interface LogEntry {
  id: string;
  type: "detection" | "deduction" | "confidence" | "error" | "system";
  message: string;
  timestamp: Date;
  value?: number;
}

interface TruthLogProps {
  entries: LogEntry[];
}

const TruthLog = ({ entries }: TruthLogProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const getTypeStyles = (type: LogEntry["type"]) => {
    switch (type) {
      case "detection":
        return "text-primary";
      case "deduction":
        return "text-warning";
      case "confidence":
        return "text-hud-price";
      case "error":
        return "text-destructive";
      case "system":
        return "text-muted-foreground";
      default:
        return "text-foreground";
    }
  };

  const getTypePrefix = (type: LogEntry["type"]) => {
    switch (type) {
      case "detection":
        return "[DETECT]";
      case "deduction":
        return "[DEDUCT]";
      case "confidence":
        return "[CONF]";
      case "error":
        return "[ERROR]";
      case "system":
        return "[SYS]";
      default:
        return "[LOG]";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="absolute right-2 md:right-4 top-16 md:top-32 bottom-16 md:bottom-4 w-[280px] md:w-80 lg:w-96 z-20">
      <div className="glass h-full flex flex-col">
        {/* Header */}
        <div className="px-3 md:px-4 py-2 md:py-3 border-b border-primary/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] md:text-xs tracking-[0.2em] text-primary">GEMINI ANALYSIS LOG</span>
          </div>
        </div>

        {/* Log entries */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1.5 md:space-y-2 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent"
        >
          {entries.length === 0 ? (
            <div className="text-muted-foreground text-xs text-center py-8">
              <div className="animate-pulse">Awaiting analysis...</div>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="text-[10px] md:text-xs font-mono leading-relaxed">
                <span className="text-muted-foreground">{formatTime(entry.timestamp)}</span>
                <span className={`ml-1 md:ml-2 ${getTypeStyles(entry.type)}`}>
                  {getTypePrefix(entry.type)}
                </span>
                <span className="ml-1 md:ml-2 text-foreground/90 break-words">{entry.message}</span>
                {entry.value !== undefined && (
                  <span className="ml-1 md:ml-2 text-hud-price text-glow">${entry.value}</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-3 md:px-4 py-1.5 md:py-2 border-t border-primary/30 text-[10px] md:text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Entries: {entries.length}</span>
            <span className="text-primary animate-flicker">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruthLog;
