'use client';

import React, { useState, useMemo } from 'react';
import { defaultCountries, parseCountry, usePhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import Image from 'next/image';
import { Input } from '@/shared/components/Input';

interface PhoneInputFieldProps {
  value: string;
  onChange: (phone: string) => void;
  onBlur?: () => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  hasError?: boolean;
  error?: string;
  required?: boolean;
  defaultCountry?: string;
}

export function CustomPhoneInputField({
  value,
  onChange,
  onBlur,
  label,
  placeholder = '',
  disabled = false,
  readOnly = false,
  hasError = false,
  error,
  required = false,
  defaultCountry = 'af',
}: PhoneInputFieldProps) {
  const phoneInput = usePhoneInput({
    defaultCountry,
    value,
    onChange: (data) => {
      onChange(data.phone);
    },
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const countries = useMemo(
    () => defaultCountries.map((c) => parseCountry(c)),
    []
  );



  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-700 font-source">
        {label}
        {required && !readOnly && <span>*</span>}
      </label>

      {/* Two-box UI */}
      <div className="flex items-center gap-2">
        {/* FLAG BOX WITH DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            className={`h-12 w-16 flex items-center justify-center rounded-md border bg-white z-30
              ${
                readOnly
                  ? 'bg-[#FDFCFC] border-neutral-grey-300 cursor-not-allowed'
                  : 'bg-white border-neutral-grey-300 cursor-pointer hover:border-neutral-grey-400'
              }
              ${hasError ? 'border-red-500' : 'border-neutral-grey-300'}`}
          >
            <Image
              src={`https://flagcdn.com/w20/${phoneInput.country.iso2}.png`}
              alt={phoneInput.country.name}
              className="w-6 h-4 rounded-sm"
              height={16}
              width={24}
            />
            <Image
              src="/assets/arrowMark.svg"
              alt=""
              width={8}
              height={8}
              className={`ml-2 transition-transform ${isDropdownOpen ? '-scale-y-100' : 'scale-y-100'}`}
            />
          </button>

          {/* Country Dropdown */}
          {isDropdownOpen && !disabled && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 w-64 max-h-60 overflow-y-auto bg-white border border-neutral-grey-300 rounded-md shadow-lg z-50">
                {countries.map((country) => (
                  <button
                    key={country.iso2}
                    type="button"
                    onClick={() => {
                      phoneInput.setCountry(country.iso2);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-source hover:bg-neutral-grey-100 flex items-center gap-2"
                  >
                    <Image
                      src={`https://flagcdn.com/w20/${country.iso2}.png`}
                      alt={country.name}
                      className="w-5 h-4 rounded-sm"
                      width={20}
                      height={16}
                    />
                    <span className="flex-1">{country.name}</span>
                    <span className="text-neutral-grey-500">+{country.dialCode}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* PHONE INPUT */}
        <div className="relative w-full">
          <Input
            type="tel"
            value={phoneInput.inputValue}
            onChange={phoneInput.handlePhoneValueChange}
            onBlur={onBlur}
            readOnly={readOnly}
            disabled={disabled}
            placeholder={placeholder}
            className={`h-12 rounded-md font-source text-sm
              ${
                hasError
                  ? 'border-red-500'
                  : readOnly
                    ? 'border-neutral-grey-300 bg-[#FDFCFC] text-neutral-grey-700'
                    : 'border-neutral-grey-300'
              }`}
          />
        </div>
      </div>

      {hasError && error && <p className="text-red-500 text-xs font-source">{error}</p>}
    </div>
  );
}

 