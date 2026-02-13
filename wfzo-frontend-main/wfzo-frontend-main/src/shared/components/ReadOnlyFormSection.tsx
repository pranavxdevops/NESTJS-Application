'use client';

import React, { useMemo } from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

import { Input } from './Input';
import { CustomSelectBox, type SelectOption } from './CustomSelectBox';
import { CustomPhoneInputField } from './CustomPhoneInputField';

interface FieldTranslation {
  language: string;
  label: string;
  placeholder?: string;
  helpText?: string;
}

export type FieldType =
  | 'text'
  | 'email'
  | 'url'
  | 'phone'
  | 'dropdown'
  | 'checkbox';

export interface ReadOnlyField {
  fieldKey: string;
  fieldType: FieldType;
  section: string;
  subSection?: string;
  translations: FieldTranslation[];
  dropdownCategory?: string;
  displayOrder: number;
  fieldsPerRow?: number;
}

export interface DropdownValue {
  category: string;
  code: string;
  label: string;
  displayOrder: number;
}

interface FormFieldGroup {
  key: string;
  label: string;
  fields: ReadOnlyField[];
  fieldsPerRow: number;
}

interface FormSection {
  key: string;
  label: string;
  groups: FormFieldGroup[];
}

interface ReadOnlyFormSectionProps {
  fields: ReadOnlyField[];
  values: Record<string, string | boolean| string[]>;
  dropdownOptions?: Record<string, DropdownValue[]>;
  locale?: string;
  sectionLabelOverrides?: Record<string, string>;
  subsectionLabels?: Record<string, string>;
}

const DEFAULT_LOCALE = 'en';

function formatKeyToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function buildSections(
  fields: ReadOnlyField[],
  labelOverrides?: Record<string, string>
): FormSection[] {
  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
  const sections = new Map<
    string,
    { label: string; groups: Map<string, FormFieldGroup> }
  >();

  sortedFields.forEach((field) => {
    const sectionKey = field.section || 'general';
    if (!sections.has(sectionKey)) {
      sections.set(sectionKey, {
        label:
          (labelOverrides && labelOverrides[sectionKey]) ||
          formatKeyToLabel(sectionKey),
        groups: new Map<string, FormFieldGroup>(),
      });
    }

    const section = sections.get(sectionKey)!;
    const groupKey = field.subSection ?? '_root';
    if (!section.groups.has(groupKey)) {
      section.groups.set(groupKey, {
        key: groupKey,
        label: groupKey === '_root' ? '' : formatKeyToLabel(groupKey),
        fields: [],
        fieldsPerRow: field.fieldsPerRow || 1,
      });
    }
    section.groups.get(groupKey)!.fields.push(field);
  });

  return Array.from(sections.entries())
    .map<FormSection>(([key, value]) => ({
      key,
      label: value.label,
      groups: Array.from(value.groups.values()).map((group) => ({
        ...group,
        fields: [...group.fields].sort((a, b) => a.displayOrder - b.displayOrder),
      })),
    }))
    .sort((a, b) => {
      const aOrder = a.groups[0]?.fields[0]?.displayOrder ?? 0;
      const bOrder = b.groups[0]?.fields[0]?.displayOrder ?? 0;
      return aOrder - bOrder;
    })
    .map((section) => ({
      ...section,
      groups: section.groups.sort((a, b) => {
        const aOrder = a.fields[0]?.displayOrder ?? 0;
        const bOrder = b.fields[0]?.displayOrder ?? 0;
        return aOrder - bOrder;
      }),
    }));
}

