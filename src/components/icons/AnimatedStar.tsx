"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedStarProps {
  size?: number;
  active?: boolean;
  className?: string;
}

const STAR_PATH =
  "M12 2 L14.09 8.26 L20.18 8.27 L15.45 12.14 L17.18 18.02 L12 14.77 L6.82 18.02 L8.55 12.14 L3.82 8.27 L9.91 8.26 Z";

// Approximate perimeter for the star path
const STAR_DASH = 60;

const AnimatedStar: React.FC<AnimatedStarProps> = ({
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
      animate={active ? { scale: [1, 1.2, 0.95, 1.05, 1] } : { scale: [1, 1.04, 1] }}
      transition={
        active
          ? { duration: 0.5, ease: "easeOut" }
          : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <defs>
        <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Fill layer — fades to gold when active */}
      <motion.path
        d={STAR_PATH}
        animate={{ fill: active ? "#E8C547" : "transparent", opacity: active ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        filter={active ? "url(#star-glow)" : undefined}
      />

      {/* Stroke layer — draws itself in */}
      <motion.path
        d={STAR_PATH}
        stroke={active ? "#E8C547" : "#9B7BF7"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ strokeDasharray: STAR_DASH, strokeDashoffset: STAR_DASH }}
        animate={
          active
            ? { strokeDashoffset: 0 }
            : { strokeDashoffset: [STAR_DASH * 0.15, 0, STAR_DASH * 0.15] }
        }
        transition={
          active
            ? { duration: 0.5, ease: "easeOut" }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      />
    </motion.svg>
  );
};

export default AnimatedStar;
