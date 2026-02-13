'use client';

import React, { useState } from 'react';
import { Input } from './Input';
import { Textarea } from './TextArea';
import { CustomPhoneInputField } from './CustomPhoneInputField';
// removed title radios
import GoldButton from './GoldButton';
import { CustomSelectBox } from '@/shared/components/CustomSelectBox';
import { Country } from 'country-state-city';

interface FeaturedMemberFormProps {
  onSubmit?: (formData: FeaturedMemberFormData) => void | Promise<void>;
  className?: string;
  initialData?: Partial<FeaturedMemberFormData> | undefined;
  initialPhoneCountry?: string | undefined;
  enquiryType?: string;
  disabled?: boolean;
}

export interface FeaturedMemberFormData {
  firstName: string;
  lastName: string;
  organizationName: string;
  country: string;
  email: string;
  phone: string;
  message: string;
  subject?: string;
}

export default function FeaturedMemberForm({ onSubmit, className = '', initialData, initialPhoneCountry, enquiryType, disabled = false }: FeaturedMemberFormProps) {
  const [formData, setFormData] = useState<FeaturedMemberFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    organizationName: initialData?.organizationName || '',
    country: initialData?.country || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    message: initialData?.message || '',
    subject: initialData?.subject || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FeaturedMemberFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 256;

  const countries = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FeaturedMemberFormData, string>> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (enquiryType === 'submit_question' && !formData.subject?.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      // Reset only non-prefilled fields (keep readonly/prefilled values intact)
      setFormData((prev) => ({
        firstName: prefilled.firstName ? prev.firstName : '',
        lastName: prefilled.lastName ? prev.lastName : '',
        organizationName: prefilled.organizationName ? prev.organizationName : '',
        country: prefilled.country ? prev.country : '',
        email: prefilled.email ? prev.email : '',
        phone: prefilled.phone ? prev.phone : '',
        message: '',
        subject: '',
      }));
      setCharacterCount(0);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxCharacters) {
      setFormData({ ...formData, message: value });
      setCharacterCount(value.length);
    }
  };

  // Determine which fields were prefilled from initialData
  const prefilled = React.useMemo(() => ({
    firstName: !!initialData?.firstName,
    lastName: !!initialData?.lastName,
    organizationName: !!initialData?.organizationName,
    country: !!initialData?.country,
    email: !!initialData?.email,
    phone: !!initialData?.phone,
  }), [initialData]);

  // Update state when initialData changes (e.g., after auth loads)
  React.useEffect(() => {
    if (!initialData) return;
    setFormData((prev) => ({
      ...prev,
      firstName: initialData.firstName || prev.firstName,
      lastName: initialData.lastName || prev.lastName,
      organizationName: initialData.organizationName || prev.organizationName,
      country: initialData.country || prev.country,
      email: initialData.email || prev.email,
      phone: initialData.phone || prev.phone,
      message: initialData.message || prev.message,
    }));
    if (initialData?.message) setCharacterCount(initialData.message.length);
  }, [initialData]);

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-8 font-source ${className}`}>
      

      {/* First Name and Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-source">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-wfzo-grey-800 font-source">
            First name<span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Your First Name"
            disabled={prefilled.firstName || disabled}
            readOnly={prefilled.firstName || disabled}
            className={`${errors.firstName ? 'border-red-500' : ''} ${(prefilled.firstName || disabled) ? 'bg-[#FDFCFC] border-neutral-grey-300 text-neutral-grey-700' : ''}`}
          />
          {errors.firstName && <p className="text-red-500 text-xs font-source">{errors.firstName}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-wfzo-grey-800 font-source">
            Last name<span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Your Last Name"
            disabled={prefilled.lastName || disabled}
            readOnly={prefilled.lastName || disabled}
            className={`${errors.lastName ? 'border-red-500' : ''} ${(prefilled.lastName || disabled) ? 'bg-[#FDFCFC] border-neutral-grey-300 text-neutral-grey-300 text-neutral-grey-700' : ''}`}
          />
          {errors.lastName && <p className="text-red-500 text-xs font-source">{errors.lastName}</p>}
        </div>
      </div>

      {/* Organization Name and Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-source">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-wfzo-grey-800 font-source">
            Organization name<span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.organizationName}
            onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
            placeholder="Your Organization Name"
            readOnly={prefilled.organizationName || disabled}
            disabled={prefilled.organizationName || disabled}
            className={`${errors.organizationName ? 'border-red-500' : ''} ${(prefilled.organizationName || disabled) ? 'bg-[#FDFCFC] border-neutral-grey-300 text-neutral-grey-700' : ''}`}
          />
          {errors.organizationName && <p className="text-red-500 text-xs font-source">{errors.organizationName}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <CustomSelectBox
            label="Country"
            value={formData.country}
            onChange={(value) => setFormData({ ...formData, country: value })}
            placeholder="Select country"
            options={countries.map((country) => ({
              label: country.name,
              value: country.name,
            }))}
            required
            readOnly={prefilled.country || disabled}
            hasError={!!errors.country}
            error={errors.country}
          />
        </div>
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-wfzo-grey-800 font-source">
            E-mail<span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your email"
            readOnly={prefilled.email || disabled}
            disabled={prefilled.email || disabled}
            className={`${errors.email ? 'border-red-500' : ''} ${(prefilled.email || disabled) ? 'bg-[#FDFCFC] border-neutral-grey-300 text-neutral-grey-700' : ''}`}
          />
          {errors.email && <p className="text-red-500 text-xs font-source">{errors.email}</p>}
        </div>
        <div>
          <CustomPhoneInputField
            label="Phone*"
            value={formData.phone}
            onChange={(phone) => setFormData({ ...formData, phone })}
            placeholder="Enter your phone number"
            defaultCountry={initialPhoneCountry?.toLowerCase() || 'ae'}
            readOnly={prefilled.phone || disabled}
            disabled={prefilled.phone || disabled}
            hasError={!!errors.phone}
            error={errors.phone}
            required
          />
        </div>
      </div>

      {enquiryType === 'submit_question' && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-wfzo-grey-800 font-source">
            Subject<span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.subject || ''}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Enter Subject"
            readOnly={disabled}
            disabled={disabled}
            className={`${errors.subject ? 'border-red-500' : ''} ${disabled ? 'bg-[#FDFCFC] border-neutral-grey-300 text-neutral-grey-700' : ''}`}
          />
          {errors.subject && <p className="text-red-500 text-xs font-source">{errors.subject}</p>}
        </div>
      )}

      {/* Message */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-wfzo-grey-800 font-source">
          {enquiryType === 'submit_question' ? 'Question' : 'Message'}
        </label>
        <Textarea
          value={formData.message}
          onChange={handleMessageChange}
          placeholder={enquiryType === 'become_featured_member' ? "We'd like to know why you want to be featured" :  "Ask your question here" }
          readOnly={disabled}
          disabled={disabled}
          className={`min-h-[112px] ${errors.message ? 'border-red-500' : ''} ${disabled ? 'bg-[#FDFCFC] border-neutral-grey-300 text-neutral-grey-700' : ''}`}
        />
        <div className="flex justify-between items-center">
          {errors.message && <p className="text-red-500 text-xs font-source">{errors.message}</p>}
          <p className="text-xs text-wfzo-grey-800 font-source ml-auto">
            {maxCharacters - characterCount} characters left
          </p>
        </div>
      </div>

      {/* Submit Button */}
      {!disabled && (
        <div>
          <GoldButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </GoldButton>
        </div>
      )}
    </form>
  );
}
