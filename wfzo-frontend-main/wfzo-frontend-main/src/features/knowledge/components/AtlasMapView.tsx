'use client';

import { useEffect, useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Tooltip,
  Popup,
  useMap,
  GeoJSON as RLGeoJSON,
  Rectangle,
} from 'react-leaflet';
import { buildCountryCentroidMap, lookupCountryCentroid } from '@/lib/utils/geo/centroid';
import type { FeatureCollection } from 'geojson';
import L, { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { zoneTypeColors } from '../data/atlasData';

// Create dynamic color mapping based on organization types
const createMemberTypeColors = (organizationTypes: Array<{code: string, label: string}>): Record<string, string> => {
  const mapping: Record<string, string> = {};
  organizationTypes.forEach(type => {
    // Map organization type labels to colors
    const colorKey = Object.keys(zoneTypeColors).find(key =>
      key.toLowerCase().includes(type.label.toLowerCase().split(' ')[0]) ||
      type.label.toLowerCase().includes(key.toLowerCase().split(' ')[0])
    );
    mapping[type.code] = colorKey ? zoneTypeColors[colorKey as keyof typeof zoneTypeColors] : zoneTypeColors['Other Zone'];
  });
  mapping['N/A'] = zoneTypeColors['Other Zone'];
  return mapping;
};

interface MarkerMeta {
  city?: string;
  country?: string;
  address?: string;
  websiteUrl?: string;
  category?: string;
}

type MarkerData = {
  coordinates: [number, number]; // [lon, lat]
  count: number | string;
  label?: string;
  meta?: MarkerMeta;
  typeOfTheOrganization?: string;
};

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

function toLatLng([lon, lat]: [number, number]): [number, number] {
  return [lat, lon];
}

const DEFAULT_CENTER: [number, number] = [10, 0]; // [lat, lon]

const getDefaultZoom = () => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  if (width < 640) return 1.5; // mobile
  if (width < 1024) return 2; // tablet
  if (width < 1440) return 2.4; // normal desktops
  return 2.0; // large monitors - continent level
};

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
    tooltipAnchor: [0, -30],
  });
}

