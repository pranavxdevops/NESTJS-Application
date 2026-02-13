'use client';

import { cn } from '@/lib/utils/cn';

interface EventCardSkeletonProps {
  className?: string;
}

export default function EventCardSkeleton({ className }: EventCardSkeletonProps) {
  return (
    <div className={cn(
      "flex flex-col md:flex-row gap-6 p-6 rounded-[20px] bg-white shadow-wfzo animate-pulse",
      className
    )}>
      <div className="w-full md:w-48 h-44 rounded-[12px] bg-gray-200" />
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-3">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="flex items-start gap-2 flex-wrap pt-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded px-3 py-1" />
            ))}
          </div>
          <div className="h-16 bg-gray-200 rounded" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}