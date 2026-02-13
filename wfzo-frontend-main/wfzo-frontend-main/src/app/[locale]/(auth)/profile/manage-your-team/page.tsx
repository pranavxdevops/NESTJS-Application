'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Breadcrumb } from '@/shared/components/Breadcrumb';
import GoldButton from '@/shared/components/GoldButton';
import DisabledButton from '@/shared/components/DisabledButton';
import Modal from '@/shared/components/Modal';
import { Input } from '@/shared/components/Input';
import { Textarea } from '@/shared/components/TextArea';
import { CustomPhoneInputField } from '@/shared/components/CustomPhoneInputField';
import { Plus, Edit2, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import { useRouter } from 'i18n/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import {
  createUser,
  updateTeamMember,
  deleteTeamMember,
  CreateUserPayload,
  fetchMemberEnquiry,
  EnquiryResponse,
} from '@/features/profile/services/profileService';
import EnquiryStatusBanner from '@/features/profile/components/EnquiryStatusBanner';
import { toastRef } from '@/lib/utils/toastRef';
import { TOAST_SEVERITY, TOAST_TYPE } from '@/lib/constants/toast';
import { defaultCountries, parseCountry } from 'react-international-phone';
import { MAX_ALLOWED_USER_COUNT } from '@/lib/constants/constants';

function getIso2FromPhone(phone?: string) {
  if (!phone) return null;
  const normalized = phone.replace(/\s+/g, '');
  const countries = defaultCountries.map((c) => parseCountry(c));
  for (const c of countries) {
    const dial = String(c.dialCode || '');
    if (!dial) continue;
    if (normalized.startsWith('+' + dial) || normalized.startsWith(dial)) return c.iso2;
  }
  return null;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  profileImageUrl?: string;
}

