'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { X, Calendar, Plus, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

import DeleteConfirmationModal from './DeleteConfirmationModal';
import UnsavedChangesModal from './UnsavedChangesModal';
import EditEventModal from './EditEventModal';
import Image from 'next/image';
import GoldButton from '@/shared/components/GoldButton';
import LightButton from '@/shared/components/LightButton';
import { CustomFileUploadField } from '@/shared/components/DynamicForm/CustomFileUploadField';
import { Textarea } from '@/shared/components/TextArea';
import { RadioGroup, RadioGroupItem } from '@/shared/components/RadioGroup';
import CountryCitySelector from '@/shared/components/DynamicForm/CountryCitySelector';
import { CustomSelectBox, type SelectOption } from '@/shared/components/CustomSelectBox';
import StrapiRichTextEditor, { StrapiRichTextEditorRef } from './StrapiRichTextEditor';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { strapi } from '@/lib/strapi';
import { useAuth } from '@/lib/auth/useAuth';
import { useStatusConfigs } from '@/lib/contexts/StatusConfigContext';
import { useMemo } from 'react';
type EventStatus = 'initial' | 'draft' | 'pending' | 'rejected' | 'approved' | 'published' | 'past';

export interface EventData {
  id?: string | number;
  title?: string;
  organizer?: string;
  slug?: string;
  eventType?: string;
  singleDayEvent?: boolean;
  startDateTime?: string;
  endDateTime?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  city?: string;
  registrationUrl?: string;
  shortDescription?: string;
  longDescription?: string;
  publishedAt?: string;
  updatedAt?: string;
  comments?: string;
  reviewComment?: string;
  attributes?: {
    title?: string;
    organizer?: string;
    slug?: string;
    eventType?: string;
    singleDayEvent?: boolean;
    startDateTime?: string;
    endDateTime?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    city?: string;
    registrationUrl?: string;
    shortDescription?: string;
    longDescription?: string;
    publishedAt?: string;
    updatedAt?: string;
    comments?: string;
    reviewComment?: string;
    event_details?: Array<{
      id?: string | number;
      title?: string;
      description?: string;
      image?: { image?: { url?: string } };
    }>;
    webinar_details?: Array<{
      id?: string | number;
      title?: string;
      description?: string;
      image?: { image?: { url?: string } };
    }>;
  };
  event_details?: Array<{
    id?: string | number;
    title?: string;
    description?: string;
    image?: { image?: { url?: string } };
  }>;
  webinar_details?: Array<{
    id?: string | number;
    title?: string;
    description?: string;
    image?: { image?: { url?: string } };
  }>;
  image?: { image?: { url?: string } } | { url?: string };
}

interface AdvertiseEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: EventStatus;
  eventId?: string | number | null;
  eventData?: EventData | null;
  mode?: 'event' | 'webinar';
  onSave?: () => void;
}

interface EventSection {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageFile?: File | null;
  imagePosition: string;
}

