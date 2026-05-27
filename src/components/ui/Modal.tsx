"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  fullscreen?: boolean;
}

export default function Modal({ open, onClose, children, fullscreen = false }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#0f0c1b" }}>
        <div className="flex-1 flex flex-col p-5 pb-6 overflow-y-auto">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(15,12,27,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "rgba(30,20,50,0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(32px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
