"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import getStroke from "perfect-freehand";

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
}

interface DrawingCanvasProps {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
}

const COLORS = ["#ffffff", "#a78bfa", "#fb7185", "#fbbf24", "#34d399", "#60a5fa"];
const SIZES = [2, 4, 8, 14];

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

export default function DrawingCanvas({ strokes, onChange }: DrawingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  // Auto-expand canvas height based on lowest stroke point
  const canvasHeight = Math.max(800, ...strokes.map((s) => Math.max(...s.points.map((p) => p.y + 200))), ...currentPoints.map((p) => p.y + 200));

  const getPoint = useCallback((e: React.PointerEvent): Point => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    const point = getPoint(e);

    if (isEraser) {
      // Remove strokes near this point
      const threshold = 20;
      const filtered = strokes.filter((s) => {
        return !s.points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < threshold);
      });
      if (filtered.length !== strokes.length) onChange(filtered);
      return;
    }

    setIsDrawing(true);
    setCurrentPoints([point]);
  }, [getPoint, isEraser, strokes, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) {
      if (isEraser && e.buttons > 0) {
        const point = getPoint(e);
        const threshold = 20;
        const filtered = strokes.filter((s) => {
          return !s.points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < threshold);
        });
        if (filtered.length !== strokes.length) onChange(filtered);
      }
      return;
    }
    e.preventDefault();
    setCurrentPoints((prev) => [...prev, getPoint(e)]);
  }, [isDrawing, isEraser, getPoint, strokes, onChange]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length > 1) {
      onChange([...strokes, { points: currentPoints, color, size }]);
    }
    setCurrentPoints([]);
  }, [isDrawing, currentPoints, strokes, color, size, onChange]);

  function renderStroke(s: Stroke, i: number) {
    const outlinePoints = getStroke(
      s.points.map((p) => [p.x, p.y, p.pressure]),
      { size: s.size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }
    );
    const pathData = getSvgPathFromStroke(outlinePoints);
    return <path key={i} d={pathData} fill={s.color} opacity={0.9} />;
  }

  function renderCurrentStroke() {
    if (currentPoints.length < 2) return null;
    const outlinePoints = getStroke(
      currentPoints.map((p) => [p.x, p.y, p.pressure]),
      { size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }
    );
    const pathData = getSvgPathFromStroke(outlinePoints);
    return <path d={pathData} fill={color} opacity={0.9} />;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 px-1">
        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setIsEraser(false); }}
              className="w-6 h-6 rounded-full transition-transform"
              style={{
                background: c,
                border: color === c && !isEraser ? "2px solid #fff" : "2px solid rgba(255,255,255,0.15)",
                transform: color === c && !isEraser ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Sizes */}
        <div className="flex items-center gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
              style={{ background: size === s ? "rgba(255,255,255,0.1)" : "transparent" }}
            >
              <div className="rounded-full bg-white" style={{ width: Math.min(s + 2, 12), height: Math.min(s + 2, 12) }} />
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Eraser */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
          style={{
            background: isEraser ? "rgba(251,113,133,0.2)" : "rgba(255,255,255,0.05)",
            color: isEraser ? "#fb7185" : "rgba(255,255,255,0.4)",
            border: isEraser ? "1px solid rgba(251,113,133,0.4)" : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Borracha
        </button>

        {/* Clear all */}
        <button
          onClick={() => onChange([])}
          className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors ml-auto"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          Limpar
        </button>
      </div>

      {/* Canvas - scrollable infinite */}
      <div className="flex-1 rounded-xl overflow-y-auto relative" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Lined paper effect */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, rgba(255,255,255,0.12) 31px, rgba(255,255,255,0.12) 32px)",
          backgroundPosition: "0 8px",
        }} />

        <svg
          ref={svgRef}
          className="w-full touch-none"
          style={{ cursor: isEraser ? "crosshair" : "default", height: `${canvasHeight}px` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {strokes.map(renderStroke)}
          {renderCurrentStroke()}
        </svg>
      </div>
    </div>
  );
}