export function ReadOnlyFormSection({
  fields,
  values,
  dropdownOptions = {},
  locale = DEFAULT_LOCALE,
  sectionLabelOverrides,
  subsectionLabels = {},
}: ReadOnlyFormSectionProps) {
  const formSections = useMemo(() => {
    // Extract heading overrides from fields with section === 'title'
    const headingFields = fields.filter((f) => f.section === 'title');
    const labelOverrides: Record<string, string> = { ...sectionLabelOverrides };
    
    headingFields.forEach((f) => {
      const translation = f.translations.find((t) => t.language === locale) || f.translations[0];
      const label = translation?.label?.trim();
      if (!label) return;
      if (fields.some((sf) => sf.section === f.fieldKey)) {
        labelOverrides[f.fieldKey] = label;
      }
    });

    return buildSections(
      fields.filter((f) => f.section !== 'title'),
      labelOverrides
    );
  }, [fields, locale, sectionLabelOverrides]);

  const getFieldTranslation = (field: ReadOnlyField) => {
    const translation = field.translations.find((item) => item.language === locale);
    return translation ?? field.translations[0];
  };

  const renderField = (field: ReadOnlyField) => {
    const translation = getFieldTranslation(field);
    const label = translation?.label || formatKeyToLabel(field.fieldKey);
    const value = values[field.fieldKey];

    if (field.fieldType === 'checkbox') {
      const checked = typeof value === 'boolean' ? value : false;
      return (
        <div key={field.fieldKey} className="col-span-full">
          <label className="flex items-start gap-3 text-sm text-gray-700 font-source">
            <input
              type="checkbox"
              checked={checked}
              disabled
              readOnly
              className="size-5 rounded border-neutral-grey-300 bg-[#FDFCFC] text-neutral-grey-700"
            />
            <span className="space-y-1">
              <span className="block text-sm text-gray-700 font-source">{label}</span>
            </span>
          </label>
        </div>
      );
    }

    if (field.fieldType === 'dropdown') {
      const options = field.dropdownCategory
        ? dropdownOptions[field.dropdownCategory] ?? []
        : [];
        // Handle industries field (multi-select)
      if (field.fieldKey === 'industries' && Array.isArray(value)) {
        const selectedLabels = value
          .map((code) => options.find((opt) => opt.code === code)?.label)
          .filter(Boolean);

        return (
          <div key={field.fieldKey} className="space-y-1">
            <label className="text-sm text-gray-700 font-source">
              {label}
            </label>
            <div className="h-12 px-4 rounded-md border border-neutral-grey-300 bg-[#FDFCFC] text-neutral-grey-700 font-source text-sm flex items-center">
              {selectedLabels.length > 0 ? `${selectedLabels.length} Selected` : 'None selected'}
            </div>
            {selectedLabels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedLabels.map((label, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-neutral-grey-100 text-gray-700 text-sm font-source px-3 py-1.5 rounded-md"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }
      const stringValue = typeof value === 'string' ? value : '';
      const selectedOption = options.find((opt) => opt.code === stringValue);
      const displayValue = selectedOption?.label || stringValue;
      const selectOptions: SelectOption[] = options.map((option) => ({
        label: option.label,
        value: option.code,
      }));

      return (
        <div key={field.fieldKey} className="space-y-1">
          <CustomSelectBox
            value={stringValue}
            onChange={() => {}}
            label={label}
            options={selectOptions}
            readOnly={true}
            placeholder={`Select ${label.toLowerCase()}`}
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
          onChange={() => {}} // Read-only, no-op
          label={label}

          disabled={true}
          defaultCountry="ae"
        />
      );
    }

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
          className="text-sm text-gray-700 font-source"
          htmlFor={field.fieldKey}
        >
          {label}
        </label>
        <Input
          id={field.fieldKey}
          type={inputType}
          value={stringValue}
          readOnly
          disabled
          className="h-12 rounded-md font-source text-sm border-neutral-grey-300 bg-[#FDFCFC] text-neutral-grey-700"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-10">
      {formSections.map((section) => (
        <div key={section.key} className="flex flex-col gap-6">
          {section.label && (
            <h3 className="text-wfzo-grey-900 font-montserrat text-2xl font-bold leading-8">
              {section.label}
            </h3>
          )}

          {section.groups.map((group) => {
            // Build rows based on fieldsPerRow: group consecutive fields with fieldsPerRow=2
            const fieldRows: ReadOnlyField[][] = [];
            let i = 0;

            while (i < group.fields.length) {
              const field = group.fields[i];
              const fpr = field.fieldsPerRow || 1;

              if (fpr === 2) {
                // Check if next field also has fieldsPerRow=2 to pair them
                const nextField = group.fields[i + 1];
                const nextFpr = nextField?.fieldsPerRow || 1;

                if (nextFpr === 2) {
                  // Pair these two fields
                  fieldRows.push([field, nextField]);
                  i += 2;
                } else {
                  // This field alone in the row
                  fieldRows.push([field]);
                  i += 1;
                }
              } else {
                // fieldsPerRow is 1, full width
                fieldRows.push([field]);
                i += 1;
              }
            }

            return (
              <div key={group.key} className="space-y-4">
                {group.label ? (
                  <p className="text-base font-semibold text-neutral-grey-800 font-source">
                    {subsectionLabels[group.key] || group.label}
                  </p>
                ) : null}
                <div className="space-y-4">
                  {fieldRows.map((row, rowIndex) => {
                    const hasTwoFields = row.length === 2;
                    return (
                      <div
                        key={rowIndex}
                        className={`grid grid-cols-1 ${hasTwoFields ? 'md:grid-cols-2' : ''} gap-4`}
                      >
                        {row.map((field) => renderField(field))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
