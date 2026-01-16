const HudOverlay = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Subtle corner brackets - professional look */}
      <svg className="absolute inset-0 w-full h-full opacity-40">
        {/* Top Left */}
        <path
          d="M 16 48 L 16 16 L 48 16"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Top Right */}
        <path
          d="M calc(100% - 48px) 16 L calc(100% - 16px) 16 L calc(100% - 16px) 48"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Bottom Left */}
        <path
          d="M 16 calc(100% - 48px) L 16 calc(100% - 16px) L 48 calc(100% - 16px)"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Bottom Right */}
        <path
          d="M calc(100% - 48px) calc(100% - 16px) L calc(100% - 16px) calc(100% - 16px) L calc(100% - 16px) calc(100% - 48px)"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Center focus indicator - minimal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
        <div className="w-16 h-16 border border-primary/50 rounded-lg" />
      </div>
    </div>
  );
};

export default HudOverlay;
