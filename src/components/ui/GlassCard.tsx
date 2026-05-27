"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  onClick,
  hoverable = false,
}: GlassCardProps) {
  const baseStyle: React.CSSProperties = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: "0.5rem",
  };

  if (hoverable) {
    return (
      <motion.div
        style={baseStyle}
        className={className}
        onClick={onClick}
        whileHover={{
          scale: 1.01,
          borderColor: "rgba(155, 123, 247, 0.25)",
          background: "var(--glass-bg-hover)",
        }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div style={baseStyle} className={className} onClick={onClick}>
      {children}
    </div>
  );
}
