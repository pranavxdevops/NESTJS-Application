"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";

type MarkerData = {
  coordinates: [number, number]; // [lon, lat]
  count: number | string;
  label?: string; // company/country name
};

type CountryMarkers = {
  country: string;
  code?: string;
  points: MarkerData[];
};

const containerStyle: CSSProperties = {
  width: "100%",
  height: "100%",
};

const DEFAULT_CENTER = { lat: 10, lng: 0 };
const DEFAULT_ZOOM = 3; // Google Maps zoom scale

const WATER_LAND_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#B8D0FB" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#F4EEE7" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
];

export default function MembersWorldwideGoogleMap({
  apiKey,
  data,
  zoomDetailThreshold = 6,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  appearance = "default",
  showErrorUI = true,
}: {
  apiKey?: string;
  data?: CountryMarkers[];
  zoomDetailThreshold?: number; // when to switch from country pins to detailed pins
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  /**
   * default: native Google Maps look & controls
   * custom: WFZO-styled basemap with vignette and custom zoom controls
   */
  appearance?: "default" | "custom";
  /** When false, suppresses the red error block and shows the loading skeleton instead */
  showErrorUI?: boolean;
}) {
  const providedKey = (apiKey || (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string) || "").trim();
  const missingKey = !providedKey;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "wfzo-google-map",
    googleMapsApiKey: providedKey,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(initialCenter);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Demo dataset — replace with data prop if provided
  const demoData: CountryMarkers[] = [
    { country: "Brazil", points: [{ coordinates: [-51.9253, -14.235], count: 26, label: "Brazil" }] },
    { country: "Spain", points: [{ coordinates: [-3.7038, 40.4168], count: 8, label: "Spain" }] },
    {
      country: "UAE",
      points: [
        { coordinates: [55.2708, 25.2048], count: 4, label: "Dubai" },
        { coordinates: [54.3773, 24.4539], count: 3, label: "Abu Dhabi" },
      ],
    },
    {
      country: "India",
      points: [
        { coordinates: [77.209, 28.6139], count: 6, label: "Delhi" },
        { coordinates: [72.8777, 19.076], count: 4, label: "Mumbai" },
        { coordinates: [88.3639, 22.5726], count: 2, label: "Kolkata" },
      ],
    },
    {
      country: "Japan",
      points: [
        { coordinates: [139.6917, 35.6895], count: 3, label: "Tokyo" },
        { coordinates: [135.5022, 34.6937], count: 2, label: "Osaka" },
      ],
    },
    {
      country: "USA",
      points: [
        { coordinates: [-74.006, 40.7128], count: 6, label: "New York" },
        { coordinates: [-118.2437, 34.0522], count: 5, label: "Los Angeles" },
        { coordinates: [-87.6298, 41.8781], count: 3, label: "Chicago" },
      ],
    },
  ];

  const countryData = data && data.length ? data : demoData;

  // Aggregate to one pin per country (weighted by count) for low zoom
  const aggregatedMarkers = useMemo(() => {
    return countryData.map((c) => {
      if (!c.points.length) return { pos: { lat: 0, lng: 0 }, count: 0, label: c.country };
      let sumW = 0, lon = 0, lat = 0, totalCount = 0;
      for (const p of c.points) {
        const w = typeof p.count === "number" ? p.count : Number(p.count) || 1;
        sumW += w; lon += p.coordinates[0] * w; lat += p.coordinates[1] * w; totalCount += w;
      }
      const lng = sumW === 0 ? c.points[0].coordinates[0] : lon / sumW;
      const lt = sumW === 0 ? c.points[0].coordinates[1] : lat / sumW;
      return { pos: { lat: lt, lng }, count: totalCount, label: c.country };
    });
  }, [countryData]);

  const detailedMarkers = useMemo(() => {
    return countryData.flatMap((c) => c.points.map((p) => ({ pos: { lat: p.coordinates[1], lng: p.coordinates[0] }, count: p.count, label: p.label })));
  }, [countryData]);

  const showDetail = zoom >= zoomDetailThreshold;
  const markers = showDetail ? detailedMarkers : aggregatedMarkers;

  const formatCompanies = (n: number) => `${n} ${n === 1 ? "company" : "companies"}`;

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onIdle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const z = map.getZoom() ?? zoom;
    const c = map.getCenter();
    if (c) setCenter({ lat: c.lat(), lng: c.lng() });
    setZoom(z);
  }, [zoom]);

  const handleZoomIn = () => {
    const map = mapRef.current; if (!map) return; map.setZoom((map.getZoom() ?? zoom) + 1);
  };
  const handleZoomOut = () => {
    const map = mapRef.current; if (!map) return; map.setZoom((map.getZoom() ?? zoom) - 1);
  };
  const handleReset = () => {
    const map = mapRef.current; if (!map) return; map.setCenter(initialCenter); map.setZoom(initialZoom);
  };

  const PAN_THRESHOLD = 5; // below/equal this, disable dragging (custom look only)
  const options = useMemo<google.maps.MapOptions>(() => {
    if (appearance === "custom") {
      return {
        styles: WATER_LAND_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        draggable: zoom > PAN_THRESHOLD,
        restriction: {
          latLngBounds: { north: 80, south: -60, west: -170, east: 170 },
          strictBounds: false,
        },
        minZoom: 2,
        maxZoom: 18,
      };
    }
    // Default Google look & feel
    return {
      disableDefaultUI: false,
      zoomControl: true,
      fullscreenControl: true,
      mapTypeControl: true,
      streetViewControl: true,
      // leave styles undefined for native basemap
    } as google.maps.MapOptions;
  }, [appearance, zoom]);

  // Custom SVG path for a rounded-head pin
  const pinPath = "M0,0 C 9,-12 12,-18 12,-24 A 12 12 0 1 0 -12,-24 C -12,-18 -9,-12 0,0 Z";

  const pinIcon = useMemo<google.maps.Symbol | undefined>(() => {
    if (typeof window === "undefined" || !window.google) return undefined;
    const g = window.google;
    return {
      path: pinPath as unknown as google.maps.SymbolPath,
      fillColor: "#684F31",
      fillOpacity: 1,
      strokeOpacity: 0,
      scale: 1,
      anchor: new g.maps.Point(0, 0),
      labelOrigin: new g.maps.Point(0, -24),
    };
  }, []);

  const markerIcon = appearance === "custom" ? pinIcon : undefined;

  if ((loadError || missingKey) && showErrorUI) {
    const msg = missingKey
      ? "Google Maps API key is missing."
      : `Google Maps failed to load: ${loadError?.message || "Unknown error"}`;
    return (
      <div className="w-full px-[120px] py-10 pb-20 flex flex-col items-start gap-6">
        <h2 className="text-wfzo-grey-900 font-montserrat text-[32px] font-normal leading-10 self-stretch">Members Worldwide</h2>
        <div className="flex items-center gap-3 self-stretch">
          <div className="relative flex-1 h-[616px] rounded-sm bg-red-50 border border-red-200 text-red-800 p-6">
            <p className="font-semibold mb-2">{msg}</p>
            <ul className="list-disc ml-5 text-sm space-y-1">
              <li>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment (or pass apiKey prop).</li>
              <li>Enable Billing and the “Maps JavaScript API” for this key in Google Cloud Console.</li>
              <li>Under API key restrictions, allow HTTP referrers for your origin (e.g., http://localhost:3000/*).</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full px-[120px] py-10 pb-20 flex flex-col items-start gap-6">
        <h2 className="text-wfzo-grey-900 font-montserrat text-[32px] font-normal leading-10 self-stretch">Members Worldwide</h2>
        <div className="flex items-center gap-3 self-stretch">
          <div className="relative flex-1 h-[616px] rounded-sm bg-[#B8D0FB]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-[120px] py-10 pb-20 flex flex-col items-start gap-6">
      <h2 className="text-wfzo-grey-900 font-montserrat text-[32px] font-normal leading-10 self-stretch">Members Worldwide</h2>
      <div className="flex items-center gap-3 self-stretch">
        <div className="relative flex-1 h-[616px] rounded-sm overflow-hidden">
          {appearance === "custom" && (
            // Ocean/edge vignette overlay (custom look only)
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(201,219,255,0.35) 35%, rgba(141,177,246,0.35) 85%, rgba(111,149,232,0.45) 100%)" }}
            />
          )}

          {appearance === "custom" && (
            // Custom zoom buttons (hidden in default appearance which uses native controls)
            <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
              <button type="button" aria-label="Zoom in" onClick={handleZoomIn} className="h-10 w-10 rounded-md bg-white/90 text-wfzo-grey-900 shadow hover:bg-white">+</button>
              <button type="button" aria-label="Zoom out" onClick={handleZoomOut} className="h-10 w-10 rounded-md bg-white/90 text-wfzo-grey-900 shadow hover:bg-white">–</button>
              <button type="button" aria-label="Reset view" onClick={handleReset} className="h-10 w-10 rounded-md bg-white/90 text-wfzo-grey-900 shadow hover:bg-white">⤾</button>
            </div>
          )}

          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={zoom}
            onLoad={onLoad}
            onIdle={onIdle}
            options={options}
          >
            {markers.map((m, idx) => (
              <Marker
                key={idx}
                position={m.pos}
                icon={markerIcon}
                label={
                  appearance === "custom" && !showDetail
                    ? ({ text: String(m.count), color: "#F8F5F1", fontWeight: "700", fontSize: "12px" } as google.maps.MarkerLabel)
                    : undefined
                }
                onMouseOver={() => setHoveredIdx(idx)}
                onMouseOut={() => setHoveredIdx(null)}
              />
            ))}

            {hoveredIdx !== null && markers[hoveredIdx] && (
              <InfoWindow
                position={markers[hoveredIdx].pos}
                options={{ pixelOffset: new google.maps.Size(0, -36), disableAutoPan: true }}
                onCloseClick={() => setHoveredIdx(null)}
              >
                <div style={{ padding: 4 }}>
                  <span style={{ fontWeight: 600 }}>
                    {showDetail
                      ? markers[hoveredIdx].label || "Company"
                      : `${markers[hoveredIdx].label || ""} • ${formatCompanies(Number(markers[hoveredIdx].count) || 0)}`}
                  </span>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
}
