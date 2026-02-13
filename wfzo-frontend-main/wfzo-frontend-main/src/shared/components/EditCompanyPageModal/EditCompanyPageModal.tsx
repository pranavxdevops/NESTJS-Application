'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import Portal from '@/shared/components/Portal';
import type { FormField, DropdownValue, FormValue } from '@/shared/components/FormSection/types';
import { CustomFileUploadField } from '../DynamicForm/CustomFileUploadField';
import CompanyPageTab from './CompanyPageTab';
import CompanyDetailsTab from './CompanyDetailsTab';
import { useAuth } from '@/lib/auth/useAuth';
import GoldButton from '@/shared/components/GoldButton';
import {
  RemoveDocument,
  uploadDocument,
  type DocumentPurpose,
} from '@/features/membership/services/documentUpload';
import LightPressButton from '../LightPressButton';
import { useRouter } from 'next/navigation';
import UnsavedChangesModal from '@/features/events/dashboard/component/UnsavedChangesModal';

function DisabledButton({ children, ...props }: { children: React.ReactNode; [key: string]: any }) {
  const baseClasses = `
    flex items-center justify-center gap-2 px-6 py-1.5 rounded-[11px]
    border-t border-r border-l border-gray-300
    bg-gradient-to-b from-gray-400 to-gray-300
  `;

  const wrapperClasses = `
    inline-flex flex-col items-start gap-2 p-0.5 rounded-xl bg-gray-400 text-gray-600 font-source text-base font-semibold leading-6
  `;

  return (
    <button className={wrapperClasses} disabled {...props}>
      <div className={baseClasses}>{children}</div>
    </button>
  );
}

interface Section {
  id: string;
  title: string;
  description: string;
  imageFile: File | null;
  imagePreviewUrl: string;
  imagePosition: 'left' | 'right';
  image: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDraftSave: () => void;
   onApprovalStatusChange?: (pending: boolean) => void; 
  fields: FormField[];
  dropdownOptions: Record<string, DropdownValue[]>;
  companyName?: string; // 👈 PASS THIS FROM PROFILE
}

