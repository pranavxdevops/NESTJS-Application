'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { Country } from 'country-state-city';
import { DynamicForm } from '@/shared/components/DynamicForm';
import { FormSection } from '@/shared/components/FormSection';
import type {
  FormField as SharedFormField,
  DropdownValue as SharedDropdownValue,
} from '@/shared/components/FormSection/types';
import ContentHeader from '@/shared/components/ContentHeader';
import { toastRef } from '@/lib/utils/toastRef';
import { TOAST_SEVERITY } from '@/lib/constants/toast';
import type { FormField, FormValue, DropdownValue } from '@/shared/components/DynamicForm/types';
import {
  fetchPhase2FormFields,
  fetchMemberApplication,
  submitPhase2Application,
  type MemberApplication,
  savePhase2Application,
  fetchAdmissionCriteria,
} from '../services/memberRegistrationPhase2';
import { fetchDropdownValues, fetchMemberRegistrationFields } from '../services/memberRegistration';

interface Phase2FormSectionProps {
  applicationId: string;
}

const DEFAULT_LOCALE = 'en';
const SUCCESS_MESSAGE = 'Submission Successful! Thank you for completing the registration for World FZO membership. Please check your email for further instructions and updates.';
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const SUCCESS_SAVE_MESSAGE ='Application saved successfully.'
export function Phase2FormSection({ applicationId }: Phase2FormSectionProps) {
  const locale = useLocale() || DEFAULT_LOCALE;
  const [fields, setFields] = useState<FormField[]>([]);
  const [phase1Fields, setPhase1Fields] = useState<SharedFormField[]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, DropdownValue[]>>({});
  const [phase1DropdownOptions, setPhase1DropdownOptions] = useState<
    Record<string, SharedDropdownValue[]>
  >({});
  const [initialValues, setInitialValues] = useState<Record<string, FormValue>>({});
  const [phase1Values, setPhase1Values] = useState<Record<string, string | boolean|string[]>>({});
  const [application, setApplication] = useState<MemberApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving,setIsSaving]=useState(false)
  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});
  const isMountedRef = useRef(true);
  // Start disabled until application is loaded and we determine editability
  const [isDisabled, setIsDisabled] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [admissionCriteriaContent, setAdmissionCriteriaContent] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('');

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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadFormConfiguration = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Fetch Phase 1 fields, Phase 2 fields, application data, and admission criteria in parallel
      const [phase1FetchedFields, phase2FetchedFields, appData, admissionCriteria] = await Promise.all([
        fetchMemberRegistrationFields(locale),
        fetchPhase2FormFields(locale),
        fetchMemberApplication(applicationId),
        fetchAdmissionCriteria(),
      ]);

      // Fetch dropdown categories for both Phase 1 and Phase 2
      const allFields = [...phase1FetchedFields, ...phase2FetchedFields];
      const dropdownCategories = Array.from(
        new Set(
          allFields
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

      // Convert Phase 1 fields to SharedFormField format (they have the same structure)
      const phase1SharedFields = phase1FetchedFields as unknown as SharedFormField[];

      setPhase1Fields(phase1SharedFields);
      setFields(phase2FetchedFields);
      setDropdownOptions(dropdownMap);
      setPhase1DropdownOptions(dropdownMap as Record<string, SharedDropdownValue[]>);
      setApplication(appData);
      setAdmissionCriteriaContent(admissionCriteria);
      setIsDisabled(appData.status !== 'pendingFormSubmission');

      // Map application data to Phase 1 field values
      const primaryUser = appData.userSnapshots.find((u) => u.userType === 'Primary');
      const orgInfo = appData.organisationInfo;

      const phase1ValuesMap: Record<string, string | boolean|string[]> = {};

      // Map organization info
      if (orgInfo?.companyName)
        phase1ValuesMap.fullLegalNameOfTheOrganization = orgInfo.companyName;
      if (orgInfo?.typeOfTheOrganization)
        phase1ValuesMap.typeOfTheOrganization = orgInfo.typeOfTheOrganization;

      if (orgInfo?.industries && orgInfo.industries.length > 0) {
        phase1ValuesMap.industries = orgInfo.industries as unknown as string[];
      }

      if (orgInfo?.websiteUrl) phase1ValuesMap.websiteUrl = orgInfo.websiteUrl;
      if (orgInfo?.organisationContactNumber)
        phase1ValuesMap.organizationContactNumber = orgInfo.organisationContactNumber;
      if (appData.category) phase1ValuesMap.membershipCategory = appData.category;
      if (orgInfo?.position) phase1ValuesMap.primaryContactDesignation = orgInfo.position;

      // Map primary user info
      if (primaryUser) {
        if (primaryUser.firstName) phase1ValuesMap.primaryContactFirstName = primaryUser.firstName;
        if (primaryUser.lastName) phase1ValuesMap.primaryContactLastName = primaryUser.lastName;
        if (primaryUser.email) phase1ValuesMap.primaryContactEmail = primaryUser.email;
        if (primaryUser.designation)
          phase1ValuesMap.primaryContactDesignation = primaryUser.designation;
        if (primaryUser.contactNumber)
          phase1ValuesMap.primaryContactNumber = primaryUser.contactNumber;
        phase1ValuesMap.primaryNewsLetterSubscription = primaryUser.newsLetterSubscription ?? false;
      }

      // Map consent fields
      if (appData.memberConsent) {
        Object.entries(appData.memberConsent).forEach(([key, value]) => {
          phase1ValuesMap[key] = value;
        });
      }

      setPhase1Values(phase1ValuesMap);

      // Pre-populate Phase 2 form values from application data when available
      const values: Record<string, FormValue> = {};
      const appRecord = appData as unknown as Record<string, unknown>;
      const orgInfoRecord = appRecord['organisationInfo'] as Record<string, unknown> | undefined;
      const consentRecord = appRecord['memberConsent'] as Record<string, unknown> | undefined;
      const addressRecord = orgInfoRecord?.address as Record<string, unknown> | undefined;

      phase2FetchedFields.forEach((field) => {
        const key = field.fieldKey;
        let value: FormValue = null;

        // Address shortcuts (field keys used by the form)
        // map addressLine1, addressLine2, addressCity, addressState, addressCountry, zip
        if (/addressLine1/i.test(key)) {
          value = (addressRecord?.['line1'] ?? null) as FormValue;
        } else if (/addressLine2/i.test(key)) {
          value = (addressRecord?.['line2'] ?? null) as FormValue;
        } else if (/addressCity/i.test(key) || (/city/i.test(key) && key.toLowerCase().includes('address'))) {
          value = (addressRecord?.['city'] ?? null) as FormValue;
        } else if (/addressState/i.test(key) || (/state|province/i.test(key) && key.toLowerCase().includes('address'))) {
          value = (addressRecord?.['state'] ?? null) as FormValue;
        } else if (/addressCountry/i.test(key) || (/country/i.test(key) && key.toLowerCase().includes('address') && !key.toLowerCase().includes('countrycode'))) {
          value = (addressRecord?.['country'] ?? null) as FormValue;
        } else if (/countryCode/i.test(key)) {
          value = (addressRecord?.['countryCode'] ?? null) as FormValue;
        } else if (/zip/i.test(key) || /postal/i.test(key)) {
          value = (addressRecord?.['zip'] ?? null) as FormValue;
        }

        // Common organisation file/signature fields mapping
        if ((value === null || value === undefined) && orgInfoRecord) {
          if (key === 'logoDocumentUpload' && orgInfoRecord['memberLogoUrl']) {
            value = orgInfoRecord['memberLogoUrl'] as FormValue;
          }
          if (key === 'licesnseDocumentUpload' && orgInfoRecord['memberLicenceUrl']) {
            value = orgInfoRecord['memberLicenceUrl'] as FormValue;
          }
          if (key === 'signatoryName' && orgInfoRecord['signatoryName']) {
            value = orgInfoRecord['signatoryName'] as FormValue;
          }
          if (key === 'signatoryPosition' && orgInfoRecord['signatoryPosition']) {
            value = orgInfoRecord['signatoryPosition'] as FormValue;
          }
          if (key === 'signatureDraw' && orgInfoRecord['signature']) {
            value = orgInfoRecord['signature'] as FormValue;
          }
          // If keys directly map to organisationInfo entries
          if ((value === null || value === undefined) && Object.prototype.hasOwnProperty.call(orgInfoRecord, key)) {
            value = orgInfoRecord[key] as FormValue;
          }
        }

        // Consent booleans
        if ((value === null || value === undefined) && consentRecord && Object.prototype.hasOwnProperty.call(consentRecord, key)) {
          value = consentRecord[key] as FormValue;
        }

        // Top-level fallback from application document
        if ((value === null || value === undefined) && Object.prototype.hasOwnProperty.call(appRecord, key)) {
          value = appRecord[key] as FormValue;
        }

        // Final fallback defaults consistent with DynamicForm
        if (value === null || value === undefined) {
          value = field.fieldType === 'checkbox' ? false : '';
        }

        values[key] = value;
      });

  setInitialValues(values);
  // Initialize countryCode from application data
  setCountryCode((addressRecord?.['countryCode'] as string) || '');
  // set disabled state based on application status
  setIsDisabled(appData.status !== 'pendingFormSubmission');
  // ensure DynamicForm mounts with these initial values
  setFormKey((k) => k + 1);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Unable to load application form.';
      setLoadError(message);
      showToast(TOAST_SEVERITY.ERROR, 'Error', message);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [locale, applicationId, showToast]);

  useEffect(() => {
    loadFormConfiguration();
  }, [loadFormConfiguration]);

  const handleSubmit = useCallback(
    async (values: Record<string, FormValue>) => {
      setIsSubmitting(true);
      try {

        // Validation: Check required upload fields
        const newErrors: Record<string, string> = {};

        if (!values.logoDocumentUpload || typeof values.logoDocumentUpload !== 'string' || values.logoDocumentUpload.trim() === '') {
          newErrors.logoDocumentUpload = 'Company logo is required.';
        }

        if (!values.licesnseDocumentUpload || typeof values.licesnseDocumentUpload !== 'string' || values.licesnseDocumentUpload.trim() === '') {
          newErrors.licesnseDocumentUpload = 'Business license document is required.';
        }

        // Validation: Check consent checkboxes
        if (values.articleOfAssociationConsent !== true) {
          newErrors.articleOfAssociationConsent = 'You must agree to the Articles of Association.';
        }

        if (values.articleOfAssociationCriteriaConsent !== true) {
          newErrors.articleOfAssociationCriteriaConsent = 'You must agree to the Articles of Association criteria.';
        }

        if (values.memberShipFeeConsent !== true) {
          newErrors.memberShipFeeConsent = 'You must agree to the membership fee terms.';
        }

        // If there are validation errors, set them and prevent submission
        if (Object.keys(newErrors).length > 0) {
          setExternalErrors(newErrors);
          setIsSubmitting(false);
          return;
        }

        // Build the Phase 2 payload structure
        const payload = {
          organisationInfo: {
            address: {
              line1: typeof values.addressLine1 === 'string' ? values.addressLine1 : '',
              line2: typeof values.addressLine2 === 'string' ? values.addressLine2 : '',
              city: typeof values.addressCity === 'string' ? values.addressCity : '',
              state: typeof values.addressState === 'string' ? values.addressState : '',
              country: typeof values.addressCountry === 'string' ? values.addressCountry : '',
              countryCode: countryCode,
              zip: typeof values.zip === 'string' ? values.zip : ''
            },
            memberLogoUrl: typeof values.logoDocumentUpload === 'string' ? values.logoDocumentUpload : '',
            memberLicenceUrl:
              typeof values.licesnseDocumentUpload === 'string' ? values.licesnseDocumentUpload : '',
            signatoryName: typeof values.signatoryName === 'string' ? values.signatoryName : '',
            signatoryPosition: typeof values.signatoryPosition === 'string' ? values.signatoryPosition : '',
            signature: typeof values.signatureDraw === 'string' ? values.signatureDraw : '',
          },
          memberConsent: {
            articleOfAssociationConsent: true, // Validated to be true above
            articleOfAssociationCriteriaConsent: true, // Validated to be true above
            memberShipFeeConsent: true, // Validated to be true above
          },
          phase: 'phase2',
        };

        // Ensure memberId is a string to satisfy the API contract
        const memberId = String(application?.memberId ?? '');
        const response = await submitPhase2Application(memberId, payload);
        console.log('Response from backend:', response);
        // Sync to Strapi using the current application state (which has Phase 1 data)
        // merged with the response (which has Phase 2 data)
        const mergedApp: MemberApplication = {
          ...(response as MemberApplication),
          organisationInfo: {
            ...application?.organisationInfo,
            ...(response as MemberApplication)?.organisationInfo,
          },
          userSnapshots: application?.userSnapshots || [],
          category: application?.category || '',
        };
          await syncOrganizationToStrapi(mergedApp, dropdownOptions);
          async function syncOrganizationToStrapi(
            app: MemberApplication | null,
            dropdownOptions: Record<string, DropdownValue[]>
          ) {
            if (!app?.organisationInfo) {

              return;
            }
          const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;
            const strapiToken = process.env.NEXT_PUBLIC_STRAPI_JWT || process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN;
          if (!baseUrl || !strapiToken) {
              throw new Error('Strapi configuration missing');
            }
          const org = app.organisationInfo as any;
          const primaryUser = app.userSnapshots?.find((u) => u.userType === 'Primary') || app.userSnapshots?.[0];



            if (!org.companyName) {
              throw new Error('Company name is required');
            }

            // Build Strapi payload
            const position = primaryUser?.designation || org.position || '';
          // Get industries from org (these are codes like "tech", "finance")
            const orgIndustryCodes = Array.isArray(org.industries) ? org.industries : [];

            // Map codes to labels using dropdown options
            const industriesDropdown = dropdownOptions['industries'] || [];
            const industryLabels = orgIndustryCodes
              .map((code: string) => {
                const option = industriesDropdown.find((opt) => opt.code === code);
                const label = option ? option.label : code; // Fallback to code if label not found
                return label;
              })
              .filter(Boolean);
          // Get logo URL from org
            const logoUrl = org.memberLogoUrl || '';
            // Initial payload with industries as JSON (using labels) and logo URL
            const strapiPayload = {
              data: {
                organizationName: org.companyName,
                slug: org.companyName?.toLowerCase().replace(/\s/g, '-'),              },
            };
          const response = await fetch(`${baseUrl}/api/organizations?status=draft`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${strapiToken}`,
              },
              body: JSON.stringify(strapiPayload),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to sync to Strapi: ${response.status} - ${errorText}`);
            }

          const result = await response.json();

          const organizationId = result?.data?.documentId || result?.data?.id;
          if (!organizationId) {
            throw new Error('Organization ID not returned from Strapi');
          }
          return result;
          }

        // If backend returns the updated application document, update local state
        const updatedApp = response as MemberApplication;
        setApplication(updatedApp);

        // Rebuild initialValues for phase2 fields from the returned document
        const newInitialValues: Record<string, FormValue> = {};
        const updatedRecord = updatedApp as unknown as Record<string, unknown>;
        const orgInfoRecord = updatedRecord['organisationInfo'] as Record<string, unknown> | undefined;
        const consentRecord = updatedRecord['memberConsent'] as Record<string, unknown> | undefined;
        const addressRecord = orgInfoRecord?.address as Record<string, unknown> | undefined;

        fields.forEach((field) => {
          const key = field.fieldKey;
          let value: FormValue = null;

          if (/addressLine1/i.test(key)) {
            value = (addressRecord?.['line1'] ?? null) as FormValue;
          } else if (/addressLine2/i.test(key)) {
            value = (addressRecord?.['line2'] ?? null) as FormValue;
          } else if (/addressCity/i.test(key) || (/city/i.test(key) && key.toLowerCase().includes('address'))) {
            value = (addressRecord?.['city'] ?? null) as FormValue;
          } else if (/addressState/i.test(key) || (/state|province/i.test(key) && key.toLowerCase().includes('address'))) {
            value = (addressRecord?.['state'] ?? null) as FormValue;
          } else if (/addressCountry/i.test(key) || (/country/i.test(key) && key.toLowerCase().includes('address') && !key.toLowerCase().includes('countrycode'))) {
            value = (addressRecord?.['country'] ?? null) as FormValue;
          } else if (/countryCode/i.test(key)) {
            value = (addressRecord?.['countryCode'] ?? null) as FormValue;
          } else if (/zip/i.test(key) || /postal/i.test(key)) {
            value = (addressRecord?.['zip'] ?? null) as FormValue;
          }

          if ((value === null || value === undefined) && orgInfoRecord) {
            if (key === 'logoDocumentUpload' && orgInfoRecord['memberLogoUrl']) {
              value = orgInfoRecord['memberLogoUrl'] as FormValue;
            }
            if (key === 'licesnseDocumentUpload' && orgInfoRecord['memberLicenceUrl']) {
              value = orgInfoRecord['memberLicenceUrl'] as FormValue;
            }
            if (key === 'signatoryName' && orgInfoRecord['signatoryName']) {
              value = orgInfoRecord['signatoryName'] as FormValue;
            }
            if (key === 'signatoryPosition' && orgInfoRecord['signatoryPosition']) {
              value = orgInfoRecord['signatoryPosition'] as FormValue;
            }
            if (key === 'signatureDraw' && orgInfoRecord['signature']) {
              value = orgInfoRecord['signature'] as FormValue;
            }
            if ((value === null || value === undefined) && Object.prototype.hasOwnProperty.call(orgInfoRecord, key)) {
              value = orgInfoRecord[key] as FormValue;
            }
          }

          if ((value === null || value === undefined) && consentRecord && Object.prototype.hasOwnProperty.call(consentRecord, key)) {
            value = consentRecord[key] as FormValue;
          }

          if ((value === null || value === undefined) && Object.prototype.hasOwnProperty.call(updatedRecord, key)) {
            value = updatedRecord[key] as FormValue;
          }

          if (value === null || value === undefined) {
            value = field.fieldType === 'checkbox' ? false : '';
          }

          newInitialValues[key] = value;
        });

        setInitialValues(newInitialValues);
        // Update countryCode from response
        setCountryCode((addressRecord?.['countryCode'] as string) || '');
        // remount DynamicForm so it picks up updated initial values
        setFormKey((k) => k + 1);

        setIsDisabled(updatedApp.status !== 'pendingFormSubmission');
        showToast(TOAST_SEVERITY.SUCCESS, 'Success', SUCCESS_MESSAGE);
      } catch (error) {
        console.error('Form submission error:', error);
        const message = error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE;
        showToast(TOAST_SEVERITY.ERROR, 'Error', message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [application, showToast, fields, countryCode]
  );
  const handleSave = useCallback(
  async (values: Record<string, FormValue>) => {
    setIsSaving(true)
    try {
      const payload = {
        organisationInfo: {
          address: {
            line1: values.addressLine1 || "",
            line2: values.addressLine2 || "",
            city: values.addressCity || "",
            state: values.addressState || "",
            country: values.addressCountry || "",
            countryCode: countryCode,
            zip: values.zip || ""
          },
          memberLogoUrl: values.logoDocumentUpload || "",
          memberLicenceUrl: values.licesnseDocumentUpload || "",
          signatoryName: values.signatoryName || "",
          signatoryPosition: values.signatoryPosition || "",
          signature: values.signatureDraw || "",
        },
        memberConsent: {
          articleOfAssociationConsent: values.articleOfAssociationConsent || false,
          articleOfAssociationCriteriaConsent: values.articleOfAssociationCriteriaConsent || false,
          memberShipFeeConsent: values.memberShipFeeConsent || false,
        },
        phase: "phase2",
        status: "draft",
      };

      const memberId = String(application?.memberId);
      if (!memberId) throw new Error("Missing memberId");
      const response = await savePhase2Application(memberId, payload);
      showToast(TOAST_SEVERITY.SUCCESS, 'Success', SUCCESS_SAVE_MESSAGE);
    } catch (err) {
      showToast("error", "Error", "Unable to save. Please try again.");
    }
    finally {
        setIsSaving(false);
      }
  },
  [application, countryCode, showToast]
);

  // Handle field changes to track country and derive countryCode
  const handleFieldChange = useCallback((fieldKey: string, value: FormValue) => {
    // When addressCountry field changes, derive the countryCode
    if (fieldKey === 'addressCountry' && typeof value === 'string') {
      const countries = Country.getAllCountries();
      const country = countries.find(c => c.name === value || c.isoCode === value);
      if (country) {
        setCountryCode(country.isoCode);
      } else {
        setCountryCode('');
      }
    }
  }, []);

  const SECTION_LABELS: Record<string, string> = {
    organizationInformation: 'Organization Details',
    userInformation: 'Personal Details',
    consent: '',
  };

  const SUBSECTION_LABELS: Record<string, string> = {
    primaryContact: 'Primary Contact',
    organizationInformation: 'Organization Contact',
  };

  return (
    <section className="px-5 md:px-30 py-10 md:py-20 gap-6">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-8 max-w-[640px]">
          <ContentHeader
            header="Complete your information"
            description={
              application
                ? `Welcome back! Continue your ${application.category} membership application.`
                : ''
            }
          />
        </div>

        <div className="flex flex-col-reverse lg:flex-row items-start gap-6 lg:gap-8">
          <div className="flex-1 w-full">
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

            {isLoading ? (
              <div className="rounded-lg border border-dashed border-neutral-grey-300 p-6 text-sm text-neutral-grey-600">
                Loading application form...
              </div>
            ) : null}

            {!isLoading && !loadError && application && (
              <>
                {/* Phase 1 Data - Read Only */}
                {phase1Fields.length > 0 && (
                  <div className="mb-10">
                    <FormSection
                      fields={phase1Fields}
                      values={phase1Values}
                      dropdownOptions={phase1DropdownOptions}
                      locale={locale}
                      sectionLabelOverrides={SECTION_LABELS}
                      subsectionLabels={SUBSECTION_LABELS}
                      readOnly={true}
                    />
                  </div>
                )}

                {/* Phase 2 Form - Editable */}
                {fields.length > 0 ? (
                  <DynamicForm
                    key={formKey}
                    fields={fields}
                    dropdownOptions={dropdownOptions}
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    submitButtonText="Submit Form"
                    onSave={handleSave}
                    saveButtonText="Save"
                    isSubmitting={isSubmitting}
                    isSaving={isSaving}
                    isDisabled={isDisabled}
                    locale={locale}
                    externalErrors={externalErrors}
                    admissionCriteriaContent={admissionCriteriaContent}
                    onFieldChange={handleFieldChange}
                    memberId={String(application?.memberId ?? '')}
                    onExternalErrorClear={(key) => {
                      setExternalErrors((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-neutral-grey-300 p-6 text-sm text-neutral-grey-600">
                    Form is currently unavailable.
                  </div>
                )}
              </>
            )}
          </div>

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
