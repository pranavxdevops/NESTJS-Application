'use client';

import React from 'react';

export type EnquiryStatusType = 'pending' | 'approved' | 'rejected';

export interface EnquiryStatusBannerProps {
  status: EnquiryStatusType;
  message?: string;
  onDismiss?: () => void;
}

export default function EnquiryStatusBanner({ status, message, onDismiss }: EnquiryStatusBannerProps) {
  // Status configuration with colors and messages
  const statusConfig = {
    pending: {
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-800',
      iconColor: '#808080',
      defaultMessage: 'Your request to add additional team members is under review. contact the WFZO for additional details info@lorem.com',
    },
    approved: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      iconColor: '#22C55E',
      defaultMessage: 'Your request to add additional team members has been approved.',
    },
    rejected: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-500',
      iconColor: '#D61B0A',
      defaultMessage: 'Your request to add additional team members has been rejected. contact the WFZO for additional details info@lorem.com',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`flex justify-between w-full border ${config.borderColor} ${config.bgColor} rounded-xl px-6 py-3`}
    >
      <div className="flex items-start gap-3">
        <svg
          width="17"
          height="17"
          viewBox="0 0 17 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.33333 0C3.73333 0 0 3.73333 0 8.33333C0 12.9333 3.73333 16.6667 8.33333 16.6667C12.9333 16.6667 16.6667 12.9333 16.6667 8.33333C16.6667 3.73333 12.9333 0 8.33333 0ZM9.16667 12.5H7.5V10.8333H9.16667V12.5ZM9.16667 9.16667H7.5V4.16667H9.16667V9.16667Z"
            fill={config.iconColor}
          />
        </svg>

        <div className="flex flex-col gap-0.5">
          <p className={`text-sm font-semibold font-source ${config.textColor}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </p>
          <p className="text-sm text-gray-800 font-source leading-5">{message || config.defaultMessage}</p>
        </div>
      </div>
      {onDismiss && (
        <span
          className="text-gray-600 cursor-pointer hover:text-gray-800 text-sm font-medium self-start"
          onClick={onDismiss}
        >
          Dismiss
        </span>
      )}
    </div>
  );
}
