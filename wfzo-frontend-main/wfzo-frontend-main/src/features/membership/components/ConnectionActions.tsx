'use client';

import React, { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils/cn';
import RemoveConnectionModal from '@/features/network/components/RemoveConnectionModal';
import ReportBlockModal from '@/features/network/components/ReportBlockModal';
import ConnectionActionsMenu from '@/features/network/components/ConnectionActionsMenu';

export type ConnectionStatus = 'none' | 'pending' | 'connected';

interface ConnectionActionsProps {
  memberId: string;
  memberName: string;
  connectionStatus: ConnectionStatus;
  connectionId?: string;
  isBlocked: boolean; 
  onConnect: () => void;
  onMessage: () => void;
  onRemoveConnection: (connectionId: string) => void;
  onReport: (memberId: string,userId:string|null, reason: string) => void;
  onBlock: (memberId: string, connectionId: string) => void;
    onUnblock: (memberId: string, connectionId: string) => void;
  isLoading?: boolean;
}

export function ConnectionActions({
  memberId,
  memberName,
  connectionStatus,
  connectionId,
  isBlocked,
  onConnect,
  onMessage,
  onRemoveConnection,
  onReport,
  onBlock,
    onUnblock,
  isLoading = false,
}: ConnectionActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showReportBlockModal, setShowReportBlockModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);




  const handleRemoveConfirm = () => {
    if (connectionId) {
      onRemoveConnection(connectionId);
    }
    setShowRemoveModal(false);
  };

  const handleReportBlockSubmit = async (
  type: 'report' | 'block' | 'unblock',
  reason?: string
) => {
  try {
    setIsSubmitting(true);

    if (type === 'report' && reason) {
      await onReport(memberId, null, reason);
    } else if (type === 'block' && connectionId) {
      await onBlock(memberId, connectionId);
    } else if (type === 'unblock' && connectionId) {
      await onUnblock(memberId, connectionId);
    }

    setShowReportBlockModal(false);
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <>
      <div className="flex items-center gap-3">
        {/* Connect / Request Sent / Message Button */}
        {connectionStatus === 'none' && (
          <button
            onClick={onConnect}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-2 px-2.5 sm:px-2 md:px-3 py-1.5 rounded-lg border border-wfzo-grey-300 bg-white text-wfzo-gold-700 font-source text-sm sm:text-base  transition-colors',
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-wfzo-gold-50'
            )}
          >
            <svg
              width="22"
              height="16"
              viewBox="0 0 22 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 7H15C14.7167 7 14.4792 6.90417 14.2875 6.7125C14.0958 6.52083 14 6.28333 14 6C14 5.71667 14.0958 5.47917 14.2875 5.2875C14.4792 5.09583 14.7167 5 15 5H17V3C17 2.71667 17.0958 2.47917 17.2875 2.2875C17.4792 2.09583 17.7167 2 18 2C18.2833 2 18.5208 2.09583 18.7125 2.2875C18.9042 2.47917 19 2.71667 19 3V5H21C21.2833 5 21.5208 5.09583 21.7125 5.2875C21.9042 5.47917 22 5.71667 22 6C22 6.28333 21.9042 6.52083 21.7125 6.7125C21.5208 6.90417 21.2833 7 21 7H19V9C19 9.28333 18.9042 9.52083 18.7125 9.7125C18.5208 9.90417 18.2833 10 18 10C17.7167 10 17.4792 9.90417 17.2875 9.7125C17.0958 9.52083 17 9.28333 17 9V7ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 14V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
                fill="#9B7548"
              />
            </svg>

            <span className="hidden sm:inline">Connect</span>
          </button>
        )}

        {connectionStatus === 'pending' && (
          <button
            disabled
            className="flex items-center gap-2 px-2.5 sm:px-3 md:px-3 py-1.5 rounded-lg border border-grey-300 bg-wfzo-grey-200 text-wfzo-grey-600 font-source text-sm sm:text-base font-source cursor-not-allowed"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V17.2C4 16.6333 4.14583 16.1125 4.4375 15.6375C4.72917 15.1625 5.11667 14.8 5.6 14.55C6.11667 14.2833 6.6375 14.0583 7.1625 13.875C7.6875 13.6917 8.21667 13.5333 8.75 13.4C9.13333 13.3167 9.50833 13.2417 9.875 13.175C10.2417 13.1083 10.6167 13.0583 11 13.025C11.2833 12.9917 11.5208 13.075 11.7125 13.275C11.9042 13.475 12 13.7167 12 14C12 14.2833 11.9042 14.5208 11.7125 14.7125C11.5208 14.9042 11.2833 15.0167 11 15.05C10.7 15.0833 10.4042 15.1167 10.1125 15.15C9.82083 15.1833 9.525 15.2417 9.225 15.325C8.75833 15.4417 8.3 15.5833 7.85 15.75C7.4 15.9167 6.95 16.1167 6.5 16.35C6.35 16.4333 6.22917 16.55 6.1375 16.7C6.04583 16.85 6 17.0167 6 17.2V18H11.45C11.7333 18 11.9708 18.0958 12.1625 18.2875C12.3542 18.4792 12.45 18.7167 12.45 19C12.45 19.2833 12.3542 19.5208 12.1625 19.7125C11.9708 19.9042 11.7333 20 11.45 20H6ZM12 12C10.9 12 9.95833 11.6083 9.175 10.825C8.39167 10.0417 8 9.1 8 8C8 6.9 8.39167 5.95833 9.175 5.175C9.95833 4.39167 10.9 4 12 4C13.1 4 14.0417 4.39167 14.825 5.175C15.6083 5.95833 16 6.9 16 8C16 9.1 15.6083 10.0417 14.825 10.825C14.0417 11.6083 13.1 12 12 12ZM12 10C12.55 10 13.0208 9.80417 13.4125 9.4125C13.8042 9.02083 14 8.55 14 8C14 7.45 13.8042 6.97917 13.4125 6.5875C13.0208 6.19583 12.55 6 12 6C11.45 6 10.9792 6.19583 10.5875 6.5875C10.1958 6.97917 10 7.45 10 8C10 8.55 10.1958 9.02083 10.5875 9.4125C10.9792 9.80417 11.45 10 12 10Z"
                fill="#808080"
              />
              <path
                d="M17 21C15.8933 21 14.95 20.61 14.17 19.83C13.39 19.05 13 18.1067 13 17C13 15.8933 13.39 14.95 14.17 14.17C14.95 13.39 15.8933 13 17 13C18.1067 13 19.05 13.39 19.83 14.17C20.61 14.95 21 15.8933 21 17C21 18.1067 20.61 19.05 19.83 19.83C19.05 20.61 18.1067 21 17 21ZM17.4 16.84V15C17.4 14.8933 17.36 14.8 17.28 14.72C17.2 14.64 17.1067 14.6 17 14.6C16.8933 14.6 16.8 14.64 16.72 14.72C16.64 14.8 16.6 14.8933 16.6 15V16.82C16.6 16.9267 16.62 17.03 16.66 17.13C16.7 17.23 16.76 17.32 16.84 17.4L18.06 18.62C18.14 18.7 18.2333 18.74 18.34 18.74C18.4467 18.74 18.54 18.7 18.62 18.62C18.7 18.54 18.74 18.4467 18.74 18.34C18.74 18.2333 18.7 18.14 18.62 18.06L17.4 16.84Z"
                fill="#808080"
              />
            </svg>

            <span className="hidden sm:inline">Connection Request Sent</span>
            <span className="sm:hidden">Request Sent</span>
          </button>
        )}

        {connectionStatus === 'connected' && (
  <>
    {!isBlocked ? (
      /* ✅ MESSAGE */
      <button
        onClick={onMessage}
        className="flex items-center gap-2 px-1.5 sm:px-2 md:px-3 py-1.5 rounded-lg border border-wfzo-grey-300 text-wfzo-gold-700 font-source text-sm sm:text-base hover:bg-wfzo-gold-50 transition-colors"
      >
        {/* message icon */}
        <span className="hidden sm:inline">Message</span>
      </button>
    ) : (
      /* 🚫 MEMBER BLOCKED */
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-wfzo-grey-300 bg-wfzo-grey-200 text-wfzo-grey-600 font-source text-sm sm:text-base cursor-not-allowed">
        {/* blocked icon */}
        <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V17.2C4 16.6333 4.14583 16.1125 4.4375 15.6375C4.72917 15.1625 5.11667 14.8 5.6 14.55C6.11667 14.2833 6.6375 14.0583 7.1625 13.875C7.6875 13.6917 8.21667 13.5333 8.75 13.4C9.13333 13.3167 9.50833 13.2417 9.875 13.175C10.2417 13.1083 10.6167 13.0583 11 13.025C11.2833 12.9917 11.5208 13.075 11.7125 13.275C11.9042 13.475 12 13.7167 12 14C12 14.2833 11.9042 14.5208 11.7125 14.7125C11.5208 14.9042 11.2833 15.0167 11 15.05C10.7 15.0833 10.4042 15.1167 10.1125 15.15C9.82083 15.1833 9.525 15.2417 9.225 15.325C8.75833 15.4417 8.3 15.5833 7.85 15.75C7.4 15.9167 6.95 16.1167 6.5 16.35C6.35 16.4333 6.22917 16.55 6.1375 16.7C6.04583 16.85 6 17.0167 6 17.2V18H11.45C11.7333 18 11.9708 18.0958 12.1625 18.2875C12.3542 18.4792 12.45 18.7167 12.45 19C12.45 19.2833 12.3542 19.5208 12.1625 19.7125C11.9708 19.9042 11.7333 20 11.45 20H6ZM12 12C10.9 12 9.95833 11.6083 9.175 10.825C8.39167 10.0417 8 9.1 8 8C8 6.9 8.39167 5.95833 9.175 5.175C9.95833 4.39167 10.9 4 12 4C13.1 4 14.0417 4.39167 14.825 5.175C15.6083 5.95833 16 6.9 16 8C16 9.1 15.6083 10.0417 14.825 10.825C14.0417 11.6083 13.1 12 12 12ZM12 10C12.55 10 13.0208 9.80417 13.4125 9.4125C13.8042 9.02083 14 8.55 14 8C14 7.45 13.8042 6.97917 13.4125 6.5875C13.0208 6.19583 12.55 6 12 6C11.45 6 10.9792 6.19583 10.5875 6.5875C10.1958 6.97917 10 7.45 10 8C10 8.55 10.1958 9.02083 10.5875 9.4125C10.9792 9.80417 11.45 10 12 10Z"
                fill="#808080"
              />
              <path
                d="M17 21C15.8933 21 14.95 20.61 14.17 19.83C13.39 19.05 13 18.1067 13 17C13 15.8933 13.39 14.95 14.17 14.17C14.95 13.39 15.8933 13 17 13C18.1067 13 19.05 13.39 19.83 14.17C20.61 14.95 21 15.8933 21 17C21 18.1067 20.61 19.05 19.83 19.83C19.05 20.61 18.1067 21 17 21ZM17.4 16.84V15C17.4 14.8933 17.36 14.8 17.28 14.72C17.2 14.64 17.1067 14.6 17 14.6C16.8933 14.6 16.8 14.64 16.72 14.72C16.64 14.8 16.6 14.8933 16.6 15V16.82C16.6 16.9267 16.62 17.03 16.66 17.13C16.7 17.23 16.76 17.32 16.84 17.4L18.06 18.62C18.14 18.7 18.2333 18.74 18.34 18.74C18.4467 18.74 18.54 18.7 18.62 18.62C18.7 18.54 18.74 18.4467 18.74 18.34C18.74 18.2333 18.7 18.14 18.62 18.06L17.4 16.84Z"
                fill="#808080"
              />
            </svg>
        <span className="hidden sm:inline">Member Blocked</span>
      </div>
    )}
  </>
)}

        {/* More Menu Button - Only show when connected */}
        {connectionStatus === 'connected' && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center ml-2 gap-2 px-1.5 sm:px-2 md:px-3 py-1.5 rounded-lg border border-wfzo-grey-300 text-wfzo-gold-700 font-source text-sm sm:text-base font-source hover:bg-wfzo-grey-50 transition-colors"
            >
              <svg
                width="4"
                height="16"
                viewBox="0 0 4 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14C0 13.45 0.195833 12.9792 0.5875 12.5875C0.979167 12.1958 1.45 12 2 12C2.55 12 3.02083 12.1958 3.4125 12.5875C3.80417 12.9792 4 13.45 4 14C4 14.55 3.80417 15.0208 3.4125 15.4125C3.02083 15.8042 2.55 16 2 16ZM2 10C1.45 10 0.979167 9.80417 0.5875 9.4125C0.195833 9.02083 0 8.55 0 8C0 7.45 0.195833 6.97917 0.5875 6.5875C0.979167 6.19583 1.45 6 2 6C2.55 6 3.02083 6.19583 3.4125 6.5875C3.80417 6.97917 4 7.45 4 8C4 8.55 3.80417 9.02083 3.4125 9.4125C3.02083 9.80417 2.55 10 2 10ZM2 4C1.45 4 0.979167 3.80417 0.5875 3.4125C0.195833 3.02083 0 2.55 0 2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0C2.55 0 3.02083 0.195833 3.4125 0.5875C3.80417 0.979167 4 1.45 4 2C4 2.55 3.80417 3.02083 3.4125 3.4125C3.02083 3.80417 2.55 4 2 4Z"
                  fill="#9B7548"
                />
              </svg>

              <span className="hidden sm:inline">More</span>
            </button>

           {connectionStatus === 'connected' && showMenu && (
  <ConnectionActionsMenu
    isOrganization={true}
    isBlocked={isBlocked}
    isPrimaryUser={true}
    onClose={() => setShowMenu(false)}
    onAction={(action) => {
      setShowMenu(false);

      if (action === 'remove') {
        setShowRemoveModal(true);
      }

      if (action === 'report-block' || action === 'report-unblock') {
        setShowReportBlockModal(true);
      }
    }}
  />
)}

          </div>
        )}



        
      </div>

      {/* Modals */}
      <RemoveConnectionModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveConfirm}
        organizationName={memberName}
      />

      <ReportBlockModal
        isOpen={showReportBlockModal}
        isBlocked={isBlocked}
        isOrganization={true}
        name={memberName}
          isSubmitting={isSubmitting}   
        onClose={() => setShowReportBlockModal(false)}
        onSubmit={handleReportBlockSubmit}
      />
    </>
  );
}
 