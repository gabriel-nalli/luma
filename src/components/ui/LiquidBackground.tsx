"use client";

import { useEffect, useRef } from "react";

class Blob {
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;

  constructor(width: number, height: number) {
    this.radius = Math.random() * 150 + 100;
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    const colors = ["#4c1d95", "#6d28d9", "#1e1b4b", "#312e81", "#7c3aed", "#3b0764"];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(width: number, height: number, mouse: { x?: number; y?: number }) {
    this.x += this.vx;
    this.y += this.vy;

    if (mouse.x !== undefined && mouse.y !== undefined) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 400) {
        this.x += dx * 0.01;
        this.y += dy * 0.01;
      }
    }

    if (this.x < -this.radius) this.x = width + this.radius;
    if (this.x > width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = height + this.radius;
    if (this.y > height + this.radius) this.y = -this.radius;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

export default function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const mouseRef = useRef<{ x?: number; y?: number }>({});
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function createBlobs() {
      blobsRef.current = [];
      for (let i = 0; i < 8; i++) {
        blobsRef.current.push(new Blob(canvas!.width, canvas!.height));
      }
    }

    function animate() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.fillStyle = "#0f0c1b";
      ctx!.fillRect(0, 0, w, h);

      for (const blob of blobsRef.current) {
        blob.update(w, h, mouseRef.current);
        blob.draw(ctx!);
      }

      animRef.current = requestAnimationFrame(animate);
    }

    function handleMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    function handleTouch(e: TouchEvent) {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }

    resize();
    createBlobs();
    animate();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("touchmove", handleTouch);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchmove", handleTouch);
    };
  }, []);

  return (
    <>
      {/* SVG Goo Filter */}
      <svg style={{ position: "absolute", visibility: "hidden", width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 80 -20" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Liquid canvas */}
      <div
        className="fixed inset-0 z-0"
        style={{ filter: "url(#goo)", background: "#0f0c1b" }}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      {/* Glass overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: "rgba(15, 12, 27, 0.45)",
          backdropFilter: "blur(50px) saturate(110%)",
          WebkitBackdropFilter: "blur(50px) saturate(110%)",
        }}
      />
    </>
  );
}
