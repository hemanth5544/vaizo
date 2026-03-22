"use client";

import {
  Bell,
  CloudLightning,
  Music2,
  Pause,
  Phone,
  Play,
  SkipBack,
  SkipForward,
  Send,
  Thermometer,
  Timer as TimerIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useMemo, useRef, useState } from "react";

type VoiceButtonState = "idle" | "recording" | "processing" | "success" | "error";

const BOUNCE_VARIANTS = {
  idle: 0.5,
  "ring-idle": 0.5,
  "timer-ring": 0.35,
  "ring-timer": 0.35,
  "timer-idle": 0.3,
  "idle-timer": 0.3,
  "idle-ring": 0.5,
} as const;

const DEFAULT_BOUNCE = 0.5;
const TIMER_INTERVAL_MS = 1000;

const DefaultIdle = () => {
  const [showTemp, setShowTemp] = useState(false);

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-2"
      layout
      onHoverEnd={() => setShowTemp(false)}
      onHoverStart={() => setShowTemp(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          initial={{ opacity: 0, scale: 0.8 }}
          key="storm"
        >
          <CloudLightning className="h-5 w-5 text-white" />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showTemp && (
          <motion.div
            animate={{ opacity: 1, width: "auto" }}
            className="flex items-center gap-1 overflow-hidden"
            exit={{ opacity: 0, width: 0 }}
            initial={{ opacity: 0, width: 0 }}
          >
            <Thermometer className="h-3 w-3 shrink-0 text-white" />
            <span className="pointer-events-none whitespace-nowrap text-white text-xs">
              12°C
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Voice Recorder Ring View
const VoiceRing = () => {
  const [voiceState, setVoiceState] = useState<VoiceButtonState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handlePress = async () => {
    if (voiceState === "idle" || voiceState === "success") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];

        // Start duration timer
        setDuration(0);
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          if (timerRef.current) clearInterval(timerRef.current);
          const blob = new Blob(chunks, { type: "audio/webm" });
          setAudioBlob(blob);
          setVoiceState("processing");
          setTimeout(() => setVoiceState("success"), 800);
        };

        mediaRecorder.start();
        setVoiceState("recording");
        setAudioBlob(null);
        setSent(false);
        setFailed(false);
      } catch {
        setVoiceState("error");
      }
    } else if (voiceState === "recording") {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setSending(true);
    setFailed(false);
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice-note.webm");
    try {
      const res = await fetch("/api/send-voice", { method: "POST", body: formData });
      if (res.ok) {
        setSent(true);
        setAudioBlob(null);
        setVoiceState("idle");
        setDuration(0);
        setTimeout(() => setSent(false), 3000);
      } else {
        setFailed(true);
        setVoiceState("error");
        setTimeout(() => { setFailed(false); setVoiceState("idle"); }, 3000);
      }
    } catch {
      setFailed(true);
      setVoiceState("error");
      setTimeout(() => { setFailed(false); setVoiceState("idle"); }, 3000);
    } finally {
      setSending(false);
    }
  };

  const handleDiscard = () => {
    setAudioBlob(null);
    setVoiceState("idle");
    setDuration(0);
    setSent(false);
    setFailed(false);
  };

  const isRecording = voiceState === "recording";
  const isProcessing = voiceState === "processing";
  const isReady = voiceState === "success" && !!audioBlob;
  const isError = voiceState === "error";

  return (
    <div className="flex items-center gap-2.5 px-4 py-3" style={{ width: "300px" }}>
      {/* Phone icon — pulses green when recording */}
      <Phone
        className="h-5 w-5 shrink-0 transition-all"
        style={{
          color: isRecording ? "#4ade80" : isError || failed ? "#f87171" : "#4ade80",
          filter: isRecording ? "drop-shadow(0 0 4px #4ade80)" : "none",
        }}
      />

      {/* Text area */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white leading-tight">
          {sent && "Sent!"}
          {failed && "Failed to send"}
          {isRecording && "Recording..."}
          {isProcessing && "Processing..."}
          {isReady && "Ready to send"}
          {voiceState === "idle" && !sent && !failed && "Voice Message"}
          {isError && !failed && "Mic error"}
        </p>
        <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.5)" }}>
          {isRecording && formatDuration(duration)}
          {isProcessing && "Preparing audio..."}
          {isReady && `${formatDuration(duration)} recorded`}
          {voiceState === "idle" && !sent && !failed && "Tap mic to record"}
          {sent && "Email delivered via Resend"}
          {failed && "Tap mic to try again"}
          {isError && !failed && "Check mic permissions"}
        </p>
      </div>

      {/* Discard button — only when ready */}
      <AnimatePresence>
        {isReady && (
          <motion.button
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            onClick={handleDiscard}
            type="button"
            className="flex shrink-0 items-center justify-center transition-colors"
            style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mic / stop / spinner button */}
      <button
        onClick={handlePress}
        disabled={isProcessing || sending}
        type="button"
        className="flex shrink-0 items-center justify-center transition-all"
        style={{
          width: 32, height: 32, borderRadius: "50%",
          backgroundColor: isRecording ? "#ef4444" : isError ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.15)",
          color: "#ffffff",
          boxShadow: isRecording ? "0 0 0 3px rgba(239,68,68,0.25)" : "none",
        }}
      >
        {isProcessing || sending ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : isRecording ? (
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="9" y1="22" x2="15" y2="22" />
          </svg>
        )}
      </button>

      {/* Send button */}
      <AnimatePresence>
        {isReady && (
          <motion.button
            animate={{ opacity: 1, scale: 1, width: 32 }}
            exit={{ opacity: 0, scale: 0.8, width: 0 }}
            initial={{ opacity: 0, scale: 0.8, width: 0 }}
            onClick={handleSend}
            disabled={sending}
            type="button"
            className="flex h-8 shrink-0 items-center justify-center transition-colors overflow-hidden"
            style={{ borderRadius: "50%", backgroundColor: "#4ade80", color: "#000" }}
          >
            <Send className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const DefaultTimer = () => {
  const [time, setTime] = useState(60);
  const maxTime = 60;

  useMemo(() => {
    const timer = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 0));
    }, TIMER_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ width: "260px" }}>
      <TimerIcon className="h-5 w-5 shrink-0" style={{ color: "#fbbf24" }} />
      <p className="shrink-0 font-medium text-sm text-white">{time}s remaining</p>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${(time / maxTime) * 100}%`,
            backgroundColor: "#fbbf24",
          }}
        />
      </div>
    </div>
  );
};

const Notification = () => (
  <div className="flex w-64 items-center gap-3 px-4 py-3">
    <Bell className="h-5 w-5 shrink-0" style={{ color: "#facc15" }} />
    <div className="flex-1">
      <p className="font-medium text-sm text-white">New Message</p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>You have a new notification!</p>
    </div>
    <span
      className="rounded-full px-2 py-0.5 text-xs"
      style={{ backgroundColor: "rgba(250,204,21,0.25)", color: "#fde047" }}
    >
      1
    </span>
  </div>
);

const MusicPlayer = () => {
  const [playing, setPlaying] = useState(true);
  return (
    <div className="flex w-72 items-center gap-2 px-4 py-3">
      <Music2 className="h-5 w-5 shrink-0" style={{ color: "#f472b6" }} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm text-white">Brats</p>
        <p className="truncate text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Arjan Dhillon</p>
      </div>
      <button className="rounded-full p-1 hover:bg-white/20" style={{ color: "#ffffff" }} onClick={() => setPlaying(false)} type="button">
        <SkipBack className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} />
      </button>
      <button className="rounded-full p-1 hover:bg-white/20" style={{ color: "#ffffff" }} onClick={() => setPlaying((p) => !p)} type="button">
        {playing ? (
          <Pause className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} />
        ) : (
          <Play className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} />
        )}
      </button>
      <button className="rounded-full p-1 hover:bg-white/20" style={{ color: "#ffffff" }} onClick={() => setPlaying(true)} type="button">
        <SkipForward className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} />
      </button>
    </div>
  );
};

type View = "idle" | "ring" | "timer" | "notification" | "music";

export interface DynamicIslandProps {
  view?: View;
  onViewChange?: (view: View) => void;
  idleContent?: ReactNode;
  ringContent?: ReactNode;
  timerContent?: ReactNode;
  className?: string;
}

export default function DynamicIsland({
  view: controlledView,
  onViewChange,
  idleContent,
  ringContent,
  timerContent,
  className = "",
}: DynamicIslandProps) {
  const [internalView, setInternalView] = useState<View>("idle");
  const [variantKey, setVariantKey] = useState<string>("idle");
  const [expanded, setExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const view = controlledView ?? internalView;

  const content = useMemo(() => {
    switch (view) {
      case "ring":
        return ringContent ?? <VoiceRing />;
      case "timer":
        return timerContent ?? <DefaultTimer />;
      case "notification":
        return <Notification />;
      case "music":
        return <MusicPlayer />;
      default:
        return idleContent ?? <DefaultIdle />;
    }
  }, [view, idleContent, ringContent, timerContent]);

  const handleViewChange = (newView: View) => {
    setExpanded(true);
    if (view === newView) return;
    setVariantKey(`${view}-${newView}`);
    if (onViewChange) {
      onViewChange(newView);
    } else {
      setInternalView(newView);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>

      {/* ISLAND */}
      <motion.div
        className="w-fit rounded-full"
        layout
        style={{ borderRadius: 32, backgroundColor: "#000000" }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                type: "spring",
                bounce:
                  BOUNCE_VARIANTS[variantKey as keyof typeof BOUNCE_VARIANTS] ??
                  DEFAULT_BOUNCE,
                duration: 0.25,
              }
        }
      >
        <div className="overflow-hidden rounded-full">
          {!expanded && (
            <button
              type="button"
              aria-label="Open"
              onClick={() => setExpanded(true)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center"
            />
          )}

          {expanded && (
            <motion.div
              animate={
                shouldReduceMotion
                  ? { scale: 1, opacity: 1 }
                  : {
                      scale: 1,
                      opacity: 1,
                      filter: "blur(0px)",
                      originX: 0.5,
                      originY: 0.5,
                      transition: { delay: 0.05 },
                    }
              }
              initial={{
                scale: 0.9,
                opacity: 0,
                filter: "blur(5px)",
                originX: 0.5,
                originY: 0.5,
              }}
              key={view}
              transition={{
                type: "spring",
                bounce:
                  BOUNCE_VARIANTS[variantKey as keyof typeof BOUNCE_VARIANTS] ??
                  DEFAULT_BOUNCE,
              }}
            >
              {content}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* NAV BUTTONS */}
      <div className="flex justify-center gap-1 rounded-full border border-black/10 bg-black/5 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
        {[
          { key: "idle", icon: <CloudLightning className="size-3 text-foreground" /> },
          { key: "ring", icon: <Phone className="size-3 text-foreground" /> },
          // { key: "timer", icon: <TimerIcon className="size-3 text-foreground" /> },
          { key: "notification", icon: <Bell className="size-3 text-foreground" /> },
          { key: "music", icon: <Music2 className="size-3 text-foreground" /> },
        ].map(({ key, icon }) => (
          <button
            aria-label={key}
            key={key}
            onClick={() => handleViewChange(key as View)}
            type="button"
            className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}