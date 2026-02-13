'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { X, ChevronLeft, Plus, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import DeleteConfirmationModal from '@/features/events/dashboard/component/DeleteConfirmationModal';
import UnsavedChangesModal from '@/features/events/dashboard/component/UnsavedChangesModal';
import EditEventModal from '@/features/events/dashboard/component/EditEventModal';
import { ArticleData, ArticleStatus } from '../PublicationsDashboard';
import GoldButton from '@/shared/components/GoldButton';
import LightButton from '@/shared/components/LightButton';
import { Input } from '@/shared/components/Input';
import { Textarea } from '@/shared/components/TextArea';
import { RadioGroup, RadioGroupItem } from '@/shared/components/RadioGroup';
import { CustomSelectBox, type SelectOption } from '@/shared/components/CustomSelectBox';
import { CustomFileUploadField } from '@/shared/components/DynamicForm/CustomFileUploadField';
import StrapiRichTextEditor from '@/features/events/dashboard/component/StrapiRichTextEditor';
import { strapi, STRAPI_URL } from '@/lib/strapi';
import { useAuth } from '@/lib/auth/useAuth';

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

interface PublishArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: ArticleStatus;
  articleId?: string | number | null;
  articleData?: ArticleData | null;
  onSave?: (status?: ArticleStatus, operation?: 'save' | 'delete' | 'review' | 'publish') => void;
}

interface FormSection {
  id?: string | number;
  title: string;
  content: string;
  imageId?: number;
  imageUrl?: string;
  imageFile?: File;
}

const ARTICLE_CATEGORIES: SelectOption[] = [
  { value: 'library', label: 'Library' },
  { value: 'members-news', label: "Members' News" },
  { value: 'general-news', label: 'General News' },
  { value: 'reports', label: 'Reports' },
  { value: 'papers', label: 'Papers' },
  { value: 'bulletins', label: 'Bulletins' },
];

