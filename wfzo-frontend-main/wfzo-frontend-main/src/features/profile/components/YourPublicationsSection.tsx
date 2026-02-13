'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface YourPublicationsSectionProps {
  locale: string;
}

export default function YourPublicationsSection({ locale }: YourPublicationsSectionProps) {
  const router = useRouter();
  const [publications, setPublications] = useState<any[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    setPublications([{ title: 'Sample Publication' }]);
  }, []);

  if (publications.length === 0) return null;

  return (
    <div className="flex p-8 flex-col gap-6 rounded-[20px] border border-wfzo-gold-200 bg-[#F8F5F1]">
      <div className="flex items-center justify-between gap-4">
        {/* LEFT CONTENT */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-wfzo-grey-900 font-montserrat text-xl font-semibold leading-6">
            Your Publications
          </h2>

          <p className="text-wfzo-grey-700 font-source text-base font-normal leading-6">
            Publish and manage articles, announcements, or thought leadership content. Share updates and insights to strengthen your organization’s presence.
          </p>

          <button
            onClick={() => router.push(`/${locale}/news-publications/your-publications`)}
            className="px-4 py-2 text-wfzo-gold-600 font-source text-base font-semibold hover:bg-wfzo-gold-50 rounded-sm transition-colors self-start cursor-pointer"
          >
            View Your Publications
          </button>
        </div>

        {/* RIGHT ARROW */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path
            d="M12.6 12L8.70005 8.10005C8.51672 7.91672 8.42505 7.68338 8.42505 7.40005C8.42505 7.11672 8.51672 6.88338 8.70005 6.70005C8.88338 6.51672 9.11672 6.42505 9.40005 6.42505C9.68338 6.42505 9.91672 6.51672 10.1 6.70005L14.7 11.3C14.8 11.4 14.8709 11.5084 14.9125 11.625C14.9542 11.7417 14.975 11.8667 14.975 12C14.975 12.1334 14.9542 12.2584 14.9125 12.375C14.8709 12.4917 14.8 12.6 14.7 12.7L10.1 17.3C9.91672 17.4834 9.68338 17.575 9.40005 17.575C9.11672 17.575 8.88338 17.4834 8.70005 17.3C8.51672 17.1167 8.42505 16.8834 8.42505 16.6C8.42505 16.3167 8.51672 16.0834 8.70005 15.9L12.6 12Z"
            fill="#4D4D4D"
          />
        </svg>
      </div>
    </div>
  );
}
