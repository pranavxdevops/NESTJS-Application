'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { CustomFileUploadField } from '@/shared/components/DynamicForm/CustomFileUploadField';
import { uploadDocument } from '@/features/membership/services/documentUpload';
import { useParams, useRouter } from 'next/navigation';
import { createUser, refreshMemberData } from '../services/profileService';
import { TeamMember } from '@app/[locale]/(auth)/profile/manage-your-team/page';
import { FILE_SIZE_DISPLAY_TEXT } from '@/lib/constants/constants';

interface ProfileImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  localMember: any;
  memberId: string;
  canClose?: boolean;
}

export default function ProfileImageUploadModal({
  isOpen,
  onClose,
  onSuccess,
  localMember,
  memberId,
  canClose = false,
}: ProfileImageUploadModalProps) {
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const userSnapshot = localMember;

  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const firstName = userSnapshot?.firstName || '';
  const lastName = userSnapshot?.lastName || '';
  const email = userSnapshot?.email || '';
  const phone = userSnapshot?.contactNumber || '';
  const designation = userSnapshot?.designation || '';
  const router = useRouter();
  if (!isOpen) return null;
  /* ================= FILE HANDLERS ================= */

  const handleFileSelect = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setUpdateError(null);

    try {
      const response = await uploadDocument(file, 'other');
      setUploadedPhotoUrl(response.publicUrl);
    } catch {
      setUpdateError('Upload failed. Please try again.');
      setPreviewUrl('');
      setFileName('');
      setUploadedPhotoUrl('');
    }
  };

  const handleRemoveFile = () => {
    setPreviewUrl('');
    setFileName('');
    setUploadedPhotoUrl('');
  };

  const handleUpdateUserDetails = async () => {
    if (!uploadedPhotoUrl) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Build payload for the PATCH API
      const payload = {
        action: 'editUser',
        username: email, // from userSnapshot
        email: email,
        firstName: firstName,
        lastName: lastName,
        contactNumber: phone,
        designation: designation,
        userType: 'Secondry',
        profileImageUrl: uploadedPhotoUrl, // include the uploaded image
      };

      // Call existing createUser PATCH API
      const response = await createUser(memberId, payload);

      // Trigger success callback
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update user details:', err);
      setUpdateError('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (canClose || uploadedPhotoUrl) {
      onClose();
    }
  };

  // const handleSignOut = () => {
  //   window.location.href = '/api/auth/logout';
  // };
  const handleSignOut = async () => {
    try {
      console.log('🚪 Starting logout...');
      // Import the unified auth client
      const { logout } = await import('@/lib/auth/authClient');
      await logout();

      console.log('✅ Logout completed');
      
      // Navigate to home page with locale
      router.push(`/${locale}`);
      router.refresh();
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-start justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div
        className="w-full max-w-[853px] bg-white rounded-2xl shadow-xl my-8 mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 bg-white border-b border-wfzo-gold-100 rounded-t-2xl">
          <button
            onClick={() => handleClose()}
            className="text-wfzo-grey-900 hover:text-wfzo-grey-700 transition-colors"
            aria-label="Go back"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.82505 13L12.725 17.9C12.925 18.1 13.0209 18.3334 13.0125 18.6C13.0042 18.8667 12.9 19.1 12.7 19.3C12.5 19.4834 12.2667 19.5792 12 19.5875C11.7334 19.5959 11.5 19.5 11.3 19.3L4.70005 12.7C4.60005 12.6 4.52922 12.4917 4.48755 12.375C4.44588 12.2584 4.42505 12.1334 4.42505 12C4.42505 11.8667 4.44588 11.7417 4.48755 11.625C4.52922 11.5084 4.60005 11.4 4.70005 11.3L11.3 4.70005C11.4834 4.51672 11.7125 4.42505 11.9875 4.42505C12.2625 4.42505 12.5 4.51672 12.7 4.70005C12.9 4.90005 13 5.13755 13 5.41255C13 5.68755 12.9 5.92505 12.7 6.12505L7.82505 11H19C19.2834 11 19.5209 11.0959 19.7125 11.2875C19.9042 11.4792 20 11.7167 20 12C20 12.2834 19.9042 12.5209 19.7125 12.7125C19.5209 12.9042 19.2834 13 19 13H7.82505Z"
                fill="#333333"
              />
            </svg>
          </button>
          <h1 className="text-base font-bold font-source text-wfzo-grey-900">
            Upload Profile Picture
          </h1>
          <button
            onClick={handleClose}
            className="text-wfzo-grey-900 hover:text-wfzo-grey-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* ================= CONTENT ================= */}
        <div className="px-8 py-8 overflow-y-auto max-h-[calc(100vh-260px)]">
          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-wfzo-grey-900 mb-2">Profile Details</h2>
            <p className="text-base text-wfzo-grey-700 font-source">
              A profile photo is mandatory to be able to finalize your account.
            </p>
          </div>

          {/* ================= READ ONLY FIELDS ================= */}
          <div className="grid grid-cols-2 gap-8 mb-8 font-source">
            {/* First Name */}
            <div>
              <label className="text-sm text-wfzo-grey-800">First Name</label>
              <input
                value={firstName}
                disabled
                className="mt-1 h-12 w-full rounded-[9px] border bg-[#F3F4F6] px-4 text-wfzo-grey-500 cursor-not-allowed"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="text-sm text-wfzo-grey-800">Last Name</label>
              <input
                value={lastName}
                disabled
                className="mt-1 h-12 w-full rounded-[9px] border bg-[#F3F4F6] px-4 text-wfzo-grey-500 cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-wfzo-grey-800">E-mail</label>
              <input
                value={email}
                disabled
                className="mt-1 h-12 w-full rounded-[9px] border bg-[#F3F4F6] px-4 text-wfzo-grey-500 cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-wfzo-grey-800">Phone</label>
              <input
                value={phone}
                disabled
                className="mt-1 h-12 w-full rounded-[9px] border bg-[#F3F4F6] px-4 text-wfzo-grey-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Designation */}
          <div className="mb-8 font-source">
            <label className="text-sm text-wfzo-grey-800">Designation</label>
            <input
              value={designation}
              disabled
              className="mt-1 h-12 w-full rounded-[9px] border bg-[#F3F4F6] px-4 text-wfzo-grey-500 cursor-not-allowed"
            />
          </div>

          {/* ================= UPLOAD SECTION ================= */}
          <label className="text-sm text-wfzo-grey-800 mb-2 block font-source">Upload Image*</label>

          <p className="text-sm text-neutral-grey-900 rounded-md bg-[#FFF8E9] py-2.5 pl-4 mb-3">
            Max size: {FILE_SIZE_DISPLAY_TEXT.IMAGE} · Min dimensions: 600×600px
          </p>

          <CustomFileUploadField
            label="Upload Image"
            previewUrl={previewUrl}
            fileName={fileName}
            onSelect={handleFileSelect}
            onRemove={handleRemoveFile}
            hasError={!!updateError}
            error={updateError || ''}
          />
        </div>

        {/* ================= FOOTER ================= */}
        <div className="sticky bottom-0 bg-white px-8 py-6 border-t flex gap-4">
          <button
            onClick={handleUpdateUserDetails}
            disabled={!uploadedPhotoUrl || isUpdating}
            className={`px-6 py-2 rounded-xl font-semibold ${
              uploadedPhotoUrl
                ? 'bg-gradient-to-b from-wfzo-gold-700 to-wfzo-gold-500 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUpdating ? 'Updating...' : 'Update User Details'}
          </button>

          <button
            onClick={handleSignOut}
            className="px-6 py-2 rounded-xl bg-wfzo-gold-50 text-wfzo-gold-600 font-semibold"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
