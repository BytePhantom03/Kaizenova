"use client";
import React, { useState, useEffect, useCallback, use, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  BrainCircuit, ChevronRight, SkipForward, CheckCircle2,
  Clock, Loader2, AlertCircle, XCircle, Sparkles, Keyboard,
  Trophy, ArrowRight, Mic, Volume2
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  difficulty: number;
  hints?: Record<string, any>;
}

interface Feedback {
  composite_score: number;
  technical_accuracy: number;
  communication: number;
  feedback_text: string;
  correct_concepts: string[];
  missing_concepts: string[];
  next_question: Question | null;
}

type Phase = "loading_question" | "answering" | "evaluating" | "feedback" | "completed" | "error";

/* ── Score Ring SVG ── */
function ScoreRing({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          {score.toFixed(0)}
        </motion.span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

/* ── Evaluation Animation ── */
function EvaluatingPhase({ isTranscribing = false }: { isTranscribing?: boolean }) {
  const [currentStep, setCurrentStep] = useState(0);
  const analysisSteps = isTranscribing ? [
    "Transcribing your audio...",
    "Understanding speech patterns...",
    "Converting to text..."
  ] : [
    "Analyzing technical accuracy...",
    "Evaluating communication clarity...",
    "Checking concept coverage...",
    "Generating feedback..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % analysisSteps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [analysisSteps.length]);

  return (
    <motion.div
      key="evaluating"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-[60vh] gap-6"
    >
      <div className="relative">
        <motion.div
          className="h-20 w-20 rounded-2xl border-2 border-primary/20 flex items-center justify-center bg-primary/5"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <BrainCircuit className="h-8 w-8 text-primary" />
        </motion.div>
        {/* Orbiting dots */}
        <motion.div
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-secondary"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      <div className="text-center">
        <p className="text-foreground font-semibold mb-2">
          {isTranscribing ? "Processing Voice" : "AI is evaluating your answer"}
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-muted-foreground text-sm"
          >
            {analysisSteps[currentStep]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Typing dots */}
      <div className="flex gap-1.5">
        <div className="typing-dot h-2 w-2 rounded-full bg-primary" />
        <div className="typing-dot h-2 w-2 rounded-full bg-primary" />
        <div className="typing-dot h-2 w-2 rounded-full bg-primary" />
      </div>
    </motion.div>
  );
}

export default function InterviewSession({ params }: { params: Promise<{ id: string }> }) {
  const { id: interviewId } = use(params);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading_question");
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  
  // Voice feature state
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const loadNextQuestion = useCallback(async (q?: Question | null) => {
    if (q === null) {
      // No more questions from feedback
      await completeInterview();
      return;
    }
    if (q) {
      setQuestion(q);
      setAnswer("");
      setFeedback(null);
      setPhase("answering");
      return;
    }
    setPhase("loading_question");
    try {
      const res = await api.get(`/interviews/${interviewId}/next-question`);
      setQuestion(res.data);
      setAnswer("");
      setFeedback(null);
      setPhase("answering");
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (detail?.includes("No more questions") || detail?.includes("Interview is completed") || e.response?.status === 404) {
        await completeInterview();
      } else {
        setErrorMsg(detail || "Failed to load question.");
        setPhase("error");
      }
    }
  }, [interviewId]);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    loadNextQuestion();
  }, []);

  // Play TTS when a new question starts
  useEffect(() => {
    let mounted = true;
    const playTTS = async (text: string) => {
      try {
        setIsPlayingTTS(true);
        const res = await api.post("/ai/tts", { text });
        if (!mounted) return;
        const audio = new Audio(`data:audio/wav;base64,${res.data.audio_base64}`);
        currentAudioRef.current = audio;
        audio.onended = () => {
          if (mounted) {
            setIsPlayingTTS(false);
            startRecording();
          }
        };
        await audio.play();
      } catch (e) {
        console.error("TTS playback failed", e);
        if (mounted) {
          setIsPlayingTTS(false);
          startRecording(); // fallback
        }
      }
    };

    if (phase === "answering" && question) {
      playTTS(question.question_text);
    }
    
    return () => {
      mounted = false;
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [phase, question]);

  const answerRef = useRef(answer);
  useEffect(() => { answerRef.current = answer; }, [answer]);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Start MediaRecorder for Sarvam STT
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // When recording stops, automatically process STT and submit
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAndSubmitAudio(audioBlob);
      };

      // Also try SpeechRecognition for real-time visual feedback
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        let finalTranscriptBase = answerRef.current;

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let newFinalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              newFinalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (newFinalTranscript) {
            finalTranscriptBase += (finalTranscriptBase ? " " : "") + newFinalTranscript.trim();
          }
          setAnswer((finalTranscriptBase + " " + interimTranscript).trim());
          resetSilenceTimer();
        };
        recognition.start();
      }

      const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          stopRecordingAndSubmit();
        }, 5000); // 5 seconds of silence auto-submits
      };

      const checkSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;
        
        if (average > 10) {
          resetSilenceTimer();
        }
        
        if (mediaRecorderRef.current?.state === "recording") {
          requestAnimationFrame(checkSilence);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      resetSilenceTimer();
      checkSilence();

    } catch (e) {
      console.error("Mic access denied or error", e);
      setIsRecording(false);
      setErrorMsg("Microphone access denied. Please type your answer.");
    }
  };

  const stopRecordingAndSubmit = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try { audioContextRef.current.close(); } catch (e) {}
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // This will trigger onstop and processAndSubmitAudio
    }
    setIsRecording(false);
  };

  const processAndSubmitAudio = async (audioBlob: Blob) => {
    if (!question) return;
    setPhase("evaluating");
    setIsTranscribing(true);

    try {
      let transcribedText = answerRef.current;

      // 1. Send audio to STT only if we have sufficient data
      if (audioBlob.size > 1000) {
        const formData = new FormData();
        formData.append("file", audioBlob, "answer.webm");
        
        const sttRes = await api.post("/ai/stt", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        if (sttRes.data?.transcript) {
          transcribedText = sttRes.data.transcript;
        }
      }
      
      setAnswer(transcribedText);
      setIsTranscribing(false);

      // 2. Submit text to evaluation
      const res = await api.post(`/interviews/${interviewId}/answer`, {
        question_id: question.id,
        answer_text: transcribedText,
        was_skipped: !transcribedText.trim(),
      });
      setFeedback(res.data);
      setPhase("feedback");
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || "Failed to process audio or submit answer.");
      setPhase("error");
      setIsTranscribing(false);
    }
  };

  const manualSubmitText = async (autoSubmitted = false) => {
    if (isRecording) {
      stopRecordingAndSubmit();
      return;
    }
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    
    if (!question) return;
    setPhase("evaluating");
    
    try {
      const currentText = answerRef.current;
      const res = await api.post(`/interviews/${interviewId}/answer`, {
        question_id: question.id,
        answer_text: currentText,
        was_skipped: !currentText.trim(),
      });
      setFeedback(res.data);
      setPhase("feedback");
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || "Failed to submit answer.");
      setPhase("error");
    }
  };

  const completeInterview = async () => {
    try {
      const res = await api.post(`/interviews/${interviewId}/complete`);
      if (res.data?.report_id) {
        setReportId(res.data.report_id);
      }
      setPhase("completed");
    } catch {
      setPhase("completed");
    }
  };

  const handleNext = () => {
    setQuestionNumber((n) => n + 1);
    if (feedback?.next_question !== undefined) {
      loadNextQuestion(feedback.next_question);
    } else {
      loadNextQuestion();
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-danger";
  };

  const scoreBgColor = (score: number) => {
    if (score >= 75) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-danger";
  };

  const difficultyLabel = (d: number) => {
    if (d <= 3) return { text: "Easy", color: "text-success", bg: "bg-success/10 border-success/30" };
    if (d <= 6) return { text: "Medium", color: "text-warning", bg: "bg-warning/10 border-warning/30" };
    return { text: "Hard", color: "text-danger", bg: "bg-danger/10 border-danger/30" };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient */}
      <div className="fixed top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/6 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border glass-strong sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium text-foreground">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <BrainCircuit className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-muted-foreground">Q</span>
            <span className="text-primary font-bold text-lg">{questionNumber}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono text-xs font-medium">{formatTime(elapsed)}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={completeInterview}
            className="text-xs text-muted-foreground hover:text-accent"
          >
            <XCircle className="h-3.5 w-3.5 mr-1" /> End
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">

          {/* Loading question */}
          {phase === "loading_question" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh] gap-5"
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium mb-1">Generating your next question</p>
                <p className="text-sm text-muted-foreground">Adapting difficulty to your performance...</p>
              </div>
            </motion.div>
          )}

          {/* Answering */}
          {phase === "answering" && question && (
            <motion.div key="answering" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Tags and Status */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {(() => {
                    const dl = difficultyLabel(question.difficulty);
                    return (
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${dl.bg} ${dl.color}`}>
                        {dl.text} · {question.difficulty}/10
                      </span>
                    );
                  })()}
                  <span className="text-xs px-2.5 py-1 rounded-lg border border-border bg-surface text-muted-foreground capitalize">
                    {question.question_type}
                  </span>
                </div>
                
                {/* Audio Status Pill */}
                <AnimatePresence>
                  {isPlayingTTS && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium"
                    >
                      <Volume2 className="h-3.5 w-3.5" /> Interviewer Speaking
                    </motion.div>
                  )}
                  {isRecording && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/10 border border-danger/30 text-danger text-xs font-medium"
                    >
                      <div className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                      Listening (Auto-submits after 10s silence)
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Question card */}
              <div className="relative rounded-2xl border border-border bg-card/30 backdrop-blur-sm overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-primary" />
                <div className="p-6 lg:p-8 pl-7 lg:pl-9">
                  <p className="text-lg font-medium text-foreground leading-relaxed">{question.question_text}</p>
                </div>
              </div>

              {/* Answer area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    {isRecording ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-danger animate-pulse inline-block" />
                        Listening... (transcription appears here)
                      </span>
                    ) : "Your Answer"}
                  </label>
                  <span className="text-xs text-muted-foreground tabular-nums">{answer.length} chars</span>
                </div>
                <textarea
                  value={answer}
                  onChange={(e) => { if (!isRecording) setAnswer(e.target.value); }}
                  placeholder={isRecording ? "Speak now — your words will appear here in real time..." : "Speak your answer when prompted..."}
                  rows={8}
                  disabled={isPlayingTTS}
                  style={{ cursor: isRecording ? "not-allowed" : "auto" }}
                  className="w-full rounded-2xl border border-border bg-surface px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 resize-none leading-relaxed focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3),0_0_12px_rgba(0,240,255,0.1)] disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnswer("");
                    manualSubmitText();
                  }}
                  disabled={isPlayingTTS}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <SkipForward className="h-4 w-4" /> Skip
                </Button>
                <Button
                  onClick={() => manualSubmitText()}
                  disabled={isPlayingTTS || (!isRecording && !answer.trim())}
                  className="flex-1 gap-2"
                >
                  {isRecording ? "Stop Listening & Submit" : "Submit Answer"} <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Evaluating */}
          {phase === "evaluating" && <EvaluatingPhase isTranscribing={isTranscribing} />}

          {/* Feedback */}
          {phase === "feedback" && feedback && (
            <motion.div key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Score card with ring */}
              <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ScoreRing score={feedback.composite_score} />
                  <div className="flex-1 w-full space-y-4">
                    <h2 className="text-lg font-semibold text-foreground text-center sm:text-left">Performance Breakdown</h2>

                    {[
                      { label: "Technical Accuracy", value: feedback.technical_accuracy },
                      { label: "Communication", value: feedback.communication },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className={`font-semibold ${scoreColor(item.value)}`}>{item.value.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${scoreBgColor(item.value)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Feedback */}
              <div className="rounded-2xl border border-border bg-card/30 p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Feedback
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feedback.feedback_text}</p>
              </div>

              {/* Concepts as pills */}
              {(feedback.correct_concepts.length > 0 || feedback.missing_concepts.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {feedback.correct_concepts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-2xl border border-success/20 bg-success/5 p-5"
                    >
                      <div className="text-xs font-semibold text-success uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Concepts Covered
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {feedback.correct_concepts.map((c, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-success/10 text-success/90 border border-success/20"
                          >
                            {c}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {feedback.missing_concepts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-2xl border border-warning/20 bg-warning/5 p-5"
                    >
                      <div className="text-xs font-semibold text-warning uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> Concepts Missed
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {feedback.missing_concepts.map((c, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-warning/10 text-warning/90 border border-warning/20"
                          >
                            {c}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              <Button onClick={handleNext} className="w-full gap-2">
                {feedback.next_question ? "Next Question" : "View Results"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Completed */}
          {phase === "completed" && (
            <motion.div key="completed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-[70vh] gap-8 text-center"
            >
              {/* Celebration */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                  <Trophy className="h-12 w-12 text-primary" />
                </div>
                {/* Sparkle particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-2 w-2 rounded-full bg-primary"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: [0, (Math.random() - 0.5) * 100],
                      y: [0, (Math.random() - 0.5) * 100],
                    }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    style={{ left: '50%', top: '50%' }}
                  />
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-2">Interview Complete!</h2>
                <p className="text-muted-foreground">
                  Great job! You answered {questionNumber - 1} question{questionNumber !== 2 ? "s" : ""} in {formatTime(elapsed)}.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3"
              >
                <Button variant="outline" onClick={() => router.push("/interview/setup")}>
                  New Interview
                </Button>
                {reportId ? (
                  <Button onClick={() => router.push(`/report/${reportId}`)} className="gap-2">
                    View Detailed Report <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => router.push("/dashboard")} className="gap-2">
                    Back to Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Error */}
          {phase === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[60vh] gap-5 text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-danger" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Something went wrong</h2>
                <p className="text-muted-foreground text-sm max-w-sm">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push("/dashboard")}>Dashboard</Button>
                <Button onClick={() => question ? setPhase("answering") : loadNextQuestion()}>Try Again</Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
