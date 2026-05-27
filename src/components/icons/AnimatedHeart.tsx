"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedHeartProps {
  size?: number;
  active?: boolean;
  className?: string;
}

const HEART_PATH =
  "M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z";

const heartbeatSequence = [1, 1.2, 1, 1.15, 1];
const heartbeatTimes = [0, 0.2, 0.4, 0.6, 1];

const AnimatedHeart: React.FC<AnimatedHeartProps> = ({
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
          ? { scale: heartbeatSequence }
          : { scale: [1, 1.05, 1] }
      }
      transition={
        active
          ? { duration: 0.7, times: heartbeatTimes, ease: "easeInOut" }
          : { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <motion.path
        d={HEART_PATH}
        stroke="#9B7BF7"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ fill: active ? "#9B7BF7" : "transparent", fillOpacity: active ? 0.25 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.svg>
  );
};

export default AnimatedHeart;
