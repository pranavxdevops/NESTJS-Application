'use client';

import React, { JSX } from 'react';

export interface ContactInfo {
  label: string;
  value: string;
  icon: React.ReactNode;
  type?: 'text' | 'email' | 'phone' | 'link';
  actionIcon?: React.ReactNode;
}

type SocialPlatform = 'facebook' | 'x' | 'youtube' | 'linkedin';
interface SocialMediaItem {
  title: SocialPlatform;
  url: string;
}
interface ContactDetailsSectionProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  contactPersonInfo: ContactInfo[];
  companyInfo: ContactInfo[];
  socialIcons?: Record<string, JSX.Element>;
  socialMediaHandles?: SocialMediaItem[];
  showCompleteRegistration?: boolean;
  onRegistrationAction?: () => void;
}

export function ContactDetailsSection({
  activeTab = 'contact',

  contactPersonInfo,
  companyInfo,
  socialIcons,
  socialMediaHandles,
}: ContactDetailsSectionProps) {
  const ContactCard = ({
    title,
    contactInfo,
    socialIcons,
    socialMediaHandles,
  }: {
    title: string;
    contactInfo: ContactInfo[];
    socialIcons?: Record<string, JSX.Element>;
    socialMediaHandles?: SocialMediaItem[];
  }) => {
    const handleAction = (info: ContactInfo) => {
      if (info.type === 'link') window.open(info.value, '_blank');
      if (info.type === 'email') window.location.href = `mailto:${info.value}`;
      if (info.type === 'phone') window.location.href = `tel:${info.value}`;
      if (info.type === 'text') {
        navigator.clipboard.writeText(info.value);
      }
    };

    return (
      <div className="flex-1 flex flex-col w-full">
        <h2
          className="font-montserrat text-xl sm:text-2xl md:text-3xl  font-black text-grey-900 mb-6"
          
        >
          {title}
        </h2>

        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col flex-1 w-full font-source">
          <div className="space-y-6 sm:space-y-8 flex-1">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 w-full"
              >
                <div className="flex-shrink-0">{info.icon}</div>
                <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 w-full">
                  <span className="text-grey-500 text-sm font-normal leading-5 sm:w-32 w-full">
                    {info.label}
                  </span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`text-grey-700 text-base font-normal leading-6 flex-1 break-words ${
                        info.type === 'link' && !info.value?.includes('*')
                          ? 'underline cursor-pointer'
                          : ''
                      }`}
                      onClick={() =>
                        ['link', 'email', 'phone'].includes(info.type || '') &&
                        !info.value?.includes('*')
                          ? handleAction(info)
                          : undefined
                      }
                    >
                      {info.value}
                    </span>
                    {info.actionIcon && (
                      <button
                        className="flex-shrink-0 hover:scale-110 transition-transform"
                        onClick={() => handleAction(info)}
                        aria-label={`action-${info.label}`}
                      >
                        {info.actionIcon}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {socialIcons && socialMediaHandles && (
            <div className="mt-8 flex gap-4 justify-center">
              {socialMediaHandles.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.title}
                  className="flex h-8 w-8 items-center justify-center rounded
                   border border-[#9B7548]
                   hover:bg-[#9B7548]/10 transition"
                >
                  {socialIcons[item.title]}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full  pt-2 pb-20">
      <div className="max-w-7xl mx-auto">
        {activeTab === 'contact' && (
          <div className="flex flex-col xl:flex-row gap-8">
            <ContactCard title="Contact person details" contactInfo={contactPersonInfo} />
            <ContactCard
              title="Company details"
              contactInfo={companyInfo}
              socialIcons={socialIcons}
              socialMediaHandles={socialMediaHandles}
            />
          </div>
        )}
      </div>
    </div>
  );
}
