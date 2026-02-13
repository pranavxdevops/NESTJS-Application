
'use client';

import Image from 'next/image';
import { Mail, Phone, Briefcase, ExternalLink } from 'lucide-react';

interface TeamMemberProfileHeaderProps {
  member: any;
  userSnapshot: any;
  locale: string;
}

export default function TeamMemberProfileHeader({
  member,
  userSnapshot,
}: TeamMemberProfileHeaderProps) {
  const fullName =
    `${userSnapshot?.firstName || ''} ${userSnapshot?.lastName || ''}`.trim() ||
    'Team Member';

  const position = userSnapshot?.designation || 'Position of employee';
  const email = userSnapshot?.email || 'info@company.com';
  const phone = userSnapshot?.contactNumber || '+971 4 123 4567';
  const photoUrl = userSnapshot?.profileImageUrl || '/default-avatar.png';
  const organizationLogo =
    member?.organisationInfo?.memberLogoUrl ||
    'https://api.builder.io/api/v1/image/assets/TEMP/3c90dd4d532fe09eb7b62fe18fdbf4b165dbd2b4?width=320';

  return (
    <div className="relative flex items-center gap-10 bg-white rounded-[24px] px-10 py-8 shadow-wfzo">
      {/* Profile Image */}
      <div className="relative w-40 h-40 rounded-full overflow-hidden flex-shrink-0">
        <Image src={photoUrl} alt={fullName} fill className="object-cover" />
      </div>

      {/* Center Content */}
      <div className="flex-1 space-y-4">
        <h1 className="text-4xl font-extrabold font-montserrat text-wfzo-grey-900">
          {fullName}
        </h1>

        {/* Position */}
        <div className="flex items-center gap-3">
          <Briefcase size={18} className="text-wfzo-gold-600" />
          <span className="text-wfzo-grey-500 text-sm">Position</span>
          <span className="ml-6 text-wfzo-grey-800 font-medium">
            {position}
          </span>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-wfzo-gold-600" />
          <span className="text-wfzo-grey-500 text-sm">E-mail Address</span>
          <a
            href={`mailto:${email}`}
            className="ml-6 text-wfzo-grey-800 font-medium flex items-center gap-2"
          >
            {email}
            <ExternalLink size={16} className="text-wfzo-gold-600" />
          </a>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3">
          <Phone size={18} className="text-wfzo-gold-600" />
          <span className="text-wfzo-grey-500 text-sm">Phone Number</span>
          <a
            href={`tel:${phone}`}
            className="ml-6 text-wfzo-grey-800 font-medium"
          >
            {phone}
          </a>
        </div>
      </div>

      {/* Organization Logo (Right aligned) */}
      <div className="absolute top-8 right-10 w-28 h-16">
        <Image
          src={organizationLogo}
          alt="Organization Logo"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
