"use client";

import React, { useEffect, useRef } from 'react';
import { UserMinus, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ConnectionActionsMenuProps {
  isOrganization: boolean;
  isBlocked: boolean;
  onClose: () => void;
  onAction: (action: 'remove' | 'report-block' | 'report-unblock') => void;
  isPrimaryUser?: boolean;
}

const ConnectionActionsMenu: React.FC<ConnectionActionsMenuProps> = ({
  isOrganization,
  isBlocked,
  onClose,
  onAction,
  isPrimaryUser = true, // Default to true for backward compatibility
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-[180px] rounded-lg bg-white shadow-[0_6px_12px_-6px_rgba(139,105,65,0.12),0_8px_24px_-4px_rgba(139,105,65,0.08)] py-2 z-10"
    >
      {/* Remove Connection - only for organizations AND only for Primary Users */}
      {isOrganization && isPrimaryUser && (
        <button
          onClick={() => onAction('remove')}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-wfzo-gold-25 transition-colors text-left"
        >
          <UserMinus className="w-6 h-6 text-wfzo-grey-500" />
          <span className="font-source text-sm font-normal leading-5 text-wfzo-grey-800">
            Remove Connection
          </span>
        </button>
      )}

      {/* Report / Block or Report / Unblock */}
      <button
        onClick={() => onAction(isBlocked ? 'report-unblock' : 'report-block')}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-wfzo-gold-25 transition-colors text-left"
      >
        {isBlocked ? (
          <ShieldCheck className="w-6 h-6 text-wfzo-grey-500" />
        ) : (
          <ShieldAlert className="w-6 h-6 text-wfzo-grey-500" />
        )}
        <span className="font-source text-sm font-normal leading-5 text-wfzo-grey-800">
          {isBlocked ? 'Report / Unblock user' : 'Report / Block user'}
        </span>
      </button>
    </div>
  );
};

export default ConnectionActionsMenu;
