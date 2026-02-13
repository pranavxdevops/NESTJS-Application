'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FieldRenderer } from './FieldRenderer';
import { LocationSelector } from './LocationSelector';
import type { FormField, FormValue, DropdownValue, FormFieldTranslation } from './types';
import { Country, State } from 'country-state-city';
import type { ICountry, IState } from 'country-state-city';

interface AddressFormFieldsProps {
  fields: FormField[];
  formValues: Record<string, FormValue>;
  errors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  disabled: boolean;
  dropdownOptions: Record<string, DropdownValue[]>;
  onFieldChange: (key: string, value: FormValue) => void;
  onFieldBlur: (key: string) => void;
  getFieldTranslation: (field: FormField) => FormFieldTranslation;
}

export function AddressFormFields({
  fields,
  formValues,
  errors,
  touchedFields,
  disabled,
  dropdownOptions,
  onFieldChange,
  onFieldBlur,
  getFieldTranslation,
}: AddressFormFieldsProps) {
  // Find location fields
  const countryField = fields.find((f) => f.fieldKey.toLowerCase().includes('country') && !f.fieldKey.toLowerCase().includes('countrycode'));
  const countryCodeField = fields.find((f) => f.fieldKey.toLowerCase().includes('countrycode'));
  const stateField = fields.find(
    (f) =>
      f.fieldKey.toLowerCase().includes('state') || f.fieldKey.toLowerCase().includes('province')
  );
  const cityField = fields.find((f) => f.fieldKey.toLowerCase().includes('city'));

  const countryKey = countryField?.fieldKey;
  const countryCodeKey = countryCodeField?.fieldKey;
  const stateKey = stateField?.fieldKey;
  const cityKey = cityField?.fieldKey;

  const countryValue = countryKey ? (formValues[countryKey] as string) : '';
  const stateValue = stateKey ? (formValues[stateKey] as string) : '';
  const cityValue = cityKey ? (formValues[cityKey] as string) : '';

  // Shared selected country/state
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [selectedState, setSelectedState] = useState<IState | null>(null);

  const countries = useMemo(() => {
    return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Sync countryValue → selectedCountry
  useEffect(() => {
    if (countryValue && countries.length > 0) {
      const country = countries.find((c) => c.name === countryValue || c.isoCode === countryValue);
      if (country && (!selectedCountry || selectedCountry.isoCode !== country.isoCode)) {
        setSelectedCountry(country);

        // Set countryCode when country is selected
        if (countryCodeKey && country.isoCode) {
          onFieldChange(countryCodeKey, country.isoCode);
        }

        // Reset only when actual change, not on mount/submit
        if (selectedCountry && selectedCountry.isoCode !== country.isoCode) {
          setSelectedState(null);
          if (stateKey) onFieldChange(stateKey, '');
          if (cityKey) onFieldChange(cityKey, '');
        }
      }
    } else if (!countryValue) {
      setSelectedCountry(null);
      setSelectedState(null);
      // Clear countryCode when country is cleared
      if (countryCodeKey) {
        onFieldChange(countryCodeKey, '');
      }
    }
  }, [countryValue, countries, selectedCountry, stateKey, cityKey, countryCodeKey, onFieldChange]);

  // Sync stateValue → selectedState
  useEffect(() => {
    if (stateValue && selectedCountry) {
      const states = State.getStatesOfCountry(selectedCountry.isoCode);
      const state = states.find((s) => s.name === stateValue || s.isoCode === stateValue);
      if (state && (!selectedState || selectedState.isoCode !== state.isoCode)) {
        // Only clear city when actual state changes
        if (selectedState && selectedState.isoCode !== state.isoCode) {
          if (cityKey) onFieldChange(cityKey, '');
        }

        setSelectedState(state);
      }
    } else if (!stateValue) {
      setSelectedState(null);
    }
  }, [stateValue, selectedCountry, selectedState, cityKey, onFieldChange]);

  const locationFieldKeys = [countryKey, countryCodeKey, stateKey, cityKey].filter(Boolean) as string[];

  const allFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  const fieldRows: FormField[][] = [];
  let i = 0;
  while (i < allFields.length) {
    const field = allFields[i];
    const fpr = field.fieldsPerRow || 1;

    if (fpr === 2 && i + 1 < allFields.length && allFields[i + 1].fieldsPerRow === 2) {
      fieldRows.push([field, allFields[i + 1]]);
      i += 2;
    } else {
      fieldRows.push([field]);
      i += 1;
    }
  }

  return (
    <>
      {fieldRows.map((row, rowIndex) => {
        const hasTwoFields = row.length === 2;
        return (
          <div
            key={rowIndex}
            className={`grid grid-cols-1 ${hasTwoFields ? 'md:grid-cols-2' : ''} gap-4`}
          >
            {row.map((field) => {
              // Skip rendering countryCode field - it's managed automatically
              if (field.fieldKey === countryCodeKey) {
                return null;
              }

              if (locationFieldKeys.includes(field.fieldKey)) {
                // Shared props for all location fields
                const sharedProps = {
                  selectedCountry,
                  selectedState,
                  countryValue,
                  stateValue,
                  cityValue,
                  onCountryChange: (value: string) => {
                    if (countryKey) {
                      onFieldChange(countryKey, value);
                      // Also set countryCode if field exists
                      // Look for countryCode field - could be addressCountryCode or countryCode
                      const countryCodeKey = fields.find((f) => 
                        f.fieldKey.toLowerCase().includes('countrycode')
                      )?.fieldKey;
                      if (countryCodeKey) {
                        // Find the country object from the value being set
                        const country = countries.find((c) => c.name === value || c.isoCode === value);
                        if (country) {
                          onFieldChange(countryCodeKey, country.isoCode);
                        }
                      }
                    }
                  },
                  onStateChange: (value: string) => {
                    if (stateKey) onFieldChange(stateKey, value);
                  },
                  onCityChange: (value: string) => {
                    if (cityKey) onFieldChange(cityKey, value);
                  },
                  countryError: countryKey ? errors[countryKey] : undefined,
                  stateError: stateKey ? errors[stateKey] : undefined,
                  cityError: cityKey ? errors[cityKey] : undefined,
                  countryTouched: countryKey ? touchedFields[countryKey] : false,
                  stateTouched: stateKey ? touchedFields[stateKey] : false,
                  cityTouched: cityKey ? touchedFields[cityKey] : false,
                  disabled,
                };

                if (field.fieldKey === countryKey) {
                  return (
                    <LocationSelector key={field.fieldKey} {...sharedProps} fieldType="country" />
                  );
                }
                if (field.fieldKey === stateKey) {
                  return (
                    <LocationSelector key={field.fieldKey} {...sharedProps} fieldType="state" />
                  );
                }
                if (field.fieldKey === cityKey) {
                  return (
                    <LocationSelector key={field.fieldKey} {...sharedProps} fieldType="city" />
                  );
                }
              }

              return (
                <FieldRenderer
                  key={field.fieldKey}
                  field={field}
                  value={formValues[field.fieldKey]}
                  error={errors[field.fieldKey]}
                  touched={touchedFields[field.fieldKey]}
                  disabled={disabled}
                  dropdownOptions={
                    field.dropdownCategory ? dropdownOptions[field.dropdownCategory] : undefined
                  }
                  onChange={(value) => onFieldChange(field.fieldKey, value)}
                  onBlur={() => onFieldBlur(field.fieldKey)}
                  translation={getFieldTranslation(field)}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}
