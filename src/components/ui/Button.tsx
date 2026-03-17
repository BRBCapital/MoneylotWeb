"use client";

import React, { useState } from "react";

export type ButtonProps = {
  label: string;
  loading?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick: () => void;
  width?: string | number;
  textColor?: string;
  fontSize?: string;
  height?: string | number;
  backgroundColor?: string;
  className?: string;
};

type ButtonDropdownProps = ButtonProps & { children: React.ReactNode };

export function SmPrimary({
  label,
  loading,
  disabled,
  fullWidth,
  height,
  width,
  fontSize = "text-[13px]",
  onClick,
  className,
}: ButtonProps) {
  const cls = `
    ${fullWidth ? "w-full" : ""}
    ${fontSize}
    text-center text-black font-medium px-4 py-2 rounded-lg
  `;

  const isDisabled = disabled || !!loading;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        if (isDisabled) return;
        onClick();
      }}
      className={`${cls} ${className || ""} ${
        disabled
          ? "bg-[#e2f2ef] cursor-not-allowed"
          : loading
            ? "bg-[#89E081]/80 pointer-events-none"
            : "bg-[#89E081] hover:bg-[#89E081]/80"
      } duration-300 cursor-pointer whitespace-nowrap`}
      style={{
        height: height || "35px",
        width: width || (fullWidth ? "100%" : "auto"),
      }}
    >
      {loading ? (
        <div className="flex justify-center items-center gap-x-1.5 text-black/70">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
          {loading}
        </div>
      ) : (
        label
      )}
    </button>
  );
}

export function SmPrimaryDropdown({
  label,
  loading,
  disabled,
  fullWidth,
  onClick,
  children,
  className,
}: ButtonDropdownProps) {
  const [openDropdownMenu, setOpenDropdownMenu] = useState(false);

  const cls = `${fullWidth ? "w-full" : ""} text-[13px] text-center text-black font-medium px-4 py-2 rounded-lg`;
  const isDisabled = disabled || !!loading;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          if (isDisabled) return;
          setOpenDropdownMenu((v) => !v);
          onClick();
        }}
        className={`${cls} ${className || ""} ${
          disabled
            ? "bg-[#e2f2ef] cursor-not-allowed"
            : loading
              ? "bg-[#89E081]/80 pointer-events-none"
              : "bg-[#89E081] hover:bg-[#89E081]/80"
        } duration-300 cursor-pointer whitespace-nowrap`}
      >
        {loading ? loading : label}
      </button>
      {openDropdownMenu ? <>{children}</> : null}
    </div>
  );
}

export function SmSecondary({
  label,
  loading,
  disabled,
  fullWidth,
  height,
  width,
  fontSize = "text-[13px]",
  onClick,
  textColor = "text-black",
  backgroundColor = "bg-[#f2f0f0]",
  className,
}: ButtonProps) {
  const cls = `
    ${fullWidth ? "w-full" : ""}
    ${fontSize}
    text-center font-semibold px-4 py-2 rounded-lg
  `;

  const isDisabled = disabled || !!loading;
  const stateClass = disabled
    ? `${backgroundColor} opacity-60 cursor-not-allowed`
    : loading
      ? `${backgroundColor} opacity-80 pointer-events-none cursor-default`
      : `${backgroundColor} hover:opacity-80 cursor-pointer`;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        if (isDisabled) return;
        onClick();
      }}
      className={`${cls} ${textColor} ${className || ""} ${stateClass} duration-300 whitespace-nowrap`}
      style={{
        height: height || "35px",
        width: width || (fullWidth ? "100%" : "auto"),
      }}
    >
      {loading ? loading : label}
    </button>
  );
}

export function MdPrimary({
  label,
  loading,
  disabled,
  fullWidth,
  onClick,
  textColor = "text-black",
  backgroundColor = "bg-[#89E081]",
  className,
}: ButtonProps) {
  const cls = `${fullWidth ? "w-full" : ""} text-[16.5px] text-center font-semibold px-4 py-3.5 rounded-lg`;
  const isDisabled = disabled || !!loading;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        if (isDisabled) return;
        onClick();
      }}
      className={`${cls} ${textColor} ${className || ""} ${
        disabled
          ? "opacity-60 cursor-not-allowed bg-black/10"
          : loading
            ? `${backgroundColor} opacity-80 pointer-events-none`
            : `${backgroundColor} hover:opacity-80`
      } duration-300 cursor-pointer whitespace-nowrap`}
    >
      {loading ? loading : label}
    </button>
  );
}

export function MdSecondary({
  label,
  loading,
  disabled,
  fullWidth,
  onClick,
  className,
}: ButtonProps) {
  const cls = `${fullWidth ? "w-full" : ""} text-[16.5px] text-center text-black font-semibold px-4 py-3.5 rounded-lg`;
  const isDisabled = disabled || !!loading;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        if (isDisabled) return;
        onClick();
      }}
      className={`${cls} ${className || ""} ${
        disabled
          ? "bg-[#e2f2ef] cursor-not-allowed"
          : loading
            ? "bg-[#f2f0f0] opacity-80 pointer-events-none"
            : "bg-[#f2f0f0] hover:opacity-80"
      } duration-300 cursor-pointer whitespace-nowrap`}
    >
      {loading ? loading : label}
    </button>
  );
}

const Button = {
  SmPrimary,
  SmPrimaryDropdown,
  SmSecondary,
  MdPrimary,
  MdSecondary,
};

export default Button;