export default function AdvertiseEventModal({
  isOpen,
  onClose,
  status = 'draft',
  eventId: initialEventId = null,
  eventData,
  mode = 'event',
  onSave,
}: AdvertiseEventModalProps) {
  const params = useParams();
  const locale = params?.locale as string;

  const [eventId, setEventId] = useState<string | number | null>(initialEventId);
  const { user, member } = useAuth();
  
  const editorRef = useRef<StrapiRichTextEditorRef>(null);

  const handlePreview = () => {
    const slug = eventData?.slug || eventData?.attributes?.slug;
    if (!slug) {
      console.error('No slug found for preview');
      return;
    }
    const basePath = mode === 'webinar' ? '/webinars/all-webinars' : '/events/all-events';
    const fullPath = `/${locale}${basePath}/${slug}`;
    window.open(fullPath, '_blank');
  };
  const initialFormState = {
    organizationName: member?.organisationInfo?.companyName || '',
    eventName: '',
    eventType: 'presential',
    singleDayEvent: false,
    startDate: '',
    endDate: '',
    localTime: '',
    country: '',
    city: '',
    registrationLink: '',
    shortIntro: '',
    longDescription: '',
    bannerImageFile: null,
    existingImageUrl: '',
    sections: [
      {
        id: '1',
        title: '',
        description: '',
        imageUrl: '',
        imageFile: undefined,
        imagePosition: 'left',
      },
    ],
  };
  const [formData, setFormData] = useState<{
    organizationName: string;
    eventName: string;
    eventType: string;
    singleDayEvent: boolean;
    startDate: string;
    endDate: string;
    localTime: string;
    country: string;
    city: string;
    registrationLink: string;
    shortIntro: string;
    longDescription: string;
    bannerImageFile: File | null;
    existingImageUrl: string;
    sections: EventSection[];
  }>({
    organizationName: member?.organisationInfo?.companyName || '',
    eventName: '',
    eventType: 'presential',
    singleDayEvent: false,
    startDate: '',
    endDate: '',
    localTime: '',
    country: '',
    city: '',
    registrationLink: '',
    shortIntro: '',
    longDescription: '',
    bannerImageFile: null,
    existingImageUrl: '',
    sections: [
      {
        id: '1',
        title: '',
        description: '',
        imageUrl: '',
        imageFile: undefined,
        imagePosition: 'left',
      },
    ],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [shortIntroChars, setShortIntroChars] = useState(256);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [isEditButtonVisible, setIsEditButtonVisible] = useState(true);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const { configs: statusConfigs } = useStatusConfigs();
  const deleteSection = () => {
    if(formData.sections.length > 1){
     setFormData(prev => ({
      ...prev,
      sections: prev.sections.slice(0, -1), // remove last section
    }));
  }}

  // Reset editing state when modal opens or status changes
  useEffect(() => {
    if (isOpen) {
      setIsEditingEnabled(false);
      setIsEditButtonVisible(status === 'approved');
    }
  }, [isOpen, status]);

  // Populate form from eventData on mount
  useEffect(() => {
    if (eventData && isOpen) {
      // Editing existing event
      // Handle both flattened and nested data structures
      const data = (eventData as any).attributes || eventData;
      // Get existing image URL
      const imageData = (data as unknown as { image?: { image?: { url?: string } } | { url?: string } })?.image;
      let existingImageUrl = '';
      if (imageData) {
        if ('image' in imageData && imageData.image && imageData.image.url) {
          existingImageUrl = getStrapiMediaUrl(imageData.image.url);
        } else if ('url' in imageData && imageData.url) {
          existingImageUrl = getStrapiMediaUrl(imageData.url);
        }
      }
      const eventSections =
        Array.isArray(data.event_details) && data.event_details.length > 0
          ? data.event_details.map((detail: any, index: number) => ({
              id: String(detail.id ?? index + 1),
              title: detail.title ?? '',
              description: detail.description ?? '',
              imageUrl: detail?.image?.image?.url
                ? getStrapiMediaUrl(detail.image.image.url)
                : '',
              imageFile: undefined,
              imagePosition: detail.imagePosition ?? 'left',
            }))
          : initialFormState.sections;
       const webinarSections =
         Array.isArray(data.webinar_details) && data.webinar_details.length > 0
           ? data.webinar_details.map((detail: any, index: number) => ({
               id: String(detail.id ?? index + 1),
               title: detail.title ?? '',
               description: detail.description ?? '',
               imageUrl: detail?.image?.image?.url
                 ? getStrapiMediaUrl(detail.image.image.url)
                 : '',
               imageFile: undefined,
               imagePosition: detail.imagePosition ?? 'left',
             }))
           : initialFormState.sections;
      setFormData({
        organizationName: member?.organisationInfo?.companyName || (data as EventData).organizer || (eventData as EventData).organizer || '',
        eventName: (data as EventData).title || (eventData as EventData).title || '',
        eventType: ((data as EventData).eventType || (eventData as EventData).eventType) === 'Hybrid' ? 'hybrid' : 'presential',
        singleDayEvent:
          mode === 'webinar' ? true : (data as EventData).singleDayEvent || (eventData as EventData).singleDayEvent || false,
        startDate:
          (data as EventData).startDateTime || (eventData as EventData).startDateTime || (data as EventData).startDate || (eventData as EventData).startDate
            ? (((data as EventData).startDateTime || (eventData as EventData).startDateTime || (data as EventData).startDate || (eventData as EventData).startDate) || '').split('T')[0]
            : '',
        endDate:
          (data as EventData).endDateTime || (eventData as EventData).endDateTime
            ? (((data as EventData).endDateTime || (eventData as EventData).endDateTime) || '').split('T')[0]
            : '',
        localTime:
          (data as EventData).startDateTime || (eventData as EventData).startDateTime
            ? (((data as EventData).startDateTime || (eventData as EventData).startDateTime) || '').split('T')[1]?.substring(0, 5)
            : '',
        country: (data as EventData).location || (eventData as EventData).location || '',
        city: (data as EventData).city || (eventData as EventData).city || '',
        registrationLink: (data as EventData).registrationUrl || (eventData as EventData).registrationUrl || '',
        shortIntro: (data as EventData).shortDescription || (eventData as EventData).shortDescription || '',
        longDescription: (data as EventData).longDescription || (eventData as EventData).longDescription || '',
        bannerImageFile: null, // Can't populate file from data
        existingImageUrl,
        sections: mode === 'webinar' ? webinarSections : eventSections,
      });
      setShortIntroChars(
        256 - (((data as EventData).shortDescription || (eventData as EventData).shortDescription || '').length || 0)
      );
      setEventId(initialEventId); // Ensure eventId is set for editing
      const longDesc = (data as EventData).longDescription || '';
      if (longDesc) { console.log("******************long desc",longDesc); editorRef.current?.setContent(longDesc); } else { editorRef.current?.clear(); }
    } else if (isOpen) {
      // Reset to initial state when opening a new event modal
      setFormData({
        ...initialFormState,
        singleDayEvent: mode === 'webinar' ? true : false,
      });
      setShortIntroChars(256);
      setErrors({});
      setEventId(null);
      editorRef.current?.clear();
    }
  }, [eventData, isOpen, mode, initialEventId]);

  const reviewerComment = useMemo(() => {
    return (
      (eventData as EventData)?.attributes?.comments ||
      (eventData as EventData)?.attributes?.reviewComment ||
      (eventData as EventData)?.comments ||
      (eventData as EventData)?.reviewComment ||
      ''
    );
  }, [eventData]);

  const reviewerMessage = useMemo(() => {
    if (reviewerComment.trim()) {
      return reviewerComment.trim();
    }

    const matchingConfig = statusConfigs.find((c: { eventStatus: string }) => c.eventStatus.toLowerCase() === status.toLowerCase());
    if (matchingConfig && matchingConfig.message) {
      const updatedAt = (eventData as EventData)?.updatedAt || (eventData as EventData)?.attributes?.updatedAt;
      const dateStr = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
      return matchingConfig.message.replace('{date}', dateStr).replace('{mode}', mode);
    }

    return 'No additional comments were provided by the reviewer.';
  }, [reviewerComment, statusConfigs, status, eventData, mode]);

  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: String(prev.sections.length + 1),
          title: '',
          description: '',
          imageUrl: '',
          imageFile: undefined,
          imagePosition: 'left',
        },
      ],
    }));
  };

  if (!isOpen) return null;

  const canEditFields = (status: EventStatus): boolean => {
    return isEditingEnabled || (status === 'initial' || status === 'draft' || status === 'rejected');
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleShortIntroChange = (value: string) => {
    if (value.length <= 256) {
      setFormData((prev) => ({ ...prev, shortIntro: value }));
      setShortIntroChars(256 - value.length);
      if (errors.shortIntro) {
        setErrors((prev) => ({ ...prev, shortIntro: '' }));
      }
    }
  };

  const handleSectionChange = (
    sectionId: string,
    field: keyof EventSection,
    value: string | File | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      ),
    }));
  };

  // Validation function - only called on Submit for Review
  const validateForReview = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.eventName.trim()){newErrors.eventName = mode === 'webinar'? 'Webinar name is required' : 'Event name is required';} 
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.singleDayEvent && !formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.city) newErrors.city = 'City is required';
    const link = formData.registrationLink.trim();
    if (!link) {
      newErrors.registrationLink = 'Registration link is required';
    } else {
      try {
        new URL(link); // Will throw if invalid
        // Optionally enforce protocol (recommended for security)
        if (!/^https?:\/\//i.test(link)) {
          newErrors.registrationLink = 'Please enter a complete URL (e.g., https://example.com)';
        }
      } catch {
        newErrors.registrationLink = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }
    if (!formData.shortIntro.trim()) newErrors.shortIntro = 'Short intro is required';
    if (!formData.longDescription.trim())
      newErrors.longDescription = 'Long description is required';
    if (!formData.bannerImageFile && !formData.existingImageUrl)
      newErrors.bannerImage = 'Banner image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildAndSubmit = async (targetStatus: 'Draft' | 'Pending' | 'Published') => {
    // Only validate if submitting for review or publishing
    if ((targetStatus === 'Pending' || targetStatus === 'Published') && !validateForReview()) {
      return; // Stop if validation fails
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let bannerImageId: number | null = null;
      let shouldUpdateImage = false;

      if (formData.bannerImageFile) {
        // New image uploaded
        bannerImageId = await strapi.uploadDocument(formData.bannerImageFile);
        shouldUpdateImage = true;
      } else if (!formData.existingImageUrl) {
        // No image (removed)
        bannerImageId = null;
        shouldUpdateImage = true;
      }
      // If existingImageUrl exists and no new file, don't update image field

      const uploadedSectionImages = await Promise.all(
        formData.sections.map(async (sec) => {
          if (sec.imageFile) {
            return await strapi.uploadDocument(sec.imageFile);
          }
          return null;
        })
      );

      const eventDetails = formData.sections.map((sec, index) => ({
        title: sec.title || '',
        description: sec.description || '',
        imagePosition: sec.imagePosition || 'left',
        image: {
          image: uploadedSectionImages[index],
          alternateText: formData.eventName,
          href: formData.registrationLink,
        },
      }));
      const toISOString = (date?: string, time?: string) => {
        if (!date) return null;

        const safeTime = time || '00:00';
        return new Date(`${date}T${safeTime}:00`).toISOString();
      };
      console.log(formData.startDate,"eventDetails",toISOString(formData.startDate, formData.localTime));
      const webinarPayload = {
        locale: 'en',
        organizer: formData.organizationName,
        title: formData.eventName,
        slug: formData.eventName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),

        singleDayEvent: true,

        startDate: toISOString(formData.startDate, formData.localTime),
        endDateTime: toISOString(formData.startDate, formData.localTime),

        location: formData.country,
        city: formData.city,

        shortDescription: formData.shortIntro,
        longDescription: formData.longDescription,
        registrationUrl: formData.registrationLink,

        webinarStatus: targetStatus,

        ...(shouldUpdateImage ? { image: bannerImageId ? { image: bannerImageId } : null } : {}),

        cta: {
          type: 'external',
          href: formData.registrationLink,
        },
        authorEmail: user?.email || '',
        authorName: user?.name || '',

        webinar_details: eventDetails,
        publishedAt: targetStatus === 'Published' ? new Date().toISOString() : null,
      };

      // ---------------------------
      // EVENT PAYLOAD
      // ---------------------------
      const eventPayload = {
        locale: 'en',
        organizer: formData.organizationName,
        title: formData.eventName,
        slug: formData.eventName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),

        eventType: formData.eventType === 'presential' ? 'Presential' : 'Hybrid',

        singleDayEvent: formData.singleDayEvent,

        startDateTime: toISOString(formData.startDate, formData.localTime),
        endDateTime: formData.singleDayEvent
          ? null
          : toISOString(formData.endDate, formData.localTime),

        location: formData.country,
        city: formData.city,

        shortDescription: formData.shortIntro,
        longDescription: formData.longDescription,

        registrationUrl: formData.registrationLink,

        eventStatus: targetStatus,

        ...(shouldUpdateImage ? { image: bannerImageId ? { image: bannerImageId } : null } : {}),

        cta: {
          type: 'external',
          href: formData.registrationLink,
        },
        authorEmail: user?.email || '',
        authorName: user?.name || '',
        event_details: eventDetails,
        publishedAt: targetStatus === 'Published' ? new Date().toISOString() : null,
      };

      const payload = mode === 'webinar' ? webinarPayload : eventPayload;

      let result;
      if (mode === 'webinar') {
        if (initialEventId) {
          // If editing and saving as draft or pending, unpublish if currently published
          if ((targetStatus === 'Draft' || targetStatus === 'Pending') && (eventData as EventData)?.publishedAt) {
            await fetch(
              `${strapi.url}/api/content-manager/collection-types/api::webinar.webinar/${initialEventId}/actions/unpublish`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`,
                },
              }
            );
          }
          result = await strapi.webinarApi.updateWebinar(initialEventId, payload);
           if (targetStatus === 'Published') {
      await fetch(
        `${strapi.url}/api/content-manager/collection-types/api::webinar.webinar/${initialEventId}/actions/unpublish`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`,
          },
        }
      );
      result = await strapi.webinarApi.publishWebinar(initialEventId, payload);
    }}else {
          result = await strapi.webinarApi.createWebinarCard(payload);
          setEventId(result.data.documentId);
        }
      } else {
        if (initialEventId) {
          // If editing and saving as draft or pending, unpublish if currently published
          if ((targetStatus === 'Draft' || targetStatus === 'Pending') && (eventData as EventData)?.publishedAt) {
            await fetch(
              `${strapi.url}/api/content-manager/collection-types/api::event.event/${initialEventId}/actions/unpublish`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`,
                },
              }
            );
          }
          result = await strapi.eventApi.updateEvent(initialEventId, payload);
           if (targetStatus === 'Published') {
      result = await strapi.eventApi.publishEvents(initialEventId, payload);
    }
        } else {
          result = await strapi.eventApi.createEventCard(payload);
          setEventId(result.data.documentId);
        }
      }

      if (targetStatus === 'Pending') {
       
        fetch(`${strapi.emailUrl}${strapi.SUBMIT_PATH}/events/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user?.email,
            type: "EVENT_SUBMITTED_FOR_APPROVAL",
            eventTitle: formData.eventName,
            scheduledDate: formData.startDate,
            organizerName: formData.organizationName,
            eventType: mode,
            firstName: user?.name?.split(' ')[0],
            lastName: user?.name?.split(' ').slice(1).join(' '),
          }),
        }).catch(() => {});
      }

      setFormData(initialFormState);
      setErrors({});
      setShortIntroChars(256);
      editorRef.current?.clear();

      // Trigger refresh of hosting events
      if (onSave) {
        onSave();
      }

      onClose();
        } catch (error: unknown) {
          console.error(`Failed to save ${mode}:`, error);
          alert(`Error saving ${mode}: ` + ((error as Error)?.message || 'Unknown error'));
        } finally {
          setIsSubmitting(false);
        }
  };

  const handleSubmitForReview = () => {
    buildAndSubmit('Pending');
  };
  const resetFormCompletely = () => {
    // Reset form fields
    setFormData(initialFormState);

    // Clear validation errors
    setErrors({});

    // Reset counters
    setShortIntroChars(256);

    // Reset eventId (important if draft was created)
    setEventId(null);

    // Clear rich text editor content
    editorRef.current?.clear();
  };

  const handleSaveAsDraft = () => {
    if (!formData.eventName.trim()) {
    setErrors({ eventName: mode ==='webinar' ? 'Webinar name is required' : 'Event name is required' });
    return;
  }
    buildAndSubmit('Draft'); // No validation
  };

  const handlePublish = () => {
    buildAndSubmit('Published');
  };

  const handleDelete = async () => {
    if (!initialEventId) return;
    try {
      if (mode === 'webinar') {
        await strapi.webinarApi.deleteWebinar(initialEventId);
      } else {
        await strapi.eventApi.deleteEvent(initialEventId);
      }
      // Trigger refresh of hosting events
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error: unknown) {
      console.error('Delete failed:', error);
      alert(`Failed to delete ${mode}`);
    }
  };


  const getStatusConfig = () => {
    
    switch (status) {
      case 'initial':
        return {
          headerTitle: mode === 'webinar' ? 'Post a Webinar' : 'Advertise an Event',
          showAlert: false,
          buttons: [
            { type: 'primary', text: 'Submit for Review', action: handleSubmitForReview },
            { type: 'secondary', text: 'Save as Draft', action: handleSaveAsDraft },
          ],
          hideDelete: true,
        };
      case 'draft':
        return {
          headerTitle: 'Draft',
          showAlert: false,
          buttons: [
            { type: 'primary', text: 'Submit for Review', action: handleSubmitForReview },
            { type: 'secondary', text: 'Save as Draft', action: handleSaveAsDraft },
            { type: 'preview', text: 'Preview', action: handlePreview },
          ],
          hideDelete: false,
        };
      case 'pending':
        return {
          headerTitle: 'Pending Review',
          showAlert: true,
          alertType: 'warning',
          alertIcon: <AlertTriangle className="w-5 h-5" />,
          alertTitle: 'Pending Review',
          alertMessage: reviewerMessage,
          alertBg: '#FDF9ED',
          alertBorder: '#F3DA91',
          alertIconColor: '#A38529',
          alertTitleColor: '#A38529',
          buttons: [
            { type: 'primary', text: 'Cancel Review', action: handleSaveAsDraft }, // TODO: implement cancel
            { type: 'preview', text: 'Preview', action: handlePreview },
          ],
          hideDelete: false,
        };
      case 'rejected':
        return {
          headerTitle: 'Rejected',
          showAlert: true,
          alertType: 'error',
          alertIcon: <AlertCircle className="w-5 h-5" />,
          alertTitle: 'Review notes',
          alertMessage: reviewerMessage,
          alertBg: '#FFEFEB',
          alertBorder: '#FDAEA0',
          alertIconColor: '#D61B0A',
          alertTitleColor: '#D61B0A',
          buttons: [
            { type: 'primary', text: 'Resubmit for Review', action: handleSubmitForReview },
            { type: 'secondary', text: 'Save as Draft', action: handleSaveAsDraft },
            { type: 'preview', text: 'Preview', action: handlePreview },
          ],
          hideDelete: false,
        };
      case 'approved':
        return {
          headerTitle: 'Approved',
          showAlert: true,
          alertType: 'success',
          alertIcon: <CheckCircle className="w-5 h-5" />,
          alertTitle: `${mode === 'webinar' ? 'Webinar' : 'Event'} Approved`,
          alertMessage: reviewerMessage,
          alertBg: '#EDFDF3',
          alertBorder: '#91F3BA',
          alertIconColor: '#248F50',
          alertTitleColor: '#248F50',
          buttons: [
            { type: 'primary', text: isEditingEnabled ? 'Submit for Review' : 'Publish', action: isEditingEnabled ? handleSubmitForReview : handlePublish },
            { type: 'preview', text: 'Preview', action: handlePreview },
            ...(isEditButtonVisible ? [{ type: 'edit', text: 'Edit', action: () => setShowEditModal(true) }] : []),
          ],
          hideDelete: true,
        };
      case 'published':
        return {
          headerTitle: 'Published',
          showAlert: true,
          alertType: 'success',
          alertIcon: <CheckCircle className="w-5 h-5" />,
          alertTitle: `${mode === 'webinar' ? 'Webinar' : 'Event'} Published`,
          alertMessage: `Your ${mode} has been published.`,
          alertBg: '#EDFDF3',
          alertBorder: '#91F3BA',
          alertIconColor: '#248F50',
          alertTitleColor: '#248F50',
          buttons: [{ type: 'preview', text: 'Preview', action: handlePreview }],
          hideDelete: true,
        };
      default:
        return {
          headerTitle: 'Advertise an Event',
          showAlert: false,
          buttons: [
            { type: 'primary', text: 'Submit for Review', action: handleSubmitForReview },
            { type: 'secondary', text: 'Save as Draft', action: handleSaveAsDraft },
          ],
          hideDelete: false,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="fixed inset-0 z-[900] flex items-start justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowUnsavedModal(true)}
      ></div>

      <div
        className="w-full max-w-[853px] bg-white rounded-2xl shadow-xl my-8 mx-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 bg-white border-b border-wfzo-gold-100 rounded-t-2xl">
          <button
            onClick={() => setShowUnsavedModal(true)}
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
            {statusConfig.headerTitle}
          </h1>
          <button
            onClick={() => setShowUnsavedModal(true)}
            className="text-wfzo-grey-900 hover:text-wfzo-grey-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-8 py-8 overflow-y-auto max-h-[calc(100vh-260px)]">
          {/* Status Alert */}
          {statusConfig.showAlert && (
            <div
              className="flex items-start gap-3 p-4 mb-8 rounded-lg"
              style={{
                backgroundColor: statusConfig.alertBg,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: statusConfig.alertBorder,
              }}
            >
              <div style={{ color: statusConfig.alertIconColor }}>{statusConfig.alertIcon}</div>
              <div className="flex-1">
                <h3
                  className="font-medium text-base mb-2 font-inter"
                  style={{ color: statusConfig.alertTitleColor }}
                >
                  {statusConfig.alertTitle}
                </h3>
                <p className="text-sm text-wfzo-grey-800 font-inter leading-6">
                  {statusConfig.alertMessage}
                </p>
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="flex flex-col gap-4 mb-8">
            <h2 className="text-2xl font-extrabold font-montserrat text-wfzo-grey-900 leading-8">
              {mode === 'webinar' ? 'Webinar Details' : 'Event Details'}
            </h2>

            {/* Organization Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">Organization Name</label>
              <input
                type="text"
                value={formData.organizationName}
                disabled
                className="h-12 px-4 rounded-[9px] border border-[#D1D5DB] bg-[#F3F4F6] text-base font-source text-wfzo-grey-500 cursor-not-allowed opacity-100"
              />
            </div>

            {/* Event Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                {mode === 'webinar' ? 'Webinar Name*' : 'Event Name*'}
              </label>
              <input
                type="text"
                placeholder={mode === 'webinar' ? 'Name of Webinar' : ' Name of Event'}
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                disabled={!canEditFields(status)}
                className={`h-12 px-4 rounded-[9px] border text-base font-source placeholder:text-wfzo-grey-700 ${
                  errors.eventName
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-neutral-grey-300 focus:border-wfzo-gold-500'
                } bg-white text-wfzo-grey-700 ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.eventName && <p className="text-xs text-red-600 font-source mt-1">{errors.eventName}</p>}
            </div>

            {/* Event Type */}
            {mode === 'event' && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-source text-wfzo-grey-800">Event Type</label>
                <RadioGroup
                  value={formData.eventType}
                  onValueChange={(value) => handleInputChange('eventType', value)}
                  disabled={!canEditFields(status)}
                  className="!flex !flex-row !flex-nowrap !items-center gap-8"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="presential"
                      id="presential"
                      disabled={!canEditFields(status)}
                    />
                    <label
                      htmlFor="presential"
                      className={`text-sm font-source text-wfzo-grey-800 ${!canEditFields(status) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      Presential
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="hybrid" id="hybrid" disabled={!canEditFields(status)} />
                    <label
                      htmlFor="hybrid"
                      className={`text-sm font-source text-wfzo-grey-800 ${!canEditFields(status) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      Hybrid
                    </label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Single Day Toggle */}
            {mode === 'event' && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.singleDayEvent}
                  onClick={() =>
                    canEditFields(status) &&
                    handleInputChange('singleDayEvent', !formData.singleDayEvent)
                  }
                  disabled={!canEditFields(status)}
                  className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors ${
                    formData.singleDayEvent ? 'bg-wfzo-gold-500' : 'bg-wfzo-grey-400'
                  } ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.singleDayEvent ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <label className="text-sm font-source text-wfzo-grey-800">Single Day Event</label>
              </div>
            )}

            {/* Dates */}
            {mode === 'webinar' || formData.singleDayEvent ? (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-source text-wfzo-grey-800">
                  {mode === 'webinar' ? 'Date of Webinar*' : 'Date of Event*'}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    disabled={!canEditFields(status)}
                    className={`h-12 w-full px-4 pr-12 rounded-[9px] border text-base font-source ${
                      errors.startDate
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-grey-300 focus:border-wfzo-gold-500'
                    } bg-white text-wfzo-grey-700 ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                 
                </div>
                {errors.startDate && (
                  <p className="text-xs text-red-600 font-source mt-1">{errors.startDate}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-source text-wfzo-grey-800">Start Date*</label>
                  <div className="relative">
                    <input
                    ref={startDateRef}
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      onClick={() => startDateRef.current?.showPicker()}
                      disabled={!canEditFields(status)}
                      className={`h-12 w-full px-4 pr-12 rounded-[9px] border text-base font-source  appearance-none
        [&::-webkit-calendar-picker-indicator]:opacity-0 ${
                        errors.startDate
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-neutral-grey-300 focus:border-wfzo-gold-500'
                      } bg-white text-wfzo-grey-700 ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <span 
                    onClick={() => startDateRef.current?.showPicker()}
                    className=" absolute right-4 top-1/2 -translate-y-1/2 text-wfzo-grey-500 cursor-pointer">
                      <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.5 16C10.8 16 10.2083 15.7583 9.725 15.275C9.24167 14.7917 9 14.2 9 13.5C9 12.8 9.24167 12.2083 9.725 11.725C10.2083 11.2417 10.8 11 11.5 11C12.2 11 12.7917 11.2417 13.275 11.725C13.7583 12.2083 14 12.8 14 13.5C14 14.2 13.7583 14.7917 13.275 15.275C12.7917 15.7583 12.2 16 11.5 16ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V1C3 0.716667 3.09583 0.479167 3.2875 0.2875C3.47917 0.0958333 3.71667 0 4 0C4.28333 0 4.52083 0.0958333 4.7125 0.2875C4.90417 0.479167 5 0.716667 5 1V2H13V1C13 0.716667 13.0958 0.479167 13.2875 0.2875C13.4792 0.0958333 13.7167 0 14 0C14.2833 0 14.5208 0.0958333 14.7125 0.2875C14.9042 0.479167 15 0.716667 15 1V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6Z" fill="#808080"/>
                      </svg>

                    </span>
                   
                  </div>
                  {errors.startDate && (
                    <p className="text-xs text-red-600 font-source mt-1">{errors.startDate}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-source text-wfzo-grey-800">End Date*</label>
                  <div className="relative">
                    <input
                      ref={endDateRef}
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                       onClick={() => endDateRef.current?.showPicker()}
                      disabled={!canEditFields(status)}
                      className={`h-12 w-full px-4 pr-11 rounded-[12px] border text-base font-source appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 ${
                        errors.endDate
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-neutral-grey-300 focus:border-wfzo-gold-500'
                      } bg-white text-wfzo-grey-700 ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />


                       {/* Calendar Icon */}
                   <span 
                    onClick={() => endDateRef.current?.showPicker()}
                    className=" absolute right-4 top-1/2 -translate-y-1/2 text-wfzo-grey-500 cursor-pointer">
                  <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.5 16C10.8 16 10.2083 15.7583 9.725 15.275C9.24167 14.7917 9 14.2 9 13.5C9 12.8 9.24167 12.2083 9.725 11.725C10.2083 11.2417 10.8 11 11.5 11C12.2 11 12.7917 11.2417 13.275 11.725C13.7583 12.2083 14 12.8 14 13.5C14 14.2 13.7583 14.7917 13.275 15.275C12.7917 15.7583 12.2 16 11.5 16ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V1C3 0.716667 3.09583 0.479167 3.2875 0.2875C3.47917 0.0958333 3.71667 0 4 0C4.28333 0 4.52083 0.0958333 4.7125 0.2875C4.90417 0.479167 5 0.716667 5 1V2H13V1C13 0.716667 13.0958 0.479167 13.2875 0.2875C13.4792 0.0958333 13.7167 0 14 0C14.2833 0 14.5208 0.0958333 14.7125 0.2875C14.9042 0.479167 15 0.716667 15 1V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6Z" fill="#808080"/>
                  </svg>
                  </span>
                   
                  </div>
                  {errors.endDate && <p className="text-xs text-red-600 font-source mt-1">{errors.endDate}</p>}
                </div>
              </div>
            )}

            {/* Local Time */}
            <div className="flex flex-col gap-1 max-w-[378.5px]">
              <label className="text-sm font-source text-wfzo-grey-800">
                Local Time of {mode === 'webinar' ? 'Webinar' : 'Event'}
              </label>
              <input
                type="time"
                value={formData.localTime}
                onChange={(e) => handleInputChange('localTime', e.target.value)}
                disabled={!canEditFields(status)}
                className={`h-12 px-4 rounded-[9px] border border-neutral-grey-300 bg-white text-base font-source text-wfzo-grey-800 ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Country & City */}
            <div className="grid grid-cols-2 gap-8">
              <CountryCitySelector
                countryValue={formData.country}
                cityValue={formData.city}
                onCountryChange={(value) => {
                  handleInputChange('country', value);
                  setFormData((prev) => ({ ...prev, city: '' }));
                }}
                onCityChange={(value) => {
                  handleInputChange('city', value);
                }}
                countryError={errors.country}
                cityError={errors.city}
                disabled={!canEditFields(status)}
              />
            </div>

            {/* Registration Link */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                Website link to {mode === 'webinar' ? 'webinar call' : 'registration'}*
              </label>
              <input
                type="url"
                placeholder={`Enter ${mode === 'webinar' ? 'Webinar call' : 'Registration'} link`}
                value={formData.registrationLink}
                onChange={(e) => handleInputChange('registrationLink', e.target.value)}
                disabled={!canEditFields(status)}
                className={`h-12 px-4 rounded-[9px] border text-base font-source placeholder:text-wfzo-grey-700 ${
                  errors.registrationLink
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-neutral-grey-300 focus:border-wfzo-gold-500'
                } bg-white text-wfzo-grey-700 ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.registrationLink && (
                <p className="text-xs text-red-600 font-source mt-1">{errors.registrationLink}</p>
              )}
            </div>
          </div>

          {/* Event Text */}
          <div className="flex flex-col gap-4 mb-8">
            <h2 className="text-2xl font-extrabold font-montserrat text-wfzo-grey-900 leading-8">
              {mode === 'webinar' ? 'Webinar' : 'Event'} Text
            </h2>

            {/* Short Intro */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                Short {mode === 'webinar' ? 'Webinar' : 'Event'} Intro*
              </label>
              <Textarea
                placeholder="Introduction"
                value={formData.shortIntro}
                onChange={(e) => handleShortIntroChange(e.target.value)}
                disabled={!canEditFields(status)}
                className={`min-h-[112px] px-3 py-2 rounded-[9px] border text-base font-source resize-none ${
                  errors.shortIntro
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-neutral-grey-300 focus:border-wfzo-gold-500'
                } bg-white text-gray-700 placeholder:text-gray-500 ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-wfzo-grey-800">{shortIntroChars} characters left</p>
                {errors.shortIntro && <p className="text-xs text-red-600 font-source">{errors.shortIntro}</p>}
              </div>
            </div>

            {/* Long Description */}
            {/* Long Description */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                Long {mode === 'webinar' ? 'Webinar' : 'Event'} Description*
              </label>

              <StrapiRichTextEditor
                ref={editorRef}
                initialContent={formData.longDescription ?? ""}
                disabled={!canEditFields(status)}
                onSave={(html: string) => {
                  setFormData((prev) => ({
                    ...prev,
                    longDescription: html,
                  }));

                  if (errors.longDescription) {
                    setErrors((prev) => ({
                      ...prev,
                      longDescription: '',
                    }));
                  }
                }}
              />

              {errors.longDescription && (
                <p className="text-xs text-red-600 font-source mt-1">{errors.longDescription}</p>
              )}
            </div>

            {/* Banner Image */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-source text-wfzo-grey-800">
                {mode === 'webinar' ? 'Webinar' : 'Event'} Banner Image*
              </label>
              <CustomFileUploadField
                label={`${mode === 'webinar' ? 'Webinar' : 'Event'} Banner`}
                previewUrl={
                  formData.bannerImageFile
                    ? URL.createObjectURL(formData.bannerImageFile)
                    : formData.existingImageUrl || undefined
                }
                fileName={formData.bannerImageFile?.name}
                onSelect={(file) => {
                  if (canEditFields(status)) {
                    setFormData((p) => ({ ...p, bannerImageFile: file, existingImageUrl: '' }));
                    if (errors.bannerImage) setErrors((prev) => ({ ...prev, bannerImage: '' }));
                  }
                }}
                onRemove={() => {
                  if (canEditFields(status))
                    setFormData((p) => ({ ...p, bannerImageFile: null, existingImageUrl: '' }));
                }}
                hasError={!!errors.bannerImage}
                disabled={!canEditFields(status)}
              />
              {errors.bannerImage && (
                <p className="text-xs text-red-600 font-source mt-1">{errors.bannerImage}</p>
              )}
            </div>

            {/* Dynamic Sections */}
            {formData.sections.map((section, index) => (
              <div key={section.id} className="flex flex-col gap-3">
                <h3 className="text-base font-bold font-source text-wfzo-grey-800">
                  Paragraph {index + 1}
                </h3>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-source text-wfzo-grey-800">Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="Title"
                    value={section.title}
                    onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                    disabled={!canEditFields(status)}
                    className={`h-12 px-4 rounded-[9px] border border-neutral-grey-300 bg-white text-base font-source text-wfzo-grey-700 placeholder:text-wfzo-grey-700 ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-source text-wfzo-grey-800">
                    {mode === 'webinar' ? 'Webinar' : 'Event'} Description*
                  </label>
                  <Textarea
                    placeholder={`Description of ${mode === 'webinar' ? 'webinar' : 'event'}`}
                    value={section.description}
                    onChange={(e) => handleSectionChange(section.id, 'description', e.target.value)}
                    disabled={!canEditFields(status)}
                    className={`min-h-[112px] px-3 py-2 rounded-[9px] border border-neutral-grey-300 bg-white text-base font-source text-gray-700 placeholder:text-gray-500 resize-none ${!canEditFields(status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <p className="text-xs font-source text-wfzo-grey-800">
                    {1024 - (section.description?.length || 0)} characters left
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <CustomSelectBox
                    label="Image Position"
                    value={section.imagePosition}
                    onChange={(value) => handleSectionChange(section.id, 'imagePosition', value)}
                    placeholder="Select position"
                    options={[
                      { label: 'Left', value: 'left' },
                      { label: 'Right', value: 'right' }
                    ]}
                    disabled={!canEditFields(status)}
                  />
                </div>

                <CustomFileUploadField
                  label="UploadImage"
                  previewUrl={
                    section.imageFile
                      ? URL.createObjectURL(section.imageFile)
                      : section.imageUrl || undefined
                  }
                  fileName={
                    section.imageFile?.name || (section.imageUrl ? 'Existing image' : undefined)
                  }
                  onSelect={(file) => {
                    if (canEditFields(status)) {
                      handleSectionChange(section.id, 'imageFile', file);
                      handleSectionChange(section.id, 'imageUrl', ''); // clear old image
                    }
                  }}
                  onRemove={() => {
                    if (canEditFields(status)) {
                      handleSectionChange(section.id, 'imageFile', undefined);
                      handleSectionChange(section.id, 'imageUrl', '');
                    }
                  }}
                  disabled={!canEditFields(status)}
                />
              </div>
            ))}
           <div className='flex items-center w-full'>
            <GoldButton
              onClick={canEditFields(status) ? addSection : undefined}
              disabled={!canEditFields(status)}
            >
              Add Paragraph
              <Plus className="w-6 h-6 ml-2" />
            </GoldButton>
            <div className="ml-auto">
            {formData.sections.length>1&&(
               <button 
              type="button"
              onClick={deleteSection}
              className="font-source text-base font-bold leading-5 cursor-pointer h-[40px] rounded-[12px] py-2 px-6 flex items-center justify-center gap-[10px] border-2 text-red-600 border-red-600 hover:bg-red-50"
            >
               Delete Section
            </button>
            )}

           </div>
            </div>
          </div>

          <div className="mb-6 mt-6 text-sm font-source text-wfzo-grey-700">
            <span className="font-bold text-base text-wfzo-grey-800">
              Approval Process  -{' '}
            </span>
            Upon submission, your event/webinar will be reviewed by our admin team within 3-5 business days. You will be notified via email regarding the status of your submission.
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-8 py-6 border-t border-wfzo-gold-100 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            {statusConfig.buttons.map((button, index) => {
              if (button.type === 'primary') {
                return (
                  <GoldButton key={index} onClick={button.action} disabled={isSubmitting}>
                    {button.text}
                  </GoldButton>
                );
              } else if (button.type === 'secondary') {
                return (
                  <LightButton key={index} onClick={button.action} disabled={isSubmitting}>
                    {button.text}
                  </LightButton>
                );
              } else if (button.type === 'preview') {
                return (
                  <LightButton
                    key={index}
                    onClick={button.action}
                    disabled={isSubmitting}
                  >
                    {button.text}
                  </LightButton>
                );
              } else if (button.type === 'edit') {
                return (
                  <LightButton
                    key={index}
                    onClick={button.action}
                    disabled={isSubmitting}
                  >
                    {button.text}
                  </LightButton>
                );
              }
              return null;
            })}
          </div>

          {!statusConfig.hideDelete && initialEventId && (
            <button className="cursor-pointer" onClick={() => setShowDeleteModal(true)}>
              <Image src="/assets/deletebuttonForEvent.svg" alt="Delete" width={30} height={30} />
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${mode === 'webinar' ? 'Webinar' : 'Event'}?`}
        description={`This ${mode} is awaiting review. Deleting it will cancel the submission and remove the event permanently.`}
        buttonText = {`Delete ${mode === 'webinar' ? 'Webinar' : 'Event'}`}
      />

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onSaveDraft={handleSaveAsDraft}
        onExitWithoutSaving={() => {
          setShowUnsavedModal(false);
          resetFormCompletely();
          onClose();
        }}
      />

      <EditEventModal
        title={`Edit ${mode === 'webinar' ? 'Webinar' : 'Event'}?`}
        description={`Editing this ${mode} will restart the approval process. Your changes will need to be reviewed again before the event goes live.`}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onContinue={() => {
          setShowEditModal(false);
          setIsEditingEnabled(true);
          setIsEditButtonVisible(false);
        }}
      />
    </div>
  );
}
