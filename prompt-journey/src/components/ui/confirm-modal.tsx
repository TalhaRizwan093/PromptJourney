"use client";

import { ReactNode } from "react";
import { Button } from "./button";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      button: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      button: "bg-amber-600 hover:bg-amber-700",
    },
    default: {
      icon: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/30",
      button: "bg-violet-600 hover:bg-violet-700",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-2xl border ${styles.border} ${styles.bg} bg-zinc-900 dark:bg-zinc-900 light:bg-white shadow-2xl`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full ${styles.bg} flex items-center justify-center mx-auto mb-4`}>
            <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-center text-zinc-100 dark:text-zinc-100 light:text-zinc-900 mb-2">
            {title}
          </h3>

          {/* Message */}
          <div className="text-center text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mb-6">
            {message}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              className={`flex-1 ${styles.button} text-white`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Please wait..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
