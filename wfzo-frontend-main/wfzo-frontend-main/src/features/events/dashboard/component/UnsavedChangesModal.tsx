'use client';

import { useEffect } from 'react';
import { X, Info } from 'lucide-react';
import GoldButton from '@/shared/components/GoldButton';
import LightButton from '@/shared/components/LightButton';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDraft?: () => void;
  onExitWithoutSaving?: () => void;


   primaryAction?: {
    label: string;
    onClick: () => void;
  };

  secondaryAction?: {
    label: string;
    onClick: () => void;
  };


}

export default function UnsavedChangesModal({
  isOpen,
  onClose,
  onSaveDraft,
  onExitWithoutSaving,
  primaryAction,
  secondaryAction
}: UnsavedChangesModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white rounded-2xl w-full max-w-[440px] p-6 shadow-wfzo flex gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* INFO ICON */}
        <div className="flex-shrink-0">
          <Info className="w-6 h-6 text-[#C28E2C]" strokeWidth={2.5} />
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Title + Close */}
          <div className="flex items-center justify-between">
            <h2 className="text-wfzo-grey-900 font-source text-base font-bold leading-5">
              Unsaved Changes
            </h2>

            <button
              onClick={onClose}
              className="text-wfzo-grey-800 hover:text-black"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* DESCRIPTION */}
          <p className="text-wfzo-grey-700 font-source text-base leading-6">
            Are you sure you want to leave without saving your changes?
          </p>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3">
           {secondaryAction && (
    <LightButton type="button" onClick={secondaryAction.onClick}>
      {secondaryAction.label}
    </LightButton>
  )}

             {primaryAction && (
    <GoldButton type="button" onClick={primaryAction.onClick}>
      {primaryAction.label}
    </GoldButton>
  )}

  {!primaryAction && !secondaryAction && onSaveDraft && (
    <LightButton type="button" onClick={onSaveDraft}>
      Save as Draft
    </LightButton>
  )}

   {!primaryAction && !secondaryAction && onExitWithoutSaving && (
    <GoldButton type="button" onClick={onExitWithoutSaving}>
      Exit without saving
    </GoldButton>
  )}
          </div>
        </div>
      </div>
    </div>
  );
}
