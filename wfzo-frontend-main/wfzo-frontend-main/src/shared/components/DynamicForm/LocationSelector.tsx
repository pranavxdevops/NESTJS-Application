'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Country, State, City } from 'country-state-city';
import type { ICountry, IState } from 'country-state-city';
import { CustomSelectBox, type SelectOption } from '../CustomSelectBox';

interface LocationSelectorProps {
  countryValue?: string;
  stateValue?: string;
  cityValue?: string;
  selectedCountry?: ICountry | null; 
  selectedState?: IState | null; 
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  countryError?: string;
  stateError?: string;
  cityError?: string;
  countryTouched?: boolean;
  stateTouched?: boolean;
  cityTouched?: boolean;
  disabled?: boolean;
  fieldType?: 'country' | 'state' | 'city'; // Only render one field
}

export function LocationSelector({
  countryValue = '',
  stateValue = '',
  cityValue = '',
  selectedCountry: propCountry,
  selectedState: propState,
  onCountryChange,
  onStateChange,
  onCityChange,
  countryError,
  stateError,
  cityError,
  countryTouched = false,
  stateTouched = false,
  cityTouched = false,
  disabled = false,
  fieldType,
}: LocationSelectorProps) {
  // Internal state only used when NOT in fieldType mode
  const [internalCountry, setInternalCountry] = useState<ICountry | null>(null);
  const [internalState, setInternalState] = useState<IState | null>(null);

  // Use props if fieldType is set (shared state), otherwise use internal state
  const selectedCountry = fieldType ? (propCountry ?? null) : internalCountry;
  const selectedState = fieldType ? (propState ?? null) : internalState;

  const countries = useMemo(() => {
    return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const states = useMemo(() => {
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry.isoCode).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [selectedCountry]);

  const cities = useMemo(() => {
    if (!selectedCountry || !selectedState) return [];
    return City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [selectedCountry, selectedState]);

  // Sync external countryValue → selectedCountry (only for internal mode)
  useEffect(() => {
    if (!fieldType && countryValue && countries.length > 0) {
      const country = countries.find((c) => c.name === countryValue || c.isoCode === countryValue);
      if (country && internalCountry?.isoCode !== country.isoCode) {
        setInternalCountry(country);
        setInternalState(null);
      }
    }
  }, [countryValue, countries, fieldType, internalCountry, onStateChange, onCityChange]);

  // Sync external stateValue → selectedState (only for internal mode)
  useEffect(() => {
    if (!fieldType && stateValue && selectedCountry) {
      const state = states.find((s) => s.name === stateValue || s.isoCode === stateValue);
      if (state && internalState?.isoCode !== state.isoCode) {
        setInternalState(state);
        onCityChange('');
      }
    }
  }, [stateValue, states, fieldType, internalState, onCityChange]);

  const handleCountryChange = useCallback(
    (value: string) => {
      const country = countries.find((c) => c.isoCode === value);
      if (!country) return;

      if (!fieldType) {
        setInternalCountry(country);
        setInternalState(null);
      }

      onCountryChange(country.name);
      onStateChange('');
      onCityChange('');
    },
    [countries, onCountryChange, onStateChange, onCityChange, fieldType]
  );

  const handleStateChange = useCallback(
    (value: string) => {
      const state = states.find((s) => s.isoCode === value);
      if (!state) return;

      if (!fieldType) {
        setInternalState(state);
      }

      onStateChange(state.name);
      onCityChange('');
    },
    [states, onStateChange, onCityChange, fieldType]
  );

  const handleCityChange = useCallback(
    (value: string) => {
      onCityChange(value);
    },
    [onCityChange]
  );

  const hasCountryError = countryTouched && Boolean(countryError);
  const hasStateError = stateTouched && Boolean(stateError);
  const hasCityError = cityTouched && Boolean(cityError);

  // Render only one field if fieldType is specified
  if (fieldType === 'country') {
    return (
      <CustomSelectBox
        value={selectedCountry?.isoCode || ''}
        onChange={handleCountryChange}
        label="Country"
        placeholder="Select country"
        options={countries.map((country) => ({
          label: country.name,
          value: country.isoCode,
        }))}
        disabled={disabled}
        required
        hasError={hasCountryError}
        error={countryError}
      />
    );
  }

  if (fieldType === 'state') {
    return (
      <CustomSelectBox
        value={selectedState?.isoCode || ''}
        onChange={handleStateChange}
        label="State/Region"
        placeholder={selectedCountry ? 'Select state/region' : 'Select country first'}
        options={states.map((state) => ({
          label: state.name,
          value: state.isoCode,
        }))}
        disabled={!selectedCountry || disabled}
        required
        hasError={hasStateError}
        error={stateError}
      />
    );
  }

  if (fieldType === 'city') {
    return (
      <CustomSelectBox
        value={cityValue}
        onChange={handleCityChange}
        label="City"
        placeholder={selectedState ? 'Select city' : 'Select state first'}
        options={cities.map((city) => ({
          label: city.name,
          value: city.name,
        }))}
        disabled={!selectedState || disabled}
        required
        hasError={hasCityError}
        error={cityError}
      />
    );
  }

  return (
    <>
      {/* Country */}
      <CustomSelectBox
        value={selectedCountry?.isoCode || ''}
        onChange={handleCountryChange}
        label="Country"
        placeholder="Select country"
        options={countries.map((country) => ({
          label: country.name,
          value: country.isoCode,
        }))}
        disabled={disabled}
        required
        hasError={hasCountryError}
        error={countryError}
      />

      {/* State */}
      <CustomSelectBox
        value={selectedState?.isoCode || ''}
        onChange={handleStateChange}
        label="State/Region"
        placeholder={selectedCountry ? 'Select state/region' : 'Select country first'}
        options={states.map((state) => ({
          label: state.name,
          value: state.isoCode,
        }))}
        disabled={!selectedCountry || disabled}
        required
        hasError={hasStateError}
        error={stateError}
      />

      {/* City */}
      <CustomSelectBox
        value={cityValue}
        onChange={handleCityChange}
        label="City"
        placeholder={selectedState ? 'Select city' : 'Select state first'}
        options={cities.map((city) => ({
          label: city.name,
          value: city.name,
        }))}
        disabled={!selectedState || disabled}
        required
        hasError={hasCityError}
        error={cityError}
      />
    </>
  );
}
