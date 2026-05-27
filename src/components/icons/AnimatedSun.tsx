"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedSunProps {
  size?: number;
  className?: string;
}

const RAY_COUNT = 8;

const AnimatedSun: React.FC<AnimatedSunProps> = ({ size = 24, className }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rotating ray group */}
      <motion.g
        style={{ transformOrigin: "12px 12px" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: RAY_COUNT }).map((_, i) => {
          const angle = (i * 360) / RAY_COUNT;
          const rad = (angle * Math.PI) / 180;
          const x1 = 12 + Math.cos(rad) * 7;
          const y1 = 12 + Math.sin(rad) * 7;
          const x2 = 12 + Math.cos(rad) * 10;
          const y2 = 12 + Math.sin(rad) * 10;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#E8C547"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}
      </motion.g>

      {/* Center circle — subtle pulse */}
      <motion.circle
        cx="12"
        cy="12"
        r="4.5"
        fill="#E8C547"
        stroke="#E8C547"
        strokeWidth={1}
        fillOpacity={0.85}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "12px 12px" }}
      />
    </motion.svg>
  );
};

export default AnimatedSun;
