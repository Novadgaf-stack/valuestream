import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Pause, Play, Zap, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RadarSync from './RadarSync';
import AgentDebate from './AgentDebate';
import MarketForceHUD from './MarketForceHUD';
import { useHiveConsensus } from '@/hooks/useHiveConsensus';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface DetectedItem {
  id: string;
  objectName: string;
  value: number;
  lowballPrice: number;
  highballPrice: number;
  volatilityScore: number;
  pessimistText: string;
  hypemanText: string;
  bbox: { x: number; y: number; w: number; h: number };
  timestamp: Date;
}

const MarketForceScanner: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [fps, setFps] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const lastFrameTime = useRef(Date.now());
  const { user } = useAuth();
  
  const { state, analyze, abort } = useHiveConsensus();

  // Create or resume session on mount
  useEffect(() => {
    if (!user) return;
    
    const initSession = async () => {
      // Check for active session
      const { data: existingSession } = await supabase
        .from('audit_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (existingSession) {
        setSessionId(existingSession.id);
        setTotalValue(Number(existingSession.total_value) || 0);
        
        // Load existing items
        const { data: items } = await supabase
          .from('detected_items')
          .select('*')
          .eq('session_id', existingSession.id)
          .order('detected_at', { ascending: false });
        
        if (items) {
          setDetectedItems(items.map(item => ({
            id: item.id,
            objectName: item.object_name,
            value: Number(item.value),
            lowballPrice: 0,
            highballPrice: 0,
            volatilityScore: item.volatility_score || 0,
            pessimistText: '',
            hypemanText: '',
            bbox: { 
              x: Number(item.bbox_x), 
              y: Number(item.bbox_y), 
              w: Number(item.bbox_w), 
              h: Number(item.bbox_h) 
            },
            timestamp: new Date(item.detected_at),
          })));
        }
      } else {
        // Create new session
        const { data: newSession } = await supabase
          .from('audit_sessions')
          .insert({
            user_id: user.id,
            title: `MarketForce Audit - ${new Date().toLocaleDateString()}`,
          })
          .select()
          .single();
        
        if (newSession) {
          setSessionId(newSession.id);
        }
      }
    };

    initSession();
  }, [user]);

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

  // Save detected item when consensus reached
  useEffect(() => {
    if (state.hasConsensus && state.finalPrice > 0 && sessionId && state.bbox) {
      const saveItem = async () => {
        const newItem: DetectedItem = {
          id: crypto.randomUUID(),
          objectName: state.objectName,
          value: state.finalPrice,
          lowballPrice: state.pessimist.value || 0,
          highballPrice: state.hypeman.value || 0,
          volatilityScore: state.volatilityScore,
          pessimistText: state.pessimist.text,
          hypemanText: state.hypeman.text,
          bbox: state.bbox,
          timestamp: new Date(),
        };

        // Add to local state
        setDetectedItems(prev => [newItem, ...prev]);
        setTotalValue(prev => prev + state.finalPrice);

        // Save to database
        const { error } = await supabase
          .from('detected_items')
          .insert({
            session_id: sessionId,
            object_name: state.objectName,
            value: state.finalPrice,
            confidence: 0.95,
            bbox_x: state.bbox.x,
            bbox_y: state.bbox.y,
            bbox_w: state.bbox.w,
            bbox_h: state.bbox.h,
            is_damaged: false,
            volatility_score: state.volatilityScore,
          });

        if (error) {
          console.error('Failed to save item:', error);
        }

        // Update session totals
        await supabase
          .from('audit_sessions')
          .update({
            total_value: totalValue + state.finalPrice,
            item_count: detectedItems.length + 1,
          })
          .eq('id', sessionId);

        // Save value snapshot
        await supabase
          .from('value_snapshots')
          .insert({
            session_id: sessionId,
            total_value: totalValue + state.finalPrice,
            item_count: detectedItems.length + 1,
          });
      };

      saveItem();
    }
  }, [state.hasConsensus, state.finalPrice, sessionId, state.bbox, state.objectName, state.pessimist, state.hypeman, state.volatilityScore, detectedItems.length, totalValue]);

  const handleToggleScan = () => {
    if (isScanning) {
      abort();
    }
    setIsScanning(!isScanning);
  };

  const handleFreezeMint = async () => {
    if (!state.hasConsensus || !user || !sessionId) return;

    try {
      // Generate PDF
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('MARKETFORCE AUDIT REPORT', 20, 30);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);
      doc.text(`Session ID: ${sessionId.slice(0, 8)}...`, 20, 50);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Object: ${state.objectName}`, 20, 70);
      
      doc.setFontSize(24);
      doc.text(`Final Value: $${state.finalPrice.toLocaleString()}`, 20, 85);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Volatility Score: ${state.volatilityScore}%`, 20, 100);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Agent Analysis:', 20, 120);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 50, 50);
      doc.text(`Pessimist (The Bear): $${state.pessimist.value || 0}`, 20, 135);
      
      doc.setTextColor(50, 150, 50);
      doc.text(`Hype Man (The Bull): $${state.hypeman.value || 0}`, 20, 145);
      
      doc.setTextColor(0, 0, 0);
      
      // Add analysis text
      doc.setFontSize(10);
      const pessimistLines = doc.splitTextToSize(`Bear Analysis: ${state.pessimist.text.slice(0, 300)}...`, 170);
      doc.text(pessimistLines, 20, 160);
      
      const hypemanLines = doc.splitTextToSize(`Bull Analysis: ${state.hypeman.text.slice(0, 300)}...`, 170);
      doc.text(hypemanLines, 20, 190);

      // Convert to blob
      const pdfBlob = doc.output('blob');
      const fileName = `${user.id}/${sessionId}/${state.objectName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audit-reports')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload report');
        // Still download locally
        doc.save(`marketforce-audit-${Date.now()}.pdf`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audit-reports')
        .getPublicUrl(fileName);

      // Update the most recent detected item with report URL
      if (detectedItems.length > 0) {
        await supabase
          .from('detected_items')
          .update({ report_url: urlData.publicUrl })
          .eq('session_id', sessionId)
          .eq('object_name', state.objectName)
          .order('detected_at', { ascending: false })
          .limit(1);
      }

      toast.success('Audit report saved!');
      
      // Also download locally
      doc.save(`marketforce-audit-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

    await supabase
      .from('audit_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        total_value: totalValue,
        item_count: detectedItems.length,
      })
      .eq('id', sessionId);

    toast.success(`Session ended. Total value: $${totalValue.toLocaleString()}`);
    setSessionId(null);
    setDetectedItems([]);
    setTotalValue(0);
    setIsScanning(false);
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
        volatilityScore={state.volatilityScore}
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
        itemCount={detectedItems.length}
        fps={fps}
      />

      {/* Session info */}
      {sessionId && (
        <div className="absolute top-4 right-4 glass-dark px-4 py-2 rounded z-20">
          <div className="text-xs text-muted-foreground font-mono">
            SESSION: {sessionId.slice(0, 8)}...
          </div>
          <div className="text-sm text-primary font-mono">
            {detectedItems.length} items • ${totalValue.toLocaleString()}
          </div>
        </div>
      )}

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

        {sessionId && detectedItems.length > 0 && (
          <Button
            onClick={handleEndSession}
            size="lg"
            variant="outline"
            className="gap-2 px-8 py-6 text-lg font-mono border-muted-foreground text-muted-foreground hover:bg-muted/10"
          >
            <Save className="w-5 h-5" />
            END SESSION
          </Button>
        )}
      </div>
    </div>
  );
};

export default MarketForceScanner;
