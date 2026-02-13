'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
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
      className="fixed inset-0 z-550 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className={`inline-flex flex-col items-start rounded-[20px] bg-white ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end items-center p-4 bg-[#FCFAF8] w-full rounded-t-[20px]">
            {title && (
    <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold font-source">
      {title}
    </h2>
  )}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-wfzo-grey-800 hover:text-wfzo-grey-900 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
