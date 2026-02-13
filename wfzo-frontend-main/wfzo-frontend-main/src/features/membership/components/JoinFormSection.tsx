'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';

import ContentHeader from '@/shared/components/ContentHeader';
import GoldButton from '@/shared/components/GoldButton';
import { FormSection } from '@/shared/components/FormSection';
import type { FormField, FormValue, DropdownValue as SharedDropdownValue } from '@/shared/components/FormSection/types';
import { toastRef } from '@/lib/utils/toastRef';
import { TOAST_SEVERITY } from '@/lib/constants/toast';

import {
  fetchDropdownValues,
  fetchMemberRegistrationFields,
  submitMemberRegistration,
  type DropdownValue,
  type MemberRegistrationField,
  type MemberRegistrationPayload,
} from '../services/memberRegistration';

interface MembershipFormProps {
  selectedMembership: string | null;
  reference: React.RefObject<HTMLFormElement | null>;
}

const DEFAULT_LOCALE = 'en';
const PRIMARY_USER_TYPE = 'Primary';
const SUCCESS_MESSAGE = 'Registration Successful! Thank you for signing up for World FZO membership. Please check your email for further instructions and updates.';
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const SECTION_LABELS: Record<string, string> = {
  organizationInformation: 'Organization Details',
  userInformation: 'Personal Details',
  consent: '',
};

const SUBSECTION_LABELS: Record<string, string> = {
  primaryContact: 'Primary Contact',
  organizationInformation: 'Organization Contact',
};

function normalizeValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function formatKeyToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function JoinFormSection({ selectedMembership, reference }: MembershipFormProps) {
  const locale = useLocale() || DEFAULT_LOCALE;
  const [fields, setFields] = useState<MemberRegistrationField[]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, DropdownValue[]>>({});
  const [formValues, setFormValues] = useState<Record<string, FormValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const isMountedRef = useRef(true);

  const showToast = useCallback(
    (severity: 'success' | 'error' | 'warn' | 'info', summary: string, detail: string) => {
      toastRef.current?.show({
        severity,
        summary,
        detail,
        life: 4000,
      });
    },
    []
  );

  useEffect(() => {
    if (formValues.primaryNewsLetterSubscription === undefined) {
      setFormValues(prev => ({
        ...prev,
        primaryNewsLetterSubscription: true // ✅ precheck only once
      }));
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadFormConfiguration = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setSubmitSuccess(false);
    try {
      const fetchedFields = await fetchMemberRegistrationFields(locale);
      
      const dropdownCategories = Array.from(
        new Set(
          fetchedFields
            .map((field) => field.dropdownCategory)
            .filter((category): category is string => Boolean(category))
        )
      );

      let dropdownMap: Record<string, DropdownValue[]> = {};
      if (dropdownCategories.length) {
        const dropdownResults = await Promise.all(
          dropdownCategories.map(async (category) => {
            const values = await fetchDropdownValues(category, locale);
            return [category, values] as const;
          })
        );
        dropdownMap = Object.fromEntries(dropdownResults);
      }

      if (!isMountedRef.current) {
        return;
      }

      setFields(fetchedFields);
      setDropdownOptions(dropdownMap);
      setFormValues((prev) => {
        const next: Record<string, FormValue> = {};
        fetchedFields.forEach((field) => {
          const existing = prev[field.fieldKey];
          if (field.fieldType === 'checkbox') {
            next[field.fieldKey] = typeof existing === 'boolean' ? existing : false;
          } 
          else if (field.fieldKey === 'industries') {
            // Initialize industries as an array
            next[field.fieldKey] = Array.isArray(existing) ? existing : [];
          }
          else {
            next[field.fieldKey] = typeof existing === 'string' ? existing : '';
          }
        });
        return next;
      });
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Unable to load registration form.';
      setLoadError(message);
      showToast(TOAST_SEVERITY.ERROR, 'Error', message);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [locale, showToast]);

  useEffect(() => {
    loadFormConfiguration();
  }, [loadFormConfiguration]);

  useEffect(() => {
    if (!selectedMembership || !fields.length) {
      return;
    }
    setFormValues((prev) => {
      const membershipFieldExists = fields.some(
        (field) => field.fieldKey === 'membershipCategory'
      );
      if (!membershipFieldExists) {
        return prev;
      }
      const options = dropdownOptions.membershipCategory;
      if (!options?.length) {
        return prev;
      }
      const normalizedSelected = normalizeValue(selectedMembership);
      const matched = options.find((option) => {
        const normalizedLabel = normalizeValue(option.label);
        const normalizedCode = normalizeValue(option.code);
        return normalizedLabel === normalizedSelected || normalizedCode === normalizedSelected;
      });
      if (!matched) {
        return prev;
      }
      const currentValue = prev.membershipCategory;
      if (typeof currentValue === 'string' && currentValue === matched.code) {
        return prev;
      }
      return {
        ...prev,
        membershipCategory: matched.code,
      };
    });
  }, [selectedMembership, dropdownOptions, fields]);

  const updateFieldValue = useCallback((key: string, value: FormValue) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Clear error when user starts typing
    setErrors((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
  }, []);

  const validateField = useCallback((field: MemberRegistrationField, value: FormValue): string | null => {
    const translation = field.translations.find(t => t.language === locale) ?? field.translations[0];
    const label = translation?.label || formatKeyToLabel(field.fieldKey);
    
    if (field.fieldType === 'checkbox') {
      return null; // Checkboxes are optional
    }
// Handle array values (multi-select dropdowns like industries)
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${label} is required`;
      }
      return null;
    }
    const stringValue = typeof value === 'string' ? value.trim() : '';
    
    // Required field validation
    if (!stringValue) {
      return `${label} is required`;
    }

    // Email validation
    if (field.fieldType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return 'Wrong E-mail format has been entered';
      }
    }

    // URL validation
    if (field.fieldType === 'url') {
      const urlRegex =
        /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;

      if (!urlRegex.test(stringValue)) {
        return 'Please enter a valid website URL';
      }
    }

    // Phone validation
    if (field.fieldType === 'phone') {
      if (stringValue.length < 10) {
        return `Please enter a valid phone number`;
      }
    }

    return null;
  }, [locale]);

  const handleBlur = useCallback((fieldKey: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldKey]: true }));
    
    const field = fields.find(f => f.fieldKey === fieldKey);
    if (field) {
      const error = validateField(field, formValues[fieldKey]);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldKey]: error }));
      }
    }
  }, [fields, formValues, validateField]);

  const getStringValue = useCallback(
    (key: string) => {
      const value = formValues[key];
      return typeof value === 'string' ? value.trim() : '';
    },
    [formValues]
  );

  const getBooleanValue = useCallback(
    (key: string) => {
      const value = formValues[key];
      return typeof value === 'boolean' ? value : false;
    },
    [formValues]
  );
const getArrayValue = useCallback(
    (key: string) => {
      const value = formValues[key];
      return Array.isArray(value) ? value : [];
    },
    [formValues]
  );
  const buildPayload = useCallback((): MemberRegistrationPayload => {
    const organizationName = getStringValue('fullLegalNameOfTheOrganization');
    const organizationType = getStringValue('typeOfTheOrganization');
    const membershipCategory = getStringValue('membershipCategory');
    const websiteUrl = getStringValue('websiteUrl');
    const industriesValue = getArrayValue('industries');
    const organisationContactNumber = getStringValue('organizationContactNumber');

    const primaryFirstName = getStringValue('primaryContactFirstName');
    const primaryLastName = getStringValue('primaryContactLastName');
    const primaryEmail = getStringValue('primaryContactEmail');
    const primaryDesignation = getStringValue('primaryContactDesignation');
    const primaryContactNumber = getStringValue('primaryContactNumber');
    const newsletterSubscription = getBooleanValue('primaryNewsLetterSubscription');

    const consentEntries: Record<string, boolean> = {};
    fields.forEach((field) => {
      if (field.section === 'consent' && field.fieldType === 'checkbox') {
        consentEntries[field.fieldKey] = getBooleanValue(field.fieldKey);
      }
    });
    // Include authorizedPersonDeclaration from organizationInformation
    consentEntries.authorizedPersonDeclaration = getBooleanValue('authorizedPersonDeclaration');

    return {
      memberUsers: [
        {
          username: primaryEmail,
          email: primaryEmail,
          firstName: primaryFirstName,
          lastName: primaryLastName,
          userType: PRIMARY_USER_TYPE,
          designation: primaryDesignation || undefined,
          contactNumber: primaryContactNumber || undefined,
          newsLetterSubscription: newsletterSubscription,
        },
      ],
      category: membershipCategory,
      status: 'pendingFormSubmission',
      organisationInfo: {
        typeOfTheOrganization: organizationType || undefined,
        companyName: organizationName || undefined,
        websiteUrl: websiteUrl || undefined,
        industries: industriesValue.length > 0 ? industriesValue : undefined,        
        position: primaryDesignation || undefined,
        organisationContactNumber: organisationContactNumber || undefined,
      },
      memberConsent: consentEntries,
      featuredMember: false,
      categoryValidation: null,
    };
  }, [fields, getBooleanValue, getStringValue,getArrayValue]);

  const cleanBackendMessage = (msg: string): string => {
  if (!msg) return msg;
 
  // Remove leading nested paths (memberUsers.0.email, memberUsers.0., etc)
  return msg.replace(/^[a-zA-Z0-9_.[\]]+\./, "");
}

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting || submitSuccess) {
        return;
      }

      // Validate all fields
      const newErrors: Record<string, string> = {};
      const newTouched: Record<string, boolean> = {};
      
      fields.forEach((field) => {
        if (field.section === 'title') return; // Titles are not inputs
        newTouched[field.fieldKey] = true;
        const error = validateField(field, formValues[field.fieldKey]);
        if (error) {
          newErrors[field.fieldKey] = error;
        }
      });

      // Validate authorizedPersonDeclaration checkbox
      if (!getBooleanValue('authorizedPersonDeclaration')) {
        newErrors.authorizedPersonDeclaration = "Authorization confirmation is required to proceed with the registration.";
        newTouched.authorizedPersonDeclaration = true;
      }

      setTouchedFields(newTouched);
      setErrors(newErrors);

      // If there are validation errors, don't submit
      if (Object.keys(newErrors).length > 0) {
        // showToast(
        //   'error',
        //   'Validation Error',
        //   'Please correct the errors before submitting.'
        // );
        return;
      }

      

      setIsSubmitting(true);
      try {
        const payload = buildPayload();
        await submitMemberRegistration(payload);

        // Subscribe to newsletter if opted in
        const newsletterSubscription = getBooleanValue('primaryNewsLetterSubscription');
        if (newsletterSubscription && process.env.NEXT_PUBLIC_MAILERLITE_ENABLED === 'true') {
          const primaryEmail = getStringValue('primaryContactEmail');
          try {
            await fetch('/api/mailerlite/subscribers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: primaryEmail }),
            });
          } catch (newsletterError) {
            // Log error but don't fail the registration
            console.error('Newsletter subscription failed:', newsletterError);
          }
        }

        setSubmitSuccess(true);
        showToast('success', 'Success', SUCCESS_MESSAGE);
      } catch (error) {
        setSubmitSuccess(false);
          let rawMessage =
          error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE;
            // console.log("rawMessage", rawMessage);
            
        const message = cleanBackendMessage(rawMessage);
        // console.log("message", message);
        

        showToast('error', 'Error', message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      buildPayload,
      fields,
      formValues,
      isSubmitting,
      showToast,
      submitSuccess,
      validateField,
    ]
  );

  // Convert types for FormSection component
  const sharedFields = fields as unknown as FormField[];
  const sharedDropdownOptions = dropdownOptions as unknown as Record<string, SharedDropdownValue[]>;

  return (
    <section className="px-5 md:px-30 py-10 md:py-20 gap-6">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-8 max-w-[640px]">
          <ContentHeader header="Join Us" description="" />
        </div>

        <div className="flex flex-col-reverse lg:flex-row items-start gap-6 lg:gap-8">
          <form
            ref={reference}
            onSubmit={handleSubmit}
            className="flex flex-col gap-10 flex-1 w-full"
          >
            {loadError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="flex items-start justify-between gap-4">
                  <p>{loadError}</p>
                  <button
                    type="button"
                    onClick={loadFormConfiguration}
                    className="text-sm font-semibold text-red-700 underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : null}

            {isLoading && !fields.length ? (
              <div className="rounded-lg border border-dashed border-neutral-grey-300 p-6 text-sm text-neutral-grey-600">
                Loading form fields...
              </div>
            ) : null}

            {fields.length > 0 && (
              <FormSection
                fields={sharedFields}
                values={formValues}
                dropdownOptions={sharedDropdownOptions}
                locale={locale}
                sectionLabelOverrides={SECTION_LABELS}
                subsectionLabels={SUBSECTION_LABELS}
                readOnly={false}
                errors={errors}
                touchedFields={touchedFields}
                onValueChange={updateFieldValue}
                onBlur={handleBlur}
              />
            )}

            {!isLoading && !fields.length && !loadError ? (
              <div className="rounded-lg border border-dashed border-neutral-grey-300 p-6 text-sm text-neutral-grey-600">
                Form is currently unavailable.
              </div>
            ) : null}

            <div>
              <GoldButton type="submit" disabled={isSubmitting || submitSuccess}>
                {submitSuccess ? 'Submitted' : isSubmitting ? 'Submitting…' : 'Sign up'}
              </GoldButton>
            </div>
          </form>

          <div className="flex-1 w-full aspect-[3/4] max-h-[520px] lg:max-h-[640px] mb-6 lg:mb-0">
            <Image
              className="w-full h-full rounded-2xl object-cover"
              src="/assets/form-image.png"
              alt="Business meeting"
              width={568}
              height={736}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(JoinFormSection);
