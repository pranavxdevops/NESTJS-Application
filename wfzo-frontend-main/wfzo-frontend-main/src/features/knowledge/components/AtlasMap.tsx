'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { zoneTypeColors, regions, zoneTypes, zoneSpecializations, managementTypes, activityStatuses, type Zone, type Region, type ZoneType, type ZoneSpecialization, type ManagementType, type ActivityStatus } from '../data/atlasData';

// Dynamically import Map component to avoid SSR issues with Leaflet
const AtlasMapView = dynamic(() => import('./AtlasMapView'), { ssr: false });

type Member = {
  id: number | string;
  name: string;
  address: string;
  countryCode: string;
  countryName: string;
  continent: string;
  city?: string;
  memberLogoUrl?: string;
  coordinates: [number, number];
  typeOfTheOrganization?: string;
  websiteUrl?: string;
  category?: string;
};

type ApiMember = {
  id?: number | string;
  companyName?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  countryCode?: string;
  city?: string;
  memberLogoUrl?: string;
  industries?: string[];
  typeOfTheOrganization?: string;
  websiteUrl?: string;
  category?: string;
};

function mapApiMemberToMember(m: ApiMember, idx: number): Member {
  const lon = Number(m.longitude) || 0;
  const lat = Number(m.latitude) || 0;
  const countryName = m.country || 'Unknown';
  const city = m.city || '';
  const address = [city, countryName].filter(Boolean).join(', ');
  return {
    id: m.id ?? `api-${idx}`,
    name: m.companyName || 'Unknown member',
    address,
    countryCode: m.countryCode || '',
    countryName,
    continent: 'Unknown',
    city: m.city,
    memberLogoUrl: m.memberLogoUrl,
    coordinates: [lon, lat],
    typeOfTheOrganization: m.typeOfTheOrganization,
    websiteUrl: m.websiteUrl,
    category: m.category,
  };
}

