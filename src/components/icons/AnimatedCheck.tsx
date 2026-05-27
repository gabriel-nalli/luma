"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedCheckProps {
  size?: number;
  active?: boolean;
  className?: string;
}

// Approximate path length for the checkmark
const CHECK_LENGTH = 22;

const AnimatedCheck: React.FC<AnimatedCheckProps> = ({
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
      animate={active ? { scale: [1, 1.15, 0.95, 1] } : { scale: 1 }}
      transition={active ? { duration: 0.35, ease: "easeOut" } : { duration: 0 }}
    >
      {/* Circle background */}
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke="#9B7BF7"
        strokeWidth={1.5}
        animate={{ fill: active ? "#9B7BF7" : "transparent", fillOpacity: active ? 0.15 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Checkmark stroke — draws in */}
      <motion.path
        d="M7 12.5 L10.5 16 L17 9"
        stroke="#9B7BF7"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ strokeDasharray: CHECK_LENGTH, strokeDashoffset: CHECK_LENGTH }}
        animate={{ strokeDashoffset: active ? 0 : CHECK_LENGTH }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
};

export default AnimatedCheck;
