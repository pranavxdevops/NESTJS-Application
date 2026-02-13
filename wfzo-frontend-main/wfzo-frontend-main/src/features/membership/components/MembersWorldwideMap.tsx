'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import membersMapData from '@/shared/data/membersMapData.json';
import { buildCountryCentroidMap, lookupCountryCentroid } from '@/lib/utils/geo/centroid';
import type { FeatureCollection } from 'geojson';
import L, { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ============================================================================
// TYPES
// ============================================================================

interface MarkerMeta {
  city?: string;
  country?: string;
  address?: string;
}

type MarkerData = {
  coordinates: [number, number]; // [lon, lat]
  count: number | string;
  label?: string;
  meta?: MarkerMeta;
};

type Member = {
  id: number | string;
  name: string;
  address: string;
  countryCode: string;
  countryName: string;
  continent: string;
  city?: string;
  coordinates: [number, number];
};

type ThemeMode = 'light' | 'dark';
type AggregationLevel = 'continent' | 'country' | 'member';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CENTER: [number, number] = [10, 0]; // [lat, lon]

const CONTINENT_CENTROIDS: Record<string, [number, number]> = {
  Africa: [21.0936, 7.1881],
  Europe: [10, 50],
  'North America': [-100, 45],
  'South America': [-60, -15],
  Asia: [100, 35],
  Oceania: [134, -25],
  Antarctica: [0, -82],
};

// Theme configurations
const THEMES = {
  light: {
    tileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    backgroundColor: '#a8c5d8',
    pinColor: '#684F31',
    pinTextColor: '#F8F5F1',
    tooltipBg: '#ffffff',
    tooltipText: '#8B6941',
  },
  dark: {
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    backgroundColor: '#0d1117',
    pinColor: '#fbbf24',
    pinTextColor: '#1a1a1a',
    tooltipBg: '#1f2937',
    tooltipText: '#fbbf24',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function toLatLng([lon, lat]: [number, number]): [number, number] {
  return [lat, lon];
}

function getDefaultZoom(): number {
  if (typeof window === 'undefined') return 2.4;
  const width = window.innerWidth;
  if (width < 640) return 1.5;
  if (width < 1024) return 2;
  if (width < 1440) return 2.4;
  return 3;
}

function createPinIcon({
  text,
  showNumber,
  theme,
}: {
  text?: string;
  showNumber?: boolean;
  theme: ThemeMode;
}): DivIcon {
  const colors = THEMES[theme];
  const svg = `
  <svg width="32" height="48" viewBox="-16 -48 32 48" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,0 C 9,-12 12,-18 12,-24 A 12 12 0 1 0 -12,-24 C -12,-18 -9,-12 0,0 Z" fill="${colors.pinColor}" stroke="${theme === 'dark' ? colors.pinTextColor : 'none'}" stroke-width="${theme === 'dark' ? '1' : '0'}" />
    ${showNumber && text ? `<text x="0" y="-24" text-anchor="middle" dominant-baseline="middle" fill="${colors.pinTextColor}" font-size="12" font-weight="700" font-family="Source Sans 3">${text}</text>` : ''}
  </svg>`;
  return new DivIcon({
    html: svg,
    className: 'wfzo-pin-icon',
    iconSize: [32, 48],
    iconAnchor: [16, 0],
    tooltipAnchor: [0, -30],
  });
}

// ============================================================================
// HOOKS
// ============================================================================

function useResponsive(mobileFullScreen: boolean, headerSelector: string) {
  const [isMobile, setIsMobile] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  useEffect(() => {
    const calc = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile && mobileFullScreen) {
        const vh = window.innerHeight;
        const headerEl = document.querySelector(headerSelector) as HTMLElement | null;
        const headerOffset = headerEl?.getBoundingClientRect().height || 64;
        setContainerHeight(vh - headerOffset - 8);
      } else {
        setContainerHeight(null);
      }
    };
    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('orientationchange', calc);
    return () => {
      window.removeEventListener('resize', calc);
      window.removeEventListener('orientationchange', calc);
    };
  }, [mobileFullScreen, headerSelector]);

  return { isMobile, containerHeight };
}

function useCountryCentroids() {
  const [centroids, setCentroids] = useState<Map<string, [number, number]>>(new Map());

  useEffect(() => {
    let isMounted = true;
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then((r) => r.json())
      .then((json: FeatureCollection) => {
        if (!isMounted) return;
        try {
          const centroidMap = buildCountryCentroidMap(json, {
            codePropertyCandidates: ['iso_a2', 'ISO_A2', 'iso2', 'code', 'wb_a2'],
            namePropertyCandidates: ['name', 'NAME', 'admin', 'ADMIN', 'country'],
          });
          setCentroids(centroidMap);
        } catch {
          // Optional feature, fail silently
        }
      })
      .catch(() => {
        // Network error, fail silently
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return centroids;
}

// ============================================================================
// MEMBER DATA AGGREGATION
// ============================================================================

function useNormalizedMembers(initialMembers: Member[]): Member[] {
  return useMemo(() => {
    interface ImportedMember {
      id?: number | string;
      name: string;
      address: string;
      countryCode: string;
      countryName: string;
      continent: string;
      city?: string;
      coordinates: number[];
    }
    const source = initialMembers as unknown as ImportedMember[];
    return source.map((m, idx) => {
      const coordsArray = Array.isArray(m.coordinates) ? m.coordinates : [0, 0];
      const tuple: [number, number] = [Number(coordsArray[0]) || 0, Number(coordsArray[1]) || 0];
      return {
        id: m.id ?? idx + 1,
        name: m.name,
        address: m.address,
        countryCode: m.countryCode,
        countryName: m.countryName,
        continent: m.continent,
        city: m.city,
        coordinates: tuple,
      };
    });
  }, [initialMembers]);
}

function useCountryAggregates(members: Member[], centroids: Map<string, [number, number]>) {
  return useMemo(() => {
    const byCountry: Record<
      string,
      { count: number; lon: number; lat: number; haveCoords: number; name: string; code: string }
    > = {};
    members.forEach((m) => {
      const code = m.countryCode || m.countryName;
      if (!byCountry[code])
        byCountry[code] = { count: 0, lon: 0, lat: 0, haveCoords: 0, name: m.countryName, code };
      byCountry[code].count += 1;
      if (m.coordinates) {
        byCountry[code].lon += m.coordinates[0];
        byCountry[code].lat += m.coordinates[1];
        byCountry[code].haveCoords += 1;
      }
    });
    return Object.values(byCountry)
      .map((v) => {
        let coords: [number, number] | null = null;
        if (v.haveCoords) {
          coords = [v.lon / v.haveCoords, v.lat / v.haveCoords];
        } else {
          const found = lookupCountryCentroid(centroids, { iso2: v.code, name: v.name });
          if (found) coords = found;
        }
        return { countryKey: v.code, label: v.name, count: v.count, coordinates: coords };
      })
      .filter((c) => Array.isArray(c.coordinates));
  }, [members, centroids]);
}

function useContinentAggregates(members: Member[]) {
  return useMemo(() => {
    const byContinent: Record<string, { count: number }> = {};
    members.forEach((m) => {
      if (!byContinent[m.continent]) byContinent[m.continent] = { count: 0 };
      byContinent[m.continent].count += 1;
    });
    return Object.entries(byContinent).map(([continent, v]) => {
      const centroid = CONTINENT_CENTROIDS[continent] || [0, 0];
      return { label: continent, count: v.count, coordinates: centroid as [number, number] };
    });
  }, [members]);
}

function useMemberMarkers(members: Member[]): MarkerData[] {
  return useMemo(() => {
    const list: MarkerData[] = [];
    members.forEach((m) => {
      const coords = m.coordinates;
      if (coords) {
        list.push({
          coordinates: coords,
          count: 1,
          label: m.name,
          meta: { city: m.city, country: m.countryName, address: m.address },
        });
      }
    });
    return list;
  }, [members]);
}

// ============================================================================
// MAP COMPONENTS
// ============================================================================

function MapRefBinder({ onInit }: { onInit?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onInit?.(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

function MapZoomSync({ onZoomEnd }: { onZoomEnd?: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onZoomEnd) return;
    const handler = () => onZoomEnd(map.getZoom());
    map.on('zoomend', handler);
    return () => {
      map.off('zoomend', handler);
    };
  }, [map, onZoomEnd]);
  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MembersWorldwideMap({
  members: initialMembers = membersMapData as unknown as Member[],
  theme = 'light',
  zoomDetailThreshold = 5,
  countryZoomThreshold = 3.2,
  continentZoomThreshold = 2.9,
  mobileMinZoom = 0,
  desktopMinZoom = 2.4,
  mobileFullScreen = true,
  headerSelector = 'header',
  interactionMode = 'none',
  onSelectionChange,
}: {
  members?: Member[];
  theme?: ThemeMode;
  zoomDetailThreshold?: number;
  countryZoomThreshold?: number;
  continentZoomThreshold?: number;
  mobileMinZoom?: number;
  desktopMinZoom?: number;
  mobileFullScreen?: boolean;
  headerSelector?: string;
  interactionMode?: 'none' | 'select';
  onSelectionChange?: (selection: {
    type: AggregationLevel;
    label: string;
    members: Member[];
  }) => void;
}) {
  const [zoom, setZoom] = useState<number>(getDefaultZoom());
  const [initialZoom, setInitialZoom] = useState<number>(getDefaultZoom());
  const mapRef = useRef<L.Map | null>(null);

  const { isMobile } = useResponsive(mobileFullScreen, headerSelector);
  const centroids = useCountryCentroids();
  const members = useNormalizedMembers(initialMembers);
  const countryAggregates = useCountryAggregates(members, centroids);
  const continentAggregates = useContinentAggregates(members);
  const memberMarkers = useMemberMarkers(members);

  // Dynamic min zoom based on screen size
  const [dynamicDesktopMinZoom, setDynamicDesktopMinZoom] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth > 1440 ? 3 : desktopMinZoom
  );

  useEffect(() => {
    const updateMinZoom = () => {
      setDynamicDesktopMinZoom(window.innerWidth > 1440 ? 3 : desktopMinZoom);
    };
    updateMinZoom();
    window.addEventListener('resize', updateMinZoom);
    return () => window.removeEventListener('resize', updateMinZoom);
  }, [desktopMinZoom]);

  const effectiveMinZoom = Math.max(0, isMobile ? mobileMinZoom : dynamicDesktopMinZoom);

  // Determine aggregation level based on zoom
  const level: AggregationLevel =
    zoom < continentZoomThreshold
      ? 'continent'
      : zoom < countryZoomThreshold
        ? 'continent'
        : zoom < zoomDetailThreshold
          ? 'country'
          : 'member';

  // Select markers to render based on level
  const markersToRender: MarkerData[] = useMemo(() => {
    if (level === 'continent') {
      return continentAggregates.map((c) => ({
        coordinates: c.coordinates,
        count: c.count,
        label: c.label,
      }));
    }
    if (level === 'country') {
      const countries = countryAggregates.filter(
        (c) => c.coordinates && !(c.coordinates[0] === 0 && c.coordinates[1] === 0)
      );
      return countries.map((c) => ({
        coordinates: c.coordinates as [number, number],
        count: c.count,
        label: c.label,
      }));
    }
    if (level === 'member' && memberMarkers.length === 0) {
      const countries = countryAggregates.filter(
        (c) => c.coordinates && !(c.coordinates[0] === 0 && c.coordinates[1] === 0)
      );
      return countries.map((c) => ({
        coordinates: c.coordinates as [number, number],
        count: c.count,
        label: c.label,
      }));
    }
    return memberMarkers;
  }, [level, continentAggregates, countryAggregates, memberMarkers]);

  // Handle marker clicks
  const handleMarkerClick = useCallback(
    (m: MarkerData) => {
      if (!mapRef.current || interactionMode !== 'select' || !onSelectionChange) return;

      if (level === 'continent') {
        const continentMembers = members.filter((mem) => mem.continent === m.label);
        onSelectionChange({ type: 'continent', label: m.label || '', members: continentMembers });
      } else if (level === 'country') {
        const countryMembers = members.filter(
          (mem) => mem.countryName === m.label || mem.countryCode === m.label
        );
        onSelectionChange({ type: 'country', label: m.label || '', members: countryMembers });
      } else if (level === 'member') {
        const member = members.find((mem) => mem.name === m.label);
        onSelectionChange({
          type: 'member',
          label: m.label || '',
          members: member ? [member] : [],
        });
      }
    },
    [level, interactionMode, onSelectionChange, members]
  );

  const handleReset = () => {
    if (mapRef.current) {
      mapRef.current.setView(DEFAULT_CENTER, initialZoom);
    }
  };

  const formatCount = (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`;

  const themeColors = THEMES[theme];

  // Update zoom on resize
  useEffect(() => {
    const handleResize = () => {
      const newZoom = getDefaultZoom();
      setZoom(newZoom);
      setInitialZoom(newZoom);
      if (mapRef.current) mapRef.current.setZoom(newZoom);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="px-5 md:px-30">
      <div className="flex items-center gap-3 self-stretch">
        <div className="w-full h-[180px] sm:h-[260px] md:h-[460px] lg:h-[616px] rounded overflow-hidden shadow-xl relative">
          {/* Zoom controls */}
          <div className="absolute right-4 top-4 z-[500] flex flex-col gap-2">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => mapRef.current?.zoomIn()}
              className={`h-10 w-10 rounded-md shadow hover:opacity-90 transition-opacity ${
                theme === 'dark'
                  ? 'bg-zinc-800/90 text-white hover:bg-zinc-800'
                  : 'bg-[#030303ff]/90 text-white hover:bg-[#030303ff]'
              }`}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => mapRef.current?.zoomOut()}
              className={`h-10 w-10 rounded-md shadow hover:opacity-90 transition-opacity ${
                theme === 'dark'
                  ? 'bg-zinc-800/90 text-white hover:bg-zinc-800'
                  : 'bg-[#030303ff]/90 text-white hover:bg-[#030303ff]'
              }`}
            >
              –
            </button>
            <button
              type="button"
              aria-label="Reset view"
              onClick={handleReset}
              className={`h-10 w-10 rounded-md shadow hover:opacity-90 transition-opacity ${
                theme === 'dark'
                  ? 'bg-zinc-800/90 text-white hover:bg-zinc-800'
                  : 'bg-[#030303ff]/90 text-white hover:bg-[#030303ff]'
              }`}
            >
              ⤾
            </button>
          </div>

          <MapContainer
            center={DEFAULT_CENTER}
            zoom={initialZoom}
            minZoom={effectiveMinZoom}
            maxZoom={12}
            maxBounds={[[-90, -180], [90, 180]]}
            className="w-full h-full relative z-10"
            worldCopyJump={isMobile}
            maxBoundsViscosity={isMobile ? 0 : 1}
            attributionControl={false}
            zoomControl={false}
            // style={{ zIndex: 0, background: themeColors.backgroundColor }}
            // {...(!isMobile
            //   ? {
            //       maxBounds: [
            //         [-85, -180],
            //         [85, 180],
            //       ] as [[number, number], [number, number]],
            //     }
            //   : {})}
          >
            <TileLayer url={themeColors.tileUrl} noWrap={true} />

            <MapRefBinder
              onInit={(map) => {
                mapRef.current = map;
                setZoom(map.getZoom());
              }}
            />

            <MapZoomSync onZoomEnd={(z) => setZoom(z)} />

            {markersToRender.map((m, idx) => {
              const num = typeof m.count === 'number' ? m.count : Number(m.count) || 0;
              const showNumber = level !== 'member';
              const icon = createPinIcon({
                text: showNumber ? String(num) : undefined,
                showNumber,
                theme,
              });
              return (
                <LeafletMarker
                  key={idx}
                  position={toLatLng(m.coordinates)}
                  icon={icon}
                  eventHandlers={{ click: () => handleMarkerClick(m) }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, 10]}
                    opacity={0.95}
                    className={`!rounded-md !py-1.5 !px-2 shadow ${
                      theme === 'dark'
                        ? '!bg-zinc-800 !text-amber-200 border !border-amber-900/30'
                        : '!bg-white !text-[#8B6941]'
                    }`}
                  >
                    {level === 'member'
                      ? (() => {
                          const locParts: string[] = [];
                          if (m.meta?.city) locParts.push(m.meta.city);
                          if (m.meta?.country && !locParts.includes(m.meta.country))
                            locParts.push(m.meta.country);
                          const location = locParts.length
                            ? locParts.join(', ')
                            : m.meta?.address || '';
                          return `${m.label}${location ? ' • ' + location : ''}`;
                        })()
                      : `${m.label || ''} • ${formatCount(num)}`}
                  </Tooltip>
                </LeafletMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