async function fetchArticleCategories(): Promise<SelectOption[]> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/tabs`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    const tabs = json.data || [];
    return tabs
      .filter((tab: any) => tab.attributes?.title !== 'World FZO News' && tab.title !== 'World FZO News')
      .map((tab: any) => ({
        value: tab.documentId,
        label: tab.attributes?.title || tab.title || `Tab ${tab.id}`,
      }));
  } catch (error) {
    console.error('Error fetching article categories:', error);
    return ARTICLE_CATEGORIES; // Fallback to hardcoded categories
  }
}

export default function PublishArticleModal({
  isOpen,
  onClose,
  status = 'draft',
  articleId,
  articleData,
  onSave,
}: PublishArticleModalProps) {
  
  const params = useParams();
  const locale = params?.locale as string;
  const { user, member } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus>(status);
  const [formData, setFormData] = useState({
    organizationName: '',
    articleName: '',
    authorName: '',
    articleCategory: '',
    articleFormat: 'write' as 'write' | 'pdf',
    shortIntro: '',
    pdfFileId: null as number | null,
    pdfFileUrl: '',
    imageId: null as number | null,
    imageUrl: '',
  });
  
  const [sections, setSections] = useState<FormSection[]>([
    { title: '', content: '', imageUrl: '' },
  ]);
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
    const [isEditingEnabled, setIsEditingEnabled] = useState(false);
    const [articleCategories, setArticleCategories] = useState<SelectOption[]>(ARTICLE_CATEGORIES);
    const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isEditButtonVisible, setIsEditButtonVisible] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (articleData && articleCategories.length > 0) {
        loadArticleData(articleData);
      } else if (articleId && articleCategories.length > 0) {
        // Fetch article data with sections if not provided
        fetchArticleData(articleId);
      } else if (!articleData && !articleId) {
        resetForm();
      }
    }
  }, [isOpen, articleData, articleId, articleCategories]);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  // Reset editing state when modal opens or status changes
  useEffect(() => {
    if (isOpen) {
      setIsEditingEnabled(false);
      setIsEditButtonVisible(status === 'approved');
    }
  }, [isOpen, status]);

  useEffect(() => {
    if (isOpen) {
      fetchArticleCategories().then(setArticleCategories);
    }
  }, [isOpen]);

  useEffect(() => {
    if (articleCategories.length > 0 && formData.articleCategory) {
      const category = articleCategories.find(cat => cat.value === formData.articleCategory);
      setSelectedCategory(category || null);
    }
  }, [articleCategories, formData.articleCategory]);

  const fetchArticleData = async (id: string | number) => {
    try {
      const response = await fetch(`${STRAPI_URL}/api/articles/${id}?populate[event_details][populate][image][populate][image][fields][0]=url&populate[newsImage][fields]=url&populate[pdfFile][fields]=url`, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_PREVIEW_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch article data');
      }

      const json = await response.json();
      const data = json.data;
      loadArticleData(data);
    } catch (error) {
      console.error('Error fetching article data:', error);
      // Fallback to reset form if fetch fails
      resetForm();
    }
  };

  const loadArticleData = (data: ArticleData) => {
    const attrs = data.attributes || data;

    // Find the category value from the label
    const categoryLabel = attrs.articleCategory || '';
    const categoryOption = articleCategories.find(cat => cat.label === categoryLabel);
    const categoryValue = categoryOption ? categoryOption.value : '';

    setFormData({
      organizationName: attrs.organizationName || member?.organisationInfo?.companyName || '',
      articleName: attrs.title || '',
      authorName: attrs.authorName || user?.name || '',
      articleCategory: categoryValue,
      articleFormat: attrs.articleFormat || 'write',
      shortIntro: attrs.shortDescription || '',
      pdfFileId: attrs.pdfFile?.id || null,
      pdfFileUrl: attrs.pdfFile?.url || '',
      imageId: attrs.newsImage?.id || null,
      imageUrl: attrs.newsImage?.url || '',
    });

    // Load sections (event_details)
    if (attrs.event_details && Array.isArray(attrs.event_details)) {
      setSections(
        attrs.event_details.map((s: any) => ({
          id: s.id,
          title: s.title || '',
          content: s.description || '', // Note: API uses 'description' not 'content'
          imageId: s.image?.image?.id,
          imageUrl: s.image?.image?.url || '', // Image is nested under image.image.url
        }))
      );
    } else {
      // If no sections, initialize with one empty section
      setSections([{ title: '', content: '', imageUrl: '' }]);
    }
    setHasChanges(false);
  };

  const resetForm = () => {
    setFormData({
      organizationName: member?.organisationInfo?.companyName || '',
      articleName: '',
      authorName: user?.name || '',
      articleCategory: '',
      articleFormat: 'write',
      shortIntro: '',
      pdfFileId: null,
      pdfFileUrl: '',
      imageId: null,
      imageUrl: '',
    });
    setSections([{ title: '', content: '', imageUrl: '' }]);
    setCoverImageFile(null);
    setPdfFile(null);
    setErrors({});
    setIsEditingEnabled(false);
    setSelectedCategory(null);
    setHasChanges(false);
  };

  const canEditFields = (currentStatus: ArticleStatus): boolean => {
    // Allow editing if:
    // 1. User has clicked Edit on approved article (isEditingEnabled = true)
    // 2. Status is draft or rejected
    // Pending and published articles are read-only unless Edit is clicked
    return isEditingEnabled || (currentStatus === 'draft' || currentStatus === 'rejected');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setHasChanges(true);
  };

  const handleSectionChange = (index: number, field: keyof FormSection, value: any) => {
    setSections(prev =>
      prev.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    );
    setHasChanges(true);
  };

  const handleAddSection = () => {
    setSections(prev => [...prev, { title: '', content: '', imageUrl: '' }]);
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length > 1) {
      setSections(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    try {
      const imageId = await strapi.uploadDocument(file);
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imageId, imageUrl: url }));
      setCoverImageFile(file);
      setErrors(prev => ({ ...prev, image: '' }));
      setHasChanges(true);
    } catch (error) {
      console.error('Cover image upload error:', error);
      alert('Failed to upload cover image');
    }
  };

  const handlePdfUpload = async (file: File) => {
    try {
      const pdfId = await strapi.uploadDocument(file);
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, pdfFileId: pdfId, pdfFileUrl: url }));
      setPdfFile(file);
      setErrors(prev => ({ ...prev, pdfFile: '' }));
      setHasChanges(true);
    } catch (error) {
      console.error('PDF upload error:', error);
      alert('Failed to upload PDF');
    }
  };

  const handleSectionImageUpload = async (index: number, file: File) => {
    try {
      const imageId = await strapi.uploadDocument(file);
      const url = URL.createObjectURL(file);
      handleSectionChange(index, 'imageId', imageId);
      handleSectionChange(index, 'imageUrl', url);
      handleSectionChange(index, 'imageFile', file);
      setErrors(prev => ({ ...prev, [`section_${index}_image`]: '' }));
      setHasChanges(true);
    } catch (error) {
      console.error('Section image upload error:', error);
      alert('Failed to upload section image');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.articleName.trim()) {
      newErrors.articleName = 'Article name is required';
    }
    if (!formData.authorName.trim()) {
      newErrors.authorName = 'Author name is required';
    }
    if (!formData.articleCategory) {
      newErrors.articleCategory = 'Article category is required';
    }
    if (formData.articleFormat === 'write' && !formData.shortIntro.trim()) {
      newErrors.shortIntro = 'Short intro is required';
    }
    if (!formData.imageId && !coverImageFile) {
      newErrors.image = 'Cover image is required';
    }

    if (formData.articleFormat === 'write') {
      sections.forEach((section, index) => {
        // Section 1 (index 0) is non-mandatory
        if (index === 0) return;
        if (!section.title.trim()) {
          newErrors[`section_${index}_title`] = 'Section title is required';
        }
        if (!section.content.trim()) {
          newErrors[`section_${index}_content`] = 'Section content is required';
        }
        if (!section.imageId && !section.imageFile) {
          newErrors[`section_${index}_image`] = 'Section image is required';
        }
      });
    } else if (formData.articleFormat === 'pdf') {
      if (!formData.pdfFileId && !pdfFile) {
        newErrors.pdfFile = 'PDF file is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!formData.articleName.trim()) {
      setErrors({ articleName: 'Article name is required' });
      return;
    }
    if (!formData.articleCategory) {
      setErrors({ articleCategory: 'Article category is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: formData.articleName,
        slug: formData.articleName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        organizationName: formData.organizationName,
        authorName: formData.authorName,
        authorEmail: user?.email,
        articleCategory: selectedCategory?.label || null,
        newsStatus:  'Draft', // Always set to Draft when saving
        authorImage: member?.organisationInfo?.memberLogoUrl,
        newsImage: formData.imageId,
        articleFormat: formData.articleFormat,
        news_tab: formData.articleCategory,
        // ...(formData.articleCategory && { news_tab: formData.articleCategory }),
        ...(formData.articleFormat === 'pdf' && {
          pdfFile: formData.pdfFileId,
        }),
        ...(formData.articleFormat === 'write' && {
          shortDescription: formData.shortIntro,
        }),
        ...(formData.articleFormat === 'write' && sections.some(s => s.title.trim() || s.content.trim() || s.imageId) ? {
          event_details: sections.filter(s => s.title.trim() || s.content.trim() || s.imageId).map(s => ({
            title: s.title,
            description: s.content,
            image: s.imageId ? {
              image: s.imageId,
              alternateText: formData.articleName,
              href: '#'
            } : null,
          }))
        } : {}),
      };

      if (articleId && articleData?.documentId) {
        await strapi.publicationApi.updateArticle(articleData.documentId, payload);
      } else {
        await strapi.publicationApi.createArticle(payload);
      }

      onSave?.(currentStatus, 'save');
      onClose();
    } catch (error: any) {
      console.error('Save draft error:', error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try { 
      const payload = {
        title: formData.articleName,
        slug: formData.articleName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        organizationName: formData.organizationName,
        authorName: formData.authorName,
        authorEmail: user?.email,
        articleCategory: selectedCategory?.label || null,
        newsStatus: 'Pending',
        authorImage: member?.organisationInfo?.memberLogoUrl,
        shortDescription: formData.shortIntro,
        newsImage: formData.imageId,
        articleFormat: formData.articleFormat,
        news_tab: formData.articleCategory,
        // ...(formData.articleCategory && { news_tab: formData.articleCategory }),
        ...(formData.articleFormat === 'pdf' && {
          pdfFile: formData.pdfFileId,
        }),
        ...(formData.articleFormat === 'write' && {
          shortDescription: formData.shortIntro,
        }),
        ...(formData.articleFormat === 'write' && sections.some(s => s.title.trim() || s.content.trim() || s.imageId) ? {
          event_details: sections.filter(s => s.title.trim() || s.content.trim() || s.imageId).map(s => ({
            title: s.title,
            description: s.content,
            image: s.imageId ? {
              image: s.imageId,
              alternateText: formData.articleName,
              href: '#'
            } : null,
          }))
        } : {}),
      };

      if (articleId && articleData?.documentId) {
        await strapi.publicationApi.updateArticle(articleData?.documentId, payload);
      } else {
        await strapi.publicationApi.createArticle(payload);
      }
      

      // Send email notification
      try {
        const emailPayload = {
          email: user?.email,
          type: "ARTICLE_SUBMITTED_FOR_APPROVAL",
          title: formData.articleName,
          description: formData.shortIntro || 'This is a PDF article.',
          category: selectedCategory?.label || formData.articleCategory,
          organizerName: formData.organizationName,
          eventType: "article",
          firstName: user?.name?.split(' ')[0],
          lastName: user?.name?.split(' ').slice(1).join(' '),
        };
        await strapi.publicationApi.sendArticleEmail(emailPayload);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the submission if email fails
      }

      onSave?.(currentStatus, 'review');
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit article');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (currentStatus !== 'approved') return;

    setSaving(true);
    try {
      

      if (articleId && articleData?.documentId) {
        const payload = {
          newsStatus: 'Published',
        };
        await strapi.publicationApi.publishArticle(articleData.documentId, payload);
        onSave?.(currentStatus, 'publish');
        onClose();
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish article');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const slug = articleData?.slug || (articleId ? `article-${articleId}` : null);
    if (!slug) {
      console.error('No slug found for preview');
      return;
    }
    const fullPath = `/${locale}/news-publications/all-publications/${slug}`;
    window.open(fullPath, '_blank');
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!articleId || !articleData?.documentId) return;

    setSaving(true);
    try {
      await strapi.publicationApi.deleteArticle(articleData.documentId);
      onSave?.(currentStatus, 'delete');
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete article');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusConfig = () => {
    const isPdfArticle = formData.articleFormat === 'pdf';

    switch (currentStatus) {
      case 'draft':
        return {
          headerTitle: 'Publish an Article',
          showAlert: false,
          buttons: [
            { type: 'primary', text: 'Submit for Review', action: handleSubmitForReview, disabled: false },
            { type: 'secondary', text: 'Save as Draft', action: handleSaveDraft, disabled: !hasChanges },
            ...(!isPdfArticle && articleId && articleData?.documentId ? [{ type: 'preview', text: 'Preview', action: handlePreview, disabled: false }] : []),
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
          alertMessage: 'Your article is being reviewed by the admin team.',
          alertBg: '#FDF9ED',
          alertBorder: '#F3DA91',
          alertIconColor: '#A38529',
          alertTitleColor: '#A38529',
          buttons: [
            { type: 'primary', text: 'Cancel Review', action: handleSaveDraft, disabled: false },
            ...(isPdfArticle ? [] : [{ type: 'preview', text: 'Preview', action: handlePreview, disabled: false }]),
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
          alertMessage: articleData?.comments || 'Please review the comments and resubmit.',
          alertBg: '#FFEFEB',
          alertBorder: '#FDAEA0',
          alertIconColor: '#D61B0A',
          alertTitleColor: '#D61B0A',
          buttons: [
            { type: 'primary', text: 'Resubmit for Review', action: handleSubmitForReview, disabled: !hasChanges },
            { type: 'secondary', text: 'Save as Draft', action: handleSaveDraft, disabled: false },
            ...(isPdfArticle ? [] : [{ type: 'preview', text: 'Preview', action: handlePreview, disabled: false }]),
          ],
          hideDelete: false,
        };
      case 'approved':
        return {
          headerTitle: 'Approved',
          showAlert: true,
          alertType: 'success',
          alertIcon: <CheckCircle className="w-5 h-5" />,
          alertTitle: 'Article Approved',
          alertMessage: 'Your article has been approved and is ready to publish.',
          alertBg: '#EDFDF3',
          alertBorder: '#91F3BA',
          alertIconColor: '#248F50',
          alertTitleColor: '#248F50',
          buttons: [
            { type: 'primary', text: isEditingEnabled ? 'Submit for Review' : 'Publish', action: isEditingEnabled ? handleSubmitForReview : handlePublish, disabled: false },
            ...(isPdfArticle ? [] : [{ type: 'preview', text: 'Preview', action: handlePreview, disabled: false }]),
            ...(isEditButtonVisible ? [{ type: 'edit', text: 'Edit', action: () => setShowEditModal(true), disabled: false }] : []),
          ],
          hideDelete: false,
        };
      case 'published':
        return {
          headerTitle: 'Published',
          showAlert: true,
          alertType: 'success',
          alertIcon: <CheckCircle className="w-5 h-5" />,
          alertTitle: 'Article Published',
          alertMessage: 'Your article has been published and is now live.',
          alertBg: '#EDFDF3',
          alertBorder: '#91F3BA',
          alertIconColor: '#248F50',
          alertTitleColor: '#248F50',
          buttons: isPdfArticle ? [] : [{ type: 'preview', text: 'Preview', action: handlePreview, disabled: false }],
          hideDelete: true,
        };
      default:
        return {
          headerTitle: 'Publish an Article',
          showAlert: false,
          buttons: [
            { type: 'primary', text: 'Submit for Review', action: handleSubmitForReview, disabled: false },
            { type: 'secondary', text: 'Save as Draft', action: handleSaveDraft, disabled: false },
            ...(isPdfArticle ? [] : [{ type: 'preview', text: 'Preview', action: handlePreview, disabled: false }]),
          ],
          hideDelete: false,
        };
    }
  };


  const statusConfig = getStatusConfig();
  const isDisabled = !canEditFields(currentStatus);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(7.58px)',
      }}
      onClick={() => {
        if ((currentStatus === 'draft' || currentStatus === 'rejected') && hasChanges) {
          setShowUnsavedModal(true);
        } else {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-[853px] flex flex-col bg-white rounded-[20px] my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 gap-3 bg-wfzo-gold-25 rounded-t-[20px]">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => {
                if ((currentStatus === 'draft' || currentStatus === 'rejected') && hasChanges) {
                  setShowUnsavedModal(true);
                } else {
                  onClose();
                }
              }}
              className="w-6 h-6 flex items-center justify-center text-wfzo-grey-800 hover:text-wfzo-grey-900 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <h2 className="font-source font-bold text-base leading-5 text-wfzo-grey-900">
            {statusConfig.headerTitle || 'Publish an Article'}
          </h2>

          <div className="flex items-center justify-end gap-3 flex-1">
            <button
              onClick={() => {
                if ((currentStatus === 'draft' || currentStatus === 'rejected') && hasChanges) {
                  setShowUnsavedModal(true);
                } else {
                  onClose();
                }
              }}
              className="w-6 h-6 flex items-center justify-center text-wfzo-grey-800 hover:text-wfzo-grey-900 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex flex-col px-8 py-8 gap-8 overflow-y-auto max-h-[calc(100vh-360px)]">
          {/* Status Alert Banner */}
          {statusConfig?.showAlert && (
            <div
              className="flex items-start gap-3 p-4 mx-4 my-4 rounded-lg"
              style={{
                backgroundColor: statusConfig.alertBg,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: statusConfig.alertBorder,
              }}
            >
              <div style={{ color: statusConfig.alertIconColor }} className="pt-0.5">
                {statusConfig.alertIcon}
              </div>
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
          {/* Article Details Section */}
          <div className="flex flex-col gap-4">
            <h3 className="font-montserrat font-extrabold text-2xl leading-8 text-wfzo-grey-900">
              Article Details
            </h3>

            <div className="flex flex-col gap-8">
              {/* Organization Name */}
              <div className="flex flex-col gap-1">
                <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                  Organization Name
                </label>
                <Input
                  value={formData.organizationName}
                  disabled
                  className="h-12 px-4 py-1 rounded-[9px] border border-wfzo-grey-400 bg-wfzo-grey-100 text-wfzo-grey-600 font-source text-base leading-6"
                />
              </div>

              {/* Article Name */}
              <div className="flex flex-col gap-1">
                <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                  Article Name*
                </label>
                <Input
                  value={formData.articleName}
                  onChange={(e) => handleInputChange('articleName', e.target.value)}
                  placeholder="Name of Article"
                  disabled={isDisabled}
                  className={`h-12 px-4 py-1 rounded-[9px] border border-wfzo-grey-200 bg-white text-wfzo-grey-600 font-source text-base leading-6 ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                {errors.articleName && (
                  <p className="text-red-500 text-xs mt-1 font-source">{errors.articleName}</p>
                )}
              </div>

              {/* Author Name & Category Row */}
              <div className="flex items-start gap-8">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                    Author Name*
                  </label>
                  <Input
                    value={formData.authorName}
                    disabled
                    className="h-12 px-4 py-1 rounded-[9px] border border-wfzo-grey-400 bg-wfzo-grey-100 text-wfzo-grey-600 font-source text-base leading-6"
                  />
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <CustomSelectBox
                    label="Article Category*"
                    options={articleCategories}
                    value={formData.articleCategory}
                    onChange={(value) => {
                      handleInputChange('articleCategory', value);
                      const category = articleCategories.find(cat => cat.value === value);
                      setSelectedCategory(category || null);
                    }}
                    placeholder="Select Category"
                    disabled={isDisabled}
                    readOnly={isDisabled}
                  />
                  {errors.articleCategory && (
                    <p className="text-red-500 text-xs mt-1 font-source">{errors.articleCategory}</p>
                  )}
                </div>
              </div>

              {/* Article Format Radio Buttons */}
              <div className="flex flex-col gap-1">
                <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                  Article Formats
                </label>
                <RadioGroup
                  value={formData.articleFormat}
                  onValueChange={(value) =>
                    handleInputChange('articleFormat', value as 'write' | 'pdf')
                  }
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '16px',
                  }}
                  disabled={isDisabled}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      <RadioGroupItem value="write" id="write" disabled={isDisabled} />
                    </div>
                    <label
                      htmlFor="write"
                      className="font-source text-sm leading-6 tracking-[-0.084px] text-wfzo-grey-800 cursor-pointer"
                    >
                      Write Article
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      <RadioGroupItem value="pdf" id="pdf" disabled={isDisabled} />
                    </div>
                    <label
                      htmlFor="pdf"
                      className="font-source text-sm leading-6 tracking-[-0.084px] text-wfzo-grey-800 cursor-pointer"
                    >
                      Upload PDF
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Article Text Section (Write Mode) */}
          {formData.articleFormat === 'write' && (
            <div className="flex flex-col gap-4">
              <h3 className="font-montserrat font-extrabold text-2xl leading-8 text-wfzo-grey-900">
                Article Text
              </h3>

              <div className="flex flex-col gap-8">
                {/* Short Article Intro */}
                <div className="flex flex-col gap-1">
                  <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                    Short Article Intro{formData.articleFormat === 'write' ? '*' : ''}
                  </label>
                  <Textarea
                    value={formData.shortIntro}
                    onChange={(e) => handleInputChange('shortIntro', e.target.value)}
                    placeholder="Introduction"
                    rows={5}
                    maxLength={256}
                    disabled={isDisabled}
                    className={`px-3 py-1.5 rounded-[9px] border border-wfzo-grey-200 bg-white text-wfzo-grey-600 font-source text-base leading-6 resize-none ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <p className="font-source text-xs leading-4 text-wfzo-grey-800">
                    {256 - formData.shortIntro.length} characters left
                  </p>
                  {errors.shortIntro && (
                    <p className="text-red-500 text-xs mt-1 font-source">{errors.shortIntro}</p>
                  )}
                </div>

                {/* Dynamic Sections */}
                {sections.map((section, index) => (
                  <div key={index} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-source font-bold text-base leading-5 text-wfzo-grey-800">
                        Section {index + 1}
                      </h4>
                      {sections.length > 1 && !isDisabled && (
                        <button
                          onClick={() => handleRemoveSection(index)}
                          className="font-source text-base font-bold leading-5 cursor-pointer h-[40px] rounded-[12px] py-2 px-6 flex items-center justify-center gap-[10px] border-2 text-red-600 border-red-600 hover:bg-red-50"
                          aria-label={`Delete Section ${index + 1}`}
                        >
                          Delete Section
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-8">
                      {/* Section Title */}
                      <div className="flex flex-col gap-1">
                        <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                          Title*
                        </label>
                        <Input
                          value={section.title}
                          onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                          placeholder="Title"
                          disabled={isDisabled}
                          className={`h-12 px-4 py-1 rounded-[9px] border border-wfzo-grey-200 bg-white text-wfzo-grey-600 font-source text-base leading-6 ${
                            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                        {errors[`section_${index}_title`] && (
                          <p className="text-red-500 text-xs mt-1 font-source">{errors[`section_${index}_title`]}</p>
                        )}
                      </div>

                      {/* Section Content */}
                      <div className="flex flex-col gap-1">
                        <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                          Article Text
                        </label>
                        <StrapiRichTextEditor
                          initialContent={section.content ?? ""}
                          disabled={isDisabled}
                          onSave={(html: string) => {
                            handleSectionChange(index, 'content', html);
                            if (errors[`section_${index}_content`]) {
                              setErrors((prev) => ({
                                ...prev,
                                [`section_${index}_content`]: '',
                              }));
                            }
                          }}
                        />
                        {errors[`section_${index}_content`] && (
                          <p className="text-red-500 text-xs mt-1 font-source">{errors[`section_${index}_content`]}</p>
                        )}
                      </div>

                      {/* Section Image Upload */}
                      <div className="flex flex-col gap-1">
                      <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                          Upload Image*
                        </label>
                      <CustomFileUploadField
                        label="Upload Image*"
                        previewUrl={section.imageUrl}
                        onSelect={(file: File) => handleSectionImageUpload(index, file)}
                        onRemove={currentStatus === 'draft' || currentStatus === 'rejected' ? () => {
                          handleSectionChange(index, 'imageUrl', '');
                          handleSectionChange(index, 'imageId', null);
                        } : () => {}}
                        accept="image/*"
                        disabled={isDisabled}
                      />
                      </div>
                      {errors[`section_${index}_image`] && (
                        <p className="text-red-500 text-xs mt-1 font-source">{errors[`section_${index}_image`]}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Section Button */}
                {!isDisabled && (
                  <div className='flex-shrink-0'>
                  <GoldButton 
                    onClick={handleAddSection}
                  >
                    <Plus className="w-6 h-6" />
                    <span>Add Section</span>
                  </GoldButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload PDF Section */}
          {formData.articleFormat === 'pdf' && (
            <div className="flex flex-col gap-4">
              <h3 className="font-montserrat font-extrabold text-2xl leading-8 text-wfzo-grey-900">
                Upload PDF
              </h3>

              <div className="flex flex-col gap-8">
                {/* PDF Upload */}
                <div className="flex flex-col gap-1">
                <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                  Upload PDF*
                </label>
                
                <CustomFileUploadField
                  label="Upload PDF*"
                  previewUrl={formData.pdfFileUrl}
                  onSelect={(file: File) => handlePdfUpload(file)}
                  onRemove={() => {
                    setFormData(prev => ({ ...prev, pdfFileId: null, pdfFileUrl: '' }));
                    setPdfFile(null);
                  }}
                  accept=".pdf"
                  disabled={isDisabled}
                />
                </div>
                {errors.pdfFile && (
                  <p className="text-red-500 text-xs mt-1 font-source">{errors.pdfFile}</p>
                )}

                {/* Cover Image for PDF */}
                <div className="flex flex-col gap-1">
                <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                  Upload Image*
                </label>
                <CustomFileUploadField
                  label="Upload Image*"
                  previewUrl={formData.imageUrl}
                  onSelect={(file: File) => handleCoverImageUpload(file)}
                  onRemove={currentStatus === 'draft' || currentStatus === 'rejected' ? () => {
                    setFormData(prev => ({ ...prev, imageId: null, imageUrl: '' }));
                    setCoverImageFile(null);
                  } : () => {}}
                  accept="image/*"
                  disabled={isDisabled}
                />
                </div>
                {errors.image && (
                  <p className="text-red-500 text-xs mt-1 font-source">{errors.image}</p>
                )}
              </div>
            </div>
          )}

          {/* Cover Image for Write Mode */}
          {formData.articleFormat === 'write' && (
            <div className="flex flex-col gap-1">
              <label className="font-source text-sm leading-5 text-wfzo-grey-800">
                  Upload Image*
                </label>
              <CustomFileUploadField
                label="Upload Image*"
                previewUrl={formData.imageUrl}
                onSelect={(file: File) => handleCoverImageUpload(file)}
                onRemove={currentStatus === 'draft' || currentStatus === 'rejected' ? () => {
                  setFormData(prev => ({ ...prev, imageId: null, imageUrl: '' }));
                  setCoverImageFile(null);
                } : () => {}}
                accept="image/*"
                disabled={isDisabled}
              />
              {errors.image && (
                <p className="text-red-500 text-xs mt-1 font-source">{errors.image}</p>
              )}
            </div>
          )}

          {/* Review Process Info */}
          <div className="font-source text-sm leading-5 text-wfzo-grey-700">
            <span className="font-bold text-wfzo-grey-800">Approval Process - </span>
            Upon submission, your article will be reviewed by our admin team within 3-5 business days. You will be notified via email regarding the status of your submission.
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-8 py-6 border-t border-wfzo-gold-100 flex items-center justify-between z-20 rounded-b-[20px]">
          <div className="flex items-center gap-4">
            {statusConfig.buttons.map((button, index) => {
              if (button.type === 'primary') {
                if (button.disabled) {
                  return (
                    <DisabledButton key={index} onClick={button.action}>
                      {button.text}
                    </DisabledButton>
                  );
                } else {
                  return (
                    <GoldButton key={index} onClick={button.action} disabled={saving}>
                      {button.text}
                    </GoldButton>
                  );
                }
              } else if (button.type === 'secondary') {
                return (
                  <LightButton key={index} onClick={button.action} disabled={button.disabled || saving}>
                    {button.text}
                  </LightButton>
                );
              } else if (button.type === 'preview') {
                return (
                  <LightButton
                    key={index}
                    onClick={button.action}
                    disabled={button.disabled || saving}
                  >
                    {button.text}
                  </LightButton>
                );
              } else if (button.type === 'edit') {
                return (
                  <LightButton
                    key={index}
                    onClick={button.action}
                    disabled={button.disabled || saving}
                  >
                    {button.text}
                  </LightButton>
                );
              }
              return null;
            })}
          </div>

          {!statusConfig.hideDelete && articleId && (
            <div className="flex items-center">
              <button
                onClick={handleDelete}
                disabled={saving}
              >
                <Image src="/assets/deletebuttonForEvent.svg" alt="Delete" width={30} height={30} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Article?"
        buttonText="Delete Article"
        description="This article is awaiting review. Deleting it will cancel the submission and remove the article permanently."
      />

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onSaveDraft={handleSaveDraft}
        onExitWithoutSaving={() => {
          setShowUnsavedModal(false);
          onClose();
        }}
      />

      <EditEventModal
        title="Edit Article?"
        description="Editing this article will restart the approval process. Your changes will need to be reviewed again before the event goes live."
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
