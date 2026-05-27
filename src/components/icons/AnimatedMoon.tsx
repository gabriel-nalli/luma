"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedMoonProps {
  size?: number;
  className?: string;
}

const STARS = [
  { cx: 19, cy: 5, r: 0.8, delay: 0 },
  { cx: 21, cy: 10, r: 0.6, delay: 0.3 },
  { cx: 17, cy: 3, r: 0.5, delay: 0.6 },
  { cx: 20, cy: 15, r: 0.7, delay: 0.9 },
  { cx: 4, cy: 6, r: 0.5, delay: 0.45 },
  { cx: 3, cy: 14, r: 0.6, delay: 0.15 },
];

const AnimatedMoon: React.FC<AnimatedMoonProps> = ({ size = 24, className }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Crescent moon */}
      <motion.path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        fill="#9B7BF7"
        fillOpacity={0.2}
        stroke="#9B7BF7"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "12px 12px" }}
      />

      {/* Twinkling stars */}
      {STARS.map((star, i) => (
        <motion.circle
          key={i}
          cx={star.cx}
          cy={star.cy}
          r={star.r}
          fill="#E8C547"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.svg>
  );
};

export default AnimatedMoon;