export default function EditCompanyPageModal({
  isOpen,
  onClose,
  onDraftSave,
  onApprovalStatusChange,
  fields = [],
  dropdownOptions = {},
  companyName,
}: Props) {
  const [activeTab, setActiveTab] = useState<'company-page' | 'company-details'>('company-page');

  const router = useRouter();

  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [companyDetailsErrors, setCompanyDetailsErrors] = useState<Record<string, string>>({});

  const [companyDetailsTouched, setCompanyDetailsTouched] = useState<Record<string, boolean>>({});


  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [isDraftRequest, setIsDraftRequest] = useState(false);

  const REQUIRED_COMPANY_DETAILS_FIELDS = [
    'industries',
    'websiteUrl',
    'organizationContactNumber',

    'primaryContactNumber',
    'primaryContactDesignation',
    'organizationLogo',
  ] as const;
  const [shortIntro, setShortIntro] = useState('');
  const [sections, setSections] = useState<Section[]>([
    {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      imageFile: null,
      imagePreviewUrl: '',
      imagePosition: 'right',
      image: null,
    },
  ]);

  const validateCompanyDetails = () => {
    const newErrors: Record<string, string> = {};

    REQUIRED_COMPANY_DETAILS_FIELDS.forEach((key) => {
      if (key === 'organizationLogo') return;

      const field = companyDetailsFields.find((f) => f.fieldKey === key);
      if (!field) return;

      const error = validateField(field, values[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    // ✅ Logo validation MUST be before return
    if (!logoUrl && !logoPreviewUrl) {
      newErrors.organizationLogo = 'Company logo is required';
    }

    // ✅ Social validation
    const socialErrors = validateSocialLinks();

    const mergedErrors = {
      ...newErrors,
      ...socialErrors,
    };

    setCompanyDetailsErrors(mergedErrors);

    return Object.keys(mergedErrors).length === 0;
  };

  const validateField = (field: FormField, value: FormValue): string | null => {
    const label = field.translations?.[0]?.label ?? field.fieldKey;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${label} is required`;
      }
      return null;
    }

    const stringValue = typeof value === 'string' ? value.trim() : '';

    // Required
    if (!stringValue) {
      return `${label} is required`;
    }

    // URL
    if (field.fieldType === 'url') {
      let normalized = stringValue;

      // Auto-add protocol if missing
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
      }

      const urlRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;

      if (!urlRegex.test(normalized)) {
        return 'Please enter a valid website URL';
      }
    }

    // Phone
    if (field.fieldType === 'phone') {
      const digits = stringValue.replace(/\D/g, '');
      if (digits.length < 10) {
        return 'Please enter a valid phone number';
      }
    }

    return null;
  };

  const handleCompanyDetailsBlur = (fieldKey: string) => {
    setCompanyDetailsTouched((prev) => ({
      ...prev,
      [fieldKey]: true,
    }));

 if (fieldKey in socialLinks) {
    const socialErrors = validateSocialLinks();

    setCompanyDetailsErrors((prev) => ({
      ...prev,
      [fieldKey]: socialErrors[fieldKey] || '',
    }));

    return;
  }


    const field = companyDetailsFields.find((f) => f.fieldKey === fieldKey);

    if (!field) return;

    const error = validateField(field, values[fieldKey]);

    setCompanyDetailsErrors((prev) => ({
      ...prev,
      [fieldKey]: error || '',
    }));
  };

  const [companyPageErrors, setCompanyPageErrors] = useState<{
    shortIntro?: string;
    companyImage?: string;
    sections?: string;
  }>({});
  useEffect(() => {
    if (shortIntro.trim()) {
      setCompanyPageErrors((prev) => {
        if (!prev.shortIntro) return prev;
        const { shortIntro, ...rest } = prev;
        return rest;
      });
    }
  }, [shortIntro]);

  const validateCompanyPage = () => {
    const errors: typeof companyPageErrors = {};

    if (!shortIntro.trim()) {
      errors.shortIntro = 'Company introduction is required';
    }

    if (!pageImagePreviewUrl) {
      errors.companyImage = 'Company image is required';
    }

    if (sections.length === 0) {
      errors.sections = 'At least one section is required';
    } else {
      const hasInvalidSection = sections.some((s, index) => {
        return !s.title.trim() || !s.description.trim() || !s.imagePreviewUrl;
      });

      if (hasInvalidSection) {
        errors.sections = 'Each section must have a title, paragraph text, and image';
      }
    }

    setCompanyPageErrors(errors);
    return Object.keys(errors).length === 0;
  };

  //const[hasChanges,setHasChanges]=useState(false)
  const [hasCompanydetailsChanges, setHasCompanydetailsChanges] = useState(false);
  const [hasCompanyPageChanges, setHasCompanyPageChanges] = useState(false);

  const hasUnsavedChanges = hasCompanyPageChanges || hasCompanydetailsChanges;

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  };

  const markAsChanged = () => {
    if (activeTab === 'company-details') {
      setHasCompanydetailsChanges(true);
    }
    if (activeTab === 'company-page') {
      setHasCompanyPageChanges(true);
    }
  };

  const unsavedModalActions =
    activeTab === 'company-page' || activeTab === 'company-details'
      ? {
          secondaryAction: {
            label: 'Save as Draft',
            onClick: async () => {
              setShowUnsavedModal(false);
              await handleSaveDraft();
              onClose();
            },
          },
          primaryAction: {
            label: 'Exit without saving',
            onClick: () => {
              setShowUnsavedModal(false);
              onClose();
            },
          },
        }
      : {
          secondaryAction: {
            label: 'Stay on this page',
            onClick: () => {
              setShowUnsavedModal(false);
            },
          },
          primaryAction: {
            label: 'Exit without saving',
            onClick: () => {
              setShowUnsavedModal(false);
              onClose();
            },
          },
        };

  const [companyStatus, setCompanyStatus] = useState<
    'Draft' | 'Pending' | 'Rejected' | 'Approved' | 'Published' | null
  >(null);
  const isCompanyPagePending = companyStatus === 'Pending';

const isAnyApprovalPending = isRequestPending || companyStatus === 'Pending';
useEffect(() => {
  onApprovalStatusChange?.(isAnyApprovalPending);
}, [isAnyApprovalPending]);

  const isUpdateEnabled =
    (activeTab === 'company-page' && (hasCompanyPageChanges || companyStatus === 'Draft')) ||
      (activeTab === 'company-details' && (hasCompanydetailsChanges || isDraftRequest) && !isRequestPending);

  const handleSaveDraft = async () => {
  if (!isSaveDraftEnabled) return;

  try {
      setCompanyDetailsErrors({});
    setCompanyPageErrors({});
    

    if (activeTab === 'company-page') {
      await updateCompanyPage('Draft');
      setHasCompanyPageChanges(false);
    }

    if (activeTab === 'company-details') {
      await saveCompanyDetailsDraft();
      setHasCompanydetailsChanges(false);
    }

    onDraftSave();
    onClose();

  } catch (error) {
    console.error('❌ Save draft failed', error);
  }
};


  const READ_ONLY_KEYS = ['fullLegalNameOfTheOrganization', 'primaryContactEmail', 'primaryContactFirstName', 'primaryContactLastName'];

  const companyDetailsFields: FormField[] = fields.filter(
    (field) =>
      field.fieldType !== 'checkbox' &&
      field.section !== 'consent' &&
      field.fieldKey !== 'authorizedPersonDeclaration' &&
      field.fieldKey !== 'membershipCategory'
  )
  .map((field) =>
    READ_ONLY_KEYS.includes(field.fieldKey) ? { ...field, readOnly: true } : field
  );

  // Group by section
  const fieldsBySection = companyDetailsFields.reduce<Record<string, FormField[]>>((acc, field) => {
    if (!acc[field.section]) acc[field.section] = [];
    acc[field.section].push(field);
    return acc;
  }, {});

  // Company Page states
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    x: '',
    linkedin: '',
    youtube: '',
  });

  const validateSocialLinks = () => {
  const errors: Record<string, string> = {};

  const urlRegex =
    /^(https?:\/\/)(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;

    Object.entries(socialLinks).forEach(([key, value]) => {
      if (value && !urlRegex.test(value.trim())) {
        errors[key] = 'Please enter a valid URL';
      }
    });

  return errors;
};

useEffect(() => {
  const socialErrors = validateSocialLinks();

  setCompanyDetailsErrors((prev) => ({
    ...prev,
    ...socialErrors,
  }));
}, [socialLinks]);


  const handlePreviewClick = () => {
    if (!companyName) {
      console.warn('Company name missing for preview');
      return;
    }
    router.push(`/membership/members-directory/${companyName}`);
  };

  const [socialMediaHandle, setSocialMediaHandle] = useState<{ title: string; url: string }[]>([]);

  const buildSocialMediaHandleArray = () => {
    return Object.entries(socialLinks)
      .filter(([_, url]) => url && url.trim() !== '')
      .map(([title, url]) => ({
        title,
        url,
      }));
  };

  // Logo (Company Details tab)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [logoFileName, setLogoFileName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isLogoRemoved, setIsLogoRemoved] = useState(false);
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string>('');
  // Company Page Image
  const [pageImagePreviewUrl, setPageImagePreviewUrl] = useState('');
  const [pageImageFileName, setPageImageFileName] = useState('');
  const [pageImageFile, setPageImageFile] = useState<File | null>(null);

  // For fetch / update / routing
  const [organizationDocumentId, setOrganizationDocumentId] = useState<string | null>(null);

  // For upload ONLY
  const [organizationNumericId, setOrganizationNumericId] = useState<number | null>(null);
  const [currentLogoId, setCurrentLogoId] = useState<number | null>(null);
  const [currentCompanyImageId, setCurrentCompanyImageId] = useState<number | null>(null);

  const hasCompanyPageData = () => {
    const hasIntro = shortIntro.trim().length > 0;
    const hasImage = !!pageImagePreviewUrl;
    const hasValidSection = sections.some(
      (s) => s.title.trim() || s.description.trim() || s.imagePreviewUrl
    );

    return hasIntro || hasImage || hasValidSection;
  };
  const isSaveDraftEnabled =
      (activeTab === 'company-page' && hasCompanyPageChanges ) ||
  (activeTab === 'company-details' && hasCompanydetailsChanges);

  const handleLogoRemove = async () => {
    try {
      await RemoveDocument(logoUrl); // remove from storage

      setLogoUrl('');
      setLogoPreviewUrl('');
      setLogoFileName('');
      setLogoFile(null);
      setIsLogoRemoved(true);
      markAsChanged();
    } catch (err) {
      console.error('Failed to remove logo', err);
    }
  };

  const handlePageImageSelect = (file: File) => {
    setPageImageFile(file);
    setPageImageFileName(file.name);
    setPageImagePreviewUrl(URL.createObjectURL(file));
    setCompanyPageErrors((prev) => {
      if (!prev.companyImage) return prev;
      const { companyImage, ...rest } = prev;
      return rest;
    });
    markAsChanged();
  };

  const handlePageImageRemove = () => {
    setPageImageFile(null);
    setPageImageFileName('');
    setPageImagePreviewUrl('');
    setCurrentCompanyImageId(null);
    markAsChanged();
  };
  useEffect(() => {
    const hasValidSection = sections.some(
      (s) => s.title.trim() && s.description.trim() && s.imagePreviewUrl
    );

    if (hasValidSection) {
      setCompanyPageErrors((prev) => {
        if (!prev.sections) return prev;
        const { sections, ...rest } = prev;
        return rest;
      });
    }
  }, [sections]);

  const handleLogoSelect = async (file: File) => {
    try {
      setLogoPreviewUrl(URL.createObjectURL(file));
      setLogoFileName(file.name);
      setCompanyDetailsErrors((prev) => {
        const { organizationLogo, ...rest } = prev;
        return rest;
      });

      const response = await uploadDocument(file, 'member-logo');

      setLogoUrl(response.publicUrl);
      setLogoPreviewUrl(response.publicUrl);
    } catch (error) {
      console.error('Logo upload failed', error);
    }
  };

  const mapSocialMediaHandleToLinks = (handles: { title: string; url: string }[] = []) => {
    const links = {
      facebook: '',
      linkedin: '',
      x: '',
      youtube: '',
    };

    handles.forEach(({ title, url }) => {
      if (title in links) {
        links[title as keyof typeof links] = url;
      }
    });

    return links;
  };

  const { member, isLoading } = useAuth();
  const memberId = member?.memberId;
  console.log(member);

  useEffect(() => {
    if (isLoading || !member?.organisationInfo) return;

    const org = pendingRequest ?? member.organisationInfo;
    

    console.log(org);
    console.log('Primary contact number:', member.userSnapshots?.[0]?.contactNumber);
    console.log(member?.organisationInfo?.companyName);

    setValues({
      fullLegalNameOfTheOrganization: org.companyName ?? '',
      typeOfTheOrganization: org.typeOfTheOrganization ?? '',
      industries: org.industries ?? [],
      websiteUrl: org.websiteUrl ?? '',
      organizationContactNumber: org.organisationContactNumber ?? '',

      addressLine1: org.address?.line1 ?? '',
      addressCity: org.address?.city ?? '',
      addressState: org.address?.state ?? '',
      addressCountry: org.address?.country ?? '',

      primaryContactDesignation: org.position ??
  member.organisationInfo?.position ??
  '',

      primaryContactFirstName: member.userSnapshots?.[0]?.firstName ?? '',
      primaryContactLastName: member.userSnapshots?.[0]?.lastName ?? '',
      primaryContactEmail: member.userSnapshots?.[0]?.email ?? '',
      primaryContactNumber: org.primaryContactNumber ??
    member.userSnapshots?.[0]?.contactNumber ??
    '',
      organizationLogo: org.logoId ?? null,
    });
   const handles =
   pendingRequest?.socialMediaHandle ??
   member.organisationInfo?.socialMediaHandle ??
   [];

setSocialLinks(mapSocialMediaHandleToLinks(handles));

    const logoSource =
 pendingRequest
    ? pendingRequest.memberLogoUrl 
    : member.organisationInfo.memberLogoUrl;

if (logoSource) {
  setLogoUrl(logoSource);
  setLogoPreviewUrl(logoSource);
} else {
  
  setLogoUrl('');
  setLogoPreviewUrl('');
}
  }, [isLoading, member, pendingRequest]);

  useEffect(() => {
    if (isOpen) {
      setHasCompanyPageChanges(false);
       if (!isDraftRequest) {
      setHasCompanydetailsChanges(false);
    }
      setCompanyDetailsTouched({});
      setCompanyDetailsErrors({});
      setCompanyPageErrors({});
    }
  }, [isOpen]);

  const updateCompanyDetails = async () => {
    const normalizedWebsite =
      typeof values.websiteUrl === 'string' &&
      values.websiteUrl &&
      !/^https?:\/\//i.test(values.websiteUrl)
        ? `https://${values.websiteUrl}`
        : values.websiteUrl;

    if (!member?.organisationInfo) return;
console.log("Logo",logoUrl);

    const payload = {
      organisationInfo: {
        companyName: values.fullLegalNameOfTheOrganization,
        typeOfTheOrganization: values.typeOfTheOrganization,
        websiteUrl: normalizedWebsite,
        industries: values.industries,
        organisationContactNumber: values.organizationContactNumber,
        position: values.primaryContactDesignation,

        address: {
          line1: values.addressLine1,
          city: values.addressCity,
          state: values.addressState || '',
          country: values.addressCountry,
        },
        // ✅ SOCIAL LINKS BELONG TO DB
        socialMediaHandle: buildSocialMediaHandleArray(),

        memberLogoUrl: logoUrl,
      },
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')}/wfzo/api/v1/member/update/${memberId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const status = res.status;
      const errorText = await res.text();
      console.error('❌ BACKEND ERROR:', status, errorText);
      throw new Error('Company details update failed');
    }
  };

  const fetchOrganisationFromStrapi = async () => {
    if (!member?.organisationInfo?.companyName) {
      throw new Error('Company name missing');
    }

    const companyNameForStrapi = encodeURIComponent(member?.organisationInfo?.companyName || '');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/organizations?status=draft&filters[organizationName][$eq]=${companyNameForStrapi}&populate[companyImage]=true
&populate[organization][populate][image][populate]=image`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('Failed to fetch organisation from Strapi:', err);
      throw new Error('Organisation fetch failed');
    }

    const data = await res.json();

    return data.data?.[0];
  };
  const fetchPublishedOrganisationFromStrapi = async () => {
    if (!member?.organisationInfo?.companyName) {
      throw new Error('Company name missing');
    }

    const companyNameForStrapi = encodeURIComponent(member?.organisationInfo?.companyName || '');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/organizations?filters[organizationName][$eq]=${companyNameForStrapi}&populate[companyImage]=true
&populate[organization][populate][image][populate]=image`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('Failed to fetch organisation from Strapi:', err);
      throw new Error('Organisation fetch failed');
    }

    const data = await res.json();

    return data.data?.[0];
  };

  //Strapi
  useEffect(() => {
    if (!isOpen || !member?.organisationInfo?.companyName) return;

    loadCompanyPageFromStrapi();
  }, [isOpen, member]);

  const loadCompanyPageFromStrapi = async () => {
    const organisation =
      (await fetchOrganisationFromStrapi()) ?? (await fetchPublishedOrganisationFromStrapi());
    if (!organisation) return;

    console.log('LOADED ORG:', organisation);

    /* -------- Company Intro -------- */
    setShortIntro(organisation.companyIntro ?? '');
    setCompanyStatus(organisation.companyStatus);

    /* -------- Company Image -------- */
    if (organisation.companyImage?.url) {
      const imgUrl = organisation.companyImage.url;

      setCurrentCompanyImageId(organisation.companyImage.id);
      setPageImagePreviewUrl(
        imgUrl.startsWith('http')
          ? imgUrl
          : `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${imgUrl}`
      );
      setPageImageFileName('Existing Image');
    }

    /* -------- Sections -------- */
    const loadedSections = (organisation.organization ?? []).map((item: any) => {
      const media = item.image?.image; // 👈 THIS is the key fix
      const fullImageUrl = media?.url
        ? media.url.startsWith('http')
          ? media.url
          : `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}${media.url}`
        : '';

      return {
        id: String(item.id),
        title: item.title ?? '',
        description: item.description ?? '',
        imagePosition: item.imagePosition ?? 'right',
        imageFile: null,
        imagePreviewUrl: fullImageUrl,
        image: media?.id ?? null,
      };
    });

    setSections(loadedSections);
  };

  const uploadImageToStrapi = async (file: File) => {
    const formData = new FormData();
    formData.append('files', file);

    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`,
      },
      body: formData,
    });

    const data = await res.json();
    return data[0].id; // media ID
  };

  const buildSectionsPayload = async () => {
    return Promise.all(
      sections
    .filter(
      (section) =>
        section.title.trim() ||
        section.description.trim() ||
        section.imageFile ||
        section.image
    ).map(async (section) => {
        let imageComponent = null;

        if (section.imageFile) {
          const mediaId = await uploadImageToStrapi(section.imageFile);

          imageComponent = {
            image: mediaId, // ✅ media ID
            alternateText: '',
            href: '',
          };
        }
        // ✅ If no new image, KEEP existing one
        else if (section.image && section.imagePreviewUrl) {
          imageComponent = {
            image: section.image,
            alternateText: '',
            href: '',
          };
        }
        //const numericId = Number(section.id);

        return {
          //...(Number.isInteger(numericId) ? { id: numericId } : {}),
          title: section.title,
          description: section.description,
          imagePosition: section.imagePosition,
          ...(imageComponent ? { image: imageComponent } : {}),
        };
      })
    );
  };

  const updateCompanyPage = async (companyStatus: 'Draft' | 'Pending') => {
    const organisation = await fetchOrganisationFromStrapi();
    if (!organisation || typeof organisation.id !== 'number') {
      console.error('Invalid Strapi organisation:', organisation);
      throw new Error('Invalid organisation ID');
    }
    const organisationId = organisation.documentId;
    console.log(organisationId);

    if (!organisationId) return;

    // 1️⃣ Build section payload (uploads section images)
    const sectionsPayload =
  sections.length === 0
    ? []
    : await buildSectionsPayload();
    // 2️⃣ Upload company image ONLY if selected
    let companyImageId = null;

    if (pageImageFile) {
      companyImageId = await uploadImageToStrapi(pageImageFile);
    }
else if (pageImagePreviewUrl) {
  companyImageId = currentCompanyImageId;
}
    // 3️⃣ Final payload
    const payload = {
      data: {
        companyIntro: shortIntro,
        companyImage: companyImageId,
        organization: sectionsPayload,
        companyStatus: companyStatus,
      },
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/organizations/${organisationId}?status=draft`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('STRAPI ERROR:', err);
      throw new Error('Company page update failed');
    }
  };

  console.log(values);
  
const submitCompanyDetailsRequestToAdmin = async () => {
  if (!member?.organisationInfo) return;

    const payload = {
    organisationInfo: {
  ...(values.fullLegalNameOfTheOrganization && { companyName: values.fullLegalNameOfTheOrganization }),

  ...(values.typeOfTheOrganization && { typeOfTheOrganization: values.typeOfTheOrganization }),
  ...(values.industries && { industries: values.industries }),
  ...(values.websiteUrl && { websiteUrl: values.websiteUrl }),
  ...(values.organizationContactNumber && { organisationContactNumber: values.organizationContactNumber }),
  ...(values.primaryContactDesignation && { position: values.primaryContactDesignation }),
  ...(values.primaryContactNumber && { primaryContactNumber: values.primaryContactNumber }),
  ...(isLogoRemoved
  ? { memberLogoUrl: null }
  : logoUrl
  ? { memberLogoUrl: logoUrl }
  : {}),
   ...(buildSocialMediaHandleArray().length > 0 && {
        socialMediaHandle: buildSocialMediaHandleArray()
      })
},
    memberId: memberId
  };
  const res = await fetch(
    `/api/requests`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    throw new Error("Request submission failed");
  }
   const data = await res.json();
   
 
   
};
const saveCompanyDetailsDraft = async () => {
  if (!member?.organisationInfo) return;

  const payload = {
    organisationInfo: {
      ...(values.fullLegalNameOfTheOrganization && { companyName: values.fullLegalNameOfTheOrganization }),
      ...(values.typeOfTheOrganization && { typeOfTheOrganization: values.typeOfTheOrganization }),
      ...(values.industries && { industries: values.industries }),
      ...(values.websiteUrl && { websiteUrl: values.websiteUrl }),
      ...(values.organizationContactNumber && { organisationContactNumber: values.organizationContactNumber }),
      ...(values.primaryContactDesignation && { position: values.primaryContactDesignation }),
      ...(values.primaryContactNumber && { primaryContactNumber: values.primaryContactNumber }),
      ...(isLogoRemoved
  ? { memberLogoUrl: null } 
  : logoUrl
  ? { memberLogoUrl: logoUrl }
  : {}),
      ...(buildSocialMediaHandleArray().length > 0 && {
        socialMediaHandle: buildSocialMediaHandleArray()
      })
    },
    memberId: memberId
  };

  const res = await fetch(
    `/api/requests/draft`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    throw new Error("Draft save failed");
  }

  console.log("✅ Company details saved as draft");
};





const fetchRequestsByMemberId = async () => {
  if (!memberId) return;

  try {
    const res = await fetch(
      `/api/requests/member/${memberId}`
    );

    if (!res.ok) return;

    const data = await res.json();

    const pending = data.find((r: any) => r.requestStatus === 'PENDING');
    const drafts = data
  .filter((r: any) => r.requestStatus === 'DRAFT')
  .sort((a: any, b: any) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

const latestDraft = drafts[0];

      if (pending) {
      setPendingRequest(pending.organisationInfo);
      setIsRequestPending(true);
      setIsDraftRequest(false);
    } 
    else if (latestDraft) {
      setPendingRequest(latestDraft.organisationInfo);
      setIsDraftRequest(true);
      setIsRequestPending(false);
      setHasCompanydetailsChanges(true);
    } 
    else {
      setPendingRequest(null);
      setIsRequestPending(false);
      setIsDraftRequest(false);
    }

  } catch (error) {
    console.error('Failed to fetch  request', error);
  }
};





useEffect(() => {
  if (isOpen && memberId) {
    fetchRequestsByMemberId();
  }
}, [isOpen, memberId]);






  const handleUpdateClick = async () => {
    try {
      if (activeTab === 'company-details') {
        // 1️⃣ Mark all required fields as touched
        const touched: Record<string, boolean> = {};
        REQUIRED_COMPANY_DETAILS_FIELDS.forEach((key) => {
          touched[key] = true;
        });
        setCompanyDetailsTouched(touched);

        Object.keys(socialLinks).forEach((key) => {
          touched[key] = true;
        });
        setCompanyDetailsTouched(touched);
        
        const isValid = validateCompanyDetails();
        if (!isValid) return; 
        await submitCompanyDetailsRequestToAdmin();
        console.log('✅ Company details updated');
        onClose();
      }

      if (activeTab === 'company-page') {
        const isValid = validateCompanyPage();
        if (!isValid) return;

        await updateCompanyPage('Pending');
        console.log('✅ Company page updated');
        onClose();
      }
    } catch (error) {
      console.error('❌ Update failed', error);
    }
  };

  console.log(values);

  console.log('ORG ID BEFORE CLICK:', organizationNumericId);
  console.log('VALUES STATE', values);
  if (!isOpen) return null;

  return (
    <Portal>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9999]  flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
        onClick={handleAttemptClose}
      >
        {/* Modal Box */}
        <div
          className="w-full max-w-[850px] max-h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex items-center px-6 py-4  bg-[#FCFAF8] ">
            <button
              onClick={handleAttemptClose}
              className="absolute left-6 flex items-center text-gray-700 hover:text-black"
            >
              <ArrowLeft />
            </button>

            {/* Centered Title */}

            {activeTab==='company-page' ?(
              <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold font-source ">
              Edit Company Page
            </h2>
            ):(
              <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold font-source ">
              Edit Company Details
            </h2>
            )}
            

            {/* Right-aligned Close Button */}
            <button onClick={handleAttemptClose} className="ml-auto">
              <X />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 px-6 pt-4 items-center">
            {/* Company Page */}
            {activeTab === 'company-page' ? (
              <LightPressButton>Company Page</LightPressButton>
            ) : (
              <button
                onClick={() => setActiveTab('company-page')}
                className="font-source text-base  text-gray-700 hover:text-wfzo-gold-800 transition-colors"
              >
                Company Page
              </button>
            )}

            {/* Company Details */}
            {activeTab === 'company-details' ? (
              <LightPressButton>Company Details</LightPressButton>
            ) : (
              <button
                onClick={() => setActiveTab('company-details')}
                className="font-source text-base  text-gray-700 hover:text-wfzo-gold-800 transition-colors"
              >
                Company Details
              </button>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-8">
            {activeTab === 'company-details' && (
              <CompanyDetailsTab
                socialLinks={socialLinks}
                setSocialLinks={setSocialLinks}
                sections={fieldsBySection}
                isDisabled={isRequestPending}
                values={values}
                setValues={setValues}
                dropdownOptions={dropdownOptions}
                previewUrl={logoPreviewUrl}
                fileName={logoFileName}
                onFileSelect={handleLogoSelect}
                onRemoveFile={handleLogoRemove}
                onChange={markAsChanged}
                errors={companyDetailsErrors}
                touchedFields={companyDetailsTouched}
                onBlur={handleCompanyDetailsBlur}
              />
            )}

            {activeTab === 'company-page' && (
              <CompanyPageTab
              isDisabled={isCompanyPagePending}
                shortIntro={shortIntro}
                setShortIntro={setShortIntro}
                companyImageFile={pageImageFile}
                companyImagePreviewUrl={pageImagePreviewUrl}
                companyImageFileName={pageImageFileName}
                onCompanyImageSelect={handlePageImageSelect}
                onCompanyImageRemove={handlePageImageRemove}
                sections={sections}
                setSections={setSections}
                onChange={markAsChanged}
                errors={companyPageErrors}
              />
            )}
          </div>

          {/* Footer */}
          {/* Sticky Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 sm:px-8 py-6  ">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <div className="flex items-center">
                {!isUpdateEnabled ? (
                  <DisabledButton>Submit for Review</DisabledButton>
                ) : (
                  <GoldButton
                    onClick={handleUpdateClick}
                  >
                    Submit for Review
                  </GoldButton>
                )}
              </div>
              
                <button
                  onClick={handleSaveDraft}
                  disabled={!isSaveDraftEnabled}
                  className={`flex px-6 py-2 justify-center items-center gap-2 rounded-xl font-source text-base font-semibold leading-6 transition-colors
      ${
        isSaveDraftEnabled
          ? 'bg-[#F8F5F1] text-[#8B6941] hover:bg-white'
          : 'bg-[#F8F5F1] text-[#8B6941] hover:bg-white cursor-not-allowed'
      }
    `}
                >
                  Save as Draft
                </button>
              
            </div>
            {activeTab === 'company-page' && (
              <button
                className="flex px-6 py-2 justify-center items-center gap-2 rounded-xl bg-[#F8F5F1] text-[#8B6941] font-source text-base font-semibold leading-6 hover:bg-white transition-colors"
                onClick={handlePreviewClick}
              >
                Preview
              </button>
            )}
          </div>
        </div>

        <UnsavedChangesModal
          isOpen={showUnsavedModal}
          onClose={() => setShowUnsavedModal(false)}
          {...unsavedModalActions}
        />
      </div>
    </Portal>
  );
}
