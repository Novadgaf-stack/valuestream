import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Pause, Play, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RadarSync from './RadarSync';
import AgentDebate from './AgentDebate';
import MarketForceHUD from './MarketForceHUD';
import { useHiveConsensus } from '@/hooks/useHiveConsensus';
import jsPDF from 'jspdf';

const MarketForceScanner: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [fps, setFps] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const lastFrameTime = useRef(Date.now());
  
  const { state, analyze, abort } = useHiveConsensus();

  const captureAndAnalyze = useCallback(async () => {
    if (!webcamRef.current || state.isProcessing) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    // Calculate FPS
    const now = Date.now();
    setFps(Math.round(1000 / (now - lastFrameTime.current)));
    lastFrameTime.current = now;

    // Extract base64
    const base64 = imageSrc.split(',')[1];
    await analyze(base64);
  }, [analyze, state.isProcessing]);

  // Auto-capture when scanning
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      if (!state.isProcessing) {
        captureAndAnalyze();
      }
    }, 3000); // Analyze every 3 seconds

    return () => clearInterval(interval);
  }, [isScanning, captureAndAnalyze, state.isProcessing]);

  // Update total value when consensus reached
  useEffect(() => {
    if (state.hasConsensus && state.finalPrice > 0) {
      setTotalValue(prev => prev + state.finalPrice);
    }
  }, [state.hasConsensus, state.finalPrice]);

  const handleToggleScan = () => {
    if (isScanning) {
      abort();
    }
    setIsScanning(!isScanning);
  };

  const handleFreezeMint = async () => {
    if (!state.hasConsensus) return;

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('MARKETFORCE AUDIT REPORT', 20, 30);
    
    doc.setFontSize(14);
    doc.text(`Object: ${state.objectName}`, 20, 50);
    doc.text(`Final Value: $${state.finalPrice}`, 20, 60);
    doc.text(`Pessimist Value: $${state.pessimist.value || 0}`, 20, 75);
    doc.text(`Hype Man Value: $${state.hypeman.value || 0}`, 20, 85);
    
    doc.save(`marketforce-audit-${Date.now()}.pdf`);
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden hud-grid scanlines">
      {/* Webcam feed */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.8}
        className="absolute inset-0 w-full h-full object-cover"
        videoConstraints={{ facingMode: 'environment', width: 1280, height: 720 }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/30" />

      {/* Radar sync indicator */}
      <RadarSync isScanning={state.isProcessing} hasConsensus={state.hasConsensus} />

      {/* Agent debate overlay */}
      <AgentDebate
        bbox={state.bbox}
        pessimistText={state.pessimist.text}
        hypemanText={state.hypeman.text}
        finalPrice={state.finalPrice}
        lowballPrice={state.pessimist.value || 0}
        highballPrice={state.hypeman.value || 0}
        isPriceSettled={state.hasConsensus}
        objectName={state.objectName}
      />

      {/* HUD overlay */}
      <MarketForceHUD
        isConnected={true}
        agentStatus={{
          pessimist: state.pessimist.status,
          hypeman: state.hypeman.status,
          judge: state.judge.status,
        }}
        totalValue={totalValue}
        itemCount={state.hasConsensus ? 1 : 0}
        fps={fps}
      />

      {/* Control buttons */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        <Button
          onClick={handleToggleScan}
          size="lg"
          className={`
            gap-2 px-8 py-6 text-lg font-mono
            ${isScanning 
              ? 'bg-destructive hover:bg-destructive/80' 
              : 'bg-primary hover:bg-primary/80'}
          `}
        >
          {isScanning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isScanning ? 'STOP' : 'START SCAN'}
        </Button>

        {state.hasConsensus && (
          <Button
            onClick={handleFreezeMint}
            size="lg"
            variant="outline"
            className="gap-2 px-8 py-6 text-lg font-mono border-hud-price text-hud-price hover:bg-hud-price/10"
          >
            <Zap className="w-5 h-5" />
            FREEZE & MINT
          </Button>
        )}
      </div>
    </div>
  );
};

export default MarketForceScanner;
