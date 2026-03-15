import React from "react";
import Spinner from "@/components/ui/Spinner";

export default function LoadingOverlay({
  show,
  label = "Loading",
  fullScreen = false,
}: {
  show: boolean;
  label?: string;
  fullScreen?: boolean;
}) {
  if (!show) return null;
  return (
    <div
      className={`${
        fullScreen ? "fixed" : "absolute"
      } inset-0 z-30 flex items-center justify-center bg-white/65 backdrop-blur-[1px]`}
      role="status"
      aria-live="polite"
    >
      <Spinner size={30} label={label} />
    </div>
  );
}

