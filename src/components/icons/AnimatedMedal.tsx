"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedMedalProps {
  size?: number;
  active?: boolean;
  className?: string;
}

const AnimatedMedal: React.FC<AnimatedMedalProps> = ({
  size = 24,
  active = false,
  className,
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={
        active
          ? { y: ["-40%", "0%"], opacity: [0, 1] }
          : { y: "0%", opacity: 1 }
      }
      transition={
        active
          ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          : { duration: 0 }
      }
    >
      <defs>
        <radialGradient id="medal-shine" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="medal-clip">
          <circle cx="12" cy="14" r="6" />
        </clipPath>
      </defs>

      {/* Ribbon left */}
      <motion.path
        d="M9 2 L7 8 L9 10 L12 8 L15 10 L17 8 L15 2 Z"
        fill="#E8C547"
        stroke="#E8C547"
        strokeWidth={0.5}
        opacity={0.85}
      />

      {/* Medal circle */}
      <motion.circle
        cx="12"
        cy="14"
        r="6"
        fill="#E8C547"
        stroke="#E8C547"
        strokeWidth={1}
        animate={{ filter: active ? "drop-shadow(0 0 4px #E8C547aa)" : "none" }}
        transition={{ duration: 0.4 }}
      />

      {/* Inner circle detail */}
      <circle cx="12" cy="14" r="3.5" fill="none" stroke="#ffffff" strokeWidth={0.75} opacity={0.5} />

      {/* Rotating shine glint */}
      {active && (
        <motion.rect
          x="11"
          y="8"
          width="2"
          height="12"
          fill="url(#medal-shine)"
          clipPath="url(#medal-clip)"
          style={{ transformOrigin: "12px 14px" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          opacity={0.7}
        />
      )}

      {/* Star detail on medal */}
      <motion.text
        x="12"
        y="18"
        textAnchor="middle"
        fontSize="7"
        fill="#ffffff"
        fontWeight="bold"
        opacity={0.9}
      >
        ★
      </motion.text>
    </motion.svg>
  );
};

export default AnimatedMedal;
