'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Tooltip,
  useMap,
  GeoJSON as RLGeoJSON,
  Rectangle,
} from 'react-leaflet';
import membersMapData from '@/shared/data/membersMapData.json';
import { buildCountryCentroidMap, lookupCountryCentroid } from '@/lib/utils/geo/centroid';
import type { FeatureCollection } from 'geojson';
import L, { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  // Accept both number and string ids coming from JSON; normalize later if needed
  id: number | string;
  name: string;
  address: string; // full textual address
  countryCode: string; // ISO2 (some data may have 3-letter codes; upstream should align)
  countryName: string;
  continent: string; // e.g. 'Europe'
  city?: string;
  memberLogoUrl?: string;
  /** Longitude, Latitude pair (stored as [lon, lat]) */
  coordinates: [number, number];
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
};

// (Legacy compatibility) original structure if passed in
type CountryMarkers = {
  country: string;
  code?: string;
  points: MarkerData[];
};

function toLatLng([lon, lat]: [number, number]): [number, number] {
  return [lat, lon];
}

const DEFAULT_CENTER: [number, number] = [10, 0]; // [lat, lon]

const getDefaultZoom = () => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  if (width < 640) return 1.5; // mobile
  if (width < 1024) return 2; // tablet
  if (width < 1440) return 2.4; // normal desktops
  return 3; // large monitors - zoom in a bit to avoid white space
};

