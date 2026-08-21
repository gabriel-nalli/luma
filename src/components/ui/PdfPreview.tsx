"use client";

import { useState, useEffect, useRef } from "react";

interface PdfPreviewProps {
  dataUrl: string;
  fileName: string;
}

export default function PdfPreview({ dataUrl, fileName }: PdfPreviewProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [missing, setMissing] = useState(false);
  const attemptedRef = useRef(false);

  // Detect mobile
  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    // Reset on dataUrl change
    attemptedRef.current = false;
    setPages([]);
    setLoading(true);
    setError(false);
    setMissing(false);
  }, [dataUrl]);

  useEffect(() => {
    if (attemptedRef.current || !dataUrl) return;
    attemptedRef.current = true;

    let cancelled = false;

    async function render() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        let uint8: Uint8Array;
        if (dataUrl.startsWith("data:")) {
          const base64 = dataUrl.split(",")[1];
          const binary = atob(base64);
          uint8 = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i);
        } else {
          const res = await fetch(dataUrl);
          if (!res.ok) {
            if (res.status === 400 || res.status === 404) setMissing(true);
            throw new Error(`fetch failed: ${res.status}`);
          }
          const buffer = await res.arrayBuffer();
          uint8 = new Uint8Array(buffer);
        }

        const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
        const rendered: string[] = [];
        // Mobile: only first page. Desktop: up to 10
        const maxPages = isMobile ? Math.min(pdf.numPages, 2) : Math.min(pdf.numPages, 10);

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const scale = isMobile ? 1.0 : 1.2;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          rendered.push(canvas.toDataURL("image/jpeg", 0.6));
          canvas.width = 0;
          canvas.height = 0;
          if (cancelled) return;
        }

        if (!cancelled) {
          setPages(rendered);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [dataUrl, isMobile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          Carregando PDF...
        </div>
      </div>
    );
  }

  // Fallback: show placeholder with "Abrir PDF" button
  if (error || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8" />
        </svg>
        <p className="text-white/30 text-xs">{fileName}</p>
        {missing ? (
          <p className="text-[11px] text-amber-300/80 text-center px-4">Arquivo nao encontrado no servidor. Apague este slide e envie o PDF de novo.</p>
        ) : (
          <p className="text-[11px] text-white/30 text-center px-4">Nao deu pra renderizar a previa aqui.</p>
        )}
        {dataUrl.startsWith("http") && !missing && (
          <a href={dataUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
            Abrir PDF
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto rounded-lg">
      {pages.map((src, i) => (
        <img key={i} src={src} alt={`Pagina ${i + 1}`} className="w-full rounded" />
      ))}
      <p className="text-center text-[10px] text-white/30 py-2">{pages.length} pagina{pages.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
