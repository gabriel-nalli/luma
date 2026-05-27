"use client";

import { useMemo } from "react";
import getStroke from "perfect-freehand";

interface Stroke {
  points: { x: number; y: number; pressure: number }[];
  color: string;
  size: number;
}

function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
}

export default function DrawingPreview({ content, height = 120 }: { content: string; height?: number }) {
  const strokes: Stroke[] = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      return parsed.strokes || [];
    } catch {
      return [];
    }
  }, [content]);

  // Calculate bounds
  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (const s of strokes) {
      for (const p of s.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }
    if (minX === Infinity) return { x: 0, y: 0, w: 300, h: 150 };
    const pad = 20;
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }, [strokes]);

  if (strokes.length === 0) {
    return <div className="text-[11px] text-white/30 italic">Desenho vazio</div>;
  }

  return (
    <svg
      viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
      style={{ height, width: "100%" }}
      className="rounded-lg"
      preserveAspectRatio="xMidYMid meet"
    >
      {strokes.map((s, i) => {
        const outlinePoints = getStroke(
          s.points.map((p) => [p.x, p.y, p.pressure]),
          { size: s.size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }
        );
        return <path key={i} d={getSvgPathFromStroke(outlinePoints)} fill={s.color} opacity={0.9} />;
      })}
    </svg>
  );
}
