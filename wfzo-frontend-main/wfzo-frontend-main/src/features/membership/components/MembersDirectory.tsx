'use client';
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import SearchFilterBar, { type SearchFilterOption } from '@/shared/components/SearchFilterBar';
import MemberCard from '@/shared/components/MemberCard';
import Image from 'next/image';
import MembersWorldwideLeaflet from './MembersWorldwideLeaflet';
import VioletPressButton from '@/shared/components/VioletPressButton';
import LightPressButton from '@/shared/components/LightPressButton';
import LightButton from '@/shared/components/LightButton';
import Flag from 'react-world-flags';
import { trackMemberSearch } from '@/lib/analytics/gtag';
import Link from 'next/link';


interface Member {
  id: number;
  name: string;
  logo: string;
  flag: string;
  industries: string[];
  countryName?: string;
  countryCode?: string;
  continent?: string;
  slug: string;
}

interface FilterOption {
  id: string | number;
  name: string;
  isActive?: boolean;
}

const toSearchFilterOption = (option: FilterOption): SearchFilterOption => ({
  id: option.id,
  label: option.name,
  value: String(option.id),
});

interface MembersListingProps {
  members: Member[];
  filterOptions: FilterOption[];
  renderCard?: (member: Member) => React.ReactNode;
  header?: string;
  preselectedIndustry?: string | null;
  locale: string;
}

interface MapRawMemberLike {
  id: number | string;
  name: string;
  countryName?: string;
  countryCode?: string;
  memberLogoUrl?: string;
}

function isMapRawMemberLike(obj: unknown): obj is MapRawMemberLike {
  return !!obj && typeof obj === 'object' && 'name' in obj;
}

const alphabets = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const alphanumeric = ['0-9',...alphabets];

export default function MembersListing({
  members,
  filterOptions,
  header,
  preselectedIndustry,
  locale,

}: MembersListingProps) {
  const [view, setView] = useState<'alphabetical' | 'map'>('alphabetical');
  const [selectedAlpha, setSelectedAlpha] = useState<string>('A');
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(40);
  const [pendingScrollTo, setPendingScrollTo] = useState<string | null>(null);
  const [mapSelection, setMapSelection] = useState<{
    type: 'continent' | 'country' | 'member' | null;
    label: string;
    members: Member[];
  }>({ type: null, label: '', members: [] });
  const mapResultsRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastScrollY = useRef<number>(window.scrollY);
  const [navTop, setNavTop] = useState<number>(0);
  const headerRef = useRef<HTMLHeadingElement | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);    
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [baseHeight, setBaseHeight] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const programmaticScrollRef = useRef<string | null>(null);
  const programmaticScrollTimerRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPastResults, setIsPastResults] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement | null>(null);


  // ...existing code...
  // cleanup programmatic scroll timer on unmount
  useEffect(() => {
    return () => {
      if (programmaticScrollTimerRef.current) {
        window.clearTimeout(programmaticScrollTimerRef.current);
        programmaticScrollTimerRef.current = null;
      }
      programmaticScrollRef.current = null;
    };
  }, []);
// ...existing code...
     

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    // If dropdown is open and click target is outside dropdown
    if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  }

  // Listen for all document clicks
  document.addEventListener('mousedown', handleClickOutside);

  return () => {
    // Cleanup listener on unmount
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showDropdown]);


  // Calculate navbar height based on scroll position and direction
  useEffect(() => {
    const heroSectionHeight = 700; // Default from Navigation component
    const calculateNavbarHeight = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;
      const isPastHero = currentScrollY > heroSectionHeight;
      if(window.innerWidth >= 640){
        setBaseHeight(123)
      }else{
        setBaseHeight(176)
      }
      setIsScrollingUp(!isScrollingDown);
      

      let height: number;
      if (isScrollingDown && isPastHero) {
        // Minimal nav: h-8 (32px) for mobile, lg:h-auto (assumed 40px)
        height = window.innerWidth >= 1024 ? 72 : 56;
        
      } else {
        // Full nav: top row (56px mobile, 72px lg) + bottom row (68px)
        height = (window.innerWidth >= 768 ? (window.innerWidth >= 1024 ? 140 : 120) : 56);
      }
      setNavTop(height);
      lastScrollY.current = currentScrollY;
    };

    calculateNavbarHeight(); // Initial calculation
    window.addEventListener('scroll', calculateNavbarHeight, { passive: true });
    window.addEventListener('resize', calculateNavbarHeight);

    return () => {
      window.removeEventListener('scroll', calculateNavbarHeight);
      window.removeEventListener('resize', calculateNavbarHeight);
    };
  }, []);

  // 👇 For map view
