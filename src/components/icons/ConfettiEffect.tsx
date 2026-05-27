"use client";

import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ConfettiEffectProps {
  trigger: boolean;
  colors?: string[];
}

const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  trigger,
  colors = ["#9B7BF7", "#F0C4EF", "#E8C547"],
}) => {
  const prevTrigger = useRef(false);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          origin: { x: 0.5, y: 0.55 },
          colors,
          ...opts,
          particleCount: Math.floor(200 * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }

    prevTrigger.current = trigger;
  }, [trigger, colors]);

  // This component renders nothing — it is purely a side-effect trigger
  return null;
};

export default ConfettiEffect;