export default function AtlasMap() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const mapViewRef = useRef<{ zoomTo: (coordinates: [number, number], zoomLevel?: number) => void; fitToSearchResults: (members: Member[]) => void } | null>(null);

  const handleMemberClick = useCallback((member: Member) => {
    setSelectedMember(member);
  }, []);



  // Filter states
  const [colorBy, setColorBy] = useState<'Zone Type' | 'Zone Management Type' | 'Zone Activity Status'>('Zone Type');
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedZoneTypes, setSelectedZoneTypes] = useState<string[]>([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState<ZoneSpecialization[]>([]);
  const [selectedManagementTypes, setSelectedManagementTypes] = useState<ManagementType[]>([]);
  const [selectedActivityStatuses, setSelectedActivityStatuses] = useState<ActivityStatus[]>([]);

  // Collapsed states for filter sections
  const [collapsedSections, setCollapsedSections] = useState({
    show: true,
    colorBy: false,
    zoneType: true,
    region: false,
    specialization: true,
    managementType: true,
    activityStatus: true,
  });

  const toggleCollapsed = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // API data state
  const [memberData, setMemberData] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organizationTypes, setOrganizationTypes] = useState<Array<{code: string, label: string}>>([]);
  const [membershipCategories, setMembershipCategories] = useState<Array<{code: string, label: string}>>([]);

  // Fetch member data and dropdown options
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch member data
        const memberRes = await fetch('/api/member/mapdata');
        if (memberRes.ok) {
          const json = await memberRes.json();
          const apiList: ApiMember[] = Array.isArray(json.companyMapData)
            ? json.companyMapData
            : [];
          const normalized = apiList.map((m, idx) => mapApiMemberToMember(m, idx));
          setMemberData(normalized);
        }

        // Fetch organization types
        const orgTypeRes = await fetch('/api/member-registration/dropdowns/organizationType?locale=en');
        if (orgTypeRes.ok) {
          const orgTypeJson = await orgTypeRes.json();
          if (orgTypeJson.values) {
            setOrganizationTypes(orgTypeJson.values);
          }
        }

        // Fetch membership categories
        const categoryRes = await fetch('/api/member-registration/dropdowns/membershipCategory?locale=en');
        if (categoryRes.ok) {
          const categoryJson = await categoryRes.json();
          if (categoryJson.values) {
            setMembershipCategories(categoryJson.values);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create dynamic mapping from API data
  const orgTypeMapping = useMemo(() => {
    const mapping: Record<string, string> = {};
    organizationTypes.forEach(type => {
      mapping[type.label] = type.code;
    });
    return mapping;
  }, [organizationTypes]);

  const categoryMapping = useMemo(() => {
    const mapping: Record<string, string> = {};
    membershipCategories.forEach(cat => {
      mapping[cat.label] = cat.code;
    });
    return mapping;
  }, [membershipCategories]);

  // Map countries to regions
  const countryToRegion: Record<string, Region> = {
    // Africa
    'Nigeria': 'Africa',
    'Ethiopia': 'Africa',
    'Kenya': 'Africa',
    'South Africa': 'Africa',
    'Egypt': 'Africa',
    'Morocco': 'Africa',
    'Ghana': 'Africa',
    'Tanzania': 'Africa',
    'Rwanda': 'Africa',
    'Uganda': 'Africa',
    'Senegal': 'Africa',
    'Ivory Coast': 'Africa',
    'Zimbabwe': 'Africa',
    'Botswana': 'Africa',
    'Namibia': 'Africa',
    'Mozambique': 'Africa',
    'Zambia': 'Africa',
    'Angola': 'Africa',
    'Algeria': 'Africa',
    'Tunisia': 'Africa',

    // Middle East
    'United Arab Emirates': 'Middle East',
    'Saudi Arabia': 'Middle East',
    'Qatar': 'Middle East',
    'Kuwait': 'Middle East',
    'Bahrain': 'Middle East',
    'Oman': 'Middle East',
    'Jordan': 'Middle East',
    'Lebanon': 'Middle East',
    'Israel': 'Middle East',
    'Iraq': 'Middle East',
    'Iran': 'Middle East',
    'Turkey': 'Middle East',
    'Syria': 'Middle East',
    'Yemen': 'Middle East',

    // Southeast Asia
    'Singapore': 'Southeast Asia',
    'Malaysia': 'Southeast Asia',
    'Indonesia': 'Southeast Asia',
    'Thailand': 'Southeast Asia',
    'Philippines': 'Southeast Asia',
    'Vietnam': 'Southeast Asia',
    'Myanmar': 'Southeast Asia',
    'Cambodia': 'Southeast Asia',
    'Laos': 'Southeast Asia',
    'Brunei': 'Southeast Asia',

    // East Asia
    'China': 'East Asia',
    'Japan': 'East Asia',
    'South Korea': 'East Asia',
    'North Korea': 'East Asia',
    'Taiwan': 'East Asia',
    'Hong Kong': 'East Asia',
    'Macau': 'East Asia',
    'Mongolia': 'East Asia',

    // South Asia
    'India': 'South Asia',
    'Pakistan': 'South Asia',
    'Bangladesh': 'South Asia',
    'Sri Lanka': 'South Asia',
    'Nepal': 'South Asia',
    'Bhutan': 'South Asia',
    'Maldives': 'South Asia',
    'Afghanistan': 'South Asia',

    // North America
    'United States': 'North America',
    'Canada': 'North America',
    'Mexico': 'North America',

    // Central America
    'Panama': 'Central America',
    'Costa Rica': 'Central America',
    'Nicaragua': 'Central America',
    'Honduras': 'Central America',
    'El Salvador': 'Central America',
    'Guatemala': 'Central America',
    'Belize': 'Central America',

    // South America
    'Brazil': 'South America',
    'Argentina': 'South America',
    'Chile': 'South America',
    'Colombia': 'South America',
    'Peru': 'South America',
    'Venezuela': 'South America',
    'Ecuador': 'South America',
    'Bolivia': 'South America',
    'Paraguay': 'South America',
    'Uruguay': 'South America',
    'Guyana': 'South America',
    'Suriname': 'South America',

    // Caribbean
    'The Bahamas': 'Caribbean',
    'Jamaica': 'Caribbean',
    'Trinidad and Tobago': 'Caribbean',
    'Barbados': 'Caribbean',
    'Haiti': 'Caribbean',
    'Dominican Republic': 'Caribbean',
    'Cuba': 'Caribbean',
    'Puerto Rico': 'Caribbean',

    // Europe
    'United Kingdom': 'Europe',
    'Germany': 'Europe',
    'France': 'Europe',
    'Italy': 'Europe',
    'Spain': 'Europe',
    'Netherlands': 'Europe',
    'Belgium': 'Europe',
    'Switzerland': 'Europe',
    'Austria': 'Europe',
    'Sweden': 'Europe',
    'Norway': 'Europe',
    'Denmark': 'Europe',
    'Finland': 'Europe',
    'Poland': 'Europe',
    'Russia': 'Europe',
    'Ukraine': 'Europe',
    'Romania': 'Europe',
    'Czech Republic': 'Europe',
    'Hungary': 'Europe',
    'Portugal': 'Europe',
    'Greece': 'Europe',
    'Ireland': 'Europe',

    // Oceania
    'Australia': 'Oceania',
    'New Zealand': 'Oceania',
    'Papua New Guinea': 'Oceania',
    'Fiji': 'Oceania',
    'Solomon Islands': 'Oceania',
    'Vanuatu': 'Oceania',
    'Samoa': 'Oceania',
    'Tonga': 'Oceania',

    // Central Asia
    'Kazakhstan': 'Central Asia',
    'Uzbekistan': 'Central Asia',
    'Turkmenistan': 'Central Asia',
    'Kyrgyzstan': 'Central Asia',
    'Tajikistan': 'Central Asia',
  };

  // Filter members based on search and filters
  const filteredMembers = useMemo(() => {
    let filtered = memberData;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.countryName.toLowerCase().includes(query) ||
          member.city?.toLowerCase().includes(query) ||
          member.address.toLowerCase().includes(query)
      );
    }

    // Region filter
    if (selectedRegions.length > 0) {
      filtered = filtered.filter((member) => {
        const region = countryToRegion[member.countryName];
        return region && selectedRegions.includes(region);
      });
    }

    // Zone Type filter
    if (selectedZoneTypes.length > 0) {
      filtered = filtered.filter((member) => {
        const orgType = member.typeOfTheOrganization;
        return selectedZoneTypes.some(zoneType => orgTypeMapping[zoneType] === orgType);
      });
    }

    // For now, we'll ignore other filters as they don't map directly to member data
    // Specialization, management type, and activity status filters
    // would need additional API fields or mapping logic

    return filtered;
  }, [memberData, searchQuery, selectedRegions, selectedZoneTypes, orgTypeMapping]);

  // Zoom to search results when search query changes
  useEffect(() => {
    if (searchQuery && filteredMembers.length > 0 && mapViewRef.current) {
      mapViewRef.current.fitToSearchResults(filteredMembers);
    }
  }, [searchQuery, filteredMembers]);

  const handleApplyFilters = () => {
    setShowFilter(false);
  };

  const handleResetFilters = () => {
    setColorBy('Zone Type');
    setSelectedZoneTypes([]);
    setSelectedSpecializations([]);
    setSelectedManagementTypes([]);
    setSelectedActivityStatuses([]);
  };

  const handleResetAdvancedSearch = () => {
    setSelectedRegions([]);
    setSelectedZoneTypes([]);
    setSelectedSpecializations([]);
    setSelectedManagementTypes([]);
    setSelectedActivityStatuses([]);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchInput('');
  };

  const toggleRegion = (region: Region) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const toggleZoneType = (zoneType: string) => {
    setSelectedZoneTypes((prev) =>
      prev.includes(zoneType) ? prev.filter((t) => t !== zoneType) : [...prev, zoneType]
    );
  };

  const toggleSpecialization = (specialization: ZoneSpecialization) => {
    setSelectedSpecializations((prev) =>
      prev.includes(specialization) ? prev.filter((s) => s !== specialization) : [...prev, specialization]
    );
  };

  const toggleManagementType = (managementType: ManagementType) => {
    setSelectedManagementTypes((prev) =>
      prev.includes(managementType) ? prev.filter((m) => m !== managementType) : [...prev, managementType]
    );
  };

  const toggleActivityStatus = (activityStatus: ActivityStatus) => {
    setSelectedActivityStatuses((prev) =>
      prev.includes(activityStatus) ? prev.filter((a) => a !== activityStatus) : [...prev, activityStatus]
    );
  };

  return (
    <div className="relative w-full h-[684px] rounded-sm overflow-hidden bg-white shadow-wfzo">
      {/* Legend */}
      <div className="absolute top-0 left-0 right-0 z-[500] flex items-center gap-2 p-2 bg-white border-b border-wfzo-grey-200">
        {Object.entries(zoneTypeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1 px-2 py-1 rounded-lg">
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <span className="text-wfzo-grey-900 font-source text-xs font-normal leading-4">
              {type}
            </span>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="absolute top-12 left-4 right-4 z-[500] m-10 flex items-start gap-5">
        {/* Search Section */}
        <div className="flex items-center gap-3">
          {/* Search Field */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-wfzo-grey-200 bg-white min-w-[242px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L20.3 18.9C20.4833 19.0833 20.575 19.3167 20.575 19.6C20.575 19.8833 20.4833 20.1167 20.3 20.3C20.1167 20.4833 19.8833 20.575 19.6 20.575C19.3167 20.575 19.0833 20.4833 18.9 20.3L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z" fill="#5F5F5F"/>
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 text-wfzo-grey-800 font-source text-base font-normal leading-6 outline-none bg-transparent"
            />
            {(searchQuery || searchInput) && (
              <button onClick={handleClearSearch} className="p-0 bg-transparent border-none cursor-pointer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 13.4L14.9 16.3C15.0833 16.4833 15.3167 16.575 15.6 16.575C15.8833 16.575 16.1167 16.4833 16.3 16.3C16.4833 16.1167 16.575 15.8833 16.575 15.6C16.575 15.3167 16.4833 15.0833 16.3 14.9L13.4 12L16.3 9.1C16.4833 8.91667 16.575 8.68333 16.575 8.4C16.575 8.11667 16.4833 7.88333 16.3 7.7C16.1167 7.51667 15.8833 7.425 15.6 7.425C15.3167 7.425 15.0833 7.51667 14.9 7.7L12 10.6L9.1 7.7C8.91667 7.51667 8.68333 7.425 8.4 7.425C8.11667 7.425 7.88333 7.51667 7.7 7.7C7.51667 7.88333 7.425 8.11667 7.425 8.4C7.425 8.68333 7.51667 8.91667 7.7 9.1L10.6 12L7.7 14.9C7.51667 15.0833 7.425 15.3167 7.425 15.6C7.425 15.8833 7.51667 16.1167 7.7 16.3C7.88333 16.4833 8.11667 16.575 8.4 16.575C8.68333 16.575 8.91667 16.4833 9.1 16.3L12 13.4Z" fill="#4D4D4D"/>
                </svg>
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-6 py-2 rounded-xl bg-gradient-to-b from-wfzo-gold-700 to-wfzo-gold-500 text-white font-source text-base font-semibold leading-6 border-t border-l border-r border-wfzo-gold-500"
          >
            Search
          </button>
        </div>

        {/* Advanced Search Button */}
        <button
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          className={`px-4 py-2 rounded-xl ${showAdvancedSearch ? 'bg-[#E7DACB]' : 'bg-gradient-to-b from-wfzo-gold-100 to-wfzo-gold-25'} text-wfzo-gold-600 font-source text-base font-semibold leading-6 border-t border-l border-r border-wfzo-gold-25 flex items-center gap-1`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L20.3 18.9C20.4833 19.0833 20.575 19.3167 20.575 19.6C20.575 19.8833 20.4833 20.1167 20.3 20.3C20.1167 20.4833 19.8833 20.575 19.6 20.575C19.3167 20.575 19.0833 20.4833 18.9 20.3L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z" fill="#8B6941"/>
          </svg>
          Advanced Search
        </button>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="px-4 py-2 rounded-xl bg-gradient-to-b from-wfzo-gold-100 to-wfzo-gold-25 text-wfzo-gold-600 font-source text-base font-semibold leading-6 border-t border-l border-r border-wfzo-gold-25 flex items-center gap-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 18C10.7167 18 10.4792 17.9042 10.2875 17.7125C10.0958 17.5208 10 17.2833 10 17C10 16.7167 10.0958 16.4792 10.2875 16.2875C10.4792 16.0958 10.7167 16 11 16H13C13.2833 16 13.5208 16.0958 13.7125 16.2875C13.9042 16.4792 14 16.7167 14 17C14 17.2833 13.9042 17.5208 13.7125 17.7125C13.5208 17.9042 13.2833 18 13 18H11ZM7 13C6.71667 13 6.47917 12.9042 6.2875 12.7125C6.09583 12.5208 6 12.2833 6 12C6 11.7167 6.09583 11.4792 6.2875 11.2875C6.47917 11.0958 6.71667 11 7 11H17C17.2833 11 17.5208 11.0958 17.7125 11.2875C17.9042 11.4792 18 11.7167 18 12C18 12.2833 17.9042 12.5208 17.7125 12.7125C17.5208 12.9042 17.2833 13 17 13H7ZM4 8C3.71667 8 3.47917 7.90417 3.2875 7.7125C3.09583 7.52083 3 7.28333 3 7C3 6.71667 3.09583 6.47917 3.2875 6.2875C3.47917 6.09583 3.71667 6 4 6H20C20.2833 6 20.5208 6.09583 20.7125 6.2875C20.9042 6.47917 21 6.71667 21 7C21 7.28333 20.9042 7.52083 20.7125 7.7125C20.5208 7.90417 20.2833 8 20 8H4Z" fill="#8B6941"/>
            </svg>
            Filter
          </button>

          {/* Filter Dropdown */}
          {showFilter && (
            <div className="absolute top-12 z-[501] left-0 w-[400px] bg-white rounded-2xl shadow-wfzo max-h-[500px] flex flex-col">
              <div className="overflow-y-auto flex-1">
                {/* Show Filter */}
                <div className="flex flex-col p-6 border-b border-wfzo-grey-200">
                  <div className="flex items-center gap-3">
                    <h3 className="flex-1 text-wfzo-grey-900 font-montserrat text-xl font-semibold leading-6">
                      Show
                    </h3>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 text-wfzo-gold-600 font-source text-base font-semibold leading-6"
                    >
                      Reset
                    </button>
                    <button className="p-0 bg-transparent border-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.9998 10.8L8.0998 14.7C7.91647 14.8834 7.68314 14.975 7.3998 14.975C7.11647 14.975 6.88314 14.8834 6.6998 14.7C6.51647 14.5167 6.4248 14.2834 6.4248 14C6.4248 13.7167 6.51647 13.4834 6.6998 13.3L11.2998 8.70002C11.4998 8.50002 11.7331 8.40002 11.9998 8.40002C12.2665 8.40002 12.4998 8.50002 12.6998 8.70002L17.2998 13.3C17.4831 13.4834 17.5748 13.7167 17.5748 14C17.5748 14.2834 17.4831 14.5167 17.2998 14.7C17.1165 14.8834 16.8831 14.975 16.5998 14.975C16.3165 14.975 16.0831 14.8834 15.8998 14.7L11.9998 10.8Z" fill="#333333"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Color By Filter */}
                <div className="flex flex-col p-6 border-b border-wfzo-grey-200">
                  <div className="flex items-center gap-3">
                    <h3 className="flex-1 text-wfzo-grey-900 font-montserrat text-xl font-semibold leading-6">
                      Color By (1)
                    </h3>
                    <button className="px-4 py-2 text-wfzo-gold-600 font-source text-base font-semibold leading-6">
                      Reset
                    </button>
                    <button
                      onClick={() => toggleCollapsed('colorBy')}
                      className="p-0 bg-transparent border-none"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`transition-transform ${collapsedSections.colorBy ? 'rotate-180' : ''}`}
                      >
                        <path d="M11.9998 10.8L8.0998 14.7C7.91647 14.8834 7.68314 14.975 7.3998 14.975C7.11647 14.975 6.88314 14.8834 6.6998 14.7C6.51647 14.5167 6.4248 14.2834 6.4248 14C6.4248 13.7167 6.51647 13.4834 6.6998 13.3L11.2998 8.70002C11.4998 8.50002 11.7331 8.40002 11.9998 8.40002C12.2665 8.40002 12.4998 8.50002 12.6998 8.70002L17.2998 13.3C17.4831 13.4834 17.5748 13.7167 17.5748 14C17.5748 14.2834 17.4831 14.5167 17.2998 14.7C17.1165 14.8834 16.8831 14.975 16.5998 14.975C16.3165 14.975 16.0831 14.8834 15.8998 14.7L11.9998 10.8Z" fill="#333333"/>
                      </svg>
                    </button>
                  </div>
                  {!collapsedSections.colorBy && (
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() => setColorBy('Zone Type')}
                        className={`px-3 py-1 rounded-lg border ${colorBy === 'Zone Type' ? 'border-wfzo-grey-900 bg-white' : 'border-wfzo-grey-200 bg-white'} text-wfzo-grey-900 font-source text-base font-normal leading-6 flex items-center gap-1`}
                      >
                        Zone Type
                        {colorBy === 'Zone Type' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.54972 15.15L18.0247 6.675C18.2247 6.475 18.4581 6.375 18.7247 6.375C18.9914 6.375 19.2247 6.475 19.4247 6.675C19.6247 6.875 19.7247 7.1125 19.7247 7.3875C19.7247 7.6625 19.6247 7.9 19.4247 8.1L10.2497 17.3C10.0497 17.5 9.81639 17.6 9.54972 17.6C9.28305 17.6 9.04972 17.5 8.84972 17.3L4.54972 13C4.34972 12.8 4.25389 12.5625 4.26222 12.2875C4.27055 12.0125 4.37472 11.775 4.57472 11.575C4.77472 11.375 5.01222 11.275 5.28722 11.275C5.56222 11.275 5.79972 11.375 5.99972 11.575L9.54972 15.15Z" fill="#1A1A1A"/>
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => setColorBy('Zone Management Type')}
                        className="px-3 py-1 rounded-lg border border-wfzo-grey-200 bg-white text-wfzo-grey-900 font-source text-base font-normal leading-6"
                      >
                        Zone Management Type
                      </button>
                      <button
                        onClick={() => setColorBy('Zone Activity Status')}
                        className="px-3 py-1 rounded-lg border border-wfzo-grey-200 bg-white text-wfzo-grey-900 font-source text-base font-normal leading-6"
                      >
                        Zone Activity Status
                      </button>
                    </div>
                  )}
                </div>

                {/* Zone Type Filter */}
                <div className="flex flex-col p-6 border-b border-wfzo-grey-200">
                  <div className="flex items-center gap-3">
                    <h3 className="flex-1 text-wfzo-grey-900 font-montserrat text-xl font-semibold leading-6">
                      Zone Type ({selectedZoneTypes.length})
                    </h3>
                    <button
                      onClick={() => setSelectedZoneTypes([])}
                      className="px-4 py-2 text-wfzo-gold-600 font-source text-base font-semibold leading-6"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => toggleCollapsed('zoneType')}
                      className="p-0 bg-transparent border-none"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`transition-transform ${collapsedSections.zoneType ? 'rotate-180' : ''}`}
                      >
                        <path d="M11.9998 10.8L8.0998 14.7C7.91647 14.8834 7.68314 14.975 7.3998 14.975C7.11647 14.975 6.88314 14.8834 6.6998 14.7C6.51647 14.5167 6.4248 14.2834 6.4248 14C6.4248 13.7167 6.51647 13.4834 6.6998 13.3L11.2998 8.70002C11.4998 8.50002 11.7331 8.40002 11.9998 8.40002C12.2665 8.40002 12.4998 8.50002 12.6998 8.70002L17.2998 13.3C17.4831 13.4834 17.5748 13.7167 17.5748 14C17.5748 14.2834 17.4831 14.5167 17.2998 14.7C17.1165 14.8834 16.8831 14.975 16.5998 14.975C16.3165 14.975 16.0831 14.8834 15.8998 14.7L11.9998 10.8Z" fill="#333333"/>
                      </svg>
                    </button>
                  </div>
                  {!collapsedSections.zoneType && (
                    <div className="flex flex-wrap gap-4">
                      {organizationTypes.map((orgType) => (
                        <button
                          key={orgType.code}
                          onClick={() => toggleZoneType(orgType.label)}
                          className={`px-3 py-1 rounded-lg border ${selectedZoneTypes.includes(orgType.label) ? 'border-wfzo-grey-900 bg-white' : 'border-wfzo-grey-200 bg-white'} text-wfzo-grey-900 font-source text-base font-normal leading-6 flex items-center gap-1`}
                        >
                          {orgType.label}
                          {selectedZoneTypes.includes(orgType.label) && (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9.54972 15.15L18.0247 6.675C18.2247 6.475 18.4581 6.375 18.7247 6.375C18.9914 6.375 19.2247 6.475 19.4247 6.675C19.6247 6.875 19.7247 7.1125 19.7247 7.3875C19.7247 7.6625 19.6247 7.9 19.4247 8.1L10.2497 17.3C10.0497 17.5 9.81639 17.6 9.54972 17.6C9.28305 17.6 9.04972 17.5 8.84972 17.3L4.54972 13C4.34972 12.8 4.25389 12.5625 4.26222 12.2875C4.27055 12.0125 4.37472 11.775 4.57472 11.575C4.77472 11.375 5.01222 11.275 5.28722 11.275C5.56222 11.275 5.79972 11.375 5.99972 11.575L9.54972 15.15Z" fill="#1A1A1A"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-start gap-6 p-6 border-t-2 border-wfzo-grey-200 rounded-b-2xl bg-[#F9F9F9] flex-shrink-0">
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 rounded-xl bg-gradient-to-b from-wfzo-gold-700 to-wfzo-gold-500 text-white font-source text-base font-semibold leading-6 border-t border-l border-r border-wfzo-gold-500"
                >
                  Apply filters
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2 rounded-xl bg-gradient-to-b from-wfzo-gold-100 to-wfzo-gold-25 text-wfzo-gold-600 font-source text-base font-semibold leading-6 border-t border-l border-r border-wfzo-gold-25"
                >
                  Reset all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Search Dropdown */}
        {showAdvancedSearch && (
          <div className="absolute top-12 z-[501] left-0 w-[556px] bg-white rounded-2xl shadow-wfzo max-h-[500px] flex flex-col">
            <div className="overflow-y-auto flex-1">
              {/* Region Filter */}
              <div className="flex flex-col p-6 border-b border-wfzo-grey-200">
                <div className="flex items-center gap-3">
                  <h3 className="flex-1 text-wfzo-grey-900 font-montserrat text-xl font-semibold leading-6">
                    Region ({selectedRegions.length})
                  </h3>
                  <button
                    onClick={() => setSelectedRegions([])}
                    className="px-4 py-2 text-wfzo-gold-600 font-source text-base font-semibold leading-6"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => toggleCollapsed('region')}
                    className="p-0 bg-transparent border-none"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-transform ${collapsedSections.region ? 'rotate-180' : ''}`}
                    >
                      <path d="M11.9998 10.8L8.0998 14.7C7.91647 14.8834 7.68314 14.975 7.3998 14.975C7.11647 14.975 6.88314 14.8834 6.6998 14.7C6.51647 14.5167 6.4248 14.2834 6.4248 14C6.4248 13.7167 6.51647 13.4834 6.6998 13.3L11.2998 8.70002C11.4998 8.50002 11.7331 8.40002 11.9998 8.40002C12.2665 8.40002 12.4998 8.50002 12.6998 8.70002L17.2998 13.3C17.4831 13.4834 17.5748 13.7167 17.5748 14C17.5748 14.2834 17.4831 14.5167 17.2998 14.7C17.1165 14.8834 16.8831 14.975 16.5998 14.975C16.3165 14.975 16.0831 14.8834 15.8998 14.7L11.9998 10.8Z" fill="#333333"/>
                    </svg>
                  </button>
                </div>
                {!collapsedSections.region && (
                  <div className="flex flex-wrap gap-4">
                    {regions.map((region) => (
                      <button
                        key={region}
                        onClick={() => toggleRegion(region)}
                        className={`px-3 py-1 rounded-lg border ${selectedRegions.includes(region) ? 'border-wfzo-grey-900 bg-white' : 'border-wfzo-grey-200 bg-white'} text-wfzo-grey-900 font-source text-base font-normal leading-6 flex items-center gap-1`}
                      >
                        {region}
                        {selectedRegions.includes(region) && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.54972 15.15L18.0247 6.675C18.2247 6.475 18.4581 6.375 18.7247 6.375C18.9914 6.375 19.2247 6.475 19.4247 6.675C19.6247 6.875 19.7247 7.1125 19.7247 7.3875C19.7247 7.6625 19.6247 7.9 19.4247 8.1L10.2497 17.3C10.0497 17.5 9.81639 17.6 9.54972 17.6C9.28305 17.6 9.04972 17.5 8.84972 17.3L4.54972 13C4.34972 12.8 4.25389 12.5625 4.26222 12.2875C4.27055 12.0125 4.37472 11.775 4.57472 11.575C4.77472 11.375 5.01222 11.275 5.28722 11.275C5.56222 11.275 5.79972 11.375 5.99972 11.575L9.54972 15.15Z" fill="#1A1A1A"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>


              {/* Specialization Filter */}
              <div className="flex flex-col p-6 border-b border-wfzo-grey-200">
                <div className="flex items-center gap-3">
                  <h3 className="flex-1 text-wfzo-grey-900 font-montserrat text-xl font-semibold leading-6">
                    Specialization ({selectedSpecializations.length})
                  </h3>
                  <button
                    onClick={() => setSelectedSpecializations([])}
                    className="px-4 py-2 text-wfzo-gold-600 font-source text-base font-semibold leading-6"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => toggleCollapsed('specialization')}
                    className="p-0 bg-transparent border-none"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-transform ${collapsedSections.specialization ? 'rotate-180' : ''}`}
                    >
                      <path d="M11.9998 10.8L8.0998 14.7C7.91647 14.8834 7.68314 14.975 7.3998 14.975C7.11647 14.975 6.88314 14.8834 6.6998 14.7C6.51647 14.5167 6.4248 14.2834 6.4248 14C6.4248 13.7167 6.51647 13.4834 6.6998 13.3L11.2998 8.70002C11.4998 8.50002 11.7331 8.40002 11.9998 8.40002C12.2665 8.40002 12.4998 8.50002 12.6998 8.70002L17.2998 13.3C17.4831 13.4834 17.5748 13.7167 17.5748 14C17.5748 14.2834 17.4831 14.5167 17.2998 14.7C17.1165 14.8834 16.8831 14.975 16.5998 14.975C16.3165 14.975 16.0831 14.8834 15.8998 14.7L11.9998 10.8Z" fill="#333333"/>
                    </svg>
                  </button>
                </div>
                {!collapsedSections.specialization && (
                  <div className="flex flex-wrap gap-4">
                    {zoneSpecializations.map((specialization) => (
                      <button
                        key={specialization}
                        onClick={() => toggleSpecialization(specialization)}
                        className={`px-3 py-1 rounded-lg border ${selectedSpecializations.includes(specialization) ? 'border-wfzo-grey-900 bg-white' : 'border-wfzo-grey-200 bg-white'} text-wfzo-grey-900 font-source text-base font-normal leading-6 flex items-center gap-1`}
                      >
                        {specialization}
                        {selectedSpecializations.includes(specialization) && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.54972 15.15L18.0247 6.675C18.2247 6.475 18.4581 6.375 18.7247 6.375C18.9914 6.375 19.2247 6.475 19.4247 6.675C19.6247 6.875 19.7247 7.1125 19.7247 7.3875C19.7247 7.6625 19.6247 7.9 19.4247 8.1L10.2497 17.3C10.0497 17.5 9.81639 17.6 9.54972 17.6C9.28305 17.6 9.04972 17.5 8.84972 17.3L4.54972 13C4.34972 12.8 4.25389 12.5625 4.26222 12.2875C4.27055 12.0125 4.37472 11.775 4.57472 11.575C4.77472 11.375 5.01222 11.275 5.28722 11.275C5.56222 11.275 5.79972 11.375 5.99972 11.575L9.54972 15.15Z" fill="#1A1A1A"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Management Type Filter */}
              <div className="flex flex-col p-6 border-b border-wfzo-grey-200">
                <div className="flex items-center gap-3">
                  <h3 className="flex-1 text-wfzo-grey-900 font-montserrat text-xl font-semibold leading-6">
                    Management Type ({selectedManagementTypes.length})
                  </h3>
                  <button
                    onClick={() => setSelectedManagementTypes([])}
                    className="px-4 py-2 text-wfzo-gold-600 font-source text-base font-semibold leading-6"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => toggleCollapsed('managementType')}
                    className="p-0 bg-transparent border-none"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-transform ${collapsedSections.managementType ? 'rotate-180' : ''}`}
                    >
                      <path d="M11.9998 10.8L8.0998 14.7C7.91647 14.8834 7.68314 14.975 7.3998 14.975C7.11647 14.975 6.88314 14.8834 6.6998 14.7C6.51647 14.5167 6.4248 14.2834 6.4248 14C6.4248 13.7167 6.51647 13.4834 6.6998 13.3L11.2998 8.70002C11.4998 8.50002 11.7331 8.40002 11.9998 8.40002C12.2665 8.40002 12.4998 8.50002 12.6998 8.70002L17.2998 13.3C17.4831 13.4834 17.5748 13.7167 17.5748 14C17.5748 14.2834 17.4831 14.5167 17.2998 14.7C17.1165 14.8834 16.8831 14.975 16.5998 14.975C16.3165 14.975 16.0831 14.8834 15.8998 14.7L11.9998 10.8Z" fill="#333333"/>
                    </svg>
                  </button>
                </div>
                {!collapsedSections.managementType && (
                  <div className="flex flex-wrap gap-4">
                    {managementTypes.map((managementType) => (
                      <button
                        key={managementType}
                        onClick={() => toggleManagementType(managementType)}
                        className={`px-3 py-1 rounded-lg border ${selectedManagementTypes.includes(managementType) ? 'border-wfzo-grey-900 bg-white' : 'border-wfzo-grey-200 bg-white'} text-wfzo-grey-900 font-source text-base font-normal leading-6 flex items-center gap-1`}
                      >
                        {managementType}
                        {selectedManagementTypes.includes(managementType) && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.54972 15.15L18.0247 6.675C18.2247 6.475 18.4581 6.375 18.7247 6.375C18.9914 6.375 19.2247 6.475 19.4247 6.675C19.6247 6.875 19.7247 7.1125 19.7247 7.3875C19.7247 7.6625 19.6247 7.9 19.4247 8.1L10.2497 17.3C10.0497 17.5 9.81639 17.6 9.54972 17.6C9.28305 17.6 9.04972 17.5 8.84972 17.3L4.54972 13C4.34972 12.8 4.25389 12.5625 4.26222 12.2875C4.27055 12.0125 4.37472 11.775 4.57472 11.575C4.77472 11.375 5.01222 11.275 5.28722 11.275C5.56222 11.275 5.79972 11.375 5.99972 11.575L9.54972 15.15Z" fill="#1A1A1A"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity Status Filter */}
              <div className="flex flex-col p-6 border-b border-wfzo-grey-200">
                <div className="flex items-center gap-3">
                  <h3 className="flex-1 text-wfzo-grey-900 font-montserrat text-xl font-semibold leading-6">
                    Activity Status ({selectedActivityStatuses.length})
                  </h3>
                  <button
                    onClick={() => setSelectedActivityStatuses([])}
                    className="px-4 py-2 text-wfzo-gold-600 font-source text-base font-semibold leading-6"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => toggleCollapsed('activityStatus')}
                    className="p-0 bg-transparent border-none"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-transform ${collapsedSections.activityStatus ? 'rotate-180' : ''}`}
                    >
                      <path d="M11.9998 10.8L8.0998 14.7C7.91647 14.8834 7.68314 14.975 7.3998 14.975C7.11647 14.975 6.88314 14.8834 6.6998 14.7C6.51647 14.5167 6.4248 14.2834 6.4248 14C6.4248 13.7167 6.51647 13.4834 6.6998 13.3L11.2998 8.70002C11.4998 8.50002 11.7331 8.40002 11.9998 8.40002C12.2665 8.40002 12.4998 8.50002 12.6998 8.70002L17.2998 13.3C17.4831 13.4834 17.5748 13.7167 17.5748 14C17.5748 14.2834 17.4831 14.5167 17.2998 14.7C17.1165 14.8834 16.8831 14.975 16.5998 14.975C16.3165 14.975 16.0831 14.8834 15.8998 14.7L11.9998 10.8Z" fill="#333333"/>
                    </svg>
                  </button>
                </div>
                {!collapsedSections.activityStatus && (
                  <div className="flex flex-wrap gap-4">
                    {activityStatuses.map((activityStatus) => (
                      <button
                        key={activityStatus}
                        onClick={() => toggleActivityStatus(activityStatus)}
                        className={`px-3 py-1 rounded-lg border ${selectedActivityStatuses.includes(activityStatus) ? 'border-wfzo-grey-900 bg-white' : 'border-wfzo-grey-200 bg-white'} text-wfzo-grey-900 font-source text-base font-normal leading-6 flex items-center gap-1`}
                      >
                        {activityStatus}
                        {selectedActivityStatuses.includes(activityStatus) && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.54972 15.15L18.0247 6.675C18.2247 6.475 18.4581 6.375 18.7247 6.375C18.9914 6.375 19.2247 6.475 19.4247 6.675C19.6247 6.875 19.7247 7.1125 19.7247 7.3875C19.7247 7.6625 19.6247 7.9 19.4247 8.1L10.2497 17.3C10.0497 17.5 9.81639 17.6 9.54972 17.6C9.28305 17.6 9.04972 17.5 8.84972 17.3L4.54972 13C4.34972 12.8 4.25389 12.5625 4.26222 12.2875C4.27055 12.0125 4.37472 11.775 4.57472 11.575C4.77472 11.375 5.01222 11.275 5.28722 11.275C5.56222 11.275 5.79972 11.375 5.99972 11.575L9.54972 15.15Z" fill="#1A1A1A"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-start gap-6 p-6 border-t-2 border-wfzo-grey-200 rounded-b-2xl bg-[#F9F9F9] flex-shrink-0">
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className="px-6 py-2 rounded-xl bg-gradient-to-b from-wfzo-gold-700 to-wfzo-gold-500 text-white font-source text-base font-semibold leading-6 border-t border-l border-r border-wfzo-gold-500"
              >
                Apply filters
              </button>
              <button
                onClick={handleResetAdvancedSearch}
                className="px-6 py-2 rounded-xl bg-gradient-to-b from-wfzo-gold-100 to-wfzo-gold-25 text-wfzo-gold-600 font-source text-base font-semibold leading-6 border-t border-l border-r border-wfzo-gold-25"
              >
                Reset all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="w-full h-full pt-12">
        <AtlasMapView
          ref={mapViewRef}
          members={filteredMembers}
          organizationTypes={organizationTypes}
          onMemberClick={handleMemberClick}
        />
      </div>

      {/* Search Results List */}
      {searchQuery && filteredMembers.length > 0 && (
        <div className="absolute top-30 left-4 w-[350px] z-[500] max-h-[556px] bg-white rounded-2xl shadow-wfzo overflow-y-auto">
          {filteredMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="w-full flex items-center gap-3 mt-2 p-3 border-b border-wfzo-grey-200 hover:bg-wfzo-gold-25 transition-colors text-left"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: zoneTypeColors[member.typeOfTheOrganization as ZoneType] || '#684F31' }}
              />
              <div className="flex-1">
                <div className="text-wfzo-grey-900 font-source text-base font-bold leading-5">
                  {member.name}
                </div>
                <div className="text-wfzo-grey-600 font-source text-base font-normal leading-6">
                  {organizationTypes.find(type => type.code === member.typeOfTheOrganization)?.label || member.typeOfTheOrganization || 'N/A'}
                </div>
                <div className="text-wfzo-grey-600 font-source text-base font-normal leading-6">
                  {member.countryName}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Member Details Panel */}
      {selectedMember && (
        <div className="absolute top-[100px] left-[100px] z-[501] w-[350px] bg-white rounded-2xl shadow-wfzo overflow-hidden">
          <div className="flex items-center justify-end gap-2 p-3 border-b border-[#EAEAEA]">
            <button
              onClick={() => setSelectedMember(null)}
              className="text-black font-source text-base font-semibold leading-6"
            >
              Close
            </button>
            <button onClick={() => setSelectedMember(null)} className="p-1">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.99967 11.1668L5.91634 15.2502C5.76356 15.4029 5.56912 15.4793 5.33301 15.4793C5.0969 15.4793 4.90245 15.4029 4.74967 15.2502C4.5969 15.0974 4.52051 14.9029 4.52051 14.6668C4.52051 14.4307 4.5969 14.2363 4.74967 14.0835L8.83301 10.0002L4.74967 5.91683C4.5969 5.76405 4.52051 5.56961 4.52051 5.3335C4.52051 5.09739 4.5969 4.90294 4.74967 4.75016C4.90245 4.59738 5.0969 4.521 5.33301 4.521C5.56912 4.521 5.76356 4.59738 5.91634 4.75016L9.99967 8.8335L14.083 4.75016C14.2358 4.59738 14.4302 4.521 14.6663 4.521C14.9025 4.521 15.0969 4.59738 15.2497 4.75016C15.4025 4.90294 15.4788 5.09739 15.4788 5.3335C15.4788 5.56961 15.4025 5.76405 15.2497 5.91683L11.1663 10.0002L15.2497 14.0835C15.4025 14.2363 15.4788 14.4307 15.4788 14.6668C15.4788 14.9029 15.4025 15.0974 15.2497 15.2502C15.0969 15.4029 14.9025 15.4793 14.6663 15.4793C14.4302 15.4793 14.2358 15.4029 14.083 15.2502L9.99967 11.1668Z" fill="#333333"/>
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            <div>
              <h2 className="text-wfzo-grey-800 font-source text-base font-semibold leading-6">
                {selectedMember.name}
              </h2>
            </div>
            {selectedMember.address && (
            <div>
              <div className="text-wfzo-grey-600 font-source text-xs font-normal leading-4">Address</div>
              <div className="text-wfzo-grey-800 font-source text-base font-normal leading-6">
                {selectedMember.address}
              </div>
            </div>
            )}
            {selectedMember.countryName && (
            <div>
              <div className="text-wfzo-grey-600 font-source text-xs font-normal leading-4">Country</div>
              <div className="text-wfzo-grey-800 font-source text-base font-normal leading-6">
                {selectedMember.countryName}
              </div>
            </div>
            )}
            
            
            {selectedMember.typeOfTheOrganization && (
              <div>
                <div className="text-wfzo-grey-600 font-source text-xs font-normal leading-4">Type of Organization</div>
                <div className="text-wfzo-grey-800 font-source text-base font-normal leading-6">
                  {organizationTypes.find(type => type.code === selectedMember.typeOfTheOrganization)?.label || selectedMember.typeOfTheOrganization}
                </div>
              </div>
            )}
            {selectedMember.websiteUrl && (
              <div>
                <div className="text-wfzo-grey-600 font-source text-xs font-normal leading-4">Website</div>
                <div className="text-wfzo-grey-800 font-source text-base font-normal leading-6">
                  {/* <a href={selectedMember.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-wfzo-gold-600 underline"> */}
                    {selectedMember.websiteUrl}
                  {/* </a> */}
                </div>
              </div>
            )}
            {selectedMember.category && (
              <div>
                <div className="text-wfzo-grey-600 font-source text-xs font-normal leading-4">Category</div>
                <div className="text-wfzo-grey-800 font-source text-base font-normal leading-6">
                  {membershipCategories.find(type => type.code === selectedMember.category)?.label || selectedMember.category}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      
    </div>
  );
}
