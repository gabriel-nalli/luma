"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedLampProps {
  size?: number;
  active?: boolean;
  className?: string;
}

const AnimatedLamp: React.FC<AnimatedLampProps> = ({
  size = 24,
  active = false,
  className,
}) => {
  const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="bulb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8C547" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#9B7BF7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#9B7BF7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Glow halo — fades in when active */}
      <motion.circle
        cx="12"
        cy="10"
        r="9"
        fill="url(#bulb-glow)"
        animate={{ opacity: active ? 0.7 : 0, scale: active ? 1 : 0.6 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* Rays */}
      {rayAngles.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 12 + Math.cos(rad) * 7;
        const y1 = 10 + Math.sin(rad) * 7;
        const x2 = 12 + Math.cos(rad) * 10;
        const y2 = 10 + Math.sin(rad) * 10;
        return (
          <motion.line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#E8C547"
            strokeWidth={1.2}
            strokeLinecap="round"
            animate={
              active
                ? { opacity: [0, 1, 0.7], scale: [0.5, 1] }
                : { opacity: 0, scale: 0.5 }
            }
            transition={{
              duration: 0.4,
              delay: active ? i * 0.04 : 0,
              ease: "easeOut",
            }}
            style={{ transformOrigin: "12px 10px" }}
          />
        );
      })}

      {/* Bulb body */}
      <motion.path
        d="M9 10C9 7.24 10.34 5 12 5C13.66 5 15 7.24 15 10C15 11.5 14.2 12.8 13 13.5L13 15L11 15L11 13.5C9.8 12.8 9 11.5 9 10Z"
        stroke="#9B7BF7"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ fill: active ? "#E8C547" : "transparent", fillOpacity: active ? 0.3 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Base lines */}
      <motion.line x1="11" y1="15" x2="13" y2="15" stroke="#9B7BF7" strokeWidth={1.5} strokeLinecap="round" />
      <motion.line x1="10.5" y1="17" x2="13.5" y2="17" stroke="#9B7BF7" strokeWidth={1.5} strokeLinecap="round" />
      <motion.line x1="11" y1="19" x2="13" y2="19" stroke="#9B7BF7" strokeWidth={1.5} strokeLinecap="round" />

      {/* Filament detail */}
      <motion.path
        d="M11 11 Q12 9.5 13 11"
        stroke="#9B7BF7"
        strokeWidth={0.75}
        strokeLinecap="round"
        fill="none"
        animate={{ opacity: active ? 0.8 : 0.4 }}
        transition={{ duration: 0.3 }}
      />
    </motion.svg>
  );
};

export default AnimatedLamp;
