"use client";

export default function PandaChat() {
  return (
    <div className="mascot-container absolute -top-10 -right-2 w-28 h-28 pointer-events-none delay-2 z-50">
      <div className="w-full h-full transform rotate-[15deg]">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_10px_20px_rgba(139,92,246,0.5)]">
          <defs>
            <radialGradient id="chinGlow4" cx="50%" cy="85%" r="45%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="irisGrad4" x1="50%" y1="10%" x2="50%" y2="90%">
              <stop offset="10%" stopColor="#e9d5ff" stopOpacity="1" />
              <stop offset="90%" stopColor="#a78bfa" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <path d="M25,12 Q25,20 17,20 Q25,20 25,28 Q25,20 33,20 Q25,20 25,12 Z" fill="#fbbf24" className="sparkle-1" opacity="0.9" />
          <g className="panda-body">
            <ellipse cx="50" cy="48" rx="38" ry="34" fill="#ffffff" />
            <ellipse cx="50" cy="48" rx="38" ry="34" fill="url(#chinGlow4)" />
            <ellipse cx="32" cy="45" rx="10" ry="14" fill="#2a2540" transform="rotate(30 32 45)" />
            <ellipse cx="68" cy="45" rx="10" ry="14" fill="#2a2540" transform="rotate(-30 68 45)" />
            <circle cx="34" cy="44" r="5.2" fill="url(#irisGrad4)" />
            <circle cx="34" cy="44" r="5.2" fill="#d8b4fe" style={{ filter: "blur(2px)" }} opacity="0.4" />
            <circle cx="34" cy="44.5" r="3" fill="#1a1a2e" />
            <circle cx="36" cy="42.5" r="1.5" fill="#ffffff" />
            <circle cx="33" cy="46" r="0.8" fill="#ffffff" opacity="0.7" />
            <circle cx="66" cy="44" r="5.2" fill="url(#irisGrad4)" />
            <circle cx="66" cy="44" r="5.2" fill="#d8b4fe" style={{ filter: "blur(2px)" }} opacity="0.4" />
            <circle cx="66" cy="44.5" r="3" fill="#1a1a2e" />
            <circle cx="68" cy="42.5" r="1.5" fill="#ffffff" />
            <circle cx="65" cy="46" r="0.8" fill="#ffffff" opacity="0.7" />
            <ellipse cx="50" cy="58" rx="6" ry="3.5" fill="#2a2540" />

            {/* Phone */}
            <g className="panda-book">
              <rect x="18" y="52" width="18" height="28" rx="3" fill="#8b5cf6" opacity="0.5" style={{ filter: "blur(5px)" }} transform="rotate(-25 27 66)" />
              <rect x="18" y="52" width="18" height="28" rx="3" fill="#2a2540" stroke="#a78bfa" strokeWidth="1" transform="rotate(-25 27 66)" />
              <rect x="20" y="54" width="14" height="24" rx="2" fill="url(#phoneGrad)" transform="rotate(-25 27 66)" />
              <rect x="22" y="57" width="8" height="2.5" rx="1.5" fill="#ffffff" transform="rotate(-25 27 66)" />
              <rect x="26" y="61" width="6" height="2.5" rx="1.5" fill="#ffffff" transform="rotate(-25 27 66)" opacity="0.7" />
              <rect x="22" y="65" width="10" height="2.5" rx="1.5" fill="#ffffff" transform="rotate(-25 27 66)" />
            </g>

            {/* Paws */}
            <circle cx="33" cy="72" r="12" fill="#2a2540" stroke="#6d5e99" strokeWidth="1" />
            <circle cx="67" cy="72" r="12" fill="#2a2540" stroke="#6d5e99" strokeWidth="1" />

            {/* Headset */}
            <path d="M 8 42 C 8 -2, 92 -2, 92 42" fill="none" stroke="#d8b4fe" strokeWidth="3" opacity="0.9" strokeLinecap="round" />
            <rect x="4" y="32" width="12" height="26" rx="6" fill="#a78bfa" style={{ filter: "drop-shadow(0 0 5px #8b5cf6)" }} />
            <rect x="2" y="36" width="6" height="18" rx="3" fill="#8b5cf6" />
            <rect x="84" y="32" width="12" height="26" rx="6" fill="#a78bfa" style={{ filter: "drop-shadow(0 0 5px #8b5cf6)" }} />
            <rect x="92" y="36" width="6" height="18" rx="3" fill="#8b5cf6" />

            {/* Mic */}
            <path d="M 84 52 C 75 62, 62 60, 60 59" fill="none" stroke="#e9d5ff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="60" cy="59" r="3.5" fill="#ffffff" style={{ filter: "drop-shadow(0 0 4px #c4b5fd)" }} />
            <circle cx="60" cy="59" r="1.5" fill="#8b5cf6" />
          </g>
        </svg>
      </div>
    </div>
  );
}
