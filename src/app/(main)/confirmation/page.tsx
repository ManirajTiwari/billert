"use client";

import React from "react";

export interface ConfirmationModalProps {
  title?: string;
  description?: React.ReactNode;
  cancelLabel?: string;
  continueLabel?: string;
  isOpen?: boolean;
  isLoading?: boolean;
  onCancel?: () => void;
  onContinue?: () => void;
}

export function ConfirmationModal({
  title = "Confirmation Required",
  description = "Are you sure you want to proceed?",
  cancelLabel = "Cancel",
  continueLabel = "Continue",
  isOpen = true,
  isLoading = false,
  onCancel,
  onContinue,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md rounded-3xl border-2 border-gray-900 bg-white p-6 shadow-2xl transition-all md:p-8">
        {/* Title / Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900 md:text-2xl">
            {title}
          </h2>
        </div>

        {/* Description Body */}
        <div className="my-6 text-center">
          <div className="text-base font-medium text-gray-700 md:text-lg">
            {description}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-2xl border-2 border-gray-900 bg-white px-5 py-2.5 text-sm font-bold uppercase text-gray-900 transition hover:bg-gray-100 active:scale-95 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={isLoading}
            className="flex-1 rounded-2xl border-2 border-gray-900 bg-gray-900 px-5 py-2.5 text-sm font-bold uppercase text-white transition hover:bg-gray-800 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;