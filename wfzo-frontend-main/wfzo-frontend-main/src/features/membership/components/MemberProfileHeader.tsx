/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Flag from 'react-world-flags';
import Image from "next/image";
import { ConnectionActions, ConnectionStatus } from './ConnectionActions';



interface MemberProfileHeaderProps {
  memberName: string;
  avatarUrl: string;
  categories: string[];
  flag?: string; // optional flag next to name
// Connection props (optional)
showConnectionActions?: boolean;
  memberId: string;
  connectionStatus?: ConnectionStatus;
  connectionId?: string;
    isBlocked: boolean;
  onConnect: () => void;
  onMessage: () => void;
  onRemoveConnection: (connectionId: string) => void;
  onReport: (memberId: string,userId: string | null, reason: string) => void;
  onBlock: (memberId: string, connectionId: string) => void;
   onUnblock: (memberId: string, connectionId: string) => void;
  isConnectionLoading?: boolean;
}

export function MemberProfileHeader({
  memberName,
  avatarUrl,
  categories,
  flag,
  showConnectionActions,
  memberId,
  connectionStatus,
  connectionId,
  onConnect,
  onMessage,
  isBlocked,
    onUnblock,
  onRemoveConnection,
  onReport,
  onBlock,
  isConnectionLoading = false,
}: MemberProfileHeaderProps) {
  //const showConnectionActions = memberId && connectionStatus !== undefined && onConnect && onMessage && onRemoveConnection && onReport && onBlock;




  return (
    <div className="px-5 md:px-30 bg-[#FCFAF9]">
      <div className="">
        {/* Member Profile */}
        <div className="flex flex-col md:flex-row items-start md:items-center  gap-6 md:gap-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 flex-1">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Image
                src={avatarUrl}
                alt={memberName || "Member avatar"}
                width={96}
                height={96}
                className="w-[108px] h-[108px] rounded-[20px] border border-[#DADADA] bg-white flex items-center justify-center"
              />
            </div>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
              {/* Name + Flag */}
              <div className="flex items-center gap-2 mb-3">
                <h1 className="text-2xl md:text-3xl font-heading font-black text-neutral-800">
                  {memberName}
                </h1>
                <Flag code={flag} style={{ width: 22, height: 22, borderRadius: 5,marginLeft:10 }} />


              </div>

              {/* Category Tags */}
              <div className="flex flex-wrap gap-3 font-source">
                {categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-4 py-1.5 rounded-full bg-[#F4EEE7] text-[#8B6941] text-sm font-medium"
                  >
                    {category}
                  </span>
                ))}



              </div>
              {showConnectionActions && (
  <div className="flex items-start mt-2">
    <ConnectionActions
                    memberId={memberId}
                    memberName={memberName}
                    connectionStatus={connectionStatus ?? 'none'}
                    connectionId={connectionId}
                    onConnect={onConnect}
                    onMessage={onMessage}
                    onRemoveConnection={onRemoveConnection}
                    onReport={onReport}
                    isBlocked={isBlocked}
                    onBlock={onBlock}
                     onUnblock={onUnblock}
                    isLoading={isConnectionLoading}   />
  </div>
)}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 