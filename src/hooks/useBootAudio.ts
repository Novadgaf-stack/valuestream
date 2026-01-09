import { useCallback, useRef } from 'react';

export const useBootAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback((frequency = 880, duration = 0.08, type: OscillatorType = 'square') => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const playInitialize = useCallback(() => {
    playBeep(440, 0.05, 'sine');
    setTimeout(() => playBeep(660, 0.05, 'sine'), 50);
    setTimeout(() => playBeep(880, 0.1, 'sine'), 100);
  }, [playBeep]);

  const playTypingKey = useCallback(() => {
    playBeep(1200 + Math.random() * 200, 0.02, 'square');
  }, [playBeep]);

  const playSuccess = useCallback(() => {
    playBeep(523, 0.1, 'sine');
    setTimeout(() => playBeep(659, 0.1, 'sine'), 100);
    setTimeout(() => playBeep(784, 0.15, 'sine'), 200);
  }, [playBeep]);

  const playSystemOnline = useCallback(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playBeep(200 + i * 100, 0.05, 'sawtooth'), i * 40);
    }
    setTimeout(() => playBeep(1000, 0.2, 'sine'), 250);
  }, [playBeep]);

  return { playBeep, playInitialize, playTypingKey, playSuccess, playSystemOnline };
};
