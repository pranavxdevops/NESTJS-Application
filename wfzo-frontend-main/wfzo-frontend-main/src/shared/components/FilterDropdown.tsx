import React, { useState } from 'react';
// import {  Check } from 'lucide-react';
import Image from "next/image";
import LightPressButton from '@/shared/components/LightPressButton';
import GoldButton from '@/shared/components/GoldButton';

interface FilterOption {
  id: string | number;
  name: string;
  selected?: boolean;
  default?: boolean;
}

interface FilterDropdownProps {
  title: string;
  options: FilterOption[];
  onOptionChange?: (optionId: string | number, selected: boolean) => void;
  onApplyFilters?: () => void;
  onReset?: () => void;
  className?: string;
  buttonClassName?: string;
  footerButtonLabel?: string;
}

export function FilterDropdown({
  title,
  options,
  onOptionChange,
  onApplyFilters,
  onReset,
  className = '',
  buttonClassName = '',
  footerButtonLabel = '',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionToggle = (optionId: string | number, currentSelected: boolean) => {
    onOptionChange?.(optionId, !currentSelected);
  };
  const hasSelectedOption = options.some((opt) => opt.selected);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      {/* <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 font-semibold font-source ${buttonClassName}`}
      > */}
      <LightPressButton onClick={() => setIsOpen(!isOpen)}>
       <Image 
          src="/assets/filter.svg" 
          alt="Filter icon" 
          width={24} 
          height={24} 
        />
        {title}
        </LightPressButton>
      {/* </button> */}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[90vw] sm:w-96 -ml-2 sm:ml-0 bg-white rounded-2xl shadow-xl border border-gray-200 z-[501]">
          {/* Header */}
          <div className={`p-5 ${hasSelectedOption ? 'border-b border-gray-400':''}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button
                onClick={onReset}
                className="text-[#A7895E] font-medium hover:text-[#8B6941] transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Filter Options Grid */}
            <div className="mt-4 flex flex-wrap gap-3">
              {options.map((option) => {
                const isSelected = option.selected ?? false;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionToggle(option.id, option.selected || false)}
                    className={`px-2 py-1 rounded-sm text-sm font-medium border transition-all flex items-center gap-1
  ${
    isSelected
      ? ''
      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
  }
`}
                  >
                    {option.name}
                    {isSelected && <Image 
                                    src="/assets/tick.svg" 
                                    alt="Check Icon" 
                                    width={20} 
                                    height={20} 
                                  />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          {footerButtonLabel && (
            <div className="p-5  bg-gray-50 rounded-b-2xl border-t border-gray-400">
              <GoldButton
                onClick={() => {
                  onApplyFilters?.();
                  setIsOpen(false);
                }}
              >
                {footerButtonLabel}
              </GoldButton>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
