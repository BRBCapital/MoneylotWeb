"use client";

import React, { useEffect, useState } from "react";

export type ModalProps = {
  open: boolean;
  setClose: React.Dispatch<React.SetStateAction<boolean>>;
  onClosed?: () => void;
  children: React.ReactNode;
  position?: "center" | "right";
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
};

export default function Modal({
  children,
  open,
  setClose,
  onClosed,
  position = "center",
  contentClassName = "",
  contentStyle,
}: ModalProps) {
  const handleCloseModal = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.dataset.target === "closeModalTarget") setClose(false);
  };

  const [shouldRender, setShouldRender] = useState(open);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setIsExiting(false);
      return;
    }

    if (!shouldRender) return;

    setIsExiting(true);
    const t = window.setTimeout(() => {
      setShouldRender(false);
      setIsExiting(false);
      onClosed?.();
    }, 420);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClose(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setClose]);

  if (!shouldRender) return null;

  return (
    <section
      data-target="closeModalTarget"
      onClick={handleCloseModal}
      className={`w-full h-screen fixed top-0 left-0 z-50 bg-[#00000099] flex ${
        isExiting ? "fade-out" : "fade-in"
      } ${
        position === "right"
          ? "justify-end items-start"
          : "justify-center items-center"
      }`}
    >
      <div
        className={`${
          position === "right"
            ? `w-[98%] lg:w-[440px] h-[20vh] max-h-[20vh] bg-white rounded-xl overflow-y-auto mr-4 lg:mr-6 shadow-xl ${
                isExiting ? "slide-out-right" : "slide-in-right"
              }`
            : "w-[98%] lg:w-auto max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden bg-white rounded-xl p-5"
        } ${contentClassName}`}
        style={contentStyle}
      >
        {children}
      </div>
    </section>
  );
}

