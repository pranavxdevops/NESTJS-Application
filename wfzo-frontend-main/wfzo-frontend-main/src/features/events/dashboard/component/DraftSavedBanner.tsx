import React, { useEffect } from 'react';

interface DraftSavedBannerProps {
  message?: string;
  onDismiss?: () => void;
}

export default function DraftSavedBanner({
  message = 'Event has been saved as draft',
  onDismiss,
}: DraftSavedBannerProps) {
  useEffect(() => {
    if (!onDismiss) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className=" flex items-center justify-between
        w-[337px] h-[56px]
        gap-4
        px-4 py-4
        rounded-[8px]
        border border-gray-800
        bg-[#2F2F2F]
        text-white fixed top-[15vh] left-1/2 -translate-x-1/2 z-50"
    >
      {/* Left: Icon + Message */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-6 h-6 ">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 7H9V5H11V7ZM11 15H9V9H11V15ZM10 0C8.68678 0 7.38642 0.258658 6.17317 0.761205C4.95991 1.26375 3.85752 2.00035 2.92893 2.92893C1.05357 4.8043 0 7.34784 0 10C0 12.6522 1.05357 15.1957 2.92893 17.0711C3.85752 17.9997 4.95991 18.7362 6.17317 19.2388C7.38642 19.7413 8.68678 20 10 20C12.6522 20 15.1957 18.9464 17.0711 17.0711C18.9464 15.1957 20 12.6522 20 10C20 8.68678 19.7413 7.38642 19.2388 6.17317C18.7362 4.95991 17.9997 3.85752 17.0711 2.92893C16.1425 2.00035 15.0401 1.26375 13.8268 0.761205C12.6136 0.258658 11.3132 0 10 0Z"
              fill="#DADADA"
            />
          </svg>
        </div>

        <p className="text-sm font-source">{message}</p>
      </div>
      <div className="h-6 w-px bg-gray-600" />
      {/* Right: Dismiss */}
      <button
        onClick={onDismiss}
        className="text-sm font-source text-wfzo-gold-200  hover:opacity-80"
      >
        Dismiss
      </button>
    </div>
  );
}
 