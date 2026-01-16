import { useEffect, useRef, useState } from "react";
import { Brain, TrendingDown, TrendingUp, Scale, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThoughtEntry {
  id: string;
  agent: "BEAR" | "BULL" | "ARBITER" | "SYSTEM";
  message: string;
  timestamp: Date;
}

interface ThoughtStreamProps {
  thoughts: ThoughtEntry[];
  isThinking: boolean;
}

const agentConfig = {
  BEAR: {
    icon: TrendingDown,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "BEAR",
  },
  BULL: {
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    label: "BULL",
  },
  ARBITER: {
    icon: Scale,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    label: "ARBITER",
  },
  SYSTEM: {
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    label: "SYSTEM",
  },
};

const ThoughtStream = ({ thoughts, isThinking }: ThoughtStreamProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayedThoughts, setDisplayedThoughts] = useState<ThoughtEntry[]>([]);

  useEffect(() => {
    setDisplayedThoughts(thoughts);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  return (
    <div className="glass-dark rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Brain className={cn("w-4 h-4", isThinking ? "text-cyan-400 animate-pulse" : "text-muted-foreground")} />
          <span className="text-xs font-mono uppercase tracking-wider text-foreground/80">
            Neural Thought Stream
          </span>
        </div>
        {isThinking && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-400 uppercase">Processing</span>
          </div>
        )}
      </div>

      {/* Thought entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80">
        {displayedThoughts.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {isThinking ? "Initializing neural network..." : "Awaiting neural input..."}
            </p>
          </div>
        ) : (
          displayedThoughts.map((thought, index) => {
            const config = agentConfig[thought.agent];
            const Icon = config.icon;

            return (
              <div
                key={thought.id}
                className={cn(
                  "p-2 rounded-lg border animate-fade-in",
                  config.bg,
                  config.border
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-2">
                  <div className={cn("p-1 rounded", config.bg)}>
                    <Icon className={cn("w-3 h-3", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("text-[10px] font-mono font-bold uppercase", config.color)}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {thought.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed font-mono">
                      {thought.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 p-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-[10px] font-mono text-cyan-400/70">Agents debating...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThoughtStream;
