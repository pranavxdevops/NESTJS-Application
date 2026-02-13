'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { DropdownValue } from './types';

interface MultiSelectDropdownProps {
  options: DropdownValue[];
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  label: string;
  disabled?: boolean;
  hasError?: boolean;
  error?: string;
}

export function MultiSelectDropdown({
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Select options',
  label,
  disabled = false,
  hasError = false,
  error,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onBlur]);

  const toggleOption = (code: string) => {
    if (disabled) return;

    const newValue = value.includes(code)
      ? value.filter((v) => v !== code)
      : [...value, code];

    onChange(newValue);
  };

  const removeOption = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(value.filter((v) => v !== code));
  };

  const getSelectedLabels = () => {
    return value
      .map((code) => options.find((opt) => opt.code === code)?.label)
      .filter(Boolean);
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div className="w-full">
      <label className="text-sm text-gray-700 font-source block">
        {label}
        {!disabled && <span>*</span>}
      </label>

      <div className="relative w-full" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full mt-2 h-12 px-4 rounded-md border flex items-center justify-between font-source text-sm disabled:opacity-50
            ${hasError ? 'border-red-500' : 'border-neutral-grey-300'}
            ${disabled ? 'bg-[#FDFCFC] text-neutral-grey-700 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-neutral-grey-400'}
          `}
        >
          <span className={value.length === 0 ? 'text-muted-foreground' : 'text-gray-700'}>
            {value.length === 0 ? placeholder : `${value.length} Selected`}
          </span>
          <Image
            src="/assets/arrowMark.svg"
            alt="dropdown"
            width={8}
            height={8}
            className={`transition-transform ${isOpen ? '-scale-y-100' : 'scale-y-100'}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-grey-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isChecked = value.includes(option.code);
              return (
                <label
                  key={option.code}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-grey-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOption(option.code)}
                    className="hidden"
                  />
                  <span className="flex items-center justify-center flex-shrink-0">
                    <Image
                      src={isChecked ? "/assets/checkedBox.svg" : "/assets/unCheckedBox.svg"}
                      alt={isChecked ? "Checked" : "Unchecked"}
                      width={20}
                      height={20}
                      className="cursor-pointer"
                    />
                  </span>
                  <span className="text-sm text-gray-700 font-source">{option.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>



      {hasError && error && <p className="text-red-500 text-xs font-source mt-1">{error}</p>}
    </div>
  );
}

 