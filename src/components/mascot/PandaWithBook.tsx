"use client";

export default function PandaWithBook() {
  return (
    <div className="mascot-container absolute -top-10 -right-2 w-28 h-28 pointer-events-none delay-2 z-50">
      <div className="w-full h-full transform rotate-[15deg]">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_10px_20px_rgba(139,92,246,0.5)]">
          <defs>
            <radialGradient id="chinGlow" cx="50%" cy="85%" r="45%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="irisGrad" x1="50%" y1="10%" x2="50%" y2="90%">
              <stop offset="10%" stopColor="#e9d5ff" stopOpacity="1" />
              <stop offset="90%" stopColor="#a78bfa" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <path d="M25,12 Q25,20 17,20 Q25,20 25,28 Q25,20 33,20 Q25,20 25,12 Z" fill="#fbbf24" className="sparkle-1" opacity="0.9" />
          <g className="panda-body">
            <circle cx="22" cy="28" r="14" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
            <circle cx="78" cy="28" r="14" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
            <ellipse cx="50" cy="48" rx="38" ry="34" fill="#ffffff" />
            <ellipse cx="50" cy="48" rx="38" ry="34" fill="url(#chinGlow)" />
            <ellipse cx="32" cy="45" rx="10" ry="14" fill="#2a2540" transform="rotate(30 32 45)" />
            <ellipse cx="68" cy="45" rx="10" ry="14" fill="#2a2540" transform="rotate(-30 68 45)" />
            <circle cx="34" cy="44" r="5.2" fill="url(#irisGrad)" />
            <circle cx="34" cy="44" r="5.2" fill="#d8b4fe" style={{ filter: "blur(2px)" }} opacity="0.4" />
            <circle cx="34" cy="44.5" r="3" fill="#1a1a2e" />
            <circle cx="36" cy="42.5" r="1.5" fill="#ffffff" />
            <circle cx="33" cy="46" r="0.8" fill="#ffffff" opacity="0.7" />
            <circle cx="66" cy="44" r="5.2" fill="url(#irisGrad)" />
            <circle cx="66" cy="44" r="5.2" fill="#d8b4fe" style={{ filter: "blur(2px)" }} opacity="0.4" />
            <circle cx="66" cy="44.5" r="3" fill="#1a1a2e" />
            <circle cx="68" cy="42.5" r="1.5" fill="#ffffff" />
            <circle cx="65" cy="46" r="0.8" fill="#ffffff" opacity="0.7" />
            <ellipse cx="50" cy="58" rx="6" ry="3.5" fill="#2a2540" />
            <circle cx="33" cy="72" r="12" fill="#2a2540" stroke="#6d5e99" strokeWidth="1" />
            <circle cx="67" cy="72" r="12" fill="#2a2540" stroke="#6d5e99" strokeWidth="1" />
          </g>
          <g className="panda-book">
            <rect x="38" y="66" width="24" height="16" rx="4" fill="#8b5cf6" opacity="0.6" style={{ filter: "blur(6px)" }} />
            <rect x="38" y="66" width="24" height="16" rx="4" fill="url(#cardGrad)" stroke="#e9d5ff" strokeWidth="0.5" />
            <line x1="42" y1="71" x2="58" y2="71" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="42" y1="76" x2="52" y2="76" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}
