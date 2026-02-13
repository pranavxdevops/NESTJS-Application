'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { JSX, useEffect, useState } from 'react';

import { DropdownValue, FormField } from '@/shared/components/FormSection/types';
import {
  fetchMemberRegistrationFields,
  fetchDropdownValues,
} from '@/features/membership/services/memberRegistration';
import EditCompanyPageModal from '@/shared/components/EditCompanyPageModal/EditCompanyPageModal';

interface ProfileHeaderProps {
  member: any;
  locale: string;
  onDraftSaved: () => void;
}
type SocialPlatform = 'facebook' | 'x' | 'youtube' | 'linkedin';
interface SocialMediaItem {
  title: SocialPlatform;
  url: string;
}

export default function ProfileHeader({ member, locale,onDraftSaved }: ProfileHeaderProps) {
  const router = useRouter();

  const organizationName = member?.organisationInfo?.companyName;
  const description =
    member?.description ||
    'Keep your company profile up to date by editing your organization details, description, and branding in one place. Customize your organization’s page by managing company details, profile information, and brand visibility.';
  const logo =
    member?.organisationInfo?.memberLogoUrl
  const status = member?.status;
  const socialMedia = member?.socialMedia || {};
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [fields, setFields] = useState<FormField[]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, DropdownValue[]>>({});
  const [isLoadingFormConfig, setIsLoadingFormConfig] = useState(false);

  const [isCompanyDetailsPending, setIsCompanyDetailsPending] = useState(false);
  const [isCompanyPagePending, setIsCompanyPagePending] = useState(false);
  const memberId = member?.memberId;
  const isPendingReview = isCompanyDetailsPending || isCompanyPagePending;
  

const checkCompanyDetailsPending = async () => {
  if (!memberId) return;

  try {
    const res = await fetch(`/api/requests/member/${memberId}`);

    if (!res.ok) return;

    const data = await res.json();

    const hasPending = data?.some(
      (req: any) => req.requestStatus === "PENDING"
    );

    setIsCompanyDetailsPending(hasPending);

  } catch (err) {
    console.error("Failed to check company details pending", err);
  }
};
const checkCompanyPagePending = async () => {
  try {
    const companyName = member?.organisationInfo?.companyName;
    if (!companyName) return;

    const encoded = encodeURIComponent(companyName);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/organizations?status=draft&filters[organizationName][$eq]=${encoded}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`,
        },
      }
    );

    if (!res.ok) return;

    const data = await res.json();

    const organisation = data.data?.[0];

    const isPending = organisation?.companyStatus === "Pending";

    setIsCompanyPagePending(isPending);

  } catch (err) {
    console.error("Failed to check company page pending", err);
  }
};

useEffect(() => {
  if (!memberId) return;

  checkCompanyDetailsPending();
  checkCompanyPagePending();

}, [memberId]);

  const socialIcons: Record<SocialPlatform, JSX.Element> = {
  facebook: (
    <svg
              width="11"
              height="21"
              viewBox="0 0 11 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.27956 20.5297V11.5477H10.2747L10.8447 7.83215H7.27956V5.42125C7.27956 4.40436 7.77766 3.41362 9.37439 3.41362H10.9951V0.250681C10.9951 0.250681 9.5237 0 8.11771 0C5.18147 0 3.26322 1.77984 3.26322 5.00054V7.83215H0V11.5477H3.26322V20.5297H7.27956Z"
                fill="#9B7548"
              />
            </svg>
  ),

  x: (
    <svg
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.55858 6.95041L15.5379 0H14.121L8.9297 6.03488L4.78256 0H0L6.2703 9.12588L0 16.4142H1.41689L6.89918 10.0414L11.2785 16.4142H16.061L9.55749 6.95041H9.55858ZM7.61744 9.20545L6.98202 8.29646L1.92697 1.06594H4.10354L8.18311 6.90136L8.81853 7.81035L14.1221 15.3962H11.9455L7.61853 9.20654L7.61744 9.20545Z"
                fill="#9B7548"
              />
            </svg>
  ),

  youtube: (
   <svg
              width="22"
              height="15"
              viewBox="0 0 22 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.1444 4.63978C21.1444 2.07738 19.067 0 16.5046 0H4.63978C2.07738 0 0 2.07738 0 4.63978V10.1613C0 12.7237 2.07738 14.8011 4.63978 14.8011H16.5046C19.067 14.8011 21.1444 12.7237 21.1444 10.1613V4.63978ZM14.1668 7.81362L8.84577 10.4458C8.63759 10.5591 7.92806 10.4076 7.92806 10.17V4.7673C7.92806 4.52752 8.64305 4.37602 8.85122 4.49482L13.9444 7.2654C14.158 7.38638 14.3826 7.69591 14.1657 7.81254L14.1668 7.81362Z"
                fill="#9B7548"
              />
            </svg>
  ),

  linkedin: (
     <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.80547 12.812H10.751V25.4866H6.80547V12.812ZM8.77932 6.51334C10.0414 6.51334 11.0638 7.53677 11.0638 8.79562C11.0638 10.0545 10.0414 11.0812 8.77932 11.0812C7.5172 11.0812 6.49268 10.0556 6.49268 8.79562C6.49268 7.53568 7.51502 6.51334 8.77932 6.51334Z"
                fill="#9B7548"
              />
              <path
                d="M13.2231 12.812H17.0018V14.546H17.053C17.5806 13.5488 18.8645 12.4992 20.7838 12.4992C24.7729 12.4992 25.5075 15.1226 25.5075 18.5362V25.4877H21.5707V19.3253C21.5707 17.8539 21.5424 15.964 19.5228 15.964C17.5032 15.964 17.1598 17.5651 17.1598 19.2174V25.4866H13.222V12.812H13.2231Z"
                fill="#9B7548"
              />
              <rect x="1" y="1" width="30" height="30" rx="1" stroke="#9B7548" strokeWidth="2" />
            </svg>
  )
};


  useEffect(() => {
    async function loadFormConfig() {
      try {
        const localeValue = locale || 'en';

        // 1️⃣ Fetch form fields (same as Join form)
        const fetchedFields = await fetchMemberRegistrationFields(localeValue);

        // 2️⃣ Collect dropdown categories
        const dropdownCategories = Array.from(
          new Set(
            fetchedFields
              .map((f) => f.dropdownCategory)
              .filter((c): c is string => typeof c === 'string')
          )
        );

        // 3️⃣ Fetch dropdown values
        const dropdownResults = await Promise.all(
          dropdownCategories.map(async (category) => {
            const values = await fetchDropdownValues(category, localeValue);
            return [category, values] as const;
          })
        );

        setFields(fetchedFields);
        setDropdownOptions(Object.fromEntries(dropdownResults));
      } catch (error) {
        console.error('Failed to load form config', error);
      }
    }

    loadFormConfig();
  }, [locale]);

  // Get primary user email from member data
  const primaryUserEmail =
    member?.memberUsers?.find((u: any) => u.userType === 'Primary')?.email ||
    member?.userSnapshots?.find((u: any) => u.userType === 'Primary')?.email ||
    member?.email;

  const companyName = member?.organisationInfo?.companyName || member?.organizationName || '';

  console.log('Company name passed to modal:', companyName);
  return (
    <div className="flex p-8 gap-6 bg-white rounded-[20px] shadow-wfzo">
      {/* Logo */}
      <div className="flex w-40 h-40 items-center justify-center rounded-[20px] border border-wfzo-gold-200 bg-white relative">
        <div className="relative w-full h-[77px]">
          <Image src={logo} alt={organizationName} fill className="object-contain rounded-xl" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header with status */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="flex-1 text-wfzo-grey-900 font-montserrat text-2xl font-extrabold leading-8">
              {organizationName}
            </h1>
             <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 text-wfzo-gold-600 font-source text-base font-semibold hover:bg-wfzo-gold-50 rounded-sm transition-colors"
            >
              Edit
            </button>
          

          {isPendingReview && (
            <div className="flex items-center gap-1 ">
              <div className="flex px-1.5 py-1 items-center gap-0.5 rounded-xl border border-yellow-500 bg-yellow-50">
                <span className="text-yellow-500 font-source text-xs font-normal leading-4">
                  Pending review
                </span>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.8334 7.5H9.16669V5.83334H10.8334V7.5ZM10.8334 14.1667H9.16669V9.16667H10.8334V14.1667ZM10 1.66667C8.90567 1.66667 7.82204 1.88222 6.81099 2.30101C5.79994 2.7198 4.88129 3.33363 4.10746 4.10745C2.54466 5.67025 1.66669 7.78987 1.66669 10C1.66669 12.2101 2.54466 14.3298 4.10746 15.8926C4.88129 16.6664 5.79994 17.2802 6.81099 17.699C7.82204 18.1178 8.90567 18.3333 10 18.3333C12.2102 18.3333 14.3298 17.4554 15.8926 15.8926C17.4554 14.3298 18.3334 12.2101 18.3334 10C18.3334 8.90566 18.1178 7.82202 17.699 6.81098C17.2802 5.79993 16.6664 4.88127 15.8926 4.10745C15.1188 3.33363 14.2001 2.7198 13.189 2.30101C12.178 1.88222 11.0944 1.66667 10 1.66667V1.66667Z"
                  fill="#8B6941"
                />
              </svg>
            </div>
          )}
 </div>
</div>
          <p className="text-wfzo-grey-700 font-source text-base font-normal leading-6">
            {description}
          </p>
        </div>

        {/* Social Media Icons */}
        <div className="flex items-center gap-6">
     {member?.organisationInfo?.socialMediaHandle?.map((item: SocialMediaItem) => {

    return (
      <a
        key={item.title}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 border-2 border-wfzo-gold-500 rounded-sm flex items-center justify-center hover:bg-wfzo-gold-50 transition-colors"
      >
        {socialIcons[item.title]}
      </a>
    );
  })}
</div>

      </div>

      <EditCompanyPageModal
     onApprovalStatusChange={(pending) => {
  if (pending) {
    setIsCompanyDetailsPending(true);
  }
}}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onDraftSave={onDraftSaved}
        fields={fields}
        dropdownOptions={dropdownOptions}
        companyName={companyName}
      />
    </div>
  );
}





