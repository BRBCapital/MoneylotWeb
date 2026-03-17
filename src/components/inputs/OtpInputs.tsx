"use client";

import React, { useEffect, useRef } from "react";

export type OtpInputsProps = {
  length?: number;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  onEnter?: (value: string) => void;
  secure?: boolean;
  resetKey?: string | number;
};

export default function OtpInputs({
  length = 6,
  onChange,
  onComplete,
  onEnter,
  secure = false,
  resetKey,
}: OtpInputsProps) {
  const inputArray = Array.from({ length }, (_, i) => i);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const getAllValues = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const parent = (event.target as HTMLInputElement).parentElement;
    if (!parent) return "";
    const children = Array.from(parent.querySelectorAll("input"));
    const value = children.map((el) => (el as HTMLInputElement).value).join("");
    onChange?.(value);
    if (value.length === length) onComplete?.(value);
    return value;
  };

  const handleInputs = (event: React.FormEvent<HTMLInputElement>, index: number) => {
    const target = event.currentTarget;
    let value = target.value;
    value = value.replace(/[^0-9]/g, "");
    target.value = value;

    const next = target.nextElementSibling as HTMLInputElement | null;
    const prev = target.previousElementSibling as HTMLInputElement | null;

    if (value.length > 0 && index < length - 1) next?.focus();
    else if (value.length === 0 && index > 0) prev?.focus();

    // rebuild full value
    getAllValues(event as any);
  };

  const handleOnKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // Allow stepping backwards even when current field is empty
    // (e.g. user has entered 1-3 digits and focus is on the next empty box).
    if (event.key === "Backspace") {
      const target = event.currentTarget;
      if (!target.value && index > 0) {
        event.preventDefault();
        const prev = target.previousElementSibling as HTMLInputElement | null;
        if (prev) {
          prev.value = "";
          prev.focus();
          const parent = prev.parentElement;
          const inputs = parent
            ? (Array.from(parent.querySelectorAll("input")) as HTMLInputElement[])
            : [];
          const value = inputs.map((el) => el.value).join("");
          onChange?.(value);
        }
      }
    }

    if (event.key !== "Enter") return;
    if (index !== length - 1) return;
    const value = getAllValues(event as any);
    if (value.length !== length) return;
    onEnter?.(value);
  };

  useEffect(() => {
    if (resetKey == null) return;
    const el = wrapRef.current;
    if (!el) return;
    const inputs = Array.from(el.querySelectorAll("input")) as HTMLInputElement[];
    inputs.forEach((i) => (i.value = ""));
    onChange?.("");
    inputs[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const handleOnPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/[^0-9]/g, "");
    const parent = event.currentTarget.parentElement;
    if (!parent) return;
    const inputs = Array.from(parent.querySelectorAll("input")) as HTMLInputElement[];

    inputs.forEach((input, i) => {
      if (!pasted[i]) return;
      input.value = pasted[i];
    });

    const lastFilled = inputs[Math.min(pasted.length, length) - 1];
    lastFilled?.focus();

    // fire callbacks
    const value = inputs.map((el) => el.value).join("");
    onChange?.(value);
    if (value.length === length) onComplete?.(value);
  };

  const multipleInputStyle =
    "inline-block w-[52px] h-[52px] md:w-[56px] md:h-[56px] text-center text-[18px] font-semibold text-black caret-black outline-0 duration-200 bg-white border border-[#E6E6E6] focus:border-[#89E081] rounded-[10px]";

  return (
    <div className="flex justify-center gap-4 md:gap-5" ref={wrapRef}>
      {inputArray.map((_, index) => (
        <input
          key={index}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          className={multipleInputStyle}
          style={
            secure
              ? ({
                  WebkitTextSecurity: "disc",
                } as React.CSSProperties)
              : undefined
          }
          onKeyDown={(e) => handleOnKeyDown(e, index)}
          onInput={(e) => handleInputs(e, index)}
          onPaste={handleOnPaste}
        />
      ))}
    </div>
  );
}