// Simple hex darken utility (hex: #rrggbb or #rgb, factor <1 darkens)
function darken(hex: string, factor = 0.85) {
  const norm = hex.replace('#', '');
  if (![3, 6, 8].includes(norm.length)) return hex; // safety
  const full =
    norm.length === 3
      ? norm
          .split('')
          .map((c) => c + c)
          .join('')
      : norm.length === 8
        ? norm.slice(0, 6) // ignore alpha in darken calc
        : norm;
  const r = Math.round(parseInt(full.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(full.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(full.slice(4, 6), 16) * factor);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Centroid approximations for continents (lon, lat)
const CONTINENT_CENTROIDS: Record<string, [number, number]> = {
  Africa: [21.0936, 7.1881],
  Europe: [10, 50],
  'North America': [-100, 45],
  'South America': [-60, -15],
  Asia: [100, 35],
  Oceania: [134, -25],
  Antarctica: [0, -82],
};

// Provide a loose imported member shape for normalization
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

function normalizeImportedMembers(source: ImportedMember[]): Member[] {
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
}

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
  };
}

function mergeMembers(base: Member[], extra: Member[]): Member[] {
  const byKey = new Map<string, Member>();
  const add = (mem: Member) => {
    const key = String(mem.id ?? mem.name ?? mem.address ?? mem.countryName);
    if (!byKey.has(key)) {
      byKey.set(key, mem);
      return;
    }
    const existing = byKey.get(key)!;
    byKey.set(key, { ...existing, ...mem });
  };
  base.forEach(add);
  extra.forEach(add);
  return Array.from(byKey.values());
}

// Country centroids now resolved dynamically from world GeoJSON (loaded later)

function useZoomListener(onZoomEnd?: (z: number) => void) {
  const map = useMap();
  useEffect(() => {
    if (!onZoomEnd) return;
    const handler = () => onZoomEnd(map.getZoom());
    map.on('zoomend', handler);
    return () => {
      map.off('zoomend', handler);
    };
  }, [map, onZoomEnd]);
  return map;
}

function createPinIcon({ text, showNumber }: { text?: string; showNumber?: boolean }): DivIcon {
  const svg = `
  <svg width="32" height="48" viewBox="-16 -48 32 48" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,0 C 9,-12 12,-18 12,-24 A 12 12 0 1 0 -12,-24 C -12,-18 -9,-12 0,0 Z" fill="#684F31" />
    ${showNumber && text ? `<text x="0" y="-24" text-anchor="middle" dominant-baseline="middle" fill="#F8F5F1" font-size="12" font-weight="700" font-family="Source Sans 3">${text}</text>` : ''}
  </svg>`;
  return new DivIcon({
    html: svg,
    className: 'wfzo-pin-icon',
    iconSize: [32, 48],
    iconAnchor: [16, 0],
    // Bring tooltip closer (was -40). -30 keeps a small gap so it doesn't overlap the pin head.
    tooltipAnchor: [0, -30],
  });
}

export default function MembersWorldwideLeaflet({
  zoomDetailThreshold = 5, // deepest threshold for member pins
  countryZoomThreshold = 3.2, // between continent & member
  continentZoomThreshold = 2.9, // below this show continents only
  landFillColor = '#ebc443ff',
  landFillOpacity = 0.35,
  oceanFillColor = '#007bffff',
  oceanFillOpacity = 0.28,
  // Cast imported JSON to Member[] (we'll coerce coordinate arrays to tuples below)
  members: initialMembers = membersMapData as unknown as Member[],
  mobileMinZoom = 0,
  desktopMinZoom = 2.4,
  mobileFullScreen = true,
  headerSelector = 'header',
  desktopHeight = 616,
  englishBasemap = true,
  interactionMode = 'none',
  onSelectionChange,
}: {
  data?: CountryMarkers[];
  zoomDetailThreshold?: number;
  countryZoomThreshold?: number;
  continentZoomThreshold?: number;
  landFillColor?: string;
  landFillOpacity?: number;
  oceanFillColor?: string;
  oceanFillOpacity?: number;
  members?: Member[];
  mobileMinZoom?: number;
  desktopMinZoom?: number;
  mobileFullScreen?: boolean;
  headerSelector?: string;
  desktopHeight?: number; // px, from Figma ~616.57
  /** Use an English (Latin script) focused basemap (Carto light_all). */
  englishBasemap?: boolean;
  showCountryLabels?: boolean;
  /** Enable selection behavior for directory page */
  interactionMode?: 'none' | 'select';
  /** Callback when a marker selection (continent/country/member) is made */
  onSelectionChange?: (selection: {
    type: 'continent' | 'country' | 'member';
    label: string;
    members: Member[];
  }) => void;
}) {
  const [zoom, setZoom] = useState<number>(getDefaultZoom());
  const [initialZoom, setInitialZoom] = useState<number>(getDefaultZoom());
  const [isMobile, setIsMobile] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  // no need to keep center in state unless used by UI
  const mapRef = useRef<L.Map | null>(null);
  const [landGeo, setLandGeo] = useState<FeatureCollection | null>(null);
  const [countryCentroids, setCountryCentroids] = useState<Map<string, [number, number]>>(
    new Map()
  );
  // Geocoding removed; use coordinates provided in data
  const [membersWithCoords, setMembersWithCoords] = useState<Member[]>(() =>
    normalizeImportedMembers(initialMembers as unknown as ImportedMember[])
  );
  // Store API-provided aggregates
  const [apiContinentCounts, setApiContinentCounts] = useState<Record<string, number> | null>(null);
  const [apiCountryData, setApiCountryData] = useState<Array<{
    country: string;
    count: number;
    latitude?: number;
    longitude?: number;
  }> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMapData = async () => {
      try {
        const res = await fetch('/api/member/mapdata');
        if (!res.ok) return;
        const json = await res.json();
        
        // Extract continent counts
        if (json?.continentMemberCount) {
          setApiContinentCounts(json.continentMemberCount);
        }
        
        // Extract country data with coordinates
        if (Array.isArray(json?.countryMemberCount)) {
          setApiCountryData(json.countryMemberCount);
        }
        
        // Extract individual member data
        const apiList: ApiMember[] = Array.isArray(json?.companyMapData)
          ? json.companyMapData
          : [];
        if (apiList.length > 0) {
          const normalized = apiList.map((m, idx) => mapApiMemberToMember(m, idx));
          if (!isMounted) return;
          setMembersWithCoords((existing) => mergeMembers(existing, normalized));
        }
      } catch {
        // Swallow errors; fallback to bundled data.
      }
    };
    fetchMapData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Responsive detection & full-screen height for mobile
  useEffect(() => {
    const calc = () => {
      const mobile = window.innerWidth < 640; // Tailwind sm breakpoint
      setIsMobile(mobile);
      if (mobile && mobileFullScreen) {
        const vh = window.innerHeight;
        let headerOffset = 0;
        const headerEl = document.querySelector(headerSelector) as HTMLElement | null;
        if (headerEl) headerOffset = headerEl.getBoundingClientRect().height;
        else headerOffset = 64; // fallback
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
  const [dynamicDesktopMinZoom, setDynamicDesktopMinZoom] = useState(() =>
    window.innerWidth > 1440 ? 3 : desktopMinZoom
  );

  useEffect(() => {
    const updateMinZoomBasedOnSize = () => {
      if (window.innerWidth > 1440) {
        setDynamicDesktopMinZoom(3);
      } else {
        setDynamicDesktopMinZoom(desktopMinZoom);
      }
    };

    // Initialize
    updateMinZoomBasedOnSize();

    // Listen for resize
    window.addEventListener('resize', updateMinZoomBasedOnSize);
    return () => window.removeEventListener('resize', updateMinZoomBasedOnSize);
  }, [desktopMinZoom]);

  // Clamp min zoom (Leaflet typically supports 0 as farthest zoom-out for global tiles)
  const effectiveMinZoomRaw = isMobile ? mobileMinZoom : dynamicDesktopMinZoom;
  const effectiveMinZoom = Math.max(0, effectiveMinZoomRaw);

  // (Geocoding logic removed)

  // Demo dataset — can be replaced by `data` prop from CMS
  // Removed legacy demo country dataset (hierarchical member-based aggregation in use)

  // Build hierarchy from members (geocodedMembers state used)
  const membersList = membersWithCoords;

  // Country level aggregation - use API data if available, otherwise calculate from members
  const countryAggregates = useMemo(() => {
    if (apiCountryData) {
      return apiCountryData
        .filter((c) => c.latitude !== undefined && c.longitude !== undefined)
        .map((c) => ({
          countryKey: c.country,
          label: c.country,
          count: c.count,
          coordinates: [c.longitude!, c.latitude!] as [number, number],
        }));
    }
    // Fallback to client-side calculation
    const byCountry: Record<
      string,
      { count: number; lon: number; lat: number; haveCoords: number; name: string; code: string }
    > = {};
    membersList.forEach((m) => {
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
          const found = lookupCountryCentroid(countryCentroids, { iso2: v.code, name: v.name });
          if (found) coords = found;
        }
        return { countryKey: v.code, label: v.name, count: v.count, coordinates: coords };
      })
      .filter((c) => Array.isArray(c.coordinates));
  }, [apiCountryData, membersList, countryCentroids]);

  // Continent aggregation - use API data if available, otherwise calculate from members
  const continentAggregates = useMemo(() => {
    if (apiContinentCounts) {
      return Object.entries(apiContinentCounts).map(([continent, count]) => {
        const centroid = CONTINENT_CENTROIDS[continent] || [0, 0];
        return { label: continent, count, coordinates: centroid as [number, number] };
      });
    }
    // Fallback to client-side calculation
    const byContinent: Record<string, { count: number }> = {};
    membersList.forEach((m) => {
      if (!byContinent[m.continent]) byContinent[m.continent] = { count: 0 };
      byContinent[m.continent].count += 1;
    });
    return Object.entries(byContinent).map(([continent, v]) => {
      const centroid = CONTINENT_CENTROIDS[continent] || [0, 0];
      return { label: continent, count: v.count, coordinates: centroid as [number, number] };
    });
  }, [apiContinentCounts, membersList]);

  const memberMarkers: MarkerData[] = useMemo(() => {
    const list: MarkerData[] = [];
    membersList.forEach((m) => {
      const coords: [number, number] | undefined = m.coordinates;
      //if (!coords && m.city && CITY_CENTROIDS[m.city]) coords = CITY_CENTROIDS[m.city];
      if (coords) {
        list.push({
          coordinates: coords,
          count: 1, // still matches MarkerData (number|string)
          label: m.name,
          meta: { city: m.city, country: m.countryName, address: m.address },
        });
      }
    });
    return list;
  }, [membersList]);

  const level: 'continent' | 'country' | 'member' =
    zoom < continentZoomThreshold
      ? 'continent'
      : zoom < countryZoomThreshold
        ? 'continent' // still continent until a bit closer
        : zoom < zoomDetailThreshold
          ? 'country'
          : 'member';

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
    // member level: if we have zero member markers yet (geocoding not finished) fall back to country markers so pins don't disappear
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

  const handleMarkerClick = useCallback(
    (m: MarkerData) => {
      if (!mapRef.current) return;
      // Selection logic (directory usage) executed before zooming
      if (interactionMode === 'select' && onSelectionChange) {
        if (level === 'continent') {
          const continentMembers = membersList.filter((mem) => mem.continent === m.label);
          onSelectionChange({ type: 'continent', label: m.label || '', members: continentMembers });
        } else if (level === 'country') {
          const countryMembers = membersList.filter(
            (mem) => mem.countryName === m.label || mem.countryCode === m.label
          );
          onSelectionChange({ type: 'country', label: m.label || '', members: countryMembers });
        } else if (level === 'member') {
          const member = membersList.find((mem) => mem.name === m.label);
          onSelectionChange({
            type: 'member',
            label: m.label || '',
            members: member ? [member] : [],
          });
        }
      }
      // Auto-zoom on marker click disabled per requirement.
    },
    [level, interactionMode, onSelectionChange, membersList]
  );

  const formatCompanies = (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`;

  // Use MapTiler outdoor-v4 tiles like the atlas page
  const tileUrl = `https://api.maptiler.com/maps/outdoor-v4/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;

  // Adjust overlays for contrast with MapTiler outdoor-v4 basemap
  // const adjustedLandFillOpacity = Math.min(landFillOpacity + 0.1, 1);
  // const adjustedOceanFillOpacity = Math.min(oceanFillOpacity + 0.1, 0.2);
  // const adjustedLandFillColor = darken(landFillColor, 0.95);
  //const adjustedOceanFillColor = englishBasemap ? darken(oceanFillColor, 0.2) : oceanFillColor;
  // Use one unified color for background + ocean overlay to avoid flicker of different blues during zoom transitions
  //const unifiedOceanColor = adjustedOceanFillColor;

  const handleReset = () => {
    const map = mapRef.current;
    if (map) {
      map.setView(DEFAULT_CENTER, initialZoom);
    }
  };

  // Load world countries GeoJSON once (client-side) to tint land only
  useEffect(() => {
    let isMounted = true;
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then((r) => r.json())
      .then((json: FeatureCollection) => {
        if (!isMounted) return;
        setLandGeo(json);
        try {
          const centroidMap = buildCountryCentroidMap(json, {
            codePropertyCandidates: ['iso_a2', 'ISO_A2', 'iso2', 'code', 'wb_a2'],
            namePropertyCandidates: ['name', 'NAME', 'admin', 'ADMIN', 'country'],
          });
          setCountryCentroids(centroidMap);
        } catch {
          // centroid build optional
        }
      })
      .catch(() => {
        // swallow errors; overlay is optional
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Also update dynamically on resize
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
    <div className={`px-5 md:px-30`}>
      <div className="flex items-center gap-3 self-stretch">
        <div
          className="w-full h-[180px] sm:h-[260px] md:h-[460px] lg:h-[616px] rounded overflow-hidden shadow-xl bg-white relative"
        >
          {/* Zoom controls */}
          <div className="absolute right-4 top-4 z-[500] flex flex-col gap-2">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => mapRef.current?.zoomIn()}
              className="h-10 w-10 rounded-md bg-white/90 text-wfzo-grey-900 shadow hover:bg-white"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => mapRef.current?.zoomOut()}
              className="h-10 w-10 rounded-md bg-white/90 text-wfzo-grey-900 shadow hover:bg-white"
            >
              –
            </button>
            <button
              type="button"
              aria-label="Reset view"
              onClick={handleReset}
              className="h-10 w-10 rounded-md bg-white/90 text-wfzo-grey-900 shadow hover:bg-white"
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
            worldCopyJump={isMobile ? true : false}
            maxBoundsViscosity={isMobile ? 0 : 1}
            attributionControl={false}
            zoomControl={false}
            // Background matches the tinted ocean rectangle color to prevent a different shade appearing mid-zoom
            // style={{ zIndex: 0, background: oceanFillColor }}
            // {...(!isMobile
            //   ? {
            //       maxBounds: [
            //         [-85, -180],
            //         [85, 180],
            //       ] as [[number, number], [number, number]],
            //     }
            //   : {})}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
              url={tileUrl}
              noWrap={true}
            />

            {/* Optional: tint ocean using a rectangle overlay */}
            {/* <OceanTintOverlay color={oceanFillColor} opacity={adjustedOceanFillOpacity} /> */}

            {/* Optional: tint land areas only using a GeoJSON overlay in a custom pane */}
            {/* {landGeo && (
              <LandTintOverlay
                data={landGeo}
                color={adjustedLandFillColor}
                opacity={adjustedLandFillOpacity}
              />
            )} */}

            {/* Bind map ref and initialize zoom */}
            <MapRefBinder
              onInit={(map) => {
                mapRef.current = map;
                setZoom(map.getZoom());
              }}
            />

            {/* Update zoom state on changes (no-op render) */}
            <MapZoomSync onZoomEnd={(z) => setZoom(z)} />

            {markersToRender.map((m, idx) => {
              const num = typeof m.count === 'number' ? m.count : Number(m.count) || 0;
              const showNumber = level !== 'member';
              const icon = createPinIcon({
                text: showNumber ? String(num) : undefined,
                showNumber,
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
                    // Smaller offset so tooltip sits just above the pin
                    offset={[0, 10]}
                    opacity={0.95}
                    className="!bg-white !text-[#8B6941] !font-semibold !rounded-md !py-1.5 !px-2 shadow"
                  >
                    {level === 'member'
                      ? (() => {
                          const locParts: string[] = [];
                          if (m.meta?.city) locParts.push(m.meta.city);
                          if (m.meta?.country && !locParts.includes(m.meta.country))
                            locParts.push(m.meta.country);
                          // fallback to address if no city/country combination could be formed
                          const location = locParts.length
                            ? locParts.join(', ')
                            : m.meta?.address || '';
                          return `${m.label}${location ? ' • ' + location : ''}`;
                        })()
                      : `${m.label || ''} • ${formatCompanies(num)}`}
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

function MapZoomSync({ onZoomEnd }: { onZoomEnd?: (z: number) => void }) {
  useZoomListener(onZoomEnd);
  return null;
}

function MapRefBinder({ onInit }: { onInit?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onInit?.(map);
    // we only need to run on mount or when map instance changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

function LandTintOverlay({
  data,
  color,
  opacity = 0.18,
}: {
  data: FeatureCollection;
  color: string;
  opacity?: number;
}) {
  const map = useMap();
  const [paneReady, setPaneReady] = useState(false);
  useEffect(() => {
    // Create a custom pane above tiles to apply blend mode only to land polygons
    const paneName = 'land-tint';
    let pane = map.getPane(paneName);
    if (!pane) {
      map.createPane(paneName);
      pane = map.getPane(paneName)!;
      pane.style.pointerEvents = 'none'; // let interactions pass through
      pane.style.zIndex = '350'; // above tiles (tile pane is 200)
    }
    setPaneReady(true);
  }, [map]);

  if (!paneReady) return null;
  return (
    <RLGeoJSON
      data={data}
      pane="land-tint"
      style={{ fillColor: color, fillOpacity: opacity, color: 'transparent', weight: 0 }}
      interactive={false}
    />
  );
}

function OceanTintOverlay({ color, opacity = 0.26 }: { color: string; opacity?: number }) {
  const map = useMap();
  const [paneReady, setPaneReady] = useState(false);
  useEffect(() => {
    const paneName = 'ocean-tint';
    let pane = map.getPane(paneName);
    if (!pane) {
      map.createPane(paneName);
      pane = map.getPane(paneName)!;
      pane.style.pointerEvents = 'none';
      pane.style.zIndex = '300'; // below land tint (350) but above tiles (200)
    }
    setPaneReady(true);
  }, [map]);

  if (!paneReady) return null;
  const bounds: [[number, number], [number, number]] = [
    [-85, -180],
    [85, 180],
  ];
  return (
    <Rectangle
      pane="ocean-tint"
      bounds={bounds}
      pathOptions={{ fillColor: color, fillOpacity: opacity, color: 'transparent' }}
      interactive={false}
    />
  );
}
