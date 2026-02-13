'use client';

import { useEffect, useState, useCallback } from 'react';
import FeaturedMemberForm, { type FeaturedMemberFormData } from './FeaturedMemberForm';
import { useAuth } from '@/lib/auth/useAuth';
import { defaultCountries, parseCountry } from 'react-international-phone';
import { toastRef } from '@/lib/utils/toastRef';
import { TOAST_SEVERITY, TOAST_TYPE } from '@/lib/constants/toast';

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

export default function FeaturedMemberFormWrapper({ enquiryType = 'become_featured_member' }: { enquiryType?: 'submit_question' | 'become_featured_member' | 'learn_more' | 'consultancy_needs' | string }) {
  const { user, member } = useAuth();
  const [initialData, setInitialData] = useState<Partial<FeaturedMemberFormData> | undefined>(undefined);
  const [initialPhoneCountry, setInitialPhoneCountry] = useState<string | undefined>(undefined);
  const [hasPreviousEnquiry, setHasPreviousEnquiry] = useState(false);

  useEffect(() => {
    type MemberSnapshot = {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      contactNumber?: string;
      phone?: string;
      title?: string;
    };

    const snapshots = member?.userSnapshots as MemberSnapshot[] | undefined;

    const snapshot =
      snapshots?.find((s) => (s.email && user?.email && s.email === user.email) || (s.username && user?.username && s.username === user.username)) ||
      snapshots?.[0] ||
      null;

    const data: Partial<FeaturedMemberFormData> = {
      firstName: (snapshot as MemberSnapshot)?.firstName || '',
      lastName: (snapshot as MemberSnapshot)?.lastName || '',
      organizationName: member?.organisationInfo?.companyName || '',
      country: '',
      email: (snapshot as MemberSnapshot)?.email || user?.email || '',
      phone: (snapshot as MemberSnapshot)?.contactNumber || (snapshot as MemberSnapshot)?.phone || '',
      message: '',
    };

    // try to resolve country name from phone dial code
    const iso2 = getIso2FromPhone(data.phone);
    if (iso2) {
      const countries = defaultCountries.map((c) => parseCountry(c));
      const matched = countries.find((c) => c.iso2 === iso2);
      if (matched) data.country = matched.name;
      setInitialPhoneCountry(iso2);
    }

    setInitialData(data);
  }, [member, user]);

  const loadEnquiries = useCallback(async () => {
    if (!member?.memberId) return;
    const url = `/api/enquiries/member/${member.memberId}?enquiryType=${enquiryType}`;

    try {
      const res = await fetch(url, {
        headers: {
          accept: 'application/json',
        },
      });

      if (res.ok) {
        const enquiries = await res.json();
        if (enquiries && enquiries.length > 0) {
          // Sort by createdAt descending to get the latest
          const sortedEnquiries = [...enquiries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const latest = sortedEnquiries[0];
          const previousMessage = latest.message || '';
          if(enquiryType === "become_featured_member"){
            setInitialData(prev => ({ ...prev, message: previousMessage }));
          }
          if (latest.enquiryStatus === 'pending' || latest.enquiryStatus === 'approved') {
            setHasPreviousEnquiry(true);
          } else {
            setHasPreviousEnquiry(false);
          }
        } else {
          setHasPreviousEnquiry(false);
        }
      } else {
        setHasPreviousEnquiry(false);
      }
    } catch (error) {
      console.error('Error fetching previous enquiries:', error);
      setHasPreviousEnquiry(false);
    }
  }, [member?.memberId, enquiryType]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const handleFormSubmit = async (formData: FeaturedMemberFormData) => {
    const url = '/api/enquiries';

    const payload = {
      userDetails: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        organizationName: formData.organizationName,
        country: formData.country,
        phoneNumber: formData.phone,
        email: formData.email,
      },
      enquiryType: enquiryType,
      subject: formData.subject || '',
      message: formData.message,
      memberId: member?.memberId || '',
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

      // success - show toast
      toastRef.current?.show({
        severity: TOAST_SEVERITY.SUCCESS,
        summary: TOAST_TYPE.SUCCESS,
        detail: 'Your request has been submitted successfully!',
        life: 4000,
      });

      await loadEnquiries();
    } catch (error) {
      console.error('Error submitting form:', error);
      toastRef.current?.show({
        severity: TOAST_SEVERITY.ERROR,
        summary: TOAST_TYPE.ERROR,
        detail: 'There was an error submitting your request. Please try again.',
        life: 4000,
      });
    }
  };

  return <FeaturedMemberForm onSubmit={handleFormSubmit} initialData={initialData} initialPhoneCountry={initialPhoneCountry} enquiryType={enquiryType} disabled={hasPreviousEnquiry && enquiryType === "become_featured_member"} />;
}
