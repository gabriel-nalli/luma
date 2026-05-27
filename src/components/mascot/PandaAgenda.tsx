"use client";

export default function PandaAgenda() {
  return (
    <div className="mascot-container absolute -top-10 -right-5 w-28 h-28 pointer-events-none delay-2 z-50">
      <div className="w-full h-full transform rotate-[15deg]">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_10px_20px_rgba(139,92,246,0.5)]">
          <defs>
            <radialGradient id="chinGlow3" cx="50%" cy="85%" r="45%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="irisGrad3" x1="50%" y1="10%" x2="50%" y2="90%">
              <stop offset="10%" stopColor="#e9d5ff" stopOpacity="1" />
              <stop offset="90%" stopColor="#a78bfa" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d="M25,12 Q25,20 17,20 Q25,20 25,28 Q25,20 33,20 Q25,20 25,12 Z" fill="#fbbf24" className="sparkle-1" opacity="0.9" />
          <g className="panda-body">
            <circle cx="22" cy="28" r="14" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
            <circle cx="78" cy="28" r="14" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
            <ellipse cx="50" cy="48" rx="38" ry="34" fill="#ffffff" />
            <ellipse cx="50" cy="48" rx="38" ry="34" fill="url(#chinGlow3)" />
            <ellipse cx="32" cy="45" rx="10" ry="14" fill="#2a2540" transform="rotate(30 32 45)" />
            <ellipse cx="68" cy="45" rx="10" ry="14" fill="#2a2540" transform="rotate(-30 68 45)" />
            <circle cx="34" cy="44" r="5.2" fill="url(#irisGrad3)" />
            <circle cx="34" cy="44" r="5.2" fill="#d8b4fe" style={{ filter: "blur(2px)" }} opacity="0.4" />
            <circle cx="34" cy="44.5" r="3" fill="#1a1a2e" />
            <circle cx="36" cy="42.5" r="1.5" fill="#ffffff" />
            <circle cx="33" cy="46" r="0.8" fill="#ffffff" opacity="0.7" />
            <circle cx="66" cy="44" r="5.2" fill="url(#irisGrad3)" />
            <circle cx="66" cy="44" r="5.2" fill="#d8b4fe" style={{ filter: "blur(2px)" }} opacity="0.4" />
            <circle cx="66" cy="44.5" r="3" fill="#1a1a2e" />
            <circle cx="68" cy="42.5" r="1.5" fill="#ffffff" />
            <circle cx="65" cy="46" r="0.8" fill="#ffffff" opacity="0.7" />
            <ellipse cx="50" cy="58" rx="6" ry="3.5" fill="#2a2540" />
            <circle cx="33" cy="72" r="12" fill="#2a2540" stroke="#6d5e99" strokeWidth="1" />
            <circle cx="67" cy="72" r="12" fill="#2a2540" stroke="#6d5e99" strokeWidth="1" />
          </g>
          {/* Clock accessory */}
          <g className="panda-book" style={{ animation: "bookFloat 3s ease-in-out infinite" }}>
            <circle cx="50" cy="72" r="14" fill="#8b5cf6" opacity="0.5" style={{ filter: "blur(6px)" }} />
            <circle cx="50" cy="72" r="12" fill="rgba(196,181,253,0.2)" stroke="#e9d5ff" strokeWidth="1.5" />
            <line x1="50" y1="72" x2="50" y2="65" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="72" x2="55" y2="75" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="72" r="1.5" fill="#ffffff" />
          </g>
        </svg>
      </div>
    </div>
  );
}
