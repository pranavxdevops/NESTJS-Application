'use client';

import { useEffect } from 'react';
import { X, Info } from 'lucide-react';
import GoldButton from '@/shared/components/GoldButton';
import LightButton from '@/shared/components/LightButton';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  description?: string;
  title?: string;
}

export default function EditEventModal({
  isOpen,
  onClose,
  onContinue,
  title = 'Edit Event',
  description = "Editing this event will restart the approval process. Your changes will need to be reviewed again before the event goes live",
}: EditEventModalProps) {
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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl w-full max-w-[480px] p-6 shadow-wfzo flex gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* INFO ICON */}
        <Info className="w-6 h-6 text-[#C28E2C]" />

        {/* CONTENT */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Header + Close */}
          <div className="flex justify-between">
            <h2 className="text-base font-bold text-wfzo-grey-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-wfzo-grey-700 hover:text-black"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Message */}
          <p className="text-wfzo-grey-700 text-base leading-6 font-source">
            {description}
          </p>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <div onClick={onClose}>
              <LightButton>Cancel</LightButton>
            </div>

            <div onClick={onContinue}>
              <GoldButton>Continue to Edit</GoldButton>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
