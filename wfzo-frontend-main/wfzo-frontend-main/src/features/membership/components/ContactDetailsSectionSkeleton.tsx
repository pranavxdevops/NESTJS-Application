'use client';

export function ContactDetailsSectionSkeleton() {
  const CardSkeleton = () => {
    return (
      <div className="flex-1 flex flex-col w-full animate-pulse">
        
        {/* Heading */}
        <div className="h-8 bg-gray-200 rounded w-64 mb-6" />

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col flex-1 w-full">
          <div className="space-y-8">

            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-4 items-start">

                {/* Icon circle */}
                <div className="w-6 h-6 bg-gray-200 rounded-full" />

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  
                  {/* Label */}
                  <div className="h-4 bg-gray-200 rounded w-28" />

                  {/* Value */}
                  <div className="h-5 bg-gray-200 rounded flex-1" />
                </div>
              </div>
            ))}

          </div>

          {/* Social Icons Skeleton */}
          <div className="mt-8 flex gap-4 justify-center">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-gray-200 rounded"
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full px-4 pt-2 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row gap-8">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
