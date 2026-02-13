'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export interface SelectOption {
  label: string;
  value: string;
}

interface CustomSelectBoxProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  readOnly?: boolean;
  hasError?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export function CustomSelectBox({
  value,
  onChange,
  onBlur,
  label,
  placeholder = 'Select an option',
  options,
  disabled = false,
  readOnly = false,
  hasError = false,
  error,
  required = false,
  className = '',
}: CustomSelectBoxProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsDropdownOpen(false);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-sm text-gray-700 font-source">
        {label}
        {required && !readOnly && <span>*</span>}
      </label>

      <div className="relative" ref={dropdownRef}>
        {/* Select Button */}
        <button
          type="button"
          disabled={disabled || readOnly || options.length === 0}
          onClick={() => !disabled && !readOnly && setIsDropdownOpen(!isDropdownOpen)}
          onBlur={onBlur}
          className={`w-full mt-1 h-12 px-3 rounded-md border font-source text-sm text-left flex items-center justify-between transition-colors disabled:opacity-50
            ${
              readOnly
                ? 'bg-[#FDFCFC] border-neutral-grey-300 text-neutral-grey-700 cursor-not-allowed'
                : disabled
                  ? 'bg-[#FDFCFC] border-neutral-grey-300 text-neutral-grey-700 cursor-not-allowed'
                  : 'bg-white border-neutral-grey-300 cursor-pointer hover:border-neutral-grey-400'
            }
            ${hasError ? 'border-red-500' : ''}`}
        >
          <span className={selectedOption ? 'text-neutral-grey-900' : 'text-muted-foreground'}>
            {displayValue}
          </span>

          {/* Dropdown Arrow Icon */}
          <Image
            src="/assets/arrowMark.svg"
            alt="dropdown"
            width={8}
            height={8}
            className={`transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            } pointer-events-none`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && !disabled && !readOnly && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Options */}
            <div className="absolute top-full left-0 right-0 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-neutral-grey-300 rounded-md shadow-lg z-50">
              {options.length > 0 ? (
                options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-4 py-3 text-left text-sm font-source transition-colors ${
                      value === option.value
                        ? 'bg-gold-50 text-gold-700 font-semibold'
                        : 'text-neutral-grey-900 hover:bg-neutral-grey-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-neutral-grey-500">
                  No options available
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {hasError && error && (
        <p className="text-red-500 text-xs font-source">{error}</p>
      )}
    </div>
  );
}
