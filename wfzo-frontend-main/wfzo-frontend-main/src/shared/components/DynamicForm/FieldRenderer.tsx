'use client';

import React, { useState, useEffect } from 'react';
import 'react-international-phone/style.css';
import { Input } from '../Input';
import Image from 'next/image'
import { CustomSelectBox, type SelectOption } from '../CustomSelectBox';
import { SignatureField } from './SignatureField';
import { FileUploadField } from './FileUploadField';
import type { FieldRendererProps } from './types';
import type { DocumentPurpose } from '@/features/membership/services/documentUpload';
import { FILE_TYPES } from '@/lib/constants/constants';
import { CustomPhoneInputField } from '../CustomPhoneInputField';
import { parseRichText } from '@/lib/utils/renderRichText';

function formatKeyToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

interface AdmissionCriteriaInfoFieldProps {
  label: string;
  content?: string;
}

function AdmissionCriteriaInfoField({ label, content }: AdmissionCriteriaInfoFieldProps) {
  const processedContent = content ? parseRichText(content) : 'No admission criteria information available.';

  return (
    <div className="space-y-1">
      <div
        className="text-sm text-gray-700 font-source  data-field"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
}

export function FieldRenderer({
  field,
  value,
  error,
  touched,
  disabled,
  dropdownOptions,
  onChange,
  onBlur,
  translation,
  onExternalErrorClear,
  admissionCriteriaContent,
  memberId,
}: FieldRendererProps) {
  const label = translation?.label || formatKeyToLabel(field.fieldKey);
  const placeholder = translation?.placeholder || '';
  const hasError = Boolean(touched && error);

  console.log("field", field);
  

  // Checkbox field
  if (field.fieldType === 'checkbox') {
    const checked = typeof value === 'boolean' ? value : false;
    return (
      <div key={field.fieldKey} className="col-span-full">
        <label className="flex items-start gap-3 text-sm text-gray-700 font-source">
          <input
            type="checkbox"
            name={field.fieldKey}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            disabled={disabled}
            className="hidden"
          />
           <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
             <Image
          src={
   disabled
     ? (checked ? "/assets/readOnlyCheckBox.svg" : "/assets/unCheckedBox.svg")
     : (checked ? "/assets/checkedBox.svg" : "/assets/unCheckedBox.svg")
 }

          alt={checked ? "Checked" : "Unchecked"}
          width={20}
          height={20}
          className={disabled ? "opacity-60" : "cursor-pointer"}
          />
            </span>
          <span className="space-y-1">
            <span className="block text-gray-700 font-source">{label}</span>
            {hasError && <p className="text-xs text-red-500">{error}</p>}
          </span>
        </label>
      </div>
    );
  }

  // Button/File upload field
  if (field.fieldType === 'button' || field.fieldType === 'file') {
    // Determine purpose from fieldKey
    let purpose: DocumentPurpose = 'other';
    if (field.fieldKey.toLowerCase().includes('logo')) {
      purpose = FILE_TYPES.MEMBER_LOGO;
    } else if (field.fieldKey.toLowerCase().includes('lice')) {
      purpose = FILE_TYPES.MEMBER_LICENSE;
    }

    const stringValue = typeof value === 'string' ? value : '';
    
    return (
      <div key={field.fieldKey} className="space-y-1">
        <FileUploadField
          label={label}
          value={stringValue}
          purpose={purpose}
          hasError={hasError}
          error={error}
          disabled={disabled}
          onChange={(url) => onChange(url)}
          accept={ purpose === FILE_TYPES.MEMBER_LICENSE?  '.pdf' : 'image/*' }
          onExternalErrorClear={() => onExternalErrorClear?.(field.fieldKey)}
          memberId={memberId}
        />
      </div>
    );
  }

  // Dropdown field
  if (field.fieldType === 'dropdown') {
    const options = dropdownOptions ?? [];
    const stringValue = typeof value === 'string' ? value : '';
    const selectOptions: SelectOption[] = options.map((option: { code: string; label: string }) => ({
      label: option.label,
      value: option.code,
    }));
    return (
      <div key={field.fieldKey} className="space-y-1">
        <CustomSelectBox
          value={stringValue}
          onChange={(nextValue) => onChange(nextValue)}
          label={label}
          placeholder={placeholder || `Select ${label.toLowerCase()}`}
          options={selectOptions}
          disabled={!options.length || disabled}
          required
          hasError={hasError}
          error={error}
        />
      </div>
    );
  }

  if (field.fieldType === 'phone') {
    const stringValue = typeof value === 'string' ? value : '';
    return (
      <CustomPhoneInputField
        key={field.fieldKey}
        value={stringValue}
        onChange={(phone) => onChange(phone)}
        onBlur={onBlur}
        label={label}
        placeholder={placeholder}
        disabled={disabled}
        hasError={hasError}
        error={error}
        required={true}
        defaultCountry="ae"
      />
    );
  }

  // Signature field - only render for signatureDraw
  if (field.fieldKey === 'signatureDraw') {
    const stringValue = typeof value === 'string' ? value : '';
    return (
      <div key={field.fieldKey} className="col-span-full space-y-1">
        <label className="text-sm text-gray-700 font-source">
          {label}<span>*</span>
        </label>
        <SignatureField
          value={stringValue}
          onChange={(val) => onChange(val)}
          onBlur={onBlur}
          placeholder={placeholder}
          hasError={hasError}
          disabled={disabled}
          memberId={memberId}
        />
        {hasError && <p className="text-xs text-red-500 font-source">{error}</p>}
      </div>
    );
  }

  // Skip signatureType field - it's used internally by SignatureField component
  if (field.fieldKey === 'signatureType') {
    return null;
  }

  // Special handling for infoSection field type - specifically admissionCriteriaInfo
  if (field.fieldType === 'infoSection' && field.fieldKey === 'admissionCriteriaInfo') {
    return <AdmissionCriteriaInfoField label={label} content={admissionCriteriaContent} />;
  }

  // Regular input fields (text, email, url, textarea)
  const inputType =
    field.fieldType === 'email'
      ? 'email'
      : field.fieldType === 'url'
        ? 'url'
        : field.fieldType === 'textarea'
          ? 'textarea'
          : 'text';
  const stringValue = typeof value === 'string' ? value : '';

  return (
    <div key={field.fieldKey} className="space-y-1">
      <label
        className="text-sm text-gray-700 font-source"
        htmlFor={field.fieldKey}
      >
        {label} {field.fieldKey !== "addressLine2" && <span>*</span>}
      </label>
      {inputType === 'textarea' ? (
        <textarea
          id={field.fieldKey}
          name={field.fieldKey}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={4}
          className={`w-full px-3 py-2 rounded-md font-source text-sm border ${
            hasError ? 'border-red-500' : 'border-neutral-grey-300'
          } focus:outline-none focus:ring-2 focus:ring-wfzo-gold-600`}
        />
      ) : (
        <Input
          id={field.fieldKey}
          name={field.fieldKey}
          type={inputType}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`h-12 rounded-md font-source text-sm ${
            hasError ? 'border-red-500' : 'border-neutral-grey-300' 
          }`}
        />
      )}
      {hasError && <p className="text-xs text-red-500 font-source">{error}</p>}
    </div>
  );
}

