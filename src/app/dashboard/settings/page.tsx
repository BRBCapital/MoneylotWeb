"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import DashboardShell from "@/components/templates/dashboard/DashboardShell";
import Button from "@/components/ui/Button";
import { PasswordField } from "@/components/molecules/forms/Field";
import PasswordStrengthChecklist from "@/components/molecules/auth/PasswordStrengthChecklist";
import EnterCurrentPinModal from "@/components/modals/EnterCurrentPinModal";
import ChangeTransactionPinModal from "@/components/modals/ChangeTransactionPinModal";
import OtpModal from "@/components/modals/OtpModal";
import DeleteAccountModal from "@/components/modals/DeleteAccountModal";
import { showErrorToast, showSuccessToast } from "@/state/toastState";
import { webGenerateOtp } from "@/services/otp";
import { resetPin, updatePin, validatePin } from "@/services/pin";
import { ApiError } from "@/lib/apiClient";
import { changePassword } from "@/services/webinvestment";
import { authSessionAtom, userEmailAtom } from "@/state/appState";
import { useAtomValue } from "jotai";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import {
  checkPasswordValidity,
  checkPasswordValidityManual,
} from "@/lib/password";

type Tab = "password" | "pin" | "help";

function TabButton({
  active,
  label,
  onClick,
  iconActiveSrc,
  iconInactiveSrc,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  iconActiveSrc: string;
  iconInactiveSrc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-2 text-[11px] font-medium transition-colors ${
        active ? "text-[#89E081]" : "text-[#9A9A9A]"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        <Image
          src={active ? iconActiveSrc : iconInactiveSrc}
          alt=""
          width={14}
          height={14}
          className={`h-[14px] w-[14px] ${active ? "" : "opacity-50"}`}
        />
        {label}
      </span>
      {active ? (
        <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#89E081]" />
      ) : null}
    </button>
  );
}

function SupportRow({
  title,
  subtitle,
  iconSrc,
  onClick,
}: {
  title: string;
  subtitle: string;
  iconSrc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors"
    >
      <div className="flex items-start gap-3">
        <Image
          src={iconSrc}
          alt=""
          width={24}
          height={24}
          className="mt-0.5 h-[24px] w-[24px] shrink-0"
        />
        <div>
          <p className="text-[11px] font-medium text-[#2E2E2E] leading-4">
            {title}
          </p>
          <p className="mt-0.5 text-[10px] text-[#979797] leading-4">
            {subtitle}
          </p>
        </div>
      </div>
      <span className="text-[#5F6368]">›</span>
    </button>
  );
}

function RowAction({
  label,
  onClick,
  leftIconSrc,
  leftIconAlt,
}: {
  label: string;
  onClick: () => void;
  leftIconSrc?: string;
  leftIconAlt?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors"
    >
      <div className="flex items-center gap-2">
        {leftIconSrc ? (
          <Image
            src={leftIconSrc}
            alt={leftIconAlt || ""}
            width={20}
            height={20}
            className="h-5 w-5"
          />
        ) : (
          <span className="h-2 w-2 rounded-full bg-[#89E081]" />
        )}
        <span className="text-[11px] font-medium text-[#2E2E2E]">{label}</span>
      </div>
      <span className="text-[#5F6368]">›</span>
    </button>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("password");
  const userEmail = useAtomValue(userEmailAtom);
  const session = useAtomValue(authSessionAtom);
  const userId = session?.userId ?? null;
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // Password settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(
    null,
  );

  const passwordMismatch =
    Boolean(newPassword.trim()) &&
    Boolean(confirmPassword.trim()) &&
    newPassword !== confirmPassword;
  const passwordMeetsRequirements = (() => {
    const state = checkPasswordValidityManual(newPassword || "");
    return Object.values(state).every(Boolean);
  })();

  const canSavePassword = (() => {
    if (!currentPassword.trim()) return false;
    if (!newPassword.trim() || !confirmPassword.trim()) return false;
    if (passwordMismatch) return false;
    if (!passwordMeetsRequirements) return false;
    return true;
  })();

  // PIN settings modals
  const [enterCurrentOpen, setEnterCurrentOpen] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [changePinCurrentPin, setChangePinCurrentPin] = useState<string>("");
  const [resetPinOpen, setResetPinOpen] = useState(false);
  const [resetNewPinOpen, setResetNewPinOpen] = useState(false);
  const [resetOtp, setResetOtp] = useState<string>("");
  const [resetOtpSending, setResetOtpSending] = useState(false);
  const [resetOtpError, setResetOtpError] = useState<string | null>(null);
  const otpSentRef = useRef(false);

  useEffect(() => {
    if (!resetPinOpen) {
      otpSentRef.current = false;
      setResetOtpError(null);
      setResetOtpSending(false);
      return;
    }

    if (otpSentRef.current) return;
    otpSentRef.current = true;
    (async () => {
      try {
        setResetOtpError(null);
        setResetOtpSending(true);
        const e = (userEmail || "").trim();
        if (!e) throw new Error("Missing email. Please login again and retry.");
        const res = await webGenerateOtp(e, 10);
        console.log("[Settings] otp/web-generate-otp response:", res);
        showSuccessToast(
          "Success",
          res?.message || "OTP generated successfully",
        );
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Unable to send OTP. Please try again.";
        setResetOtpError(msg);
        showErrorToast("Error", msg);
      } finally {
        setResetOtpSending(false);
      }
    })();
  }, [resetPinOpen, userEmail]);

  useEffect(() => {
    if (resetNewPinOpen) return;
    // If user closes the reset flow before completion, force restart next time.
    setResetOtp("");
  }, [resetNewPinOpen]);

  return (
    <DashboardShell>
      <div className="w-full max-w-[980px]">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[18px] font-semibold text-[#2E2E2E]">Settings</h1>
          <Button.SmSecondary
            label="Delete Account"
            height={34}
            width={140}
            fontSize="text-[11px]"
            className="rounded-[8px] font-medium"
            onClick={() => {
              setDeleteAccountOpen(true);
            }}
          />
        </div>

        <div className="mt-3 flex items-center gap-5 border-b border-[#EEEEEE]">
          <TabButton
            active={tab === "password"}
            label="Password Settings"
            iconActiveSrc={imagesAndIcons.passwordActive}
            iconInactiveSrc={imagesAndIcons.passwordInactive}
            onClick={() => setTab("password")}
          />
          <TabButton
            active={tab === "pin"}
            label="PIN Settings"
            iconActiveSrc={imagesAndIcons.pinActive}
            iconInactiveSrc={imagesAndIcons.pinInactive}
            onClick={() => setTab("pin")}
          />
          <TabButton
            active={tab === "help"}
            label="Help & Support"
            iconActiveSrc={imagesAndIcons.helpActive}
            iconInactiveSrc={imagesAndIcons.helpInactive}
            onClick={() => setTab("help")}
          />
        </div>

        {tab === "password" ? (
          <div className="mt-5 rounded-[10px] border border-black/10 bg-white overflow-hidden">
            <div className="px-6 py-4">
              <p className="text-[14px] font-semibold text-[#2E2E2E]">
                Change Password
              </p>
            </div>
            <div className="h-px w-full bg-[#EEEEEE]" />
            <div className="px-6 py-6">
              {changePasswordError ? (
                <div className="mb-4 rounded-[10px] border border-[#F2C6C6] bg-[#FFF5F5] px-4 py-3 text-[12px] text-[#D32F2F]">
                  {changePasswordError}
                </div>
              ) : null}
              <div className="w-full">
                <PasswordField
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  autoComplete="current-password"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <PasswordField
                  label="Create New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                />
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-medium text-[#5F6368]">
                  Password requirements
                </p>
                <PasswordStrengthChecklist password={newPassword} />
                {passwordMismatch ? (
                  <p className="mt-2 text-[11px] font-bold text-[#E53935]">
                    password mismatch
                  </p>
                ) : null}
              </div>

              <div className="mt-6 flex justify-end">
                <Button.SmPrimary
                  label="Save Update"
                  width={150}
                  height={34}
                  fontSize="text-[11px]"
                  loading={changePasswordLoading ? "Please wait" : undefined}
                  disabled={!canSavePassword || changePasswordLoading}
                  onClick={async () => {
                    setChangePasswordError(null);
                    if (passwordMismatch) {
                      showErrorToast("Error", "password mismatch");
                      return;
                    }
                    const validity = checkPasswordValidity(newPassword || "");
                    if (validity !== true) {
                      const msg =
                        typeof validity === "string"
                          ? validity
                          : "Invalid password";
                      showErrorToast("Error", msg);
                      return;
                    }
                    try {
                      setChangePasswordLoading(true);
                      const res = await changePassword({
                        currentPassword,
                        newPassword,
                        confirmPassword,
                      });
                      console.log(
                        "[Settings] webinvestment/change-password response:",
                        res,
                      );
                      showSuccessToast(
                        "Success",
                        res?.message || "Password updated",
                      );
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    } catch (e) {
                      const msg =
                        e instanceof ApiError
                          ? e.message
                          : e instanceof Error
                            ? e.message
                            : "Unable to change password. Please try again.";
                      setChangePasswordError(msg);
                      showErrorToast("Error", msg);
                    } finally {
                      setChangePasswordLoading(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ) : tab === "pin" ? (
          <div className="mt-5 rounded-[10px] border border-black/10 bg-white overflow-hidden">
            <div className="px-6 py-4">
              <p className="text-[12px] font-semibold text-[#2E2E2E]">
                Transaction PIN
              </p>
            </div>
            <div className="h-px w-full bg-[#EEEEEE]" />
            <div className="divide-y divide-[#EEEEEE]">
              <RowAction
                label="Change Transaction PIN"
                leftIconSrc={imagesAndIcons.keyIcon}
                leftIconAlt="PIN"
                onClick={() => setEnterCurrentOpen(true)}
              />
              <RowAction
                label="Reset Transaction PIN"
                leftIconSrc={imagesAndIcons.keyIcon}
                leftIconAlt="PIN"
                onClick={() => {
                  setResetOtp("");
                  setResetOtpError(null);
                  setResetNewPinOpen(false);
                  setResetPinOpen(true);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[10px] border border-black/10 bg-white overflow-hidden">
            <div className="px-6 py-4">
              <p className="text-[12px] font-semibold text-[#2E2E2E]">
                Help & Support
              </p>
            </div>
            <div className="h-px w-full bg-[#EEEEEE]" />
            <div className="divide-y divide-[#EEEEEE]">
              <SupportRow
                title="Visit Us"
                subtitle="Plot 3A Shakiru Anjorin Street, Lekki Phase 1, Lagos."
                iconSrc={imagesAndIcons.visitUs}
                onClick={() => console.log("Visit Us clicked")}
              />
              <SupportRow
                title="Chat With Us"
                subtitle="Need help? Our support team is on standby."
                iconSrc={imagesAndIcons.chatWithUs}
                onClick={() => console.log("Chat With Us clicked")}
              />
              <SupportRow
                title="Email"
                subtitle="hello@moneylot.com"
                iconSrc={imagesAndIcons.email}
                onClick={() => console.log("Email clicked")}
              />
              <SupportRow
                title="Visit our Website"
                subtitle="www.moneylot.com"
                iconSrc={imagesAndIcons.website}
                onClick={() => console.log("Website clicked")}
              />
            </div>
          </div>
        )}

        <EnterCurrentPinModal
          open={enterCurrentOpen}
          setOpen={setEnterCurrentOpen}
          onProceed={async (pin) => {
            const res = await validatePin({ pin });
            console.log("[Settings] pin/validate-pin response:", res);
            setChangePinCurrentPin(pin);
            setChangePinOpen(true);
          }}
        />

        <ChangeTransactionPinModal
          open={changePinOpen}
          setOpen={setChangePinOpen}
          onVerified={async (newPin, confirmNewPin) => {
            if (!changePinCurrentPin || changePinCurrentPin.length !== 4) {
              throw new Error("Missing current PIN. Please restart the flow.");
            }
            if (newPin !== confirmNewPin) {
              throw new Error("PINs do not match. Please re-enter.");
            }
            const res = await updatePin({
              currentPin: changePinCurrentPin,
              newPin,
            });
            console.log("[Settings] pin/update response:", res);
            showSuccessToast(
              "Success",
              res?.message || "Transaction PIN updated",
            );
            setChangePinCurrentPin("");
          }}
        />

        <OtpModal
          open={resetPinOpen}
          setOpen={setResetPinOpen}
          headerText="Reset PIN"
          confirmLabel="Continue"
          isLoading={resetOtpSending}
          error={resetOtpError}
          onResend={async () => {
            try {
              setResetOtpError(null);
              setResetOtpSending(true);
              const e = (userEmail || "").trim();
              if (!e)
                throw new Error("Missing email. Please login again and retry.");
              const res = await webGenerateOtp(e, 10);
              console.log(
                "[Settings] otp/web-generate-otp (resend) response:",
                res,
              );
              showSuccessToast("Success", "OTP resent successfully");
            } catch (e) {
              const msg =
                e instanceof ApiError
                  ? e.message
                  : e instanceof Error
                    ? e.message
                    : "Unable to send OTP. Please try again.";
              setResetOtpError(msg);
              showErrorToast("Error", msg);
            } finally {
              setResetOtpSending(false);
            }
          }}
          onConfirm={async (otp) => {
            try {
              setResetOtpError(null);
              setResetOtpSending(true);
              const e = (userEmail || "").trim();
              if (!e)
                throw new Error("Missing email. Please login again and retry.");
              const code = (otp || "").trim();
              if (code.length !== 6) throw new Error("Enter a valid OTP.");
              setResetOtp(otp);
              setResetPinOpen(false);
              setResetNewPinOpen(true);
            } catch (e) {
              const msg =
                e instanceof ApiError
                  ? e.message
                  : e instanceof Error
                    ? e.message
                    : "Invalid OTP. Please try again.";
              setResetOtpError(msg);
              showErrorToast("Error", msg);
            } finally {
              setResetOtpSending(false);
            }
          }}
        />

        <ChangeTransactionPinModal
          open={resetNewPinOpen}
          setOpen={setResetNewPinOpen}
          title="Reset Transaction PIN"
          onVerified={async (pin, pinConfirmation) => {
            if (!resetOtp || resetOtp.length !== 6) {
              throw new Error("Missing OTP. Please restart reset flow.");
            }
            const res = await resetPin({ otp: resetOtp, pin, pinConfirmation });
            console.log("[Settings] pin/reset-pin response:", res);
            showSuccessToast(
              "Success",
              res?.message || "Transaction PIN reset successfully",
            );
            setResetOtp("");
          }}
        />

        <DeleteAccountModal
          open={deleteAccountOpen}
          setOpen={setDeleteAccountOpen}
          onSubmit={async ({ reason, comment, disableInstead }) => {
            console.log("[Settings] delete account request:", {
              reason,
              comment,
              disableInstead,
            });
            showSuccessToast(
              "Success",
              disableInstead
                ? "Account disable request submitted"
                : "Account delete request submitted",
            );
          }}
        />
      </div>
    </DashboardShell>
  );
}