function createRoundIcon({ color }: { color: string }): DivIcon {
  const svg = `
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="6" r="6" fill="${color}" />
  </svg>`;
  return new DivIcon({
    html: svg,
    className: 'wfzo-round-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

const CONTINENT_CENTROIDS: Record<string, [number, number]> = {
  Africa: [21.0936, 7.1881],
  Europe: [10, 50],
  'North America': [-100, 45],
  'South America': [-60, -15],
  Asia: [100, 35],
  Oceania: [134, -25],
  Antarctica: [0, -82],
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

function ZoomListener({ onZoomEnd }: { onZoomEnd?: (z: number) => void }) {
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

const AtlasMapView = forwardRef<{
  zoomTo: (coordinates: [number, number], zoomLevel?: number) => void;
  fitToSearchResults: (members: Member[]) => void;
}, {
  zoomDetailThreshold?: number;
  countryZoomThreshold?: number;
  continentZoomThreshold?: number;
  members?: Member[];
  organizationTypes?: Array<{code: string, label: string}>;
  onMemberClick?: (member: Member) => void;
}>(function AtlasMapView({
  zoomDetailThreshold = 5,
  countryZoomThreshold = 3.2,
  continentZoomThreshold = 2.9,
  members = [],
  organizationTypes = [],
  onMemberClick,
}, ref) {
  const [zoom, setZoom] = useState<number>(getDefaultZoom());
  const [isMobile, setIsMobile] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [landGeo, setLandGeo] = useState<FeatureCollection | null>(null);
  const [countryCentroids, setCountryCentroids] = useState<Map<string, [number, number]>>(
    new Map()
  );
  const [initialZoom, setInitialZoom] = useState<number>(getDefaultZoom());

  // Store API data
  const [continentCounts, setContinentCounts] = useState<Record<string, number> | null>(null);
  const [countryData, setCountryData] = useState<Array<{
    country: string;
    count: number;
    latitude?: number;
    longitude?: number;
  }> | null>(null);
  const memberData = members;

  // Create dynamic color mapping
  const memberTypeColors = useMemo(() => createMemberTypeColors(organizationTypes), [organizationTypes]);

  // Fetch aggregate data once (assuming backend returns all data)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/member/mapdata');
        if (!res.ok) return;
        const json = await res.json();

        // Set aggregate data
        if (json.continentMemberCount) {
          setContinentCounts(json.continentMemberCount);
        }
        if (Array.isArray(json.countryMemberCount)) {
          setCountryData(json.countryMemberCount);
        }
      } catch (error) {
        console.error('Error fetching map data:', error);
      }
    };

    fetchData();
  }, []);

  // Responsive detection
  useEffect(() => {
    const calc = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile) {
        const vh = window.innerHeight;
        let headerOffset = 0;
        const headerEl = document.querySelector('header') as HTMLElement | null;
        if (headerEl) headerOffset = headerEl.getBoundingClientRect().height;
        else headerOffset = 64;
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
  }, []);

  const effectiveMinZoom = isMobile ? 0 : 2.4;

  // Build aggregations
  const continentAggregates = useMemo(() => {
    if (!continentCounts) return [];
    return Object.entries(continentCounts).map(([continent, count]) => {
      const centroid = CONTINENT_CENTROIDS[continent] || [0, 0];
      return { label: continent, count, coordinates: centroid as [number, number] };
    });
  }, [continentCounts]);

  const countryAggregates = useMemo(() => {
    if (!countryData) return [];
    return countryData
      .filter((c) => c.latitude !== undefined && c.longitude !== undefined)
      .map((c) => ({
        countryKey: c.country,
        label: c.country,
        count: c.count,
        coordinates: [c.longitude!, c.latitude!] as [number, number],
      }));
  }, [countryData]);

  const memberMarkers: MarkerData[] = useMemo(() => {
    return memberData.map((m) => ({
      coordinates: m.coordinates,
      count: 1,
      label: m.name,
      meta: { city: m.city, country: m.countryName, address: m.address, websiteUrl: m.websiteUrl, category: m.category },
      typeOfTheOrganization: m.typeOfTheOrganization,
    }));
  }, [memberData]);

  const level: 'continent' | 'country' | 'member' =
    zoom < continentZoomThreshold
      ? 'continent'
      : zoom < countryZoomThreshold
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
      return countryAggregates.map((c) => ({
        coordinates: c.coordinates,
        count: c.count,
        label: c.label,
      }));
    }
    return memberMarkers;
  }, [level, continentAggregates, countryAggregates, memberMarkers]);

  const handleMarkerClick = useCallback(
    (marker: MarkerData) => {
      // Only handle clicks for member level to enable zoom and modal
      if (level === 'member') {
        const member = memberData.find((m) => m.name === marker.label);
        if (member) {
          // Zoom to member's location at zoom level 12
          if (mapRef.current) {
            mapRef.current.setView(toLatLng(member.coordinates), 12);
          }
          // Display the information modal
          onMemberClick?.(member);
        }
      }
      // For continent and country levels, do nothing (no zoom or modal)
    },
    [level, memberData, onMemberClick]
  );

  // Expose zoomTo and fitToSearchResults functions to parent component
  useImperativeHandle(ref, () => ({
    zoomTo: (coordinates: [number, number], zoomLevel: number = 8) => {
      if (mapRef.current) {
        mapRef.current.setView(toLatLng(coordinates), zoomLevel);
      }
    },
    fitToSearchResults: (members: Member[]) => {
      if (mapRef.current && members.length > 0) {
        const bounds = L.latLngBounds(members.map(m => toLatLng(m.coordinates)));
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    },
  }), []);

  const handleReset = () => {
    const map = mapRef.current;
    if (map) {
      map.setView(DEFAULT_CENTER, initialZoom);
    }
  };

  return (
    <div style={{ width: '100%', height: containerHeight ? `${containerHeight}px` : '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .leaflet-control-attribution { display: none !important; }
        `
      }} />

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
        zoom={getDefaultZoom()}
        minZoom={effectiveMinZoom}
        maxZoom={16}
        className="w-full h-full relative z-10"
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
          url={`https://api.maptiler.com/maps/outdoor-v4/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`}
        />

        {markersToRender.map((marker, idx) => {
          const isMemberLevel = level === 'member';
          const color = isMemberLevel ? (memberTypeColors[marker.typeOfTheOrganization || ''] || '#684F31') : '#684F31';
          const icon = isMemberLevel
            ? createRoundIcon({ color })
            : createPinIcon({ text: String(marker.count), showNumber: true });

          return (
            <LeafletMarker
              key={`${marker.label}-${idx}`}
              position={toLatLng(marker.coordinates)}
              icon={icon}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            >
              {/* <Tooltip>{marker.label}</Tooltip> */}
            </LeafletMarker>
          );
        })}

        <ZoomListener onZoomEnd={setZoom} />
      </MapContainer>
    </div>
  );
});

export default AtlasMapView;