const baseMembers = useMemo(() => {
  return view === 'map' && mapSelection.members.length > 0
    ? mapSelection.members
    : members;
}, [view, mapSelection.members, members]);

  const groupedMembers = useMemo(() => {
    const groups: Record<string, Member[]> = {};
    for (const m of baseMembers) {
      const firstChar = m.name[0].toUpperCase();
      const key = /^[0-9]/.test(firstChar) ? '0-9' : firstChar;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return groups;
  }, [baseMembers]);


  // Create reverse lookup: ISO code -> country name
const isoToCountryName = useMemo(() => {
  const map: Record<string, string> = {};
  // Add all countries from your getCountryISOCode function
  const countries = {
    AL: "Albania", AD: "Andorra", AM: "Armenia", AT: "Austria", AZ: "Azerbaijan",
    BY: "Belarus", BE: "Belgium", BA: "Bosnia and Herzegovina", BG: "Bulgaria",
    HR: "Croatia", CY: "Cyprus", CZ: "Czech Republic", DK: "Denmark", EE: "Estonia",
    FI: "Finland", FR: "France", GE: "Georgia", DE: "Germany", GR: "Greece",
    HU: "Hungary", IS: "Iceland", IE: "Ireland", IT: "Italy", KZ: "Kazakhstan",
    XK: "Kosovo", LV: "Latvia", LI: "Liechtenstein", LT: "Lithuania", LU: "Luxembourg",
    MT: "Malta", MD: "Moldova", MC: "Monaco", ME: "Montenegro", NL: "Netherlands",
    MK: "North Macedonia", NO: "Norway", PL: "Poland", PT: "Portugal", RO: "Romania",
    RU: "Russia", SM: "San Marino", RS: "Serbia", SK: "Slovakia", SI: "Slovenia",
    ES: "Spain", SE: "Sweden", CH: "Switzerland", TR: "Turkey", UA: "Ukraine",
    GB: "United Kingdom", VA: "Vatican City", GT: "Guatemala", BH: "Bahrain",
    EG: "Egypt", IR: "Iran", IQ: "Iraq", IL: "Israel", JO: "Jordan", KW: "Kuwait",
    LB: "Lebanon", OM: "Oman", CO: "Colombia", CR: "Costa Rica", PS: "Palestine", QA: "Qatar",
    SA: "Saudi Arabia", SY: "Syria", AE: "United Arab Emirates", YE: "Yemen",
    AR: "Argentina", DZ: "Algeria", AO: "Angola", BJ: "Benin", BW: "Botswana", BF: "Burkina Faso",
    BI: "Burundi", CM: "Cameroon", CV: "Cape Verde", CF: "Central African Republic",
    TD: "Chad", KM: "Comoros", CG: "Congo Brazzaville", CD: "Congo Kinshasa",
    DJ: "Djibouti", GQ: "Equatorial Guinea", ER: "Eritrea", SZ: "Eswatini",
    ET: "Ethiopia", GA: "Gabon", GM: "Gambia", GH: "Ghana", GN: "Guinea",
    GW: "Guinea-Bissau", HT: "Haiti", CI: "Ivory Coast", KE: "Kenya", LS: "Lesotho", LR: "Liberia",
    LY: "Libya", MG: "Madagascar", MW: "Malawi", ML: "Mali", MR: "Mauritania",
    MU: "Mauritius", MA: "Morocco", MZ: "Mozambique", NA: "Namibia", NE: "Niger",
    NG: "Nigeria", RW: "Rwanda", ST: "Sao Tome and Príncipe", SN: "Senegal",
    SC: "Seychelles", SL: "Sierra Leone", SO: "Somalia", ZA: "South Africa",
    SS: "South Sudan", SD: "Sudan", TZ: "Tanzania", TG: "Togo", TN: "Tunisia",
    UG: "Uganda", ZM: "Zambia", ZW: "Zimbabwe", AF: "Afghanistan", BD: "Bangladesh",
    BT: "Bhutan", BN: "Brunei", KH: "Cambodia", CN: "China", TL: "East Timor",
    IN: "India", ID: "Indonesia", JP: "Japan", LA: "Laos", MY: "Malaysia",
    MV: "Maldives", MN: "Mongolia", MM: "Myanmar", NP: "Nepal", KP: "North Korea",
    PK: "Pakistan", PH: "Philippines", SG: "Singapore", KR: "South Korea",
    LK: "Sri Lanka", TW: "Taiwan", TH: "Thailand", VN: "Vietnam", UZ: "Uzbekistan",
    TM: "Turkmenistan", KG: "Kyrgyzstan", TJ: "Tajikistan"
  };
  Object.entries(countries).forEach(([code, name]) => {
    map[code] = name;
  });
  return map;
}, []);

  useEffect(() => {
    if (preselectedIndustry) {
      setSelectedFilters([preselectedIndustry]);
    }
  }, [preselectedIndustry]);

  const applyFilters = useCallback(
  (list: Member[]) => {
   const filtered = list.filter((m) => {
      const matchesFilter =
        selectedFilters.length > 0 ? selectedFilters.some((f) => m.industries.includes(f)) : true;

      const countryName =
        (m.flag && isoToCountryName[m.flag]) ? isoToCountryName[m.flag].toLowerCase() : '';
      const q = search.toLowerCase().trim();

      // map view: search by country or continent
      // alphabetical view: search by member name only
      const matchesSearch =
        q === ''
          ? true
          : view === 'map'
          ? countryName.includes(q) || (m.continent && m.continent.toLowerCase().includes(q))
          : m.name.toLowerCase().includes(q);

      return selectedFilters.length > 0 ? matchesFilter && matchesSearch : matchesSearch;
    });
    
    // Track member search when there's a search query
    if (search.trim() !== '') {
      trackMemberSearch(search.trim(), filtered.length);
    }
    
    return filtered;
  },
  [selectedFilters, search, isoToCountryName, view]
);

  const filteredGrouped = useMemo(() => {
    const fg: Record<string, Member[]> = {};
    alphanumeric.forEach((key) => {
      fg[key] = applyFilters(groupedMembers[key] || []);
    });
    return fg;
  }, [groupedMembers, applyFilters]);

   const totalFiltered = useMemo(() => {
  if (view === 'map') {
    // In map view: use the same logic as the rendering below
    const activeMembers = search.trim() !== '' ? members : mapSelection.members;
    return applyFilters(activeMembers).length;
  } else {
    // In alphabetical view: count all filtered members
    return alphanumeric.reduce((sum, key) => sum + filteredGrouped[key].length, 0);
  }
}, [view, search, members, mapSelection.members, applyFilters,filteredGrouped]);

  const allFilteredMembers = useMemo(
    () => alphanumeric.flatMap((key) => filteredGrouped[key]).slice(0, visibleCount),
    [filteredGrouped, visibleCount]
  );

  const visibleKeys = useMemo(() => {
    const keys = new Set<string>();
    allFilteredMembers.forEach((member) => {
      const firstChar = member.name[0].toUpperCase();
      const key = /^[0-9]/.test(firstChar) ? '0-9' : firstChar;
      keys.add(key);
    });
    return Array.from(keys);
  }, [allFilteredMembers]);

  const handleAlphaSelect = (char: string) => {
    programmaticScrollRef.current = char;
    setSelectedAlpha(char);
    const keysBefore = alphanumeric.slice(0, alphanumeric.indexOf(char));
    const cumBefore = keysBefore.reduce((sum, k) => sum + filteredGrouped[k].length, 0);
    const thisGroupLength = filteredGrouped[char].length;
    const required = cumBefore + thisGroupLength;

    if (visibleCount < required) {
      setVisibleCount(required);
      setPendingScrollTo(char);
    } else {
      const section = sectionRefs.current[char];
      if (section) {
        const offsetTop = section.getBoundingClientRect().top + window.pageYOffset - 250;
        window.scrollTo({
          top: offsetTop - navTop,
          behavior: 'smooth',
        });
        if (programmaticScrollTimerRef.current) {
          window.clearTimeout(programmaticScrollTimerRef.current);
        }
        programmaticScrollTimerRef.current = window.setTimeout(() => {
          programmaticScrollRef.current = null;
          programmaticScrollTimerRef.current = null;
        }, 700);
      }
    }

    // Ensure selected letter is visible in horizontal scrollbar (mobile)
    setTimeout(() => {
      const el = document.getElementById(`alpha-btn-${char}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 0);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 40);
  };

  const hasMoreData = totalFiltered > visibleCount;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (programmaticScrollRef.current) return;
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute('data-key');
            if (key) setSelectedAlpha(key);
          }
        });
      },
      { threshold: 0.5 }
    );

    const currentRefs = { ...sectionRefs.current };
    Object.values(currentRefs).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.values(currentRefs).forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [visibleKeys]);

  useEffect(() => {
    setVisibleCount(40);
  }, [search, selectedFilters]);

  useEffect(() => {
    if (pendingScrollTo !== null) {
      const section = sectionRefs.current[pendingScrollTo];
      if (section) {
        const offsetTop = section.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: offsetTop - navTop,
          behavior: 'smooth',
        });
        if (programmaticScrollTimerRef.current) {
          window.clearTimeout(programmaticScrollTimerRef.current);
        }
        programmaticScrollTimerRef.current = window.setTimeout(() => {
          programmaticScrollRef.current = null;
          programmaticScrollTimerRef.current = null;
        }, 700);
        setPendingScrollTo(null);
      }
    }
  }, [pendingScrollTo, navTop]);

  const noResults = totalFiltered === 0;

  const selectedStyle = {
    background: 'linear-gradient(180deg, #F4EEE7 0%, #FCFAF8 100%)',
    boxShadow: '0px 4px 4px -2px #8B694114, 0px 2px 4px -2px #8B69411F',
    borderRadius: '11px',
    color: '#8B6941',
    border: '1px solid #ccc',
    fontSize: '14px',
  };
  
  useEffect(() => {
  const handleScroll = () => {
    if (!visibleKeys || visibleKeys.length === 0) {
      setShowBackToTop(false);
      return;
    }

    // Trigger after second section dynamically
    const triggerIndex = Math.min(1, visibleKeys.length - 1);
    const triggerKey = visibleKeys[triggerIndex];
    const triggerSection = sectionRefs.current[triggerKey];

    // Last section
    const lastKey = visibleKeys[visibleKeys.length - 1];
    const lastSection = sectionRefs.current[lastKey];

    if (!triggerSection || !lastSection) {
      setShowBackToTop(false);
      return;
    }

    const scrollY = window.scrollY + navTop;
    const triggerBottom = triggerSection.getBoundingClientRect().bottom + window.pageYOffset;
    const lastBottom = lastSection.getBoundingClientRect().bottom + window.pageYOffset;

    const hideOffset = 600; // Hide button 200px before last section ends

    setShowBackToTop(scrollY > triggerBottom && scrollY < lastBottom - hideOffset);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  return () => window.removeEventListener('scroll', handleScroll);
}, [visibleKeys, navTop]);

  useEffect(() => {

    if (mapSelection.members.length > 0 && mapResultsRef.current) {
      // Scroll to results
      const top = mapResultsRef.current.getBoundingClientRect().top + window.pageYOffset - navTop - 100;
      window.scrollTo({ top});
    } else if (mapContainerRef.current) {
      // Scroll to map component
      const top = mapContainerRef.current.getBoundingClientRect().top + window.pageYOffset - navTop - 130;
      window.scrollTo({ top });
    }
}, [mapSelection, view]);

// Track if viewport has scrolled past results section
useEffect(() => {
  const handleScroll = () => {
    if (!resultsContainerRef.current) {
      setIsPastResults(false);
      return;
    }

    const resultsRect = resultsContainerRef.current.getBoundingClientRect();
    const resultsTop = resultsRect.top + window.pageYOffset;
    const currentScrollY = window.scrollY + window.innerHeight+100; // Bottom of viewport

    // Check if bottom of viewport has passed the top of results section
    // Add navTop to account for sticky header
    const threshold = resultsTop + window.innerHeight; // 100px buffer

    setIsPastResults(currentScrollY > threshold);
  };

  handleScroll(); // Initial check
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleScroll);

  return () => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleScroll);
  };
}, [navTop]);

useEffect(() => {
  console.log('isPastResults:', isPastResults);
}, [isPastResults]);
   
 const handleClickClearAll = useCallback(() => {
  setSearch('');
  setSelectedFilters([]);
  setMapSelection({ type: null, label: '', members: [] });
  }, []);


  return (
    <div className="w-full py-10 md:py-20">
      {header && (
        <h2 className="text-2xl px-5 md:px-30 md:text-3xl font-montserrat font-black text-wfzo-grey-900 mb-6" ref={headerRef}>
          {header}
        </h2>
      )}

      <div ref={mapResultsRef}  className={`bg-[#FCFAF8] pt-2 pb-4 transition-all duration-500 ease-in-out sticky  z-[501] ${isPastResults  ? isScrollingUp? '': '-translate-y-50': ''}`}
      style={{ top: `${navTop}px` }}
      >
        {/* View toggle */}
        <div className="flex px-5 md:px-30 items-center justify-between mb-3">
          <div className="flex rounded-xl bg-[#E7DACB] overflow-hidden gap-2 p-1 border border-[#8B6941]">
            <button
              onClick={() => setView('alphabetical')}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium transition h-[45px] ${
                view === 'alphabetical' ? 'shadow-md' : 'text-gray-700'
              }`}
              style={view === 'alphabetical' ? selectedStyle : { fontSize: '12px' }}
            >
              <Image src="/assets/atoz.svg" alt="Sort Icon" width={16} height={16} />
              A-Z Companies
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                view === 'map' ? 'shadow-md' : 'text-gray-700'
              }`}
              style={view === 'map' ? selectedStyle : { fontSize: '12px' }}
            >
              <Image src="/assets/map.svg" alt="Map icon" width={16} height={16} />
              Map view
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="px-5 md:px-30 w-full">
          <SearchFilterBar
            className="w-full"
            searchValue={search}
            onSearchChange={(value) => {
            setSearch(value);
              // show country suggestions only in map view
              setShowDropdown(!!value.trim() && view === 'map');
              // If user typed something (non-empty), reset any existing map selection
              if (value.trim() !== '') {
                setMapSelection({ type: null, label: '', members: [] });
              }
              // Track search after a delay to avoid tracking every keystroke
              if (value.trim() !== '') {
                const searchTimeout = setTimeout(() => {
                  const activeMembers = view === 'map' 
                    ? (value.trim() !== '' ? members : mapSelection.members)
                    : members;
                  const filtered = applyFilters(activeMembers);
                  trackMemberSearch(value, filtered.length);
                }, 1000);
                return () => clearTimeout(searchTimeout);
              }
          }}
            onSearchClear={() => {
              setSearch('');
              setMapSelection({ type: null, label: '', members: [] });
            }}
            searchPlaceholder={view === "alphabetical" ? "Search members" : "Search by country or continent"}
            filterTitle="Filter by Industry"
            filterOptions={filterOptions.map(toSearchFilterOption)}
            selectedFilters={selectedFilters.map((name) => {
              const found = filterOptions.find((opt) => opt.name === name);
              return found ? String(found.id) : name;
            })}
            onSelectedFiltersChange={(values) => {
              const idSet = new Set(values);
              const resolvedNames = filterOptions
                .filter((opt) => idSet.has(String(opt.id)))
                .map((opt) => opt.name);
              setSelectedFilters(resolvedNames);
            }}
            footerButtonLabel={
              selectedFilters.length > 0 && totalFiltered > 0
                ? `Show ${totalFiltered} results`
                : undefined
            }
          />

          {/* Country & Continent suggestion dropdown */}

                {view === 'map' && showDropdown && (
                <div className="relative top-1" ref={dropdownRef}>
                  <div className="absolute mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[250px] max-h-[300px] overflow-y-auto">
                    {/* Continent suggestions */}
                    {Array.from(
                      new Set(
                        members
                          .map(m => m.continent)
                          .filter(Boolean)
                      )
                    )
                      .filter(continent => continent!.toLowerCase().includes(search.toLowerCase()))
                      .map(continent => (
                        <div
                          key={`continent-${continent}`}
                          className="flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 gap-2 border-b"
                          onClick={() => {
                            const continentMembers = members.filter(mem => mem.continent === continent);
                            setMapSelection({
                              type: 'continent',
                              label: continent || '',
                              members: continentMembers,
                            });
                            setSearch(continent || '');
                            setShowDropdown(false);
                          }}
                        >
                          <span className="text-blue-600 font-semibold">🌍</span>
                          <span className="font-medium">{continent}</span>
                        </div>
                      ))}

                    {/* Country suggestions */}
                    {Array.from(
                      new Set(
                        members
                          .map(m => m.flag ? isoToCountryName[m.flag] : undefined)
                          .filter(Boolean)
                      )
                    )
                      .filter(c => c!.toLowerCase().includes(search.toLowerCase()))
                      .map(c => {
                        // Find a member with this country to get the flag ISO code
                        const memberWithFlag = members.find(
                          m => m.flag && isoToCountryName[m.flag] === c
                        );

                        return (
                          <div
                            key={c}
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 gap-2"
                            onClick={() => {
                                setSearch(c!);
                                setShowDropdown(false); // close dropdown
                              }}
                          >
                            {memberWithFlag && (
                              <Flag
                                code={memberWithFlag.flag}
                                style={{ width: 21, height: 15, borderRadius: 4 }}
                              />
                            )}
                            <span>{c}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

        </div>
      </div>

      {/* Alphabet filter */}
      {view === 'alphabetical' && search === '' && (
        <div
          className="sticky z-[30]  bg-[#FCFAF8] px-5 md:px-30 mx-auto mb-4 shadow-md transition-[top] duration-500 ease-in-out"
          style={{ top: `${(isScrollingUp ? baseHeight : 0) + navTop}px` }}
        >
          {/* Single layout with responsive adjustment */}
          <div
            className="flex flex-nowrap overflow-x-auto no-scrollbar py-2 gap-1 md:hidden scrollbar-hidden"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              whiteSpace: 'nowrap',
            }}
          >
            {alphanumeric.map((char) => {
              const isSelected = char === selectedAlpha;
              const hasMembers = (filteredGrouped[char] || []).length > 0;

              const commonProps = {
                id: `alpha-btn-${char}`,
                onClick: () => handleAlphaSelect(char),
                disabled: !hasMembers,
                style: { scrollSnapAlign: 'center' },
              };

              const disabledClasses = !hasMembers ? 'opacity-50 cursor-not-allowed' : 'hover:text-wfzo-gold-600 hover:bg-wfzo-gold-100';

              if (isSelected) {
                return (
                  <LightPressButton
                    key={char}
                    {...commonProps}
                    className={disabledClasses}
                    style={{padding: 0!}}
                  >
                    {char}
                  </LightPressButton>
                );
              }

              return (
                <LightButton
                  key={char}
                  {...commonProps}
                  className={`${disabledClasses}
                  
                font-source text-[#4D4D4D] rounded-[11px] px-3.5 py-1
    transition-all duration-300 ease-in-out text-sm md:text-base
    whitespace-nowrap flex-shrink-0 transform-none`
              }
                >
                  {char}
                </LightButton>
              );
            })}



          </div>
          <div
            className="hidden md:grid gap-2 py-2"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(30px, 1fr))' }}
          >
           {alphanumeric.map((char) => {
          const isSelected = char === selectedAlpha;
          const hasMembers = (filteredGrouped[char] || []).length > 0;

          const commonProps = {
            id: `alpha-btn-${char}`,
            onClick: () => handleAlphaSelect(char),
            disabled: !hasMembers,
            style: { scrollSnapAlign: 'center' },
          };

          const disabledClasses = !hasMembers ? 'opacity-50 cursor-not-allowed' : '';

          if (isSelected) {
            return (
              <LightPressButton
                key={char}
                {...commonProps}
                className={disabledClasses}
                style={{padding: 0!}}
              >
                {char}
              </LightPressButton>
            );
          }

          return (
            <LightButton
              key={char}
              {...commonProps}
              className={`${disabledClasses}
                font-source
          text-[#4D4D4D] rounded-[11px] px-0 py-0 
          hover:text-wfzo-gold-600
          hover:bg-wfzo-gold-100 hover:shadow-[0_4px_6px_rgba(0,0,0,0.15)] 
          transition-all duration-300 ease-in-out 
          text-sm md:text-base md:px-0 md:py-0 !p-0 
          whitespace-nowrap flex-shrink-0`
              }
                >
              {char}
            </LightButton>
          );
        })}


          </div>
        </div>
      )}
     
     {/* Results*/}

      <div ref={resultsContainerRef} >
        {view !== 'alphabetical' && (
        <div ref={mapContainerRef}>
        <MembersWorldwideLeaflet
          interactionMode="select"
          onSelectionChange={(sel) => {
            if (sel.type === 'continent') {
              setSearch(sel.label);
            } else {
              setSearch('');
            }
            const baseIndex = new Map<number | string, Member>();
            members.forEach((m) => baseIndex.set(m.id, m));
            setMapSelection({
              type: sel.type,
              label: sel.label,
              members: sel.members.map((m, idx) => {
                const ref = baseIndex.get(Number(m.id)) || baseIndex.get(m.id) || undefined;
                const mapMemberCountryCode = isMapRawMemberLike(m) ? m.countryCode : undefined;
                const mapMemberLogoUrl = isMapRawMemberLike(m) ? m.memberLogoUrl : undefined;
                return {
                  id: Number(m.id) || idx,
                  name: m.name,
                   slug: ref?.slug || m.name,
                  logo: mapMemberLogoUrl || ref?.logo || '/assets/fallback-logo.png',
                  flag: ref?.flag || mapMemberCountryCode || '/assets/globe.svg',
                  industries: ref?.industries || [],
                  countryName: isMapRawMemberLike(m) ? m.countryName : undefined,
                  countryCode: mapMemberCountryCode,
                };
              }),
            });
          }}
        />
         </div>
      )}

  
      <div className="w-full px-5 md:px-30 mx-auto font-source">
        {view === 'alphabetical' ? (
          <>
            {noResults ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <h3 className="text-xl font-bold mb-2">
                  {search
                    ? `No results for "${search}" found`
                    : selectedFilters.length > 0
                    ? `No results for "${selectedFilters.join(', ')}" found`
                    : 'No results found'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {search
                    ? 'Try searching for another term'
                    : selectedFilters.length > 0
                    ? 'Try selecting a different filter'
                    : 'Try adjusting your filters or search'}
                </p>
                <button
                  onClick={handleClickClearAll}
                  className="px-6 py-2 rounded-md text-white"
                  style={{ background: '#6A4E23' }}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                {visibleKeys.map((key, index) => {
                  const items = filteredGrouped[key].filter((m) => allFilteredMembers.includes(m));
                  if (items.length === 0) return null;
                  const isLastGroup = index === visibleKeys.length - 1;
                  return (
                    <div
                      key={key}
                      ref={(el) => {
                        sectionRefs.current[key] = el;
                      }}
                      data-key={key}
                      className="py-1 px-3"
                    >
                      <h3 className="text-lg font-bold mb-4">{key}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                        {items.map((m) => (
                          <Link key={m.id} href={`/${locale}/membership/members-directory/${m.slug}`}>
  <MemberCard member={m} />
</Link>
                        ))}
                      </div>
                      {!isLastGroup && <hr className="mt-6 border-gray-300" />}
                    </div>
                  );
                })}
                {hasMoreData && (
                  <button
                    onClick={handleLoadMore}
                    className="block mx-auto px-6 py-2 rounded-full font-medium text-white"
                    style={{ background: '#6A4E23' }}
                  >
                    Load More
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <div className="md:px-5">
            {(mapSelection.members.length > 0 || search.trim() !== '') && (
              <div className="mt-4">
                {mapSelection.type === 'continent' ? (
                  (() => {
                    const filtered = search.trim() !== '' ? applyFilters(members) : applyFilters(mapSelection.members);

                    const byCountry = filtered.reduce((acc: Record<string, Member[]>, m) => {
                      const c = m.countryName || (m.flag && isoToCountryName[m.flag]) || 'Unknown';
                      (acc[c] ||= []).push(m);
                      return acc;
                    }, {});
                    const entries = Object.entries(byCountry).sort((a, b) =>
                      a[0].localeCompare(b[0])
                    );
                    if (entries.length === 0)
                      return (
                        <p className="text-sm text-gray-500">
                          No members match the current filters.
                        </p>
                      );
                    return (
                      <>
                        {entries.map(([country, list], i) => (
                          <div key={country} className="overflow-hidden py-1 px-3">
                            <h3 className="text-lg font-bold mb-4">{country}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                              {list.map((m) => (
                               <Link key={m.id} href={`/${locale}/membership/members-directory/${m.slug}`}>
  <MemberCard member={m} />
</Link>
                              ))}
                            </div>
                            {i < entries.length - 1 && <hr className="mt-6 border-gray-300" />}
                          </div>
                        ))}
                      </>
                    );
                  })()
                ) : (
                  <>
                    {visibleKeys.map((key, index) => {
                      const activeMembers = search.trim() !== '' ? members : mapSelection.members;
                      const selectedIds = new Set(activeMembers.map((mm) => mm.id));
                      const items = filteredGrouped[key].filter((m) => selectedIds.has(m.id));
                      if (items.length === 0) return null;
                      const isLastGroup = index === visibleKeys.length - 1;
                      return (
                        <div
                          key={key}
                          data-key={`map-${key}`}
                          className="overflow-hidden py-1 px-3"
                        >
                          <h3 className="text-lg font-bold mb-4">{key}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                            {items.map((m) => (
                              <Link key={m.id} href={`/${locale}/membership/members-directory/${m.slug}`}>
  <MemberCard member={m} />
</Link>
                            ))}
                          </div>
                          {!isLastGroup && <hr className="mt-6 border-gray-300" />}
                        </div>
                      );
                    })}
                    {hasMoreData && (
                      <button
                        onClick={handleLoadMore}
                        className="block mx-auto px-6 py-2 rounded-full font-medium text-white"
                        style={{ background: '#6A4E23' }}
                      >
                        Load More
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
        {showBackToTop && (
                <VioletPressButton
                  onClick={() => {
                    if (headerRef.current) {
                      const offsetTop =
                        headerRef.current.getBoundingClientRect().top + window.pageYOffset - navTop;
                      window.scrollTo({ top: offsetTop - 40, behavior: 'smooth' });
                    }
                  }}
                  className="fixed bottom-6 right-6 z-50 flex items-center justify-center"
                >
                  <Image src="/assets/chevron_up.svg" alt="Up Arrow" width={24} height={24}/>
                  Back to top
                </VioletPressButton>
        )}
      </div>
    </div>
  );
}
