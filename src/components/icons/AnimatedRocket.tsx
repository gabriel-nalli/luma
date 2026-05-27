"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedRocketProps {
  size?: number;
  active?: boolean;
  className?: string;
}

const particles = [
  { x: 10, delay: 0 },
  { x: 12, delay: 0.1 },
  { x: 14, delay: 0.05 },
  { x: 11, delay: 0.15 },
  { x: 13, delay: 0.08 },
];

const AnimatedRocket: React.FC<AnimatedRocketProps> = ({
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
      animate={active ? { y: [0, -2, 0, -1.5, 0] } : { y: 0 }}
      transition={
        active
          ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0 }
      }
    >
      {/* Rocket body */}
      <motion.path
        d="M12 2C12 2 7 6 7 12L9 14L12 15L15 14L17 12C17 6 12 2 12 2Z"
        fill="#9B7BF7"
        stroke="#9B7BF7"
        strokeWidth={1.2}
        strokeLinejoin="round"
        fillOpacity={0.2}
      />
      <motion.path
        d="M12 2C12 2 7 6 7 12L9 14L12 15L15 14L17 12C17 6 12 2 12 2Z"
        stroke="#9B7BF7"
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill="none"
      />

      {/* Window */}
      <circle cx="12" cy="9" r="1.5" stroke="#9B7BF7" strokeWidth={1.2} fill="none" />

      {/* Left fin */}
      <motion.path
        d="M9 12 L7 15 L9 14Z"
        fill="#9B7BF7"
        fillOpacity={0.6}
        stroke="#9B7BF7"
        strokeWidth={1}
        strokeLinejoin="round"
      />

      {/* Right fin */}
      <motion.path
        d="M15 12 L17 15 L15 14Z"
        fill="#9B7BF7"
        fillOpacity={0.6}
        stroke="#9B7BF7"
        strokeWidth={1}
        strokeLinejoin="round"
      />

      {/* Flame base */}
      <motion.path
        d="M10 15 Q12 18 14 15"
        stroke="#E8C547"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        animate={{ opacity: active ? 1 : 0.3 }}
        transition={{ duration: 0.3 }}
      />

      {/* Particle trail */}
      {active &&
        particles.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={19}
            r={1}
            fill="#E8C547"
            initial={{ y: 0, opacity: 0.8, scale: 1 }}
            animate={{ y: [0, 3, 6], opacity: [0.8, 0.4, 0], scale: [1, 0.6, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeOut",
            }}
          />
        ))}
    </motion.svg>
  );
};

export default AnimatedRocket;
