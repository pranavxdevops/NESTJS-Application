'use client';

import React, { useCallback, useMemo, useState } from 'react';
import GoldButton from '../GoldButton';
import { FieldRenderer } from './FieldRenderer';
import { AddressFormFields } from './AddressFormFields';
import type { DynamicFormProps, FormField, FormFieldGroup, FormSection, FormValue } from './types';
import { ARTICLES_OF_ASSOCIATION_PDF_URL } from '@/lib/constants/constants';

const DEFAULT_SECTION_LABELS: Record<string, string> = {
  organizationInformation: 'Organization Details',
  userInformation: 'Personal Details',
  organizationAddress: 'Organization Address',
  consent: 'Terms & Conditions',
  signature: 'Signature',
  infobox: 'Criteria For Admission', // No label for infobox section
};

const DEFAULT_SUBSECTION_LABELS: Record<string, string> = {
  primaryContact: 'Primary Contact',
  organizationInformation: 'Organization Contact',
  documents: 'Documents',
  address: 'Address',
};

function formatKeyToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function buildSections(
  fields: FormField[],
  labelOverrides?: Record<string, string>
): FormSection[] {
  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
  const sections = new Map<string, { label: string; groups: Map<string, FormFieldGroup> }>();

  sortedFields.forEach((field) => {
    const sectionKey = field.section || 'general';
    if (!sections.has(sectionKey)) {
      sections.set(sectionKey, {
        label:
          (labelOverrides && labelOverrides[sectionKey]) ||
          DEFAULT_SECTION_LABELS[sectionKey] ||
          formatKeyToLabel(sectionKey),
        groups: new Map<string, FormFieldGroup>(),
      });
    }

    const section = sections.get(sectionKey)!;
    const groupKey = field.subSection ?? '_root';
    if (!section.groups.has(groupKey)) {
      section.groups.set(groupKey, {
        key: groupKey,
        label:
          groupKey === '_root'
            ? ''
            : DEFAULT_SUBSECTION_LABELS[groupKey] || formatKeyToLabel(groupKey),
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

export function DynamicForm({
  fields,
  dropdownOptions,
  initialValues = {},
  onSubmit,
  submitButtonText = 'Submit',
  isSubmitting = false,
  locale = 'en',
  sectionLabels,
  hideSubmitButton = false,
  formRef,
  isDisabled = false,
  onSave,
  isSaving = false,
  saveButtonText,
  externalErrors = {},
  onExternalErrorClear,
  admissionCriteriaContent,
  onFieldChange,
  memberId,
}: DynamicFormProps) {
  const [formValues, setFormValues] = useState<Record<string, FormValue>>(() => {
    const values: Record<string, FormValue> = {};
    fields.forEach((field) => {
      if (initialValues[field.fieldKey] !== undefined) {
        values[field.fieldKey] = initialValues[field.fieldKey];
      } else if (field.fieldType === 'checkbox') {
        values[field.fieldKey] = false;
      } else {
        values[field.fieldKey] = '';
      }
    });
    return values;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Merge external errors with internal errors
  const allErrors = useMemo(() => ({
    ...errors,
    ...externalErrors,
  }), [errors, externalErrors]);

  // Mark external error fields as touched so errors display
  React.useEffect(() => {
    const externalKeys = Object.keys(externalErrors);
    if (externalKeys.length > 0) {
      setTouchedFields((prev) => {
        const next = { ...prev };
        externalKeys.forEach((key) => {
          next[key] = true;
        });
        return next;
      });
    }
  }, [externalErrors]);

  // Build sections with title field overrides
  const formSections = useMemo(() => {
    const headingFields = fields.filter((f) => f.section === 'title');
    const labelOverrides: Record<string, string> = { ...sectionLabels };

    headingFields.forEach((f) => {
      const translation = f.translations.find((t) => t.language === locale) || f.translations[0];
      const label = translation?.label?.trim();
      if (!label) return;
      if (DEFAULT_SECTION_LABELS[f.fieldKey] || fields.some((sf) => sf.section === f.fieldKey)) {
        labelOverrides[f.fieldKey] = label;
      }
    });

    return buildSections(
      fields.filter((f) => f.section !== 'title'),
      labelOverrides
    );
  }, [fields, locale, sectionLabels]);

  const getFieldTranslation = useCallback(
    (field: FormField) => {
      const translation = field.translations.find((item) => item.language === locale);
      return translation ?? field.translations[0];
    },
    [locale]
  );

  const updateFieldValue = useCallback(
    (key: string, value: FormValue) => {
      setFormValues((prev) => ({
        ...prev,
        [key]: value,
      }));
      // Clear error when user interacts
      if (allErrors[key]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
      // Clear external error for checkboxes when checked
      if (onExternalErrorClear && externalErrors[key]) {
        const field = fields.find(f => f.fieldKey === key);
        if (field?.fieldType === 'checkbox' && value === true) {
          onExternalErrorClear(key);
        }
      }
      // Notify parent component of field change
      if (onFieldChange) {
        onFieldChange(key, value);
      }
    },
    [allErrors, onExternalErrorClear, externalErrors, fields, onFieldChange]
  );

  const validateField = useCallback(
    (field: FormField, value: FormValue): string | null => {
      const translation = getFieldTranslation(field);
      const label = translation?.label || formatKeyToLabel(field.fieldKey);
      const helpText = translation?.helpText || label;

      // Special case: addressLine2 is not required
      const isRequired = field.required !== false && !field.fieldKey.toLowerCase().includes('addressline2');

       // Required checkbox
         if (field.fieldType === "checkbox") {
           if (isRequired && value !== true) return `${helpText || label} is required`;
           return null;
         }

         // Required file upload
         if (field.fieldType === "file") {
           const stringValue = typeof value === "string" ? value.trim() : "";
           if (isRequired && !stringValue) return `${label} is required`;
           return null;
         }

      const stringValue = typeof value === 'string' ? value.trim() : '';

      // Required field validation
      if (isRequired && !stringValue) {
        return `${label} is required`;
      }

      // Email validation
      if (field.fieldType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          return 'Wrong E-mail format has been entered';
        }
      }

      // URL validation
      if (field.fieldType === 'url') {
        try {
          new URL(stringValue);
        } catch {
          return `Please enter a valid URL`;
        }
      }

      // Phone validation
      if (field.fieldType === 'phone') {
        if (stringValue.length < 10) {
          return `Please enter a valid phone number`;
        }
      }

      return null;
    },
    [getFieldTranslation]
  );

  const handleBlur = useCallback(
    (fieldKey: string) => {
      setTouchedFields((prev) => ({ ...prev, [fieldKey]: true }));

      const field = fields.find((f) => f.fieldKey === fieldKey);
      if (field) {
        const error = validateField(field, formValues[fieldKey]);
        if (error) {
          setErrors((prev) => ({ ...prev, [fieldKey]: error }));
        }
      }
    },
    [fields, formValues, validateField]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      console.log('Form submit triggered');

      if (isSubmitting) {
        console.log('Already submitting, skipping');
        return;
      }

      console.log('Current form values:', formValues);

      // Validate all fields
      const newErrors: Record<string, string> = {};
      const newTouched: Record<string, boolean> = {};

      fields.forEach((field) => {
        if (field.section === 'title') return;
        if (field.section === 'infobox') return; // Skip infobox fields from validation
        if (field.fieldKey === 'signatureType') return; // Skip hidden field
        newTouched[field.fieldKey] = true;
        const error = validateField(field, formValues[field.fieldKey]);
        if (error) {
          newErrors[field.fieldKey] = error;
        }
      });

      setTouchedFields(newTouched);
      setErrors(newErrors);

      console.log('Validation errors:', newErrors);

      if (Object.keys(newErrors).length > 0) {
        console.log('Form has validation errors, not submitting');
        return;
      }

      console.log('Validation passed, calling onSubmit');
      await onSubmit(formValues);
    },
    [fields, formValues, isSubmitting, onSubmit, validateField]
  );
  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave(formValues); // no validation, raw save
  }, [onSave, formValues]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-10 flex-1 w-full">
      {formSections.map((section) => (
        <div key={section.key} className="flex flex-col gap-6">
          {section.label && (
            <h3 className="text-wfzo-grey-900 font-montserrat text-2xl font-bold leading-8">
              {section.label}
            </h3>
          )}

          {section.groups.map((group) => {
            // Build rows based on fieldsPerRow
            const fieldRows: FormField[][] = [];
            let i = 0;

            while (i < group.fields.length) {
              const field = group.fields[i];
              const fpr = field.fieldsPerRow || 1;

              if (fpr === 2) {
                const nextField = group.fields[i + 1];
                const nextFpr = nextField?.fieldsPerRow || 1;

                if (nextFpr === 2) {
                  fieldRows.push([field, nextField]);
                  i += 2;
                } else {
                  fieldRows.push([field]);
                  i += 1;
                }
              } else {
                fieldRows.push([field]);
                i += 1;
              }
            }

            return (
              <div key={group.key} className="space-y-4">
                {group.label ? (
                  <p className="text-base font-semibold text-neutral-grey-800 font-source">
                    {group.label}
                  </p>
                ) : null}
                <div className="space-y-4">
                  {/* Check if this is an address section */}
                  {(() => {
                    const hasCountryField = group.fields.some((f) =>
                      f.fieldKey.toLowerCase().includes('country')
                    );
                    const hasStateField = group.fields.some(
                      (f) =>
                        f.fieldKey.toLowerCase().includes('state') ||
                        f.fieldKey.toLowerCase().includes('province')
                    );
                    const hasCityField = group.fields.some((f) =>
                      f.fieldKey.toLowerCase().includes('city')
                    );

                    // If this group has all three location fields, use AddressFormFields
                    if (hasCountryField && hasStateField && hasCityField) {
                      return (
                        <AddressFormFields
                          fields={group.fields}
                          formValues={formValues}
                          errors={allErrors}
                          touchedFields={touchedFields}
                          disabled={isSubmitting || isDisabled}
                          dropdownOptions={dropdownOptions}
                          onFieldChange={updateFieldValue}
                          onFieldBlur={handleBlur}
                          getFieldTranslation={getFieldTranslation}
                        />
                      );
                    }

                    // Otherwise render fields normally based on fieldsPerRow
                    return fieldRows.map((row, rowIndex) => {
                      const hasTwoFields = row.length === 2;
                      return (
                        <div
                          key={rowIndex}
                          className={`grid grid-cols-1 ${
                            hasTwoFields ? 'md:grid-cols-2' : ''
                          } gap-4`}
                        >
                          {row.map((field) => (
                            <FieldRenderer
                              key={field.fieldKey}
                              field={field}
                              value={formValues[field.fieldKey]}
                              error={allErrors[field.fieldKey]}
                              touched={touchedFields[field.fieldKey]}
                              disabled={isSubmitting || isDisabled}
                              dropdownOptions={
                                field.dropdownCategory
                                  ? dropdownOptions[field.dropdownCategory]
                                  : undefined
                              }
                              onChange={(value) => updateFieldValue(field.fieldKey, value)}
                              onBlur={() => handleBlur(field.fieldKey)}
                              translation={getFieldTranslation(field)}
                              onExternalErrorClear={onExternalErrorClear}
                              required={field.required !== false && !field.fieldKey.toLowerCase().includes('addressline2')}
                              admissionCriteriaContent={admissionCriteriaContent}
                              memberId={memberId}
                            />
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {/* Articles of Association Link */}
  
        <div className="text-wfzo-grey-700 font-source font-bold  leading-6">
          For more information please refer to the{' '}
          <a
            href={ARTICLES_OF_ASSOCIATION_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wfzo-gold-600 underline hover:text-wfzo-gold-700 cursor-pointer"
          >
            Articles of Association
          </a>
        </div>
      

      {!hideSubmitButton && (
        <div className='flex gap-6'>
           {!isDisabled && onSave && (
            <GoldButton type="button" disabled={isSubmitting} onClick={handleSave}>{isSaving? 'Saving..':saveButtonText}</GoldButton>
          )}
          {!isDisabled &&
          <GoldButton type="submit" disabled={isSubmitting || isDisabled}>
            {isSubmitting ? 'Submitting…' : submitButtonText}
          </GoldButton>}
         
        </div>
      )}
    </form>
  );
}

