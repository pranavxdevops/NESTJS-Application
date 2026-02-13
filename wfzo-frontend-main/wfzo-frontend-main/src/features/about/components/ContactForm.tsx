'use client';

import { useState } from 'react';
import { Input } from '@/shared/components/Input';
import { Textarea } from '@/shared/components/TextArea';
import { RadioGroup, RadioGroupItem } from '@/shared/components/RadioGroup';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import GoldButton from '@/shared/components/GoldButton';

interface ContactFormProps {
  className?: string;
}

export default function ContactForm({ className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    title: 'Mr',
    firstName: '',
    lastName: '',
    organization: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    // Required field checks
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!formData.organization.trim()) newErrors.organization = 'Organization is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email.';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required.';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required.';

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required.';
    } else if (formData.message.length > 256) {
      newErrors.message = 'Message cannot exceed 256 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    console.log('Form submitted:', formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`flex flex-col h-full min-h-0 font-source ${className}`}
    >
      <div className="flex-1 pr-2 min-h-0">
        {/* Title */}
        <div className='mb-8'>
          <label className="text-xs text-neutral-grey-800 font-source">Title</label>
          <RadioGroup
            value={formData.title}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, title: value }))}
          >
            <div className="flex gap-8 mt-2">
              {['Mr', 'Mrs'].map((title) => (
                <div className="flex items-center gap-2" key={title}>
                  <RadioGroupItem
                    value={title}
                    id={title}
                    className="w-5 h-5 border-2 border-neutral-grey-400 data-[state=checked]:bg-primary-blue-500"
                  />
                  <label htmlFor={title} className="text-xs text-neutral-grey-900 font-inter">
                    {title}.
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* First & Last Name */}
        <div className="lg:flex gap-8">
          <InputField
            label="First name*"
            placeholder="First name"
            value={formData.firstName}
            onChange={(val) => {
              setFormData((prev) => ({ ...prev, firstName: val }));
              if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
            }}
            error={errors.firstName}
          />
          <InputField
            label="Last name*"
            placeholder="Last name"
            value={formData.lastName}
            onChange={(val) => {
              setFormData((prev) => ({ ...prev, lastName: val }));
              if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
            }}
            error={errors.lastName}
          />
        </div>

        {/* Organization */}
        <InputField
          label="Organization name*"
          placeholder="Company"
          value={formData.organization}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, organization: val }));
            if (errors.organization) setErrors((prev) => ({ ...prev, organization: '' }));
          }}
          error={errors.organization}
        />

        {/* Email & Phone */}
        <div className="lg:flex gap-8 ">
          <InputField
            label="Email*"
            placeholder="E-mail address"
            type="text"
            value={formData.email}
            onChange={(val) => {
              setFormData((prev) => ({ ...prev, email: val }));
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            error={errors.email}
          />

          <div className="space-y-1 lg:flex-1 min-h-0">
            <label className="text-xs text-neutral-grey-800 font-source">Phone*</label>
            <PhoneInput
              country={'af'}
              value={formData.phone}
              onChange={(value: any) => {
                setFormData((prev) => ({ ...prev, phone: value }));
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              inputClass={`!w-full !h-12 !rounded-[6px] font-source !pl-12 !focus:outline-none !focus:ring-0 border ${
                errors.phone ? '!border-red-500' : '!border-neutral-grey-300'
              }`}
              buttonClass="!rounded-l-[6px] !border-neutral-grey-300"
            />
            <div className="min-h-[20px] mt-1">
              <p
                className={`text-xs font-source transition-opacity duration-200 ${
                  errors.phone ? 'text-red-500 opacity-100' : 'text-transparent opacity-0'
                }`}
              >
                {errors.phone || 'Placeholder'}
              </p>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs text-neutral-grey-800 font-source-sans">Subject*</label>
          <div className="relative w-full">
            <select
              value={formData.subject}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, subject: e.target.value }));
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
              }}
              className={`
            w-full appearance-none cursor-pointer
            h-12 rounded-md px-3 py-2 pr-10
            bg-white text-sm font-source
            border transition-colors
            focus:outline-none 
            disabled:cursor-not-allowed disabled:opacity-50
            ${errors.subject ? 'border-red-500' : 'border-neutral-grey-300'}
            ${!formData.subject && 'text-muted-foreground'}
          `}
          style={{ color: 'black' }}
            >
              <option value="" disabled className=''  hidden >
                Subject
              </option>
              <option value="general"
              className="bg-white text-slate-800 hover:bg-slate-100 font-medium w-[50px]"
              >General Inquiry</option>
              <option value="support" 
              className="bg-white text-slate-800 hover:bg-slate-100 font-medium"
              >Support</option>
              <option value="partnership"
              className="bg-white text-slate-800 hover:bg-slate-100 font-medium"
              >Partnership</option>
            </select>

            {/* Chevron Icon */}
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          <div className="min-h-[20px] mt-1">
            <p
              className={`text-xs font-source transition-opacity duration-200 ${
                errors.subject ? 'text-red-500 opacity-100' : 'text-transparent opacity-0'
              }`}
            >
              {errors.subject || 'Placeholder'}
            </p>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-xs text-neutral-grey-800 font-source">Message*</label>
          <Textarea
            placeholder="Write your message here"
            value={formData.message}
            onChange={(e: any) => {
              setFormData((prev) => ({ ...prev, message: e.target.value }));
              if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
            }}
            className={`min-h-[140px] rounded-md resize-none font-source-sans border ${
              errors.message ? 'border-red-500' : 'border-gray-500'
            }`}
          />
          <p className="text-xs text-neutral-grey-700 font-source-sans mt-2">
            {Math.max(0, 256 - formData.message.length)} characters left
          </p>
          <div className="min-h-[20px] mt-1">
            <p
              className={`text-xs font-source transition-opacity duration-200 ${
                errors.message ? 'text-red-500 opacity-100' : 'text-transparent opacity-0'
              }`}
            >
              {errors.message || 'Placeholder'}
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="">
        <GoldButton>Get in touch</GoldButton>
      </div>
    </form>
  );
}

interface InputFieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  error?: string;
  onChange: (val: string) => void;
}

const InputField = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
}: InputFieldProps) => (
  <div className="space-y-1 lg:flex-1 min-h-0">
    <label className="text-sm text-gray-700 font-source">{label}</label>
    <div
      className={`form-field-wrapper flex items-center gap-2 rounded-lg h-12 border ${
        error ? 'border-red-500' : 'border-neutral-grey-300'
      } focus-within:border-primary-blue-500`}
    >
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        className="flex-1 h-full border-none px-0 font-source shadow-none"
      />
    </div>
    <div className="min-h-[20px]">
      <p
        className={`text-xs font-source transition-opacity duration-200 ${
          error ? 'text-red-500 opacity-100' : 'text-transparent opacity-0'
        }`}
      >
        {error || 'Placeholder'}
      </p>
    </div>
  </div>
);
