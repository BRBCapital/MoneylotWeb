"use client";

import React, { useMemo } from "react";
import {
  checkPasswordValidityManual,
  passwordChecklist,
} from "@/lib/password";

export default function PasswordStrengthChecklist({
  password,
}: {
  password: string;
}) {
  const state = useMemo(
    () => checkPasswordValidityManual(password || ""),
    [password]
  );

  return (
    <div className="mt-2">
      {passwordChecklist.map((check) => {
        const passed = state[check.key];
        return (
          <div key={check.key} className="flex items-center mb-2">
            {passed ? (
              <span className="text-green-600 mr-2 text-[12px]">✔</span>
            ) : (
              <span className="text-[#E53935] mr-2 text-[12px]">✱</span>
            )}
            <span
              className={passed ? "text-[#2E2E2E]" : "text-[#E53935]"}
              style={{ fontSize: 12 }}
            >
              {check.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

