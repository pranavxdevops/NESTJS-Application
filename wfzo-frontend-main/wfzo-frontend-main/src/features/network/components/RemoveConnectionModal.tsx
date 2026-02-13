'use client';

import { useEffect } from 'react';
import { X, Info } from 'lucide-react';
import LightButton from '@/shared/components/LightButton';
import GoldButton from '@/shared/components/GoldButton';

interface RemoveConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  organizationName: string;
}

export default function RemoveConnectionModal({
  isOpen,
  onClose,
  onConfirm,
  organizationName,
}: RemoveConnectionModalProps) {
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
        {/* ICON — SAME POSITION AS UNSAVED MODAL */}
        <div className="flex-shrink-0">
          <Info className="w-6 h-6 text-[#C28E2C]" strokeWidth={2.5} />
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col gap-6">
          {/* TITLE + CLOSE */}
          <div className="flex items-center justify-between">
            <h2 className="font-source text-base font-bold leading-5 text-wfzo-grey-900">
              Remove Connection
            </h2>

            <button
              onClick={onClose}
              className="text-wfzo-grey-800 hover:text-black"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* TEXT — UNCHANGED */}
          <div>
            <p className="font-source text-base font-normal leading-6 text-wfzo-grey-700">
              Are you sure you want to remove your connection with {' '}
              <span className="font-bold">{organizationName}</span>?All team members will also be disconnected.
            </p>

            <p className="font-source text-sm font-normal leading-5 text-wfzo-grey-600 mt-2">
              This action cannot be undone.
            </p>
          </div>

          {/* ACTIONS — UNCHANGED */}
          <div className="flex justify-end gap-4">
            <LightButton onClick={onClose}>
              Stay Connected
            </LightButton>
            <GoldButton onClick={onConfirm}>
              Remove Connection
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}

