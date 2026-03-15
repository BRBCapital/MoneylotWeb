"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { SelectField } from "@/components/molecules/forms/Field";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { ApiError } from "@/lib/apiClient";
import { uploadToFilestackS3 } from "@/services/filestack";
import { getIdentityTypes, verifyNin } from "@/services/verification";
import { showErrorToast, showSuccessToast } from "@/state/toastState";

type IdentityVerificationModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onProceed?: (data: { typeId: number; nin: string; file: File }) => void | Promise<void>;
};

export default function IdentityVerificationModal({
  open,
  setOpen,
  onProceed,
}: IdentityVerificationModalProps) {
  const [documentType, setDocumentType] = useState(""); // typeId as string
  const [idNumber, setIdNumber] = useState(""); // nin
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [identityTypesLoading, setIdentityTypesLoading] = useState(false);
  const [identityTypesError, setIdentityTypesError] = useState<string | null>(null);
  const [identityTypes, setIdentityTypes] = useState<Array<{ id: number; name: string }>>([]);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const uploadSeqRef = useRef(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canProceed = useMemo(() => {
    if (!documentType) return false;
    if (!idNumber.trim()) return false;
    if (!uploadedUrl) return false;
    return true;
  }, [documentType, idNumber, uploadedUrl]);

  function validateNin(ninRaw: string): string | null {
    const nin = (ninRaw || "").trim();
    if (!nin) return "Enter your NIN";
    if (/[^0-9]/.test(nin)) return "NIN must contain only digits";
    if (nin.length !== 11) return "NIN must be 11 digits";
    return null;
  }

  const startUpload = async (file: File) => {
    setUploadError(null);
    setSubmitError(null);
    setUploading(true);
    setUploadedUrl(null);
    const seq = ++uploadSeqRef.current;
    try {
      const { url } = await uploadToFilestackS3(file);
      if (uploadSeqRef.current !== seq) return; // ignore stale uploads
      setUploadedUrl(url);
      showSuccessToast("Success", "Document uploaded");
    } catch (e) {
      if (uploadSeqRef.current !== seq) return;
      if (e instanceof ApiError) setUploadError(e.message);
      else if (e instanceof Error) setUploadError(e.message);
      else setUploadError("Unable to upload document. Please try again.");
    } finally {
      if (uploadSeqRef.current === seq) setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
        void startUpload(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
        void startUpload(file);
      }
    }
  };

  const isValidFileType = (file: File): boolean => {
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    return validTypes.includes(file.type);
  };

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    (async () => {
      try {
        setIdentityTypesError(null);
        setIdentityTypesLoading(true);
        const res = await getIdentityTypes(ac.signal);
        if (Array.isArray(res.data)) setIdentityTypes(res.data);
        else setIdentityTypes([]);
      } catch (e) {
        if (e instanceof ApiError) setIdentityTypesError(e.message);
        else if (e instanceof Error) setIdentityTypesError(e.message);
        else setIdentityTypesError("Unable to load identity types");
      } finally {
        setIdentityTypesLoading(false);
      }
    })();
    return () => ac.abort();
  }, [open]);

  const identityOptions = useMemo(
    () => identityTypes.map((t) => ({ label: t.name, value: String(t.id) })),
    [identityTypes]
  );

  const resetForm = () => {
    setDocumentType("");
    setIdNumber("");
    setSelectedFile(null);
    setDragActive(false);
    setUploading(false);
    setUploadError(null);
    setUploadedUrl(null);
    setSubmitError(null);
    setIsSubmitting(false);
  };

  const handleProceed = async () => {
    const nin = idNumber.trim();
    console.log("[Identity] proceed clicked", {
      documentType,
      ninLen: nin.length,
      fileName: selectedFile?.name || null,
      fileType: selectedFile?.type || null,
      fileSize: selectedFile?.size || null,
    });
    if (!uploadedUrl) {
      setSubmitError(uploading ? "Uploading document..." : "Upload a document");
      return;
    }
    const typeId = Number(documentType);
    if (!Number.isFinite(typeId) || typeId <= 0) {
      setSubmitError("Select a valid identity type");
      return;
    }
    const ninErr = validateNin(nin);
    if (ninErr) {
      setSubmitError(ninErr);
      showErrorToast("Error", ninErr);
      return;
    }
    setSubmitError(null);
    try {
      setIsSubmitting(true);
      const payload = { typeId, nin, ninUrl: uploadedUrl };
      console.log("[Identity] filestack upload url:", uploadedUrl);
      console.log("[Identity] verify-NIN payload:", payload);

      if (onProceed) {
        // keep callback compatibility with local file
        if (!selectedFile) throw new Error("Missing file");
        await onProceed({ typeId, nin, file: selectedFile });
      } else {
        const res = await verifyNin(payload);
        console.log("[Identity] verify-NIN response:", res);
      }

      showSuccessToast("Success", "Identity verification submitted");
      resetForm();
      setOpen(false);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Unable to verify identity. Please try again.";
      setSubmitError(msg);
      showErrorToast("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = () => {
    uploadSeqRef.current += 1; // invalidate any in-flight upload
    setSelectedFile(null);
    setUploadedUrl(null);
    setUploadError(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Modal open={open} setClose={setOpen} position="center" contentClassName="p-0">
      <div className="w-[92vw] max-w-[550px] bg-white rounded-[10px] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-[#2E2E2E]">
            Identity Verification
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-[#F8F8F8] rounded transition-colors"
            aria-label="Close"
          >
            <Image
              src={imagesAndIcons.closeModal}
              alt="Close"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </button>
        </div>

        <div className="space-y-4">
          {/* Valid ID */}
          <div>
            <SelectField
              label="Valid ID"
              placeholder="Select document"
              value={documentType}
              onChange={setDocumentType}
              options={identityOptions}
            />
            {identityTypesLoading ? (
              <p className="mt-2 text-[11px] text-[#5F6368]">Loading identity types...</p>
            ) : null}
            {identityTypesError ? (
              <p className="mt-2 text-[11px] text-[#E53935]">{identityTypesError}</p>
            ) : null}
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-[12px] font-medium text-[#2E2E2E] mb-2">
              NIN
            </label>
            <input
              type="text"
              value={idNumber}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              onChange={(e) => {
                setIdNumber(e.target.value);
                setSubmitError(null);
              }}
              placeholder="Enter NIN"
              className="w-full h-[42px] px-4 border border-[#E9E9E9] rounded-[8px] text-[13px] text-[#2E2E2E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#89E081] focus:border-transparent"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-[12px] font-medium text-[#2E2E2E] mb-2">
              Upload Document
            </label>
            {selectedFile ? (
              <div className="border border-[#89E081] rounded-[8px] p-4 bg-[#5FCE551A]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Image
                      src={imagesAndIcons.upload}
                      alt="File"
                      width={20}
                      height={20}
                      className="w-5 h-5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#2E2E2E] truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-[#5F6368]">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      {uploading ? (
                        <p className="mt-1 text-[10px] text-[#5F6368]">Uploading...</p>
                      ) : uploadedUrl ? (
                        <p className="mt-1 text-[10px] text-[#2E2E2E]">Uploaded</p>
                      ) : uploadError ? (
                        <p className="mt-1 text-[10px] text-[#E53935]">{uploadError}</p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="ml-2 text-[#EB001B] hover:text-[#C7001A] text-[12px] font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#E9E9E9] rounded-[8px] p-8 text-center cursor-pointer hover:border-[#89E081] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <Image
                    src={imagesAndIcons.upload}
                    alt="Upload"
                    width={32}
                    height={32}
                    className="w-8 h-8 opacity-60"
                  />
                  <div>
                    <p className="text-[12px] text-[#2E2E2E] font-medium">
                      Drag and drop file here or{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-[#89E081] font-semibold hover:opacity-80"
                      >
                        choose file
                      </button>
                    </p>
                    <p className="text-[10px] text-[#5F6368] mt-1">
                      PDF, JPG, PNG
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button.SmSecondary
              label="Cancel"
              height={38}
              width={100}
              fontSize="text-[12px]"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            />
            <Button.SmPrimary
              label="Proceed"
              height={38}
              width={100}
              fontSize="text-[12px]"
              loading={isSubmitting ? "Please wait" : undefined}
              onClick={handleProceed}
              disabled={!canProceed || isSubmitting}
            />
          </div>

          <div className="min-h-[16px]">
            {submitError ? (
              <p className="text-[11px] text-[#E53935]">{submitError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
