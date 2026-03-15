export type PasswordValidationState = {
  length: boolean;
  upperCase: boolean;
  lowerCase: boolean;
  number: boolean;
  specialCharacter: boolean;
  noSpaces: boolean;
};

/**
 * Ported from `moneylot-portal-v1/helpers/formInputValidator.tsx`
 */
export function checkPasswordValidity(
  inputValue: string,
  customErrorText?: string
): true | string {
  if (!inputValue || typeof inputValue !== "string") {
    return customErrorText || "Password is required";
  }
  if (!inputValue.match(/[A-Z]/)) {
    return customErrorText || "Password must contain at least one uppercase letter";
  }
  if (/\s/.test(inputValue)) {
    return customErrorText || "Password cannot contain spaces";
  }
  if (!inputValue.match(/[a-z]/)) {
    return customErrorText || "Password must contain at least one lowercase letter";
  }
  if (!inputValue.match(/[0-9]/)) {
    return customErrorText || "Password must contain at least one number";
  }
  if (!inputValue.match(/[!@#$%^&*(),.?\":{}|<>]/)) {
    return customErrorText || "Password must contain at least one special character";
  }
  if (inputValue.length < 8) {
    return customErrorText || "Password must be at least 8 characters long";
  }
  return true;
}

/**
 * Ported from `moneylot-portal-v1/helpers/formInputValidator.tsx`
 * Returns a boolean map so UI can show a live checklist.
 */
export function checkPasswordValidityManual(inputValue: string): PasswordValidationState {
  return {
    upperCase: /[A-Z]/.test(inputValue),
    lowerCase: /[a-z]/.test(inputValue),
    number: /[0-9]/.test(inputValue),
    specialCharacter: /[!@#$%^&*(),.?\":{}|<>]/.test(inputValue),
    length: (inputValue || "").length >= 8,
    noSpaces: !/\s/.test(inputValue),
  };
}

export const passwordChecklist = [
  { key: "length", label: "Must contain at least 8 characters" },
  { key: "upperCase", label: "Upper case character" },
  { key: "lowerCase", label: "Lower case character" },
  { key: "number", label: "Number" },
  { key: "specialCharacter", label: "Special character" },
  { key: "noSpaces", label: "No spaces allowed" },
] as const satisfies ReadonlyArray<{ key: keyof PasswordValidationState; label: string }>;

