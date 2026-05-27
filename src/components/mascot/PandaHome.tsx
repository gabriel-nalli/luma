"use client";

export default function PandaHome() {
  return (
    <div className="w-28 h-28 relative z-10 shrink-0 mascot-container" style={{ animationDelay: "0.2s" }}>
      <svg viewBox="0 0 100 100" overflow="visible" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_10px_15px_rgba(139,92,246,0.4)]">
        <defs>
          <radialGradient id="chinGlowHome" cx="50%" cy="85%" r="45%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="irisGradHome" x1="50%" y1="10%" x2="50%" y2="90%">
            <stop offset="10%" stopColor="#e9d5ff" stopOpacity="1" />
            <stop offset="90%" stopColor="#a78bfa" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Sparkles */}
        <path d="M85,15 Q85,22 78,22 Q85,22 85,29 Q85,22 92,22 Q85,22 85,15 Z" fill="#fbbf24" className="sparkle-2" opacity="0.9" />
        <path d="M95,35 Q95,39 91,39 Q95,39 95,43 Q95,39 99,39 Q95,39 95,35 Z" fill="#a78bfa" className="sparkle-1" opacity="0.8" />

        <g style={{ animation: "pandaBob 3s ease-in-out infinite" }}>
          {/* Ears */}
          <circle cx="20" cy="24" r="15" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
          <circle cx="80" cy="24" r="15" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />

          {/* Left paw */}
          <circle cx="30" cy="72" r="13" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />

          {/* Right paw waving */}
          <g style={{ animation: "pandaWave 2.5s ease-in-out infinite", transformOrigin: "60px 65px" }}>
            <path d="M 60 65 Q 85 68, 84 42" fill="none" stroke="#6d5e99" strokeWidth="20" strokeLinecap="round" />
            <circle cx="84" cy="42" r="10" fill="#6d5e99" />
            <path d="M 60 65 Q 85 68, 84 42" fill="none" stroke="#2a2540" strokeWidth="17" strokeLinecap="round" />
            <circle cx="84" cy="42" r="8.5" fill="#2a2540" />
            <circle cx="84" cy="42" r="4" fill="#fbcfe8" opacity="0.9" />
            <circle cx="78.5" cy="37" r="2" fill="#fbcfe8" opacity="0.9" />
            <circle cx="84" cy="34" r="2" fill="#fbcfe8" opacity="0.9" />
            <circle cx="89.5" cy="37" r="2" fill="#fbcfe8" opacity="0.9" />
          </g>

          {/* Face */}
          <ellipse cx="50" cy="48" rx="38" ry="34" fill="#ffffff" />
          <ellipse cx="50" cy="48" rx="38" ry="34" fill="url(#chinGlowHome)" />

          {/* Left eye */}
          <g style={{ animation: "pandaBlink 4s infinite", transformOrigin: "34px 45px" }}>
            <ellipse cx="32" cy="45" rx="10" ry="14" fill="#1f1c2e" transform="rotate(30 32 45)" />
            <circle cx="34" cy="44" r="5.2" fill="url(#irisGradHome)" />
            <circle cx="34" cy="44" r="5.2" fill="#d8b4fe" opacity="0.4" style={{ filter: "blur(2px)" }} />
            <circle cx="34" cy="44.5" r="3" fill="#1a1a2e" />
            <circle cx="36" cy="42.5" r="1.5" fill="#ffffff" />
            <circle cx="33" cy="46" r="0.8" fill="#ffffff" opacity="0.7" />
          </g>

          {/* Right eye */}
          <g style={{ animation: "pandaBlink 4s infinite", transformOrigin: "66px 45px" }}>
            <ellipse cx="68" cy="45" rx="10" ry="14" fill="#1f1c2e" transform="rotate(-30 68 45)" />
            <circle cx="66" cy="44" r="5.2" fill="url(#irisGradHome)" />
            <circle cx="66" cy="44" r="5.2" fill="#d8b4fe" opacity="0.4" style={{ filter: "blur(2px)" }} />
            <circle cx="66" cy="44.5" r="3" fill="#1a1a2e" />
            <circle cx="68" cy="42.5" r="1.5" fill="#ffffff" />
            <circle cx="65" cy="46" r="0.8" fill="#ffffff" opacity="0.7" />
          </g>

          {/* Nose and mouth */}
          <ellipse cx="50" cy="56" rx="6.5" ry="4" fill="#1f1c2e" />
          <path d="M 44 62 Q 50 67 56 62" fill="none" stroke="#1f1c2e" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
