"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { sendChatMessage, transcribeAudio, type ChatMessage } from "@/lib/ai";
import BottomNav from "@/components/layout/BottomNav";
import PandaChat from "@/components/mascot/PandaChat";

interface ExtendedMessage extends ChatMessage {
  imageBase64?: string;
}

export default function ChatPage() {
  const { state } = useStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    { role: "assistant", content: "Ola! Eu sou a Luma, sua professora de Psicologia. Me pergunte qualquer coisa sobre suas materias — posso explicar conceitos, tirar duvidas de provas, analisar fotos do caderno ou ouvir seu audio. Como posso te ajudar?" },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function buildContext() {
    const subjects = state.subjects.map((s) => s.name).join(", ");
    const notes = state.notes.slice(0, 5).map((n) => `${n.title}: ${n.content.slice(0, 150)}`).join("\n");
    return `Materias: ${subjects}\nNotas:\n${notes}`;
  }

  async function handleSend() {
    const text = input.trim();
    const image = pendingImage;
    if ((!text && !image) || loading) return;

    const userMsg: ExtendedMessage = {
      role: "user",
      content: text || (image ? "Analise esta imagem" : ""),
      ...(image ? { imageBase64: image } : {}),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setPendingImage(null);
    setLoading(true);

    try {
      const reply = await sendChatMessage(updated, buildContext());
      setMessages([...updated, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Desculpa, tive um problema. Tenta de novo?" }]);
    } finally {
      setLoading(false);
    }
  }

  // Audio recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          setTranscribing(true);
          try {
            const text = await transcribeAudio(base64);
            if (text) setInput((prev) => (prev ? prev + " " + text : text));
          } catch {}
          setTranscribing(false);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {}
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Image upload
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function formatTime(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

  return (
    <main className="w-full max-w-2xl mx-auto relative z-10 p-6 md:p-12 h-screen flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex-1 flex flex-col pt-8 pb-24">
        <div className="flex flex-col flex-1 relative">

          <div className="relative z-10 flex-none">
            <PandaChat />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 10 90 80" className="w-full h-full drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <g>
                    <circle cx="22" cy="28" r="14" fill="#2a2540" />
                    <circle cx="78" cy="28" r="14" fill="#2a2540" />
                    <ellipse cx="50" cy="48" rx="38" ry="34" fill="#ffffff" />
                    <ellipse cx="32" cy="45" rx="10" ry="14" fill="#2a2540" transform="rotate(30 32 45)" />
                    <ellipse cx="68" cy="45" rx="10" ry="14" fill="#2a2540" transform="rotate(-30 68 45)" />
                    <circle cx="34" cy="44" r="5.2" fill="#a78bfa" />
                    <circle cx="34" cy="44.5" r="3" fill="#1a1a2e" />
                    <circle cx="36" cy="42.5" r="1.5" fill="#ffffff" />
                    <circle cx="66" cy="44" r="5.2" fill="#a78bfa" />
                    <circle cx="66" cy="44.5" r="3" fill="#1a1a2e" />
                    <circle cx="68" cy="42.5" r="1.5" fill="#ffffff" />
                    <ellipse cx="50" cy="58" rx="6" ry="3.5" fill="#2a2540" />
                  </g>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">Chat</h2>
                <p className="text-[13px] text-white/50 font-light">Tire suas duvidas de forma simples</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 relative z-10 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`fade-in-up ${msg.role === "user" ? "flex justify-end" : "max-w-[92%]"}`}>
                <div
                  className="rounded-2xl p-4"
                  style={msg.role === "user"
                    ? { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", maxWidth: "85%" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }
                  }
                >
                  {msg.imageBase64 && (
                    <img src={msg.imageBase64} alt="" className="rounded-lg mb-2 max-h-48 object-cover" />
                  )}
                  <p className="text-[13px] leading-[1.6] text-white/80 font-medium whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="max-w-[92%] fade-in-up">
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Pending image preview */}
          {pendingImage && (
            <div className="relative mt-3 inline-block">
              <img src={pendingImage} alt="" className="rounded-xl max-h-32 object-cover border border-white/10" />
              <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#fb7185] flex items-center justify-center text-white text-xs font-bold">X</button>
            </div>
          )}

          {/* Transcribing indicator */}
          {transcribing && (
            <div className="flex items-center gap-2 mt-2 text-white/40 text-xs">
              <div className="w-3 h-3 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
              Transcrevendo audio...
            </div>
          )}

          {/* Input area */}
          <div className="fixed bottom-[90px] left-0 right-0 px-6 z-20 max-w-2xl mx-auto">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

            {/* Recording UI */}
            {isRecording ? (
              <div className="flex items-center w-full bg-[#151520]/60 border border-[#fb7185]/30 rounded-[14px] p-3 gap-3">
                <div className="w-3 h-3 rounded-full bg-[#fb7185] animate-pulse" />
                <span className="text-sm text-white/70 flex-1">Gravando... {formatTime(recordingTime)}</span>
                <button onClick={stopRecording} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#fb7185]/20 text-[#fb7185] border border-[#fb7185]/30">
                  Parar
                </button>
              </div>
            ) : (
              <div className="flex items-center w-full bg-[#151520]/60 border border-white/10 rounded-[14px] p-1.5 transition-all focus-within:border-[#8b5cf6]/50 focus-within:bg-[#151520]/80 shadow-lg backdrop-blur-md">
                {/* Image button */}
                <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white/30 hover:text-[#a78bfa] hover:bg-white/5 transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder={pendingImage ? "Escreva a legenda..." : "Escreva sua duvida..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent text-[13px] text-white px-2 outline-none placeholder-white/30 h-10"
                />

                {/* Mic button */}
                <button onClick={startRecording} className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white/30 hover:text-[#a78bfa] hover:bg-white/5 transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </button>

                {/* Send button */}
                <button onClick={handleSend} disabled={loading} className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white/30 hover:text-[#a78bfa] hover:bg-white/5 transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
