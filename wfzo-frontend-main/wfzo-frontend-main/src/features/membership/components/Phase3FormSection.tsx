'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ContentHeader from '@/shared/components/ContentHeader';
import { toastRef } from '@/lib/utils/toastRef';

import { RadioGroup, RadioGroupItem } from '@/shared/components/RadioGroup';
import { Input } from '@/shared/components/Input';
import { Textarea } from '@/shared/components/TextArea';
import GoldButton from '@/shared/components/GoldButton';
import { CustomPhoneInputField } from '@/shared/components/CustomPhoneInputField';
import { CustomFileUploadField } from '@/shared/components/DynamicForm/CustomFileUploadField';
import {
  fetchPhase3Info,
  savePhase3Draft,
  submitPhase3Application,
} from '../services/AdditionalInformationPhase3';
import { useAuth } from '@/lib/auth/useAuth';
import { RemoveDocument, uploadDocument } from '../services/documentUpload';
import { FILE_SIZE_DISPLAY_TEXT } from '@/lib/constants/constants';

interface Phase3FormSectionProps {
  applicationId: string;
}
export function Phase3FormSection({ applicationId }: Phase3FormSectionProps) {
  const { member, isLoading } = useAuth();
  const memberId = member?.memberId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const [newsletterConsent, setNewsletterConsent] = useState<'yes' | 'no' | ''>('');
  const [additionalNewsletterEmails, setAdditionalNewsletterEmails] = useState('');

  const [companyPhotoFile, setCompanyPhotoFile] = useState<File | null>(null);
  const [companyPhotoPreview, setCompanyPhotoPreview] = useState<string>('');
  const [companyPhotoError, setCompanyPhotoError] = useState('');

  const [emailTouched, setEmailTouched] = useState({
    secondary: false,
    marketing: false,
    investor: false,
  });

  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  const imageKey = companyPhotoPreview || 'no-image';
  const handleCompanyPhotoSelect = async (file: File) => {
    setCompanyPhotoError('');
    setCompanyPhotoFile(file);
    setCompanyPhotoPreview(URL.createObjectURL(file));

    try {
      if (!memberId) {
        throw new Error('Member not loaded');
      }

      const uploadResponse = await uploadDocument(file, 'company-image', memberId);

      setForm((prev) => ({
        ...prev,
        companyPhotoUpload: uploadResponse.publicUrl,
      }));
    } catch (error) {
      console.error(error);
      setCompanyPhotoError('Failed to upload image');
    }
  };

  const handleCompanyPhotoRemove = async () => {
    if (isDisabled) return;
    try {
      await RemoveDocument(form.companyPhotoUpload);
    } catch (error) {
      console.error('Failed to remove document', error);
    }

    setCompanyPhotoFile(null);
    setCompanyPhotoPreview('');
    setForm((prev) => ({
      ...prev,
      companyPhotoUpload: '',
    }));
  };

  const [form, setForm] = useState({
    secondaryContactName: '',
    secondaryContactEmail: '',
    secondaryContactPosition: '',
    secondaryContactPhone: '',
    marketingCompanyName: '',
    companyPhotoUpload: '',
    corporateVideoLink: '',
    whyJoinWorldFzo: '',
    companyProfile: '',
    ContactForMartketing: '',
    EmailForMarketing: '',
    ContactForInvestors: '',
    EmailForInvestors: '',
    fzTotalArea: '',
    fzFoundedYear: '',
    fzCompaniesCount: '',
    fzEmployeesCount: '',
    fzJobsCreated: '',
    fzServicesBenefits: '',
    fzActivitySectors: '',
    fzIncentives: '',
  });

  const [needs, setNeeds] = useState({
    consulting: '',
    consultingArea: '',
    training: '',
    investorContactName: '',
    investorContactEmail: '',
    attendEvents: '',
    customizeEvents: '',
    globalCertification: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!memberId) return;

    const loadPhase3 = async () => {
      try {
        const info = await fetchPhase3Info(memberId);
        if (!info) return;

        setForm((prev) => ({
          ...prev,
          secondaryContactName: info.secondaryContact?.name ?? '',
          secondaryContactEmail: info.secondaryContact?.email ?? '',
          secondaryContactPosition: info.secondaryContact?.position ?? '',
          secondaryContactPhone: info.secondaryContact
            ? `${info.secondaryContact.countryCode} ${info.secondaryContact.contactNumber}`
            : '',

          marketingCompanyName: info.companyDetails?.marketingName ?? '',
          corporateVideoLink: info.companyDetails?.corporateVideoLink ?? '',
          whyJoinWorldFzo: info.companyDetails?.whyJoinWorldFZO ?? '',
          companyProfile: info.companyDetails?.companyDescription ?? '',

          ContactForMartketing: info.freeZoneInfo?.marketingFocalPoint?.name ?? '',
          EmailForMarketing: info.freeZoneInfo?.marketingFocalPoint?.email ?? '',
          ContactForInvestors: info.freeZoneInfo?.investorFocalPoint?.name ?? '',
          EmailForInvestors: info.freeZoneInfo?.investorFocalPoint?.email ?? '',

          fzTotalArea: info.freeZoneInfo?.totalAreaSqKm?.toString() ?? '',
          fzFoundedYear: info.freeZoneInfo?.foundedYear?.toString() ?? '',
          fzCompaniesCount: info.freeZoneInfo?.numberOfCompanies?.toString() ?? '',
          fzEmployeesCount: info.freeZoneInfo?.employeesInFreeZone?.toString() ?? '',
          fzJobsCreated: info.freeZoneInfo?.jobsCreated?.toString() ?? '',
          fzServicesBenefits: info.freeZoneInfo?.servicesOffered ?? '',
          fzActivitySectors: info.freeZoneInfo?.mainActivitySectors ?? '',
          fzIncentives: info.freeZoneInfo?.incentivesAndTaxBenefits ?? '',

          companyPhotoUpload: info.companyDetails?.companyPhoto?.url ?? '',
        }));

        if (info.companyDetails?.companyPhoto?.url) {
          setCompanyPhotoPreview(`${info.companyDetails.companyPhoto.url}?t=${Date.now()}`);
          setCompanyPhotoFile(null);
        }

        setNewsletterConsent(
          info.newsletter?.subscribed === true
            ? 'yes'
            : info.newsletter?.subscribed === false
              ? 'no'
              : ''
        );

        setNeeds((prev) => ({
          ...prev,

          consulting:
            info.memberNeeds?.consultingNeeded === true
              ? 'yes'
              : info.memberNeeds?.consultingNeeded === false
                ? 'no'
                : '',

          consultingArea: info.memberNeeds?.consultingAreas ?? '',

          training:
            info.memberNeeds?.trainingNeeded === true
              ? 'yes'
              : info.memberNeeds?.trainingNeeded === false
                ? 'no'
                : '',

          attendEvents:
            info.memberNeeds?.attendEvents === true
              ? 'yes'
              : info.memberNeeds?.attendEvents === false
                ? 'no'
                : '',

          customizeEvents:
            info.memberNeeds?.customizedSolutionsRequired === true
              ? 'yes'
              : info.memberNeeds?.customizedSolutionsRequired === false
                ? 'no'
                : '',

          globalCertification:
            info.memberNeeds?.wantsGlobalSafeGreenSmartZoneRecognition === true
              ? 'yes'
              : info.memberNeeds?.wantsGlobalSafeGreenSmartZoneRecognition === false
                ? 'no'
                : '',
        }));

        if (info.status === 'submitted') {
          setIsDisabled(true);
        }
      } catch (err) {
        console.error('Failed to prefill Phase 3', err);
      }
    };

    loadPhase3();
  }, [memberId]);

  const REQUIRED_FIELDS = {
    whyJoinWorldFzo: 'This field is mandatory',
    companyProfile: 'This field is mandatory',
    ContactForMartketing: 'This field is mandatory',
    EmailForMarketing: 'This field is mandatory',
    ContactForInvestors: 'This field is mandatory',
    EmailForInvestors: 'This field is mandatory',
    fzTotalArea: 'This field is mandatory',
    fzFoundedYear: 'This field is mandatory',
    fzCompaniesCount: 'This field is mandatory',
    fzEmployeesCount: 'This field is mandatory',
    fzJobsCreated: 'This field is mandatory',
    fzServicesBenefits: 'This field is mandatory',
    fzActivitySectors: 'This field is mandatory',
    fzIncentives: 'This field is mandatory',
  } as const;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Secondary contact
    if (!form.secondaryContactName.trim()) {
      newErrors.secondaryContactName = 'Name is required';
    }

    if (!form.secondaryContactEmail.trim()) {
      newErrors.secondaryContactEmail = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.secondaryContactEmail)) {
      newErrors.secondaryContactEmail = 'Invalid email address';
    }

    if (!form.secondaryContactPosition.trim()) {
      newErrors.secondaryContactPosition = 'Position is required';
    }

    const phoneDigits = form.secondaryContactPhone.replace(/\D/g, '');

    if (!phoneDigits) {
      newErrors.secondaryContactPhone = 'Contact number is required';
    } else if (phoneDigits.length <= 3) {
      newErrors.secondaryContactPhone = 'Enter a valid contact number';
    }

    if (!newsletterConsent) {
      newErrors.newsletterConsent = 'Please select Yes or No';
    }

    if (!needs.customizeEvents) {
      newErrors.customizeEvents = 'Please select Yes or No';
    }

    if (!form.fzFoundedYear) {
      newErrors.fzFoundedYear = 'Founded year is required';
    } else if (!/^\d{4}$/.test(form.fzFoundedYear)) {
      newErrors.fzFoundedYear = 'Enter a valid year';
    }

    if (!form.fzCompaniesCount.trim()) {
      newErrors.fzCompaniesCount = 'Companies count is required';
    }

    if (needs.consulting === 'yes' && !needs.consultingArea.trim()) {
      newErrors.consultingArea = 'Please specify consulting area';
    }

    Object.entries(REQUIRED_FIELDS).forEach(([field, message]) => {
      const value = form[field as keyof typeof form];

      if (!value || !String(value).trim()) {
        newErrors[field] = message;
      }
    });

    return newErrors;
  };

  const validateForSave = () => {
    const newErrors: Record<string, string> = {};

    if (!form.secondaryContactName.trim()) {
      newErrors.secondaryContactName = 'Name is required';
    }

    if (!form.secondaryContactEmail.trim()) {
      newErrors.secondaryContactEmail = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.secondaryContactEmail)) {
      newErrors.secondaryContactEmail = 'Invalid email address';
    }

    return newErrors;
  };

  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  useEffect(() => {
    const timer = setTimeout(() => {
      const newErrors: Record<string, string> = {};

      // 1️⃣ Secondary contact email
      if (emailTouched.secondary) {
        const email = form.secondaryContactEmail.trim();
        if (email && !EMAIL_REGEX.test(email)) {
          newErrors.secondaryContactEmail = 'Enter a valid email address';
        }
      }

      // 2️⃣ Marketing email
      if (emailTouched.marketing) {
        const email = form.EmailForMarketing.trim();
        if (email && !EMAIL_REGEX.test(email)) {
          newErrors.EmailForMarketing = 'Enter a valid email address';
        }
      }

      // 3️⃣ Investor email
      if (emailTouched.investor) {
        const email = form.EmailForInvestors.trim();
        if (email && !EMAIL_REGEX.test(email)) {
          newErrors.EmailForInvestors = 'Enter a valid email address';
        }
      }

      // merge errors cleanly
      setErrors((prev) => ({
        ...prev,
        ...newErrors,
      }));
    }, 500); // debounce

    return () => clearTimeout(timer);
  }, [form.secondaryContactEmail, form.EmailForMarketing, form.EmailForInvestors, emailTouched]);

  const validateFoundedYear = (value: string) => {
    const currentYear = new Date().getFullYear();

    if (!value) return 'Founded year is required';
    if (value.length !== 4) return 'Year must be 4 digits';

    const year = Number(value);
    if (year < 1900 || year > currentYear) {
      return `Year must be between 1900 and ${currentYear}`;
    }

    return '';
  };

  useEffect(() => {
    if (newsletterConsent !== 'yes') return;

    const timer = setTimeout(() => {
      // Empty is allowed
      if (!additionalNewsletterEmails.trim()) {
        setErrors((prev) => {
          const { additionalNewsletterEmails, ...rest } = prev;
          return rest;
        });
        return;
      }

      const emails = additionalNewsletterEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      // Max 3 emails
      if (emails.length > 3) {
        setErrors((prev) => ({
          ...prev,
          additionalNewsletterEmails: 'You can add maximum 3 emails',
        }));
        return;
      }

      // Validate each email
      const invalidEmail = emails.find((e) => !EMAIL_REGEX.test(e));

      if (invalidEmail) {
        setErrors((prev) => ({
          ...prev,
          additionalNewsletterEmails: `"${invalidEmail}" is not a valid email`,
        }));
      } else {
        setErrors((prev) => {
          const { additionalNewsletterEmails, ...rest } = prev;
          return rest;
        });
      }
    }, 600); // debounce

    return () => clearTimeout(timer);
  }, [additionalNewsletterEmails, newsletterConsent]);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateNeeds = (key: keyof typeof needs, value: string) => {
    setNeeds((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const buildPayload = () => ({
    secondaryContact: {
      name: form.secondaryContactName,
      email: form.secondaryContactEmail,
      ...(form.secondaryContactPosition && { position: form.secondaryContactPosition }),

      contactNumber: form.secondaryContactPhone.trim(),
    },
    companyDetails: {
      marketingName: form.marketingCompanyName,
      companyPhoto: companyPhotoFile
        ? {
            url: form.companyPhotoUpload,
            fileName: companyPhotoFile.name,
          }
        : null,

      ...(form.corporateVideoLink && { corporateVideoLink: form.corporateVideoLink }),
      whyJoinWorldFZO: form.whyJoinWorldFzo,
      companyDescription: form.companyProfile,
    },
    newsletter: newsletterConsent
      ? {
          subscribed: newsletterConsent === 'yes',
          additionalEmails:
            additionalNewsletterEmails
              ?.split(',')
              .map((e) => e.trim())
              .filter(Boolean) || [],
        }
      : undefined,
    freeZoneInfo: {
      marketingFocalPoint: {
        name: form.ContactForMartketing,
        ...(form.EmailForMarketing && { email: form.EmailForMarketing }),
      },
      investorFocalPoint: {
        name: form.ContactForInvestors,
        ...(form.EmailForInvestors && { email: form.EmailForInvestors }),
      },

      ...(form.fzTotalArea && {
        totalAreaSqKm: Number(form.fzTotalArea),
      }),
      ...(form.fzFoundedYear && {
        foundedYear: Number(form.fzFoundedYear),
      }),
      ...(form.fzCompaniesCount && {
        numberOfCompanies: Number(form.fzCompaniesCount),
      }),
      ...(form.fzEmployeesCount && {
        employeesInFreeZone: Number(form.fzEmployeesCount),
        employeesInFreeZoneCompanies: Number(form.fzEmployeesCount),
      }),

      ...(form.fzJobsCreated && {
        jobsCreated: Number(form.fzJobsCreated),
      }),
      ...(form.fzServicesBenefits && {
        servicesOffered: form.fzServicesBenefits,
      }),
      ...(form.fzActivitySectors && {
        mainActivitySectors: form.fzActivitySectors,
      }),
      ...(form.fzIncentives && {
        incentivesAndTaxBenefits: form.fzIncentives,
      }),
    },
    memberNeeds: {
      ...(needs.consulting && {
        consultingNeeded: needs.consulting.toLowerCase() === 'yes',
      }),
      ...(needs.consultingArea && {
        consultingAreas: needs.consultingArea,
      }),
      ...(needs.training && {
        trainingNeeded: needs.training.toLowerCase() === 'yes',
      }),
      ...(needs.attendEvents && {
        attendEvents: needs.attendEvents.toLowerCase() === 'yes',
      }),
      ...(needs.customizeEvents && {
        customizedSolutionsRequired: needs.customizeEvents.toLowerCase() === 'yes',
      }),
      ...(needs.globalCertification && {
        wantsGlobalSafeGreenSmartZoneRecognition: needs.globalCertification.toLowerCase() === 'yes',
      }),
    },
  });

  const handleSubmit = async () => {
    if (!memberId) {
      return;
    }

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      console.log('Submit blocked due to:', validationErrors);
      setErrors(validationErrors);

      return;
    }

    try {
      setIsSubmitting(true);

      const payload = buildPayload();

      await submitPhase3Application(memberId, payload);

      setIsDisabled(true);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!memberId) {
      return;
    }
    const validationErrors = validateForSave();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      return;
    }

    try {
      setIsSaving(true);

      const payload = buildPayload();
      await savePhase3Draft(memberId, payload);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section>
      <div>
        <ContentHeader header="Additional information" />
        <h3 className="mt-8 mb-4 text-xl font-montserrat font-black text-wfzo-grey-900">
          Secondary Contact Details
        </h3>
        <div className="mt-10 flex flex-col gap-6 max-w-[720px]">
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[720px]">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">Name</label>
              <Input
                value={form.secondaryContactName}
                onChange={(e) => updateField('secondaryContactName', e.target.value)}
                disabled={isDisabled}
                placeholder="Enter Secondary Name "
                className={`font-source ${errors.secondaryContactName ? 'border-red-500' : ''}`}
              />

              {errors.secondaryContactName && (
                <p className="text-xs text-red-600 mt-1 font-source">
                  {errors.secondaryContactName}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">E-mail(Work)</label>
              <Input
                type="email"
                value={form.secondaryContactEmail}
                onChange={(e) => {
                  updateField('secondaryContactEmail', e.target.value);
                  setEmailTouched((p) => ({ ...p, secondary: true }));
                }}
                disabled={isDisabled}
                placeholder="Enter Secondary Email"
                className={`font-source ${
                  errors.secondaryContactEmail ? 'border-red-500' : emailValid
                }`}
              />
              {errors.secondaryContactEmail && (
                <p className="text-xs text-red-600 mt-1 font-source">
                  {errors.secondaryContactEmail}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">Position</label>
              <Input
                value={form.secondaryContactPosition}
                onChange={(e) => updateField('secondaryContactPosition', e.target.value)}
                disabled={isDisabled}
                placeholder="Enter Job Position"
                className={`font-source ${errors.secondaryContactPosition ? 'border-red-500' : ''}`}
              />
              {errors.secondaryContactPosition && (
                <p className="text-xs text-red-600 mt-1 font-source">
                  {errors.secondaryContactPosition}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <CustomPhoneInputField
                label="Contact Number"
                value={form.secondaryContactPhone}
                onChange={(phone) => updateField('secondaryContactPhone', phone)}
                placeholder="Enter contact number"
                required
                disabled={isDisabled}
                defaultCountry="ae" // UAE example
              />
              {errors.secondaryContactPhone && (
                <p className="text-xs text-red-600 mt-1 font-source">
                  {errors.secondaryContactPhone}
                </p>
              )}
            </div>
          </div>

          <h3 className="mt-8 mb-4 text-xl font-montserrat font-black text-wfzo-grey-900">
            More Company Details
          </h3>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-source text-wfzo-grey-800">
              Company name(Marketing name)
            </label>
            <Input
              value={form.marketingCompanyName}
              onChange={(e) => updateField('marketingCompanyName', e.target.value)}
              disabled={isDisabled}
              placeholder="Enter Company Name"
              className="font-source placeholder:font-source"
            />
          </div>
          <div className="flex flex-col gap-3 max-w-[720px]">
            {/* Label */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-source text-wfzo-grey-800">Upload Company Photo</label>

              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-wfzo-gold-600 text-white text-xs">
                i
              </span>
            </div>

            {/* Helper strip */}
            <p className="text-sm text-neutral-grey-900 rounded-md bg-[#FFF8E9] py-2.5 pl-4 font-source ">
              Max size: {FILE_SIZE_DISPLAY_TEXT.IMAGE} · Min dimensions: 600×600px
            </p>
            <div className={`relative ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}>
              {/* Upload field */}
              <CustomFileUploadField
                key={imageKey}
                label="Upload Company Photo"
                accept="image/*"
                previewUrl={companyPhotoPreview}
                fileName={companyPhotoFile?.name}
                disabled={isDisabled}
                onSelect={handleCompanyPhotoSelect}
                onRemove={handleCompanyPhotoRemove}
                hasError={!!companyPhotoError}
                error={companyPhotoError}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-source text-wfzo-grey-800">Corporate Video Link</label>
            <Input
              value={form.corporateVideoLink}
              onChange={(e) => updateField('corporateVideoLink', e.target.value)}
              disabled={isDisabled}
              placeholder="Enter Youtube link "
              className="font-source placeholder:font-source"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-source text-wfzo-grey-800">
              Why have you chosen to join World FZO or write a testimony about the benefits you’ve
              realised from being a member of World FZO?*
            </label>
            <Textarea
              value={form.whyJoinWorldFzo}
              onChange={(e) => updateField('whyJoinWorldFzo', e.target.value)}
              disabled={isDisabled}
              placeholder=""
              className={`font-source ${errors.whyJoinWorldFzo ? 'border-red-500' : ''}`}
            />
            {errors.whyJoinWorldFzo && (
              <p className="text-xs text-red-600 mt-1 font-source">{errors.whyJoinWorldFzo}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-source text-wfzo-grey-800">
              Write a brief description about your company (Company profile)*
            </label>
            <Textarea
              value={form.companyProfile}
              onChange={(e) => updateField('companyProfile', e.target.value)}
              disabled={isDisabled}
              placeholder=""
              className={`font-source ${errors.companyProfile ? 'border-red-500' : ''}`}
            />
            {errors.companyProfile && (
              <p className="text-xs text-red-600 mt-1 font-source">{errors.companyProfile}</p>
            )}
          </div>
          <div className={isDisabled ? 'cursor-not-allowed opacity-60' : ''}>
            <div className={isDisabled ? 'pointer-events-none' : ''}>
              {/* Newsletter */}
              <div className="flex flex-col gap-4 font-source">
                <label>I would like to receive World FZO weekly newsletter by email*</label>
                <RadioGroup
                  value={newsletterConsent}
                  onValueChange={(v) => {
                    setNewsletterConsent(v as 'yes' | 'no');
                    setErrors((prev) => {
                      const { newsletterConsent, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className="!flex !flex-row !flex-nowrap !items-center gap-8 font-source"
                >
                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="yes" />
                    Yes
                  </label>

                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="no" />
                    No
                  </label>
                </RadioGroup>
                {errors.newsletterConsent && (
                  <p className="text-xs text-red-600 mt-1 font-source">
                    {errors.newsletterConsent}
                  </p>
                )}
                {newsletterConsent === 'yes' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-source text-wfzo-grey-800">
                      Add additional emails to receive the newsletter
                    </label>

                    <Input
                      className={`w-full rounded-md border p-2 text-sm font-source ${
                        errors.additionalNewsletterEmails ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="john@example.com, sara@example.com"
                      value={additionalNewsletterEmails}
                      onChange={(e) => setAdditionalNewsletterEmails(e.target.value)}
                    />
                    {errors.additionalNewsletterEmails && (
                      <p className="text-xs text-red-600 mt-1 font-source">
                        {errors.additionalNewsletterEmails}
                      </p>
                    )}
                    <p className="text-[12px] leading-[16px] font-normal text-[#5F5F5F] font-source">
                      3 emails remaining
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <h3 className="mt-8 mb-4 text-xl font-montserrat font-black text-wfzo-grey-900">
            We want to know more about your Free Zone
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[720px]">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                Contact of the focal points for marketing*
              </label>
              <Input
                value={form.ContactForMartketing}
                onChange={(e) => updateField('ContactForMartketing', e.target.value)}
                disabled={isDisabled}
                placeholder="Enter Name"
                className={`font-source ${errors.ContactForMartketing ? 'border-red-500' : ''}`}
              />
              {errors.ContactForMartketing && (
                <p className="text-xs text-red-600 mt-1 font-source">
                  {errors.ContactForMartketing}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                Email for Marketing focal point*
              </label>
              <Input
                value={form.EmailForMarketing}
                onChange={(e) => {
                  updateField('EmailForMarketing', e.target.value);
                  setEmailTouched((prev) => ({ ...prev, marketing: true }));
                }}
                disabled={isDisabled}
                placeholder="Enter Email"
                className={`font-source ${errors.EmailForMarketing ? 'border-red-500' : ''}`}
              />
              {errors.EmailForMarketing && (
                <p className="text-xs text-red-600 mt-1 font-source">{errors.EmailForMarketing}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                Contact of the focal points for investors*
              </label>
              <Input
                value={form.ContactForInvestors}
                onChange={(e) => updateField('ContactForInvestors', e.target.value)}
                disabled={isDisabled}
                placeholder="Enter Name"
                className={`font-source ${errors.ContactForInvestors ? 'border-red-500' : ''}`}
              />
              {errors.ContactForInvestors && (
                <p className="text-xs text-red-600 mt-1 font-source">
                  {errors.ContactForInvestors}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                Email for investor focal point*
              </label>
              <Input
                value={form.EmailForInvestors}
                onChange={(e) => {
                  updateField('EmailForInvestors', e.target.value);
                  setEmailTouched((prev) => ({ ...prev, investor: true }));
                }}
                disabled={isDisabled}
                placeholder="Enter Email"
                className={`font-source ${errors.EmailForInvestors ? 'border-red-500' : ''}`}
              />
              {errors.EmailForInvestors && (
                <p className="text-xs text-red-600 mt-1 font-source">{errors.EmailForInvestors}</p>
              )}
            </div>

            {/* Total size */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                Total size of Free Zone (Surface area)*
              </label>
              <div className="relative">
                <Input
                  value={form.fzTotalArea}
                  onChange={(e) => updateField('fzTotalArea', e.target.value)}
                  disabled={isDisabled}
                  placeholder=""
                  className={`font-source ${errors.fzTotalArea ? 'border-red-500' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-wfzo-grey-600 font-source">
                  km²
                </span>
                {errors.fzTotalArea && (
                  <p className="text-xs text-red-600 mt-1 font-source">{errors.fzTotalArea}</p>
                )}
              </div>
            </div>

            {/* Founded year */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                When was your Free Zone founded?*
              </label>
              <Input
                value={form.fzFoundedYear}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  updateField('fzFoundedYear', value);

                  const error = validateFoundedYear(value);

                  setErrors((prev) => ({
                    ...prev,
                    ...(error ? { fzFoundedYear: error } : {}),
                  }));
                }}
                disabled={isDisabled}
                placeholder=" Enter Year in YYYY Format"
                className={`font-source ${errors.fzFoundedYear ? 'border-red-500' : ''}`}
              />
              {errors.fzFoundedYear && (
                <p className="text-xs text-red-600 mt-1 font-source">{errors.fzFoundedYear}</p>
              )}
            </div>

            {/* Companies count */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                How many companies operate in your Free Zone?*
              </label>
              <Input
                value={form.fzCompaniesCount}
                onChange={(e) => updateField('fzCompaniesCount', e.target.value)}
                disabled={isDisabled}
                placeholder=""
                className={`font-source ${errors.fzCompaniesCount ? 'border-red-500' : ''}`}
              />
              {errors.fzCompaniesCount && (
                <p className="text-xs text-red-600 mt-1 font-source">{errors.fzCompaniesCount}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                How many employees do you have in your Free Zone?*
              </label>
              <Input
                value={form.fzEmployeesCount}
                onChange={(e) => updateField('fzEmployeesCount', e.target.value)}
                disabled={isDisabled}
                placeholder=""
                className={`font-source ${errors.fzEmployeesCount ? 'border-red-500' : ''}`}
              />
              {errors.fzEmployeesCount && (
                <p className="text-xs text-red-600 mt-1 font-source">{errors.fzEmployeesCount}</p>
              )}
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-source text-wfzo-grey-800">
                What is the number of jobs created by your Free Zone through your tenants?*
              </label>
              <Input
                value={form.fzJobsCreated}
                onChange={(e) => updateField('fzJobsCreated', e.target.value)}
                disabled={isDisabled}
                placeholder=""
                className={`font-source ${errors.fzJobsCreated ? 'border-red-500' : ''}`}
              />
              {errors.fzJobsCreated && (
                <p className="text-xs text-red-600 mt-1 font-source">{errors.fzJobsCreated}</p>
              )}
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-source text-wfzo-grey-800">
                What are the benefits offered by your Free Zone in terms of services?*
              </label>
              <Textarea
                className={`rounded-md border border-gray-300 p-2 text-sm font-source ${errors.fzServicesBenefits ? 'border-red-500' : ''}`}
                rows={3}
                value={form.fzServicesBenefits}
                onChange={(e) => updateField('fzServicesBenefits', e.target.value)}
                disabled={isDisabled}
                placeholder=""
              />
              {errors.fzServicesBenefits && (
                <p className="text-xs text-red-600 mt-1 font-source">{errors.fzServicesBenefits}</p>
              )}
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-source text-wfzo-grey-800">
                Which are the main activity sectors represented in your Free Zone?*
              </label>
              <Textarea
                className={`rounded-md border border-gray-300 p-2 text-sm font-source ${errors.fzActivitySectors ? 'border-red-500' : ''}`}
                rows={3}
                value={form.fzActivitySectors}
                onChange={(e) => updateField('fzActivitySectors', e.target.value)}
                disabled={isDisabled}
                placeholder=""
              />
              {errors.fzActivitySectors && (
                <p className="text-xs text-red-600 mt-1 font-source">{errors.fzActivitySectors}</p>
              )}
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-source text-wfzo-grey-800">
                What are the benefits offered by your Free Zone in terms of incentives / tax?*
              </label>
              <Textarea
                className={`rounded-md border border-gray-300 p-2 text-sm font-source ${errors.fzIncentives ? 'border-red-500' : ''}`}
                rows={3}
                value={form.fzIncentives}
                onChange={(e) => updateField('fzIncentives', e.target.value)}
                disabled={isDisabled}
                placeholder=""
              />
              {errors.fzIncentives && (
                <p className="text-xs text-red-600 mt-1 font-source">{errors.fzIncentives}</p>
              )}
            </div>
          </div>

          <h3 className="mt-8 mb-4 text-xl font-montserrat font-black text-wfzo-grey-900">
            We want to know more about your needs
          </h3>
          <div className={isDisabled ? 'cursor-not-allowed opacity-60' : ''}>
            <div className={isDisabled ? 'pointer-events-none' : ''}>
              <div className="flex flex-col gap-4 font-source mb-2">
                <label>Do you have any consulting needs?</label>
                <RadioGroup
                  value={needs.consulting}
                  onValueChange={(v) => setNeeds((prev) => ({ ...prev, consulting: v }))}
                  className="!flex !flex-row !flex-nowrap !items-center gap-8 font-source"
                >
                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="yes" />
                    Yes
                  </label>

                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="no" />
                    No
                  </label>
                </RadioGroup>
                {needs.consulting === 'yes' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-source text-wfzo-grey-800">
                      In which area the experts of the World FZO can assist you to imrpve your Free
                      Zone?*
                    </label>

                    <Input
                      value={needs.consultingArea}
                      onChange={(e) => updateNeeds('consultingArea', e.target.value)}
                      className={`w-full rounded-md border border-gray-300 p-2 text-sm font-source ${errors.consultingArea ? 'border-red-500' : ''}`}
                      placeholder=""
                    />
                    {errors.consultingArea && (
                      <p className="text-xs text-red-600 mt-1 font-source">
                        {errors.consultingArea}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 font-source mb-2">
                <label>
                  Do you have any training needs? Are you interestedto develop the capacity building
                  of your FZ staff?
                </label>
                <RadioGroup
                  value={needs.training}
                  onValueChange={(v) => setNeeds((prev) => ({ ...prev, training: v }))}
                  className="!flex !flex-row !flex-nowrap !items-center gap-8 font-source"
                >
                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="yes" />
                    Yes
                  </label>

                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="no" />
                    No
                  </label>
                </RadioGroup>
              </div>

              <div className="flex flex-col gap-4 font-source mb-2">
                <label>
                  Do you want to attend our Free Zone (global or regional) conferences, seminars,
                  webinars?
                </label>
                <RadioGroup
                  value={needs.attendEvents}
                  onValueChange={(v) => setNeeds((prev) => ({ ...prev, attendEvents: v }))}
                  className="!flex !flex-row !flex-nowrap !items-center gap-8 font-source"
                >
                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="yes" />
                    Yes
                  </label>

                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="no" />
                    No
                  </label>
                </RadioGroup>
              </div>

              <div className="flex flex-col gap-4 font-source mb-2">
                <label>Do you want them to be customized for your specific needs?*</label>
                <RadioGroup
                  value={needs.customizeEvents}
                  onValueChange={(v) => {
                    setNeeds((prev) => ({ ...prev, customizeEvents: v }));
                    setErrors((prev) => {
                      const { customizeEvents, ...rest } = prev;
                      return rest;
                    });
                  }}
                  className="!flex !flex-row !flex-nowrap !items-center gap-8 font-source"
                >
                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="yes" />
                    Yes
                  </label>

                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="no" />
                    No
                  </label>
                </RadioGroup>
                {errors.customizeEvents && (
                  <p className="text-xs text-red-600 mt-1 font-source">{errors.customizeEvents}</p>
                )}
              </div>

              <div className="flex flex-col gap-4 font-source mb-2">
                <label>
                  Do you want to become a Global Safe, Green or Smart Zone recognized Free Zone and
                  start the process to become one?
                </label>
                <RadioGroup
                  value={needs.globalCertification}
                  onValueChange={(v) => setNeeds((prev) => ({ ...prev, globalCertification: v }))}
                  className="!flex !flex-row !flex-nowrap !items-center gap-8 font-source"
                >
                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="yes" />
                    Yes
                  </label>

                  <label className="flex items-center gap-2 font-source text-sm">
                    <RadioGroupItem value="no" />
                    No
                  </label>
                </RadioGroup>
                <p className="text-[12px] leading-[16px] font-normal text-[#5F5F5F] font-source">
                  Check for more details www.cwertificationshub.com
                </p>
              </div>
            </div>

            {/* Buttons */}
            {!isDisabled && (
              <div className="mt-12 flex gap-6">
                <GoldButton onClick={handleSave} disabled={isSaving || isLoading || !memberId}>
                  {isSaving ? 'Saving…' : 'Save'}
                </GoldButton>

                <GoldButton
                  onClick={handleSubmit}
                  disabled={isSubmitting || isLoading || !memberId}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Form'}
                </GoldButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
