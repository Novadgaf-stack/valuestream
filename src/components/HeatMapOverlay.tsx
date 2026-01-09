import { useEffect, useRef, useMemo } from "react";

interface ScannedArea {
  x: number;
  y: number;
  w: number;
  h: number;
  value: number;
  timestamp: number;
}

interface HeatMapOverlayProps {
  scannedAreas: ScannedArea[];
  containerWidth: number;
  containerHeight: number;
}

const HeatMapOverlay = ({ scannedAreas, containerWidth, containerHeight }: HeatMapOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Normalize areas based on value for heat intensity
  const maxValue = useMemo(() => {
    return Math.max(...scannedAreas.map(a => a.value), 100);
  }, [scannedAreas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0 || containerHeight === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Draw heat map
    scannedAreas.forEach((area) => {
      const x = (area.x / 100) * containerWidth;
      const y = (area.y / 100) * containerHeight;
      const w = (area.w / 100) * containerWidth;
      const h = (area.h / 100) * containerHeight;
      
      // Calculate heat intensity based on value (0-1)
      const intensity = Math.min(area.value / maxValue, 1);
      
      // Age factor - older areas fade out (30 second lifespan)
      const age = Date.now() - area.timestamp;
      const ageFactor = Math.max(0, 1 - age / 30000);
      
      const alpha = intensity * ageFactor * 0.4;

      // Create radial gradient for heat effect
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      const radius = Math.max(w, h) * 0.8;

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      
      // Color based on value: low (cyan) -> medium (green) -> high (gold)
      if (intensity < 0.33) {
        gradient.addColorStop(0, `hsla(180, 100%, 50%, ${alpha})`); // Cyan
        gradient.addColorStop(1, `hsla(180, 100%, 50%, 0)`);
      } else if (intensity < 0.66) {
        gradient.addColorStop(0, `hsla(120, 100%, 50%, ${alpha})`); // Green
        gradient.addColorStop(1, `hsla(120, 100%, 50%, 0)`);
      } else {
        gradient.addColorStop(0, `hsla(45, 100%, 50%, ${alpha})`); // Gold
        gradient.addColorStop(1, `hsla(45, 100%, 50%, 0)`);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius / 2, y - radius / 2, w + radius, h + radius);
    });

    // Add scan lines overlay
    ctx.strokeStyle = "hsla(180, 100%, 50%, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < containerHeight; i += 4) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(containerWidth, i);
      ctx.stroke();
    }

  }, [scannedAreas, containerWidth, containerHeight, maxValue]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-5"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default HeatMapOverlay;
export type { ScannedArea };