const ManageTeamPage = () => {
  const { member } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialMember, setInitialMember] = useState<typeof newMember | null>(null);
  const [teamMemberEnquiry, setTeamMemberEnquiry] = useState<EnquiryResponse | null>(null);
  const [isEnquiryLoading, setIsEnquiryLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => localStorage.getItem('wfzo_enquiryDismissed') === 'true');
  const shouldShowBanner = useMemo(() => {
    if (isDismissed) return false;
    if (!teamMemberEnquiry?.updatedAt) return false;
    const updatedAt = new Date(teamMemberEnquiry.updatedAt);
    const bannerShowDays = parseInt(process.env.NEXT_PUBLIC_BANNER_SHOW_DAYS || '5');
    const fiveDaysAgo = new Date(Date.now() - bannerShowDays * 24 * 60 * 60 * 1000);
    return updatedAt > fiveDaysAgo;
  }, [teamMemberEnquiry, isDismissed]);
  const handleDismiss = () => {
    localStorage.setItem('wfzo_enquiryDismissed', 'true');
    setIsDismissed(true);
  };

  useEffect(() => {
    if (!member?.userSnapshots?.length) return;

    const secondaryMembers: TeamMember[] = member.userSnapshots
      .filter((user: any) => user.userType !== 'Primary' && !user.deletedAt)
      .map((user: any) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.contactNumber,
        designation: user.designation,
        profileImageUrl: user.profileImageUrl,
      }));

    setTeamMembers(secondaryMembers);
    console.log(member.userSnapshots, 'Team Members:', secondaryMembers);
  }, [member]);

  // Fetch team member enquiry on component mount
  useEffect(() => {
    const loadTeamMemberEnquiry = async () => {
      if (!member?.memberId) return;

      setIsEnquiryLoading(true);
      try {
        const enquiries = await fetchMemberEnquiry(member.memberId, 'request_additional_team_members');
        console.log('Fetched enquiries:', enquiries);
        // Extract latest enquiry by createdAt timestamp
        if (enquiries && enquiries.length > 0) {
          const latest = enquiries.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          setTeamMemberEnquiry(latest);
          console.log('enquiry', latest);
        } else {
          setTeamMemberEnquiry(null);
        }
      } catch (error) {
        console.error('Error loading team member enquiry:', error);
        setTeamMemberEnquiry(null);
      } finally {
        setIsEnquiryLoading(false);
      }
    };

    loadTeamMemberEnquiry();
  }, [member?.memberId]);

  // Form state for adding new member
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
  });

  // Form state for request additional members
  const [requestForm, setRequestForm] = useState({
    numberOfMembers: '1',
    reason: '',
  });

  const maxMembers = member?.allowedUserCount || 5;
  const isAtCapacity = teamMembers.length >= maxMembers;

  const handleEditMember = (member: TeamMember) => {
    const formData = {
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    designation: member.designation,
  };
    setEditingMember(member);
    console.log('Editing Member:', member);
    setIsEditMode(true);
    setNewMember(formData);
    setInitialMember(formData);
    setErrors({});
    setIsAddMemberModalOpen(true);
  };
  const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!newMember.firstName.trim()) {
    newErrors.firstName = 'First name is required';
  }

  if (!newMember.lastName.trim()) {
    newErrors.lastName = 'Last name is required';
  }

  if (!newMember.email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email)) {
    newErrors.email = 'Enter a valid email address';
  }

 if (!newMember.phone || newMember.phone.replace(/\D/g, '').length <= 3) {
  newErrors.phone = 'Phone number is required';
}

  if (!newMember.designation.trim()) {
    newErrors.designation = 'Designation is required';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
const isFormEdited = isEditMode && initialMember
  ? Object.keys(initialMember).some(
      (key) =>
        initialMember[key as keyof typeof initialMember] !==
        newMember[key as keyof typeof newMember]
    )
  : true;
  useEffect(() => {
  if (Object.keys(errors).length > 0) {
    validateForm();
  }
}, [newMember]);


  const handleAddMember = async () => {
    if (!validateForm()) return;

  if (isEditMode && !isFormEdited) return;

  if (!member?.memberId) return;

  setIsLoading(true);
  setErrorMessage(null);
    if (!newMember.firstName || !newMember.lastName || !newMember.email || !member?.memberId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const basePayload: CreateUserPayload = {
        username: newMember.email,
        email: newMember.email,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        contactNumber: newMember.phone,
        designation: newMember.designation,
        userType: 'Secondry',
      };

      const payload: CreateUserPayload = {
        ...basePayload,
        action: 'addUser',
      };

      const editPayload: CreateUserPayload = {
        ...basePayload,
        action: 'editUser',
      };

      console.log('isEditMode:', isEditMode);

      if (isEditMode && editingMember) {
        console.log('Updating Member with payload:', editPayload);

        await createUser(member.memberId, editPayload);

        setTeamMembers(
          teamMembers.map((tm) => (tm.id === editingMember.id ? { ...tm, ...newMember } : tm))
        );
      } else {
        const response = await createUser(member.memberId, payload);
        const snapshots = response?.member?.userSnapshots || [];
        const newlyAddedSnapshot = snapshots[snapshots.length - 1];
        const teamMember: TeamMember = {
          id: newlyAddedSnapshot?.id || `temp-${Date.now()}`,
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          email: newMember.email,
          phone: newMember.phone,
          designation: newMember.designation,
        };

        setTeamMembers([...teamMembers, teamMember]);
      }

      setNewMember({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: '',
      });

      setIsAddMemberModalOpen(false);
      setIsEditMode(false);
      setEditingMember(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'add'} member`
      );
    } finally {
      setIsLoading(false);
    }
  };
const isFormValid =
  Object.keys(errors).length === 0 &&
  newMember.firstName.trim() &&
  newMember.lastName.trim() &&
  newMember.email.trim() &&
  newMember.phone.trim() &&
  newMember.designation.trim();

const shouldDisableButton =
  isLoading ||
  !isFormValid ||
  (isEditMode && !isFormEdited);

  const handleDeleteMember = (id: string) => {
    setMemberToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (memberToDelete && member?.memberId) {
      try {
        await deleteTeamMember(member.memberId, memberToDelete);
        setTeamMembers(teamMembers.filter((m) => m.id !== memberToDelete));
        setMemberToDelete(null);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Failed to delete team member:', error);
        // You might want to show an error message here
      }
    }
  };

  const handleSubmitRequest = async () => {
    // Validation

    if (!requestForm.numberOfMembers || !requestForm.reason.trim()) {
      toastRef.current?.show({
        severity: TOAST_SEVERITY.ERROR,
        summary: TOAST_TYPE.ERROR,
        detail: 'Please fill in all required fields.',
        life: 4000,
      });
      return;
    }

    // Check if the requested number would exceed the maximum allowed user count
    const requestedMembers = parseInt(requestForm.numberOfMembers);
    if (maxMembers + requestedMembers > MAX_ALLOWED_USER_COUNT) {
      toastRef.current?.show({
        severity: TOAST_SEVERITY.ERROR,
        summary: TOAST_TYPE.ERROR,
        detail: `You cannot request more than ${MAX_ALLOWED_USER_COUNT - maxMembers} additional members. Your total would exceed the maximum allowed limit of ${MAX_ALLOWED_USER_COUNT} members.`,
        life: 6000,
      });
      return;
    }

    const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    const url = `${API_BASE}/wfzo/api/v1/enquiries`;

    // Get user details from useAuth
    const snapshots = member?.userSnapshots as any[] | undefined;
    const primarySnapshot = snapshots?.find((s: any) => s.userType === 'Primary') || snapshots?.[0];
    if (!primarySnapshot) {
      toastRef.current?.show({
        severity: TOAST_SEVERITY.ERROR,
        summary: TOAST_TYPE.ERROR,
        detail: 'Primary user snapshot not found.',
        life: 4000,
      });
      return;
    }

    let country = '';
    const phone = primarySnapshot?.contactNumber || '';
    const iso2 = getIso2FromPhone(phone);
    if (iso2) {
      const countries = defaultCountries.map((c) => parseCountry(c));
      const matched = countries.find((c) => c.iso2 === iso2);
      if (matched) country = matched.name;
    }

    const payload = {
      userDetails: {
        firstName: primarySnapshot?.firstName,
        lastName: primarySnapshot?.lastName,
        organizationName: member?.organisationInfo?.companyName,
        country: country,
        phoneNumber: phone,
        email: primarySnapshot?.email,
      },
      enquiryType: 'request_additional_team_members',
      noOfMembers: parseInt(requestForm.numberOfMembers),
      message: requestForm.reason || 'We need additional team members for our project.',
      memberId: member?.memberId,
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to submit enquiry: ${res.status} ${errText}`);
      }

      // Success
      toastRef.current?.show({
        severity: TOAST_SEVERITY.SUCCESS,
        summary: TOAST_TYPE.SUCCESS,
        detail: 'Your request has been submitted successfully!',
        life: 4000,
      });

      // Reset dismissal state so new banner shows for this request
      localStorage.removeItem('wfzo_enquiryDismissed');
      setIsDismissed(false);

      // Fetch the latest enquiry to update UI to pending state without refreshing
      if (member?.memberId) {
        try {
          const enquiries = await fetchMemberEnquiry(member.memberId, 'request_additional_team_members');
          if (enquiries && enquiries.length > 0) {
            const latest = enquiries.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            setTeamMemberEnquiry(latest);
          }
        } catch (error) {
          console.error('Error fetching updated enquiry:', error);
        }
      }

      setRequestForm({ numberOfMembers: '1', reason: '' });
      setIsRequestModalOpen(false);
    } catch (error) {
      console.error('Error submitting request:', error);
      toastRef.current?.show({
        severity: TOAST_SEVERITY.ERROR,
        summary: TOAST_TYPE.ERROR,
        detail: 'There was an error submitting your request. Please try again.',
        life: 4000,
      });
    }
  };

  const breadcrumbItems = [
    { label: 'Profile', href: '/profile' },
    { label: 'Manage your Team Members', isCurrent: true },
  ];

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880" />
      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 mb-6 text-wfzo-grey-900 hover:text-wfzo-gold-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-wfzo-gold-600" />
          <span className="font-source text-base font-semibold">Back</span>
        </button>

        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Page Title */}
        <h1 className="font-montserrat font-black text-6xl leading-[80px] text-wfzo-grey-900 mb-10">
          Manage your Team Members
        </h1>

        {/* Add Member / Request Button */}
        <div className="mb-10">
          {teamMemberEnquiry?.enquiryStatus === 'approved' && shouldShowBanner ? (
                <div className='mb-10'>
                  <EnquiryStatusBanner status={teamMemberEnquiry.enquiryStatus as 'pending' | 'approved' | 'rejected'} onDismiss={handleDismiss} />
                </div>
              ) : null
                }
                {
                  (
            <div className="flex flex-col gap-3">
              {teamMemberEnquiry?.enquiryStatus === 'pending' && (
                <div className='mb-10'>
                  <DisabledButton>Request Sent</DisabledButton>
                </div>
              )}
              {teamMemberEnquiry?.enquiryStatus === 'pending' && shouldShowBanner ? (
                <div className='mb-10'>
                <EnquiryStatusBanner status="pending" />
                </div>
              ) : null
                }
              {teamMemberEnquiry?.enquiryStatus === 'rejected' && shouldShowBanner ? (
                <div className='mb-10'>
                <EnquiryStatusBanner status="rejected" onDismiss={handleDismiss} />
                </div>
              ) : null
                }
            </div>
          )
                }
          {!isAtCapacity ? (
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="flex cursor-pointer items-center gap-4 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-100 hover:bg-wfzo-gold-200 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-wfzo-gold-600 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="font-source font-bold text-base text-wfzo-grey-800">
                Add a Team Member
              </span>
            </button>
          ) : teamMemberEnquiry?.enquiryStatus !== 'pending' && teamMembers.length < MAX_ALLOWED_USER_COUNT ? (
            <GoldButton onClick={() => setIsRequestModalOpen(true)}>
              Request Additional Team Members
            </GoldButton>
          ) : null
          }
        </div>

        {/* Content - Empty State or Team Members List */}
        {teamMembers.length === 0 ? (
          // Empty State - Illustration Section
          <div className="flex items-center gap-8 py-20">
            <div className="flex-1 flex justify-center items-center h-[420px]">
              <Image
                src="/assets/addamember.svg"
                alt="Add Team Members"
                width={450}
                height={319}
                className="object-contain"
              />
            </div>
            <div className="flex-1 flex flex-col gap-6">
              <div className="space-y-2">
                <h2 className="font-montserrat font-black text-[32px] leading-10 text-wfzo-grey-800">
                  Add Team Members
                </h2>
                <p className="font-source text-xl leading-6 text-wfzo-grey-700">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque dapibus,
                  felis at aliquet eleifend, libero purus iaculis enim, in pulvinar orci ipsum ac
                  magna.
                </p>
              </div>
              <div>
              <GoldButton onClick={() => setIsAddMemberModalOpen(true)}>
                Add a New Team Member
              </GoldButton>
              </div>
            </div>
          </div>
        ) : (
          // Team Members List
          <div className="p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="font-source text-xl font-normal text-wfzo-grey-900">Team Members</h3>
              <span
                className={`font-source text-sm ${
                  isAtCapacity ? 'text-wfzo-gold-400' : 'text-wfzo-grey-600'
                }`}
              >
                {teamMembers.length}/{maxMembers}
              </span>
            </div>

            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="relative group py-4" // Added 'group' for hover detection
                >
                  <div className="flex items-center justify-between cursor-pointer">
                    {/* Left: Avatar + Info */}
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-[60px] h-[60px] rounded-xl bg-wfzo-gold-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.profileImageUrl ? (
                          <Image
                            src={member.profileImageUrl}
                            alt={`${member.firstName} ${member.lastName}`}
                            width={60}
                            height={60}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-wfzo-gold-300 flex items-center justify-center">
                            <span className="font-source text-2xl font-bold text-wfzo-gold-700">
                              {member.firstName?.[0]}
                              {member.lastName?.[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Member Info */}
                      <div>
                        <h4 className="font-source font-bold text-base text-wfzo-grey-900">
                          {member.firstName} {member.lastName}
                        </h4>
                        <p className="font-source text-sm text-wfzo-grey-700">
                          {member.designation || 'No designation'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Action Buttons - Visible only on hover */}
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="flex cursor-pointer items-center gap-2 px-5 py-2 rounded-xl border-2 border-wfzo-gold-600 hover:bg-wfzo-gold-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-wfzo-gold-600" />
                        <span className="font-source font-semibold text-wfzo-gold-600">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <span className="font-source font-semibold text-red-500">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  {index < teamMembers.length - 1 && <div className="h-px bg-wfzo-gold-200 mt-4" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Team Member Modal */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setIsEditMode(false);
          setEditingMember(null);
          setNewMember({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            designation: '',
          });
        }}
        className="w-full max-w-[853px]"
      >
        <div className="w-full justify-center flex items-center">
          <h3 className="font-source font-bold text-base text-wfzo-grey-900 -mt-15">
            {isEditMode ? 'Edit Team Member' : 'New Team Member'}
          </h3>
        </div>

        <div className="p-8 space-y-8 w-full">
          <h4 className="font-montserrat font-extrabold text-2xl leading-8 text-wfzo-grey-900">
            User Details
          </h4>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-source text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-8">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-sm text-wfzo-grey-800 font-source">First Name*</label>
                <Input
                  type="text"
                  placeholder="First name"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  className="h-12 rounded-[9px] border-wfzo-grey-300"
                />
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
              )}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-wfzo-grey-800 font-source">Last Name*</label>
                <Input
                  type="text"
                  placeholder="Last name"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  className="h-12 rounded-[9px] border-wfzo-grey-300"
                />
              {errors.lastName && (
                <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
              )}
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-sm text-gray-800 font-source">E-mail*</label>
                {isEditMode ? (
                  // In Edit Mode: Show email as non-editable text
                  <div className="h-12 px-4 flex items-center rounded-[9px] border border-gray-300 bg-gray-50">
                    <span className="font-source text-base text-gray-500">{newMember.email}</span>
                  </div>
                ) : (
                  // In Add Mode: Normal editable input
                  <>
                  <Input
                    type="email"
                    placeholder="E-mail Address"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="h-12 rounded-[9px] border-wfzo-grey-300"
                  />
                 {errors.email && (<p className="text-red-600 text-sm mt-1">{errors.email}</p>)}
                  </>
                )}
                
              </div>
              <div>
                <CustomPhoneInputField
                  label="Phone*"
                  value={newMember.phone}
                  onChange={(phone) => setNewMember({ ...newMember, phone })}
                  placeholder="50 123 4567"
                  defaultCountry="ae"
                />
              {errors.phone && (<p className="text-red-600 text-sm mt-1">{errors.phone}</p>)}
              </div>
            </div>

            {/* Designation */}
            <div className="space-y-1">
              <label className="text-sm text-wfzo-grey-800 font-source">Designation*</label>
              <Input
                type="text"
                placeholder="Users Designation"
                value={newMember.designation}
                onChange={(e) => setNewMember({ ...newMember, designation: e.target.value })}
                className="h-12 rounded-[9px] border-wfzo-grey-300"
              />
              {errors.designation && (
                <p className="text-red-600 text-sm mt-1">{errors.designation}</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        {/* <div className="p-8 pt-4 border-t w-full border-wfzo-gold-200 bg-[#F8F5F1] rounded-b-[20px]">
          <GoldButton onClick={handleAddMember} disabled={isLoading}>
            {isLoading
              ? isEditMode
                ? 'Updating...'
                : 'Adding...'
              : isEditMode
                ? 'Update User Details'
                : 'Add User'}
          </GoldButton>
        </div> */}
        <div className="p-8 pt-4 border-t w-full border-wfzo-gold-200 bg-[#F8F5F1] rounded-b-[20px]">
  {shouldDisableButton ? (
    <DisabledButton>
      {isEditMode ? 'Update User Details' : 'Add User'}
    </DisabledButton>
  ) : (
    <GoldButton onClick={handleAddMember}>
      {isLoading
        ? isEditMode
          ? 'Updating...'
          : 'Adding...'
        : isEditMode
          ? 'Update User Details'
          : 'Add User'}
    </GoldButton>
  )}
</div>

      </Modal>

      {/* Request Additional Members Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        className="w-full max-w-[853px]"
      >
        {/* <div className="p-4 bg-wfzo-gold-25 border-b border-wfzo-gold-100">
          <h3 className="font-source font-bold text-base text-wfzo-grey-900">
            Request for More Team Members
          </h3>
        </div>

        <div className="p-8 space-y-8">
          <h4 className="font-montserrat font-extrabold text-2xl leading-8 text-wfzo-grey-900">
            User Details
          </h4> */}
          <div className="w-full justify-center flex items-center">
          <h3 className="font-source font-bold text-base text-wfzo-grey-900 -mt-15">
            Request for More Team Members
          </h3>
        </div>

        <div className="p-8 space-y-8 w-full">
          <h4 className="font-montserrat font-extrabold text-2xl leading-8 text-wfzo-grey-900">
            Request for More Team Members
          </h4>

          <div className="space-y-8">
            {/* Number of Additional Members */}
            <div className="space-y-1 max-w-[256px]">
              <label className="text-sm text-wfzo-grey-800 font-source">
                Number of Additional Members*
              </label>
              <div className="relative">
                <select
                  value={requestForm.numberOfMembers}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      numberOfMembers: e.target.value,
                    })
                  }
                  className="w-full h-12 px-4 rounded-[9px] border border-wfzo-grey-300 bg-white font-source text-base appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.4752 14.475L7.8502 10.85C7.8002 10.8 7.7627 10.7458 7.7377 10.6875C7.7127 10.6292 7.7002 10.5667 7.7002 10.5C7.7002 10.3667 7.74603 10.25 7.8377 10.15C7.92936 10.05 8.0502 10 8.2002 10H15.8002C15.9502 10 16.071 10.05 16.1627 10.15C16.2544 10.25 16.3002 10.3667 16.3002 10.5C16.3002 10.5333 16.2502 10.65 16.1502 10.85L12.5252 14.475C12.4419 14.5583 12.3585 14.6167 12.2752 14.65C12.1919 14.6833 12.1002 14.7 12.0002 14.7C11.9002 14.7 11.8085 14.6833 11.7252 14.65C11.6419 14.6167 11.5585 14.5583 11.4752 14.475Z"
                      fill="#4D4D4D"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Reason for Request */}
            <div className="space-y-1">
              <label className="text-sm text-wfzo-grey-800 font-source">Reason for request*</label>
              <Textarea
                placeholder="Why would you like to add more members of your organization?"
                value={requestForm.reason}
                onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                className="min-h-[112px] rounded-[9px] border-wfzo-grey-300 resize-none font-source"
              />
              <p className="text-xs text-wfzo-grey-800 font-source">
                {256 - requestForm.reason.length} characters left
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        {/* <div className="p-8 pt-4 border-t border-wfzo-gold-200 bg-wfzo-gold-50">
          <GoldButton onClick={handleSubmitRequest} disabled={!requestForm.reason.trim()}>
            Send Request
          </GoldButton>
        </div> */}
        {/* Modal Footer */}
        <div className="p-8 pt-4 border-t w-full border-wfzo-gold-200 bg-[#F8F5F1] rounded-b-[20px]">
          {!requestForm.reason.trim() ? (
            <DisabledButton>
              Send Request
            </DisabledButton>
          ) : (
            <GoldButton onClick={handleSubmitRequest}>
              Send Request
            </GoldButton>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="w-full max-w-[420px]"
      >
        <div className="p-8 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h3 className="font-source font-bold text-base text-wfzo-grey-900">
                Delete Team Member?
              </h3>
              <p className="font-source text-base text-wfzo-grey-700">
                Do you want to delete this user? all information relating to it will also get
                deleted.
              </p>
            </div>

            <div className="flex justify-end items-center gap-3">
              <GoldButton onClick={confirmDelete}>Delete Account</GoldButton>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-sm font-source font-semibold text-base text-wfzo-gold-600 hover:bg-wfzo-gold-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageTeamPage;
