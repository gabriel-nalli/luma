"use client";

import { useState, useEffect } from "react";

interface PdfPreviewProps {
  dataUrl: string;
  fileName: string;
}

export default function PdfPreview({ dataUrl, fileName }: PdfPreviewProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          const buffer = await res.arrayBuffer();
          uint8 = new Uint8Array(buffer);
        }

        const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
        const rendered: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          rendered.push(canvas.toDataURL("image/jpeg", 0.8));
          if (cancelled) return;
        }

        if (!cancelled) {
          setPages(rendered);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [dataUrl]);

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

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8" />
        </svg>
        <p className="text-white/30 text-xs">{fileName}</p>
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
