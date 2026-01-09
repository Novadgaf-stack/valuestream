import React from 'react';
import { Activity, Cpu, Wifi, Database } from 'lucide-react';

interface MarketForceHUDProps {
  isConnected: boolean;
  agentStatus: {
    pessimist: 'idle' | 'thinking' | 'done';
    hypeman: 'idle' | 'thinking' | 'done';
    judge: 'idle' | 'thinking' | 'done';
  };
  totalValue: number;
  itemCount: number;
  fps: number;
}

const MarketForceHUD: React.FC<MarketForceHUDProps> = ({
  isConnected,
  agentStatus,
  totalValue,
  fps,
  itemCount
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: 'idle' | 'thinking' | 'done') => {
    switch (status) {
      case 'thinking': return 'bg-yellow-500 animate-pulse';
      case 'done': return 'bg-hud-consensus';
      default: return 'bg-muted-foreground/50';
    }
  };

  return (
    <>
      {/* Top bar - System status */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        <div className="flex justify-between items-start">
          {/* Left: Logo & connection status */}
          <div className="glass-dark rounded px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">MARKETFORCE</span>
              <span className="text-xs text-muted-foreground">v2.0</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Wifi className={`w-4 h-4 ${isConnected ? 'text-hud-consensus' : 'text-destructive'}`} />
              <span className={`text-xs font-mono ${isConnected ? 'text-hud-consensus' : 'text-destructive'}`}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Right: Performance metrics */}
          <div className="glass-dark rounded px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">
                {fps} FPS
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">
                {itemCount} ITEMS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar - Agent status & total value */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="flex justify-between items-end">
          {/* Left: Agent status */}
          <div className="glass-dark rounded px-4 py-3 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground uppercase">Agents</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agentStatus.pessimist)}`} />
                <span className="text-xs font-mono text-agent-pessimist">PESSIMIST</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agentStatus.hypeman)}`} />
                <span className="text-xs font-mono text-agent-hypeman">HYPE MAN</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agentStatus.judge)}`} />
                <span className="text-xs font-mono text-hud-price">JUDGE</span>
              </div>
            </div>
          </div>

          {/* Right: Total value counter */}
          <div className="glass-dark rounded px-6 py-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground uppercase">Total Value</span>
              <span className="text-2xl font-bold font-mono mono-numbers text-hud-price text-glow-gold">
                {formatPrice(totalValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-primary/30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-primary/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/30 pointer-events-none" />

      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan-line" />
      </div>
    </>
  );
};

export default MarketForceHUD;
