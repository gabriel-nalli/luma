"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    if (isSignUp) {
      const { error } = await signUp(email.trim(), password);
      if (error) { setError(error); setLoading(false); return; }
      // Auto login after signup
      const { error: loginErr } = await signIn(email.trim(), password);
      if (loginErr) { setError(loginErr); setLoading(false); return; }
    } else {
      const { error } = await signIn(email.trim(), password);
      if (error) { setError(error); setLoading(false); return; }
    }

    router.replace("/");
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Panda */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 mascot-container">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_10px_20px_rgba(139,92,246,0.4)]">
              <g style={{ animation: "pandaBob 3s ease-in-out infinite" }}>
                <circle cx="20" cy="24" r="15" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                <circle cx="80" cy="24" r="15" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                <circle cx="30" cy="72" r="13" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                <circle cx="70" cy="72" r="13" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                <ellipse cx="50" cy="48" rx="38" ry="34" fill="#ffffff" />
                <ellipse cx="32" cy="45" rx="10" ry="14" fill="#1f1c2e" transform="rotate(30 32 45)" />
                <ellipse cx="68" cy="45" rx="10" ry="14" fill="#1f1c2e" transform="rotate(-30 68 45)" />
                <circle cx="34" cy="44" r="5.2" fill="#a78bfa" />
                <circle cx="34" cy="44.5" r="3" fill="#1a1a2e" />
                <circle cx="36" cy="42.5" r="1.5" fill="#ffffff" />
                <circle cx="66" cy="44" r="5.2" fill="#a78bfa" />
                <circle cx="66" cy="44.5" r="3" fill="#1a1a2e" />
                <circle cx="68" cy="42.5" r="1.5" fill="#ffffff" />
                <ellipse cx="50" cy="56" rx="6.5" ry="4" fill="#1f1c2e" />
                <path d="M 44 62 Q 50 67 56 62" fill="none" stroke="#1f1c2e" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-center mb-1">
          <span className="text-gradient">Luma</span>
        </h1>
        <p className="text-center text-white/50 text-sm mb-8">Sua assistente de estudos pessoal</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs text-white/50 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
          />
          <label className="block text-xs text-white/50 mb-1.5">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-4"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
          />
          {error && <p className="text-xs text-[#fb7185] mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold transition-colors"
            style={{ background: "#8b5cf6", color: "#fff", opacity: loading || !email.trim() || !password.trim() ? 0.5 : 1 }}
          >
            {loading ? "Entrando..." : isSignUp ? "Criar Conta" : "Entrar"}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className="w-full text-center text-xs text-white/40 mt-4 hover:text-white/60 transition-colors"
        >
          {isSignUp ? "Ja tem conta? Entrar" : "Nao tem conta? Criar conta"}
        </button>
      </div>
    </main>
  );
}
