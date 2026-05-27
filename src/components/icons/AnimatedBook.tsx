"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedBookProps {
  size?: number;
  active?: boolean;
  className?: string;
}

const AnimatedBook: React.FC<AnimatedBookProps> = ({
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
      animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Back cover / right page (always visible) */}
      <motion.rect
        x="4"
        y="4"
        width="16"
        height="17"
        rx="2"
        fill="#C4B0F9"
        stroke="#9B7BF7"
        strokeWidth={1.5}
      />

      {/* Spine */}
      <motion.line
        x1="12"
        y1="4"
        x2="12"
        y2="21"
        stroke="#9B7BF7"
        strokeWidth={1.5}
      />

      {/* Left cover — rotates open when active */}
      <motion.g style={{ transformOrigin: "12px 12.5px" }}>
        <motion.rect
          x="4"
          y="4"
          width="8"
          height="17"
          rx="2"
          fill={active ? "#EDE8FE" : "#9B7BF7"}
          stroke="#9B7BF7"
          strokeWidth={1.5}
          animate={
            active
              ? { scaleX: 0.15, fill: "#EDE8FE", opacity: 0.5 }
              : { scaleX: 1, fill: "#9B7BF7", opacity: 1 }
          }
          style={{ transformOrigin: "12px 12.5px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.g>

      {/* Lines on right page (visible when open) */}
      <motion.g
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.3, delay: active ? 0.2 : 0 }}
      >
        <line x1="14" y1="9" x2="19" y2="9" stroke="#9B7BF7" strokeWidth={1} strokeLinecap="round" opacity={0.6} />
        <line x1="14" y1="12" x2="19" y2="12" stroke="#9B7BF7" strokeWidth={1} strokeLinecap="round" opacity={0.6} />
        <line x1="14" y1="15" x2="19" y2="15" stroke="#9B7BF7" strokeWidth={1} strokeLinecap="round" opacity={0.6} />
        <line x1="14" y1="18" x2="17" y2="18" stroke="#9B7BF7" strokeWidth={1} strokeLinecap="round" opacity={0.6} />
      </motion.g>

      {/* Bookmark ribbon */}
      <motion.path
        d="M17 4 L17 9 L15.5 7.5 L14 9 L14 4"
        fill="#9B7BF7"
        stroke="none"
        animate={{ opacity: active ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
      />
    </motion.svg>
  );
};

export default AnimatedBook;
