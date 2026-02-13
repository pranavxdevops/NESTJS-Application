'use client';

import { useRouter } from 'next/navigation';

interface YourProfileSectionProps {
  member: any;
  locale: string;
}

export default function YourProfileSection({ member, locale }: YourProfileSectionProps) {
  const router = useRouter();
  const isIncomplete = !(member?.additionalInfo?.status === 'submitted');

  return (
    <div className="flex p-8 flex-col gap-6 rounded-[20px] border border-wfzo-gold-200 bg-[#F8F5F1] cursor-pointer" onClick={() => router.push(`/${locale}/profile/complete-profile`)}>
      {/* Header with navigation */}
      <div className="flex items-center gap-4 cursor-pointer" >
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-1">
            <h2 className="text-wfzo-grey-900 font-montserrat text-xl font-semibold leading-6">
              Your Profile
            </h2>
            {isIncomplete && (
              <div className="w-3 h-3 rounded-full bg-red-500">
                <div className="w-2 h-2 m-0.5 rounded-full bg-red-200" />
              </div>
            )}
          </div>
          
          <p className="text-wfzo-grey-700 font-source text-base font-normal leading-6 ">
            Manage your organization’s core information, contact details, and profile settings. Completing your profile helps you unlock all platform features and improves discoverability.
          </p>
        </div>

        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.6 12L8.70005 8.09999C8.51672 7.91665 8.42505 7.68332 8.42505 7.39999C8.42505 7.11665 8.51672 6.88332 8.70005 6.69999C8.88338 6.51665 9.11672 6.42499 9.40005 6.42499C9.68338 6.42499 9.91672 6.51665 10.1 6.69999L14.7 11.3C14.8 11.4 14.8709 11.5083 14.9125 11.625C14.9542 11.7417 14.975 11.8667 14.975 12C14.975 12.1333 14.9542 12.2583 14.9125 12.375C14.8709 12.4917 14.8 12.6 14.7 12.7L10.1 17.3C9.91672 17.4833 9.68338 17.575 9.40005 17.575C9.11672 17.575 8.88338 17.4833 8.70005 17.3C8.51672 17.1167 8.42505 16.8833 8.42505 16.6C8.42505 16.3167 8.51672 16.0833 8.70005 15.9L12.6 12Z" fill="#4D4D4D"/>
        </svg>
      </div>

      {/* Incomplete Profile Alert */}
      {isIncomplete && (
        <div className="flex p-4 items-start gap-3 rounded-lg border border-red-200 bg-red-50 cursor-pointer">
          <div className="flex p-0.5 items-start gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 1.66669C5.40001 1.66669 1.66667 5.40002 1.66667 10C1.66667 14.6 5.40001 18.3334 10 18.3334C14.6 18.3334 18.3333 14.6 18.3333 10C18.3333 5.40002 14.6 1.66669 10 1.66669ZM10.8333 14.1667H9.16667V12.5H10.8333V14.1667ZM10.8333 10.8334H9.16667V5.83335H10.8333V10.8334Z" fill="#D61B0A"/>
            </svg>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h3 className="flex-1 text-red-500 font-inter text-base font-medium leading-6">
                Incomplete profile
              </h3>
            </div>
            <p className="text-wfzo-grey-800 font-inter text-sm font-normal leading-6 tracking-[0.25px]">
              Complete your profile to be able to use this platform to its full potential
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
