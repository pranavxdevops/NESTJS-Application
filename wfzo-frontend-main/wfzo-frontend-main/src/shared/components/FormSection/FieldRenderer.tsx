
'use client';

import React, { useCallback } from 'react';
import { defaultCountries, parseCountry, PhoneInput, usePhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

import { Input } from '@/shared/components/Input';
import { CustomSelectBox, type SelectOption } from '@/shared/components/CustomSelectBox';
import type { FormField, DropdownValue, FormValue } from './types';
import { formatKeyToLabel } from './utils';
import Tooltip from '../Tooltip';
import { FORM_FIELD_KEYS } from '@/lib/constants/constants';
import Image from "next/image"
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { CustomPhoneInputField } from '../CustomPhoneInputField';

interface FieldRendererProps {
  field: FormField;
  value: FormValue;
  dropdownOptions?: Record<string, DropdownValue[]>;
  locale: string;
  readOnly?: boolean;
  error?: string;
  touched?: boolean;
  onValueChange?: (value: FormValue) => void;
  onBlur?: () => void;
}

export function FieldRenderer({
  field,
  value,
  dropdownOptions = {},
  locale,
  readOnly = false,
  error,
  touched = false,
  onValueChange,
  onBlur,
}: FieldRendererProps) {
  const getFieldTranslation = useCallback(() => {
    const translation = field.translations.find((item) => item.language === locale);
    return translation ?? field.translations[0];
  }, [field.translations, locale]);

  const translation = getFieldTranslation();
  const label = translation?.label || formatKeyToLabel(field.fieldKey);
  const placeholder = translation?.placeholder || '';
  const hasError = touched && Boolean(error);

  // Checkbox field
  if (field.fieldType === 'checkbox') {
    const defaultChecked =field.fieldKey === FORM_FIELD_KEYS.NEWS_LETTER
    const checked = typeof value === 'boolean' ? value : defaultChecked;
     const showDeclarationError =
    field.fieldKey === FORM_FIELD_KEYS.AUTHORIZATION && touched && error;
    return (
      <div key={field.fieldKey} className="col-span-full">
        <label className="flex items-start gap-3 text-sm text-gray-700 font-source">
          <input
            type="checkbox"
            name={field.fieldKey}
            checked={checked}
            onChange={(e) => onValueChange?.(e.target.checked)}
            onBlur={onBlur}
            disabled={readOnly}
            // className={`mt-1 size-5 rounded ${
            //   readOnly
            //     ? 'border-neutral-grey-300 bg-neutral-grey-50 text-neutral-grey-700'
            //     : 'border-neutral-grey-400 text-wfzo-gold-600 focus:ring-wfzo-gold-600'
            // }`}
            className="hidden"
          />
          <span className="flex items-center justify-center flex-shrink-0">
            <Image
                src={
  readOnly
    ? (checked ? "/assets/readOnlyCheckBox.svg" : "/assets/unCheckedBox.svg")
    : (checked ? "/assets/checkedBox.svg" : "/assets/unCheckedBox.svg")
}
              alt={checked ? "Checked" : "Unchecked"}
              width={20}
              height={20}
              className={readOnly ? "opacity-60" : "cursor-pointer"}
            />

          </span>
          <label className="text-sm text-gray-700 font-source flex items-center">
            {label}
            {field.fieldKey === FORM_FIELD_KEYS.AUTHORIZATION && (
              <span className="inline-flex ml-2.5">
                <Tooltip
                  text="An authorized person is legally empowered to act on a company's behalf, including signing documents and making contracts"
                  position="top"
                  align="start"
                >
                  <div className="cursor-pointer">
                    <Image width={20} height={20} src="/assets/info.svg" alt="info" />
                  </div>
                </Tooltip>
              </span>
            )}
          </label>
        </label>
         {showDeclarationError && (
          <p className="text-red-500 text-xs font-source mt-2">{error}</p>
        )}
      </div>
    );
  }

  // Dropdown field
  if (field.fieldType === 'dropdown') {
    const options = field.dropdownCategory
      ? dropdownOptions[field.dropdownCategory] ?? []
      : [];

      // Check if this is the industries field (multi-select)
    if (field.fieldKey === 'industries') {
      const arrayValue = Array.isArray(value) ? value : [];

      return (
        <MultiSelectDropdown
          key={field.fieldKey}
          options={options}
          value={arrayValue}
          onChange={(val) => onValueChange?.(val)}
          onBlur={onBlur}
          placeholder={placeholder || `Select ${label.toLowerCase()}`}
          label={label}
          disabled={readOnly || !options.length}
          hasError={hasError}
          error={error}
        />
      );
    }
    const stringValue = typeof value === 'string' ? value : '';
    const selectOptions: SelectOption[] = options.map((option: DropdownValue) => ({
      label: option.label,
      value: option.code,
    }));

    return (
      <div key={field.fieldKey} className="space-y-1">
        <CustomSelectBox
          value={stringValue}
          onChange={(val) => onValueChange?.(val)}
          label={label}
          placeholder={placeholder || `Select ${label.toLowerCase()}`}
          options={selectOptions}
          disabled={readOnly || !options.length}
          readOnly={readOnly}
          required={!readOnly}
          hasError={hasError}
          error={error}
        />
      </div>
    );
  }

  // Phone field
  if (field.fieldType === 'phone') {
    const stringValue = typeof value === 'string' ? value : '';

    return (
      <CustomPhoneInputField
        key={field.fieldKey}
        value={stringValue}
        onChange={(phone) => onValueChange?.(phone)}
        onBlur={onBlur}
        label={label}
        placeholder={placeholder || '__ ___ ____'}
        readOnly={readOnly}
        disabled={readOnly}
        hasError={hasError}
        error={error}
        required={!readOnly}
        defaultCountry="af"
      />
    );
  }

  // Text, email, url fields
  const inputType =
    field.fieldType === 'email'
      ? 'email'
      : field.fieldType === 'url'
        ? 'url'
        : 'text';
  const stringValue = typeof value === 'string' ? value : '';

  return (
    <div key={field.fieldKey} className="space-y-1">
      <label
        className="text-sm text-gray-700 font-source flex items-center"
        htmlFor={field.fieldKey}
      >
        {label}
        {!readOnly && <span>*</span>}
        {field.fieldKey === FORM_FIELD_KEYS.AUTHORIZATION && (
          <span className="inline-flex ml-2.5">
            <Tooltip
              text="An authorized person is legally empowered to act on a company's behalf, including signing documents and making contracts"
              position="top"
              align="start"
            >
              <div className="cursor-pointer">
                <Image width={20} height={20} src="/assets/info.svg" alt="info" />
              </div>
            </Tooltip>
          </span>
        )}
        {field.fieldKey === FORM_FIELD_KEYS.PRIMARY_CONTACT && (
          <span className="inline-flex ml-2.5">
            <Tooltip
              text="Primary contact person is officially empowered to make decisions and bind the company legally."
              position="top"
              align="start"
            >
              <div className="cursor-pointer">
                <Image width={20} height={20} src="/assets/info.svg" alt="info" />
              </div>
            </Tooltip>
          </span>
        )}
      </label>
      <Input
        id={field.fieldKey}
        name={field.fieldKey}
        type={inputType}
        value={stringValue}
        onChange={(e) => onValueChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={readOnly}
        className={`h-12 rounded-md font-source text-sm ${
          hasError
            ? 'border-red-500'
            : readOnly
              ? 'border-neutral-grey-300 bg-[#FDFCFC] text-neutral-grey-700'
              : 'border-neutral-grey-300'
        }`}
      />
      {hasError && <p className="text-red-500 text-xs font-source">{error}</p>}
    </div>
  );
}
