
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { createPcmBlob, decodeAudioData, INPUT_SAMPLE_RATE, base64ToUint8Array } from '../utils/audio';

// Tool Definition for Stage Management
const updateStageTool: FunctionDeclaration = {
  name: 'updateInterviewStage',
  description: 'Update the status of an interview stage in the timeline tracker. Call this when the candidate completes a stage or fails/skips it.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      stageId: { 
        type: Type.STRING, 
        description: 'The ID of the stage (e.g., "framing", "design", "data", "modeling", "eval")',
      },
      status: {
        type: Type.STRING,
        description: 'The new status: "active", "completed", "failed", "skipped"',
        enum: ['active', 'completed', 'failed', 'skipped']
      }
    },
    required: ['stageId', 'status']
  }
};

interface UseLiveSessionProps {
  onTranscriptUpdate: (speaker: 'user' | 'model', text: string) => void;
  getVisualContext: () => Promise<{ type: 'image' | 'text', data: string } | null>;
  systemInstruction: string;
  onToolCall?: (toolCalls: any[]) => Promise<any[]>;
  model: string;
  shouldSendVisual?: () => boolean; // New callback to check if we should send
}

export const useLiveSession = ({ onTranscriptUpdate, getVisualContext, systemInstruction, onToolCall, model, shouldSendVisual }: UseLiveSessionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const visualIntervalRef = useRef<number | null>(null);

  const stopAudioPlayback = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    if (audioContextRef.current) {
        nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
  }, []);

  const connect = async () => {
    setError(null);
    setTranscript([]); // Clear previous transcript
    if (!process.env.API_KEY) {
      setError("API Key is missing.");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Input
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      inputAudioContextRef.current = inputCtx;
      
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        try {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            
            if (sessionPromiseRef.current) {
              sessionPromiseRef.current.then(session => {
                 if (session && session.sendRealtimeInput) {
                    session.sendRealtimeInput({ media: pcmBlob });
                 }
              }).catch(err => {
                 // Ignore during connect
              });
            }
        } catch (e) {
            // Ignore processing errors
        }
      };
      
      source.connect(processor);
      processor.connect(inputCtx.destination);

      // Setup Audio Output
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }
      
      nextStartTimeRef.current = outputCtx.currentTime;

      // Start Session
      const sessionPromise = ai.live.connect({
        model: model,
        config: {
            systemInstruction: systemInstruction,
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: [{ functionDeclarations: [updateStageTool] }]
        },
        callbacks: {
          onopen: () => {
            console.log("Live Session Connected");
            setIsConnected(true);
            
            // Start Optimized Visual Streaming Loop
            visualIntervalRef.current = window.setInterval(async () => {
                 try {
                     // Only send if explicit change detected (if callback provided)
                     if (shouldSendVisual && !shouldSendVisual()) {
                         return;
                     }

                     const context = await getVisualContext();
                     if (context && context.data && context.data.length > 100 && sessionPromiseRef.current) {
                         sessionPromiseRef.current.then(session => {
                             if (context.type === 'image') {
                                 session.sendRealtimeInput({
                                     media: { mimeType: 'image/jpeg', data: context.data }
                                 });
                             }
                         }).catch(e => console.warn("Failed to send visual:", e));
                     }
                 } catch (e) {
                     console.warn("Visual context error:", e);
                 }
            }, 3000); 
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
                setIsSpeaking(true);
                try {
                    const buffer = await decodeAudioData(
                        base64ToUint8Array(audioData),
                        outputCtx,
                        24000
                    );
                    
                    const source = outputCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(outputCtx.destination);
                    
                    const now = outputCtx.currentTime;
                    const startTime = Math.max(now, nextStartTimeRef.current);
                    source.start(startTime);
                    nextStartTimeRef.current = startTime + buffer.duration;
                    
                    sourcesRef.current.add(source);
                    source.onended = () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) {
                            setIsSpeaking(false);
                        }
                    };
                } catch (e) {
                    console.error("Audio decode error:", e);
                }
            }

            if (msg.serverContent?.outputTranscription?.text) {
                setTranscript(prev => [...prev, { role: 'model', text: msg.serverContent?.outputTranscription?.text || '' }]);
            }
            if (msg.serverContent?.inputTranscription?.text) {
                setTranscript(prev => [...prev, { role: 'user', text: msg.serverContent?.inputTranscription?.text || '' }]);
            }

            if (msg.toolCall) {
                if (onToolCall) {
                    try {
                        const responses = await onToolCall(msg.toolCall.functionCalls);
                        sessionPromiseRef.current?.then(session => {
                            session.sendToolResponse({
                               functionResponses: responses
                            });
                        });
                    } catch (e) {
                        console.error("Tool call error:", e);
                    }
                }
            }
          },
          onclose: () => {
            console.log("Live Session Closed");
            disconnect();
          },
          onerror: (err) => {
            console.error("Live Session Error", err);
            setError("Connection error. Please try again.");
            disconnect();
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start session");
      disconnect();
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsSpeaking(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      if (inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
      }
      inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
      stopAudioPlayback();
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }
    
    if (visualIntervalRef.current) {
        clearInterval(visualIntervalRef.current);
        visualIntervalRef.current = null;
    }

    if (sessionPromiseRef.current) {
       sessionPromiseRef.current.then((session: any) => {
           if(session.close) session.close();
       }).catch(() => {});
       sessionPromiseRef.current = null;
    }
  };

  return { connect, disconnect, isConnected, isSpeaking, error, transcript };
};
