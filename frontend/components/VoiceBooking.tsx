"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
} from "lucide-react";

interface VoiceBookingProps {
  isOpen?: boolean;
  onClose?: () => void;
  onApplyRoute?: (from: string, to: string) => void;
}

interface UIState {
  route: string;
  layover: string;
  source?: string;
  destination?: string;
  seats_left?: number;
  message?: string;
  leg1?: {
    from: string;
    to: string;
    trainNumber: string;
    trainName: string;
    seats: number;
  };
  leg2?: {
    from: string;
    to: string;
    trainNumber: string;
    trainName: string;
    seats: number;
  };
}

export const VoiceBooking: React.FC<VoiceBookingProps> = ({
  isOpen = true,
  onClose,
  onApplyRoute,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [uiState, setUiState] = useState<UIState | null>(null);
  const [lastAudioBase64, setLastAudioBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up timer and audio on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  // Timer for active recording
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  // Helper to play base64 audio via HTML5 Audio constructor
  const playBase64Audio = (audioBase64: string) => {
    if (!audioBase64) return;
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      const audio = new Audio("data:audio/wav;base64," + audioBase64);
      audio.play();
      currentAudioRef.current = audio;

      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
    } catch (err) {
      console.error("HTML5 Audio playback error:", err);
      setIsPlayingAudio(false);
    }
  };

  // Replay cached audio
  const handleReplayAudio = () => {
    if (lastAudioBase64) {
      playBase64Audio(lastAudioBase64);
    }
  };

  // Start microphone recording using MediaRecorder
  const handleStartRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio tracks on stream to release microphone
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/wav",
        });

        await submitVoicePayload(audioBlob);
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone error:", err);
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone permission was denied. You can still test with the demo voice button below."
          : err.message || "Failed to initialize microphone."
      );
      setIsRecording(false);
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send audio or fallback demo to /api/voice-agent
  const submitVoicePayload = async (audioBlob?: Blob, fallbackText?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      if (audioBlob) {
        formData.append("audio_file", audioBlob, "user_speech.wav");
      }
      if (fallbackText) {
        formData.append("text", fallbackText);
      }

      const res = await fetch("/api/voice-agent", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      setIsProcessing(false);

      if (res.ok && data.audio_base64) {
        setTranscript(data.transcript || "Find trains from Delhi to Mumbai");
        setAgentResponse(data.response_text || data.ui_state?.message || null);
        setUiState(data.ui_state || { route: "split", layover: "Kota" });
        setLastAudioBase64(data.audio_base64);

        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        const audio = new Audio("data:audio/wav;base64," + data.audio_base64);
        audio.play();
        currentAudioRef.current = audio;

        setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
      } else {
        const errMessage =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || data.message || "Failed to process voice request.";
        setErrorMessage(errMessage);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || "Network error contacting voice agent endpoint.");
    }
  };

  // Quick action: Test with standard prompt
  const handleDemoSample = () => {
    submitVoicePayload(undefined, "Book ticket from Delhi to Mumbai in Tatkal quota");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-white relative overflow-hidden">
      {/* Background Accent Gradient */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                TatkalPro Voice Agent
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Gnani.ai Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Prisma STT • Node.js BFS Routing • Timbre TTS
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Voice Booking"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Mic Section */}
      <div className="flex flex-col items-center justify-center py-5 relative z-10">
        <div className="relative flex items-center justify-center mb-4">
          {/* Framer-Motion Concentric Pulsing Rings */}
          {isRecording && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-orange-500/30"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: [1, 1.45, 1.8], opacity: [0.7, 0.35, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                style={{ width: 88, height: 88, margin: "auto" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-amber-400/20"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: [1, 1.3, 1.55], opacity: [0.6, 0.2, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  delay: 0.45,
                  ease: "easeOut",
                }}
                style={{ width: 88, height: 88, margin: "auto" }}
              />
            </>
          )}

          {/* Interactive Microphone Button */}
          <motion.button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing}
            whileTap={{ scale: 0.94 }}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex flex-col items-center justify-center shadow-lg transition-all relative z-10 cursor-pointer ${
              isRecording
                ? "bg-gradient-to-tr from-red-600 to-orange-500 text-white shadow-red-500/30 ring-4 ring-red-400/40"
                : isProcessing
                ? "bg-slate-800 text-slate-400 animate-pulse border border-slate-700"
                : "bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-orange-500/30 hover:scale-105 hover:shadow-orange-500/50"
            }`}
            aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8 animate-bounce" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </motion.button>
        </div>

        {/* State Label & Timer */}
        <div className="text-center">
          {isRecording ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-red-400 tracking-wider flex items-center gap-1.5 uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Listening • {formatTimer(recordingSeconds)}
              </span>
              <p className="text-[11px] text-slate-300">
                Tap button when finished speaking
              </p>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-1.5 uppercase">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
                Synthesizing with Gnani Prisma & BFS...
              </span>
              <p className="text-[11px] text-slate-400">
                Checking Tatkal direct & split seat graphs
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-slate-200">
                Tap to speak: &quot;Delhi to Mumbai&quot;
              </span>
              <p className="text-[11px] text-slate-400">
                Uses Gnani Prisma STT & Timbre TTS
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results / Transcription / Agent Response UI */}
      <AnimatePresence>
        {(transcript || agentResponse || uiState) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-3 relative z-10"
          >
            {/* User Speech Transcription */}
            {transcript && (
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-0.5">
                  🎙️ Recognized Speech (Gnani Prisma STT)
                </span>
                <p className="text-slate-100 font-medium italic">
                  &ldquo;{transcript}&rdquo;
                </p>
              </div>
            )}

            {/* Agent Voice Output & Playback Controls */}
            {agentResponse && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-500/30 text-xs relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase text-blue-300 tracking-wider flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    Gnani Timbre Voice Response (Nalini)
                  </span>
                  {lastAudioBase64 && (
                    <button
                      type="button"
                      onClick={handleReplayAudio}
                      className="px-2 py-0.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold text-[10px] flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Replay Voice
                    </button>
                  )}
                </div>
                <p className="text-white font-medium text-xs sm:text-sm leading-relaxed">
                  {agentResponse}
                </p>
                {isPlayingAudio && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-blue-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    Speaking with Gnani Timbre audio...
                  </div>
                )}
              </div>
            )}

            {/* Split Route Visual Card from BFS ui_state */}
            {uiState?.route === "split" && (
              <div className="p-4 rounded-2xl bg-orange-950/40 border border-orange-500/40 text-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold text-[10px] uppercase tracking-wide border border-orange-500/30">
                    Split-Ticket Route Discovered
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    5 Seats Left
                  </span>
                </div>

                {/* 2-Leg Journey Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      LEG 1
                    </span>
                    <span className="font-bold text-white text-xs">
                      {uiState.source || "Delhi"} → {uiState.layover || "Kota"}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {uiState.leg1?.trainName || "Kota Jan Shatabdi"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      LEG 2 (TRANSFER VIA {uiState.layover || "KOTA"})
                    </span>
                    <span className="font-bold text-white text-xs">
                      {uiState.layover || "Kota"} → {uiState.destination || "Mumbai"}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {uiState.leg2?.trainName || "August Kranti Rajdhani"}
                    </p>
                  </div>
                </div>

                {/* Lock Seats CTA */}
                <button
                  type="button"
                  onClick={() => {
                    if (onApplyRoute) {
                      onApplyRoute(uiState.source || "NDLS", uiState.destination || "MMCT");
                    }
                  }}
                  className="mt-1 w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs tracking-wide shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>LOCK SPLIT-TICKET SEATS VIA {uiState.layover || "KOTA"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Controls: Sample Voice Query */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Gnani Vachana Enterprise SDK
        </span>

        <button
          type="button"
          onClick={handleDemoSample}
          disabled={isProcessing || isRecording}
          className="text-orange-400 hover:text-orange-300 font-semibold cursor-pointer underline underline-offset-2 transition disabled:opacity-50"
        >
          Try Sample Demo Query
        </button>
      </div>
    </div>
  );
};

export default VoiceBooking;
