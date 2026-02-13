"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Country, City } from "country-state-city";
import type { ICountry } from "country-state-city";
import { CustomSelectBox, type SelectOption } from "../CustomSelectBox";

interface CountryCitySelectorProps {
  countryValue?: string;
  cityValue?: string;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
  countryError?: string;   // New: validation error for country
  cityError?: string;      // New: validation error for city
}

export default function CountryCitySelector({
  countryValue = "",
  cityValue = "",
  onCountryChange,
  onCityChange,
  disabled = false,
  countryError = "",
  cityError = "",
}: CountryCitySelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);

  // Load countries once
  const countries = useMemo(() => {
    return Country.getAllCountries().sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, []);

  // Load cities based on selected country
  const cities = useMemo(() => {
    if (!selectedCountry) return [];
    const list = City.getCitiesOfCountry(selectedCountry.isoCode) ?? [];
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCountry]);

  // Pre-fill country when countryValue changes (e.g., on edit)
  useEffect(() => {
    if (countryValue && !selectedCountry) {
      const found = countries.find(
        (c) => c.name === countryValue || c.isoCode === countryValue
      );
      if (found) {
        setSelectedCountry(found);
      }
    }
  }, [countryValue, countries, selectedCountry]);

  const handleCountryChange = useCallback(
    (iso: string) => {
      const country = countries.find((c) => c.isoCode === iso);
      if (country) {
        setSelectedCountry(country);
        onCountryChange(country.name);
        onCityChange(""); // Reset city when country changes
      }
    },
    [countries, onCountryChange, onCityChange]
  );

  const handleCityChange = useCallback(
    (value: string) => {
      onCityChange(value);
    },
    [onCityChange]
  );

  return (
    <>
      {/* Country Selector */}
      <div className="flex flex-col gap-1">
        <CustomSelectBox
          value={selectedCountry?.isoCode || ""}
          onChange={handleCountryChange}
          label="Country"
          placeholder="Select country"
          options={countries.map((country) => ({
            label: country.name,
            value: country.isoCode,
          }))}
          disabled={disabled}
          required
          hasError={!!countryError}
          error={countryError}
        />
      </div>

      {/* City Selector */}
      <div className="flex flex-col gap-1">
        <CustomSelectBox
          value={cityValue}
          onChange={handleCityChange}
          label="City"
          placeholder={selectedCountry ? "Select city" : "Select country first"}
          options={cities.length > 0 ? cities.map((city) => ({
            label: city.name,
            value: city.name,
          })) : []}
          disabled={!selectedCountry || disabled}
          required
          hasError={!!cityError}
          error={cityError}
        />
      </div>
    </>
  );
}