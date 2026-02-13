'use client';

import React, { useMemo } from 'react';
import type { FormSectionProps, FormField } from './types';
import { buildSections } from './utils';
import { FieldRenderer } from './FieldRenderer';

const DEFAULT_LOCALE = 'en';

export function FormSection({
  fields,
  values,
  dropdownOptions = {},
  locale = DEFAULT_LOCALE,
  sectionLabelOverrides,
  subsectionLabels = {},
  readOnly = false,
  errors = {},
  touchedFields = {},
  onValueChange,
  onBlur,
}: FormSectionProps) {
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
            const fieldRows: FormField[][] = [];
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
                {group.label && (
                  <p className="text-base font-semibold text-neutral-grey-800 font-source ">
                    {subsectionLabels[group.key] || group.label}
                  </p>
                )}

                {fieldRows.map((row, rowIndex) => {
                  const hasIndustries = row.some((f) => f.fieldKey === 'industries');

                  // ✅ SAFE NORMALIZATION
                  const industriesValue = Array.isArray(values.industries) ? values.industries : [];

                  return (
                    <React.Fragment key={rowIndex}>
                      {/* NORMAL GRID ROW */}
                      <div
                        className={`grid grid-cols-1 ${
                          row.length === 2 ? 'md:grid-cols-2' : ''
                        } gap-4`}
                      >
                        {row.map((field) => (
                          <FieldRenderer
                            key={field.fieldKey}
                            field={field}
                            value={values[field.fieldKey] ?? (field.fieldType === 'checkbox' ? false : '')}
                            dropdownOptions={dropdownOptions}
                            locale={locale}
                            readOnly={readOnly}
                            error={errors[field.fieldKey]}
                            touched={touchedFields[field.fieldKey]}
                            onValueChange={
                              onValueChange
                                ? (value) => onValueChange(field.fieldKey, value)
                                : undefined
                            }
                            onBlur={onBlur ? () => onBlur(field.fieldKey) : undefined}
                          />
                        ))}
                      </div>

                      {/* FULL-WIDTH SELECTED INDUSTRIES */}
                      {hasIndustries && industriesValue.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {industriesValue.map((code) => {
                            const label = dropdownOptions.industries?.find(
                              (o) => o.code === code
                            )?.label;

                            return (
                              <span
                                key={code}
                                className={`inline-flex items-center gap-2 px-3 py-2 text-xs border rounded-lg font-source ${
                                  readOnly ? 'bg-[#FDFCFC]' : 'bg-white'
                                }`}
                              >
                                {label}
                                {!readOnly && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onValueChange?.(
                                        'industries',
                                        industriesValue.filter((v) => v !== code)
                                      )
                                    }
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
