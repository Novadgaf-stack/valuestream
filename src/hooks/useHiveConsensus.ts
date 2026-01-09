import { useState, useCallback, useRef } from 'react';

interface AgentState {
  text: string;
  status: 'idle' | 'thinking' | 'done';
  value?: number;
}

interface HiveState {
  pessimist: AgentState;
  hypeman: AgentState;
  judge: AgentState;
  bbox: { x: number; y: number; w: number; h: number } | null;
  objectName: string;
  finalPrice: number;
  isProcessing: boolean;
  hasConsensus: boolean;
}

const initialAgentState: AgentState = { text: '', status: 'idle' };

export const useHiveConsensus = () => {
  const [state, setState] = useState<HiveState>({
    pessimist: initialAgentState,
    hypeman: initialAgentState,
    judge: initialAgentState,
    bbox: null,
    objectName: '',
    finalPrice: 0,
    isProcessing: false,
    hasConsensus: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setState({
      pessimist: initialAgentState,
      hypeman: initialAgentState,
      judge: initialAgentState,
      bbox: null,
      objectName: '',
      finalPrice: 0,
      isProcessing: false,
      hasConsensus: false,
    });
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    reset();
  }, [reset]);

  const analyze = useCallback(async (imageBase64: string) => {
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState(prev => ({
      ...prev,
      isProcessing: true,
      hasConsensus: false,
      pessimist: { text: '', status: 'thinking' },
      hypeman: { text: '', status: 'thinking' },
      judge: { text: '', status: 'idle' },
    }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hive-consensus`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ image: imageBase64 }),
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            
            if (data.content === '[DONE]') {
              setState(prev => ({ ...prev, isProcessing: false }));
              continue;
            }

            if (data.agent === 'pessimist') {
              if (data.type === 'chunk') {
                setState(prev => ({
                  ...prev,
                  pessimist: {
                    ...prev.pessimist,
                    text: prev.pessimist.text + data.content,
                  },
                }));
              } else if (data.type === 'complete') {
                // Extract lowball value from complete text
                let lowballValue = 0;
                try {
                  const match = data.content.match(/\{[\s\S]*\}/);
                  if (match) {
                    const parsed = JSON.parse(match[0]);
                    lowballValue = parsed.lowball_value || 0;
                  }
                } catch {}
                
                setState(prev => ({
                  ...prev,
                  pessimist: {
                    text: data.content,
                    status: 'done',
                    value: lowballValue,
                  },
                  judge: { ...prev.judge, status: 'thinking' },
                }));
              }
            } else if (data.agent === 'hypeman') {
              if (data.type === 'chunk') {
                setState(prev => ({
                  ...prev,
                  hypeman: {
                    ...prev.hypeman,
                    text: prev.hypeman.text + data.content,
                  },
                }));
              } else if (data.type === 'complete') {
                // Extract highball value from complete text
                let highballValue = 0;
                try {
                  const match = data.content.match(/\{[\s\S]*\}/);
                  if (match) {
                    const parsed = JSON.parse(match[0]);
                    highballValue = parsed.highball_value || 0;
                  }
                } catch {}
                
                setState(prev => ({
                  ...prev,
                  hypeman: {
                    text: data.content,
                    status: 'done',
                    value: highballValue,
                  },
                  judge: { ...prev.judge, status: 'thinking' },
                }));
              }
            } else if (data.agent === 'judge') {
              if (data.type === 'complete' && data.content !== '[DONE]') {
                setState(prev => ({
                  ...prev,
                  judge: {
                    text: data.content,
                    status: 'done',
                    value: data.value,
                  },
                  bbox: data.bbox ? {
                    x: data.bbox[0],
                    y: data.bbox[1],
                    w: data.bbox[2],
                    h: data.bbox[3],
                  } : prev.bbox,
                  objectName: data.objectName || prev.objectName,
                  finalPrice: data.value || 0,
                  hasConsensus: true,
                  isProcessing: false,
                }));
              } else if (data.type === 'error') {
                console.error('Judge error:', data.content);
                setState(prev => ({ ...prev, isProcessing: false }));
              }
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error('Hive consensus error:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []);

  return {
    state,
    analyze,
    abort,
    reset,
  };
};
