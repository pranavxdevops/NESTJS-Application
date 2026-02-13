'use client';

import { useMemo } from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import { SearchInput } from '@/shared/components/SearchInput';
import { FilterDropdown } from '@/shared/components/FilterDropdown';

export type SearchFilterOption = {
  id: string | number;
  label: string;
  value?: string;
};

export type SearchFilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchClear?: () => void;
  searchPlaceholder?: string;
  className?: string;
  filterTitle?: string;
  filterOptions?: SearchFilterOption[];
  selectedFilters?: string[];
  onSelectedFiltersChange?: (values: string[]) => void;
  footerButtonLabel?: string;
  showSelectedChips?: boolean;
};

export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = 'Search',
  className,
  filterTitle,
  filterOptions,
  selectedFilters = [],
  onSelectedFiltersChange,
  footerButtonLabel,
  showSelectedChips = true,
}: SearchFilterBarProps) {
  const dropdownOptions = useMemo(
    () =>
      filterOptions?.map((option) => {
        const optionValue = option.value ?? String(option.id);
        const isSelected = selectedFilters.includes(optionValue);
        return {
          id: option.id,
          name: option.label,
          selected: isSelected,
        };
      }) ?? [],
    [filterOptions, selectedFilters]
  );

  const selectedOptionMetadata = useMemo(() => {
    if (!filterOptions?.length) return [];
    const selectedSet = new Set(selectedFilters);
    return filterOptions.filter((opt) => selectedSet.has(opt.value ?? String(opt.id)));
  }, [filterOptions, selectedFilters]);

  const handleFilterToggle = (optionId: string | number, nextSelected: boolean) => {
    if (!filterOptions || !onSelectedFiltersChange) return;
    const option = filterOptions.find((opt) => opt.id === optionId);
    if (!option) return;
    const optionValue = option.value ?? String(option.id);
    if (nextSelected) {
      onSelectedFiltersChange(Array.from(new Set([...selectedFilters, optionValue])));
    } else {
      onSelectedFiltersChange(selectedFilters.filter((value) => value !== optionValue));
    }
  };

  const handleResetFilters = () => {
    onSelectedFiltersChange?.([]);
  };

  return (
    <div className={clsx('flex flex-wrap items-start gap-4', className)}>
      <SearchInput
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        onClear={onSearchClear}
        placeholder={searchPlaceholder}
      />

      {filterOptions && filterOptions.length > 0 && (
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <FilterDropdown
            title={filterTitle ?? 'Filter'}
            options={dropdownOptions}
            onOptionChange={handleFilterToggle}
            onReset={handleResetFilters}
            footerButtonLabel={footerButtonLabel}
          />

          {showSelectedChips && selectedOptionMetadata.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedOptionMetadata.map((option) => {
                const optionValue = option.value ?? String(option.id);
                return (
                  <span
                    key={optionValue}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EAEAEA] text-[#4D4D4D] h-6"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={() => handleFilterToggle(option.id, false)}
                      className="flex items-center justify-center w-4 h-4 text-xs rounded-full hover:bg-gray-300"
                    >
                      <Image src="/assets/close.svg" alt="Remove filter" width={24} height={24} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
