"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import maplibregl, { Map as MLMap, LngLatLike, Marker as MLMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type MarkerData = {
  coordinates: [number, number]; // [lon, lat]
  count: number | string;
  label?: string; // company/country name
};

// (empty)
type CountryMarkers = {
  country: string;
  code?: string;
  points: MarkerData[];
};

const containerStyle: CSSProperties = { width: "100%", height: "100%" };
const DEFAULT_CENTER: [number, number] = [0, 10]; // [lon, lat]
const DEFAULT_ZOOM = 2.5; // MapLibre zoom scale (roughly aligns with Google 3)

// Open-source tiles: CARTO Voyager (closer to Google light scheme) + country boundaries
const DEFAULT_STYLE = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
    // World mask polygon to enable an ocean darken overlay
    worldmask: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[
                [-180, -85],
                [180, -85],
                [180, 85],
                [-180, 85],
                [-180, -85]
              ]],
            },
          },
        ],
      },
    },
    countries: {
      type: "geojson",
      data: "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
      generateId: true,
    },
  },
  layers: [
    { id: "basemap", type: "raster", source: "basemap", minzoom: 0, maxzoom: 19 },
    // Ocean darken overlay (applies to entire world)
    {
      id: "ocean-darken",
      type: "fill",
      source: "worldmask",
      paint: {
        "fill-color": "#7FB1DA",
        "fill-opacity": 0.26,
      },
    },
    // Beige tint on land so countries retain beige look even with darker oceans
    {
      id: "land-beige",
      type: "fill",
      source: "countries",
      filter: ["!=", ["get", "name"], "Antarctica"],
      paint: {
        "fill-color": "#EDE3D1",
        "fill-opacity": 0.16,
      },
    },
    // Country fills for hover effect (transparent by default)
    {
      id: "country-fill",
      type: "fill",
      source: "countries",
      filter: ["!=", ["get", "name"], "Antarctica"],
      paint: {
        "fill-color": "#ecd998ff", // light blue similar to Google hover
        "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.28, 0],
      },
    },
    {
      id: "country-outline",
      type: "line",
      source: "countries",
      filter: ["!=", ["get", "name"], "Antarctica"],
      paint: {
        "line-color": "#B8C7D9",
        "line-width": 0.5,
        "line-opacity": 0.6,
      },
    },
  ],
} as const;

export default function MembersWorldwideMapLibre({
  data,
  zoomDetailThreshold = 5.5,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
}: {
  data?: CountryMarkers[];
  zoomDetailThreshold?: number;
  initialCenter?: [number, number];
  initialZoom?: number;
}) {
  const mapRef = useRef<MLMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<MLMarker[]>([]);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Demo dataset — replace with data prop if provided
  const demoData: CountryMarkers[] = [
    { country: "Brazil", points: [{ coordinates: [-51.9253, -14.235], count: 26, label: "Brazil" }] },
    { country: "Spain", points: [{ coordinates: [-3.7038, 40.4168], count: 8, label: "Spain" }] },
    { country: "UAE", points: [
      { coordinates: [55.2708, 25.2048], count: 4, label: "Dubai" },
      { coordinates: [54.3773, 24.4539], count: 3, label: "Abu Dhabi" },
    ]},
    { country: "India", points: [
      { coordinates: [77.209, 28.6139], count: 6, label: "Delhi" },
      { coordinates: [72.8777, 19.076], count: 4, label: "Mumbai" },
      { coordinates: [88.3639, 22.5726], count: 2, label: "Kolkata" },
    ]},
    { country: "Japan", points: [
      { coordinates: [139.6917, 35.6895], count: 3, label: "Tokyo" },
      { coordinates: [135.5022, 34.6937], count: 2, label: "Osaka" },
    ]},
    { country: "USA", points: [
      { coordinates: [-74.006, 40.7128], count: 6, label: "New York" },
      { coordinates: [-118.2437, 34.0522], count: 5, label: "Los Angeles" },
      { coordinates: [-87.6298, 41.8781], count: 3, label: "Chicago" },
    ]},
  ];

  const countryData = data && data.length ? data : demoData;

  // Aggregate to one pin per country (weighted by count) for low zoom
  const aggregatedMarkers = useMemo(() => countryData.map((c) => {
    if (!c.points.length) return { pos: [0, 0] as [number, number], count: 0, label: c.country };
    let sumW = 0, lon = 0, lat = 0, totalCount = 0;
    for (const p of c.points) {
      const w = typeof p.count === "number" ? p.count : Number(p.count) || 1;
      sumW += w; lon += p.coordinates[0] * w; lat += p.coordinates[1] * w; totalCount += w;
    }
    const lng = sumW === 0 ? c.points[0].coordinates[0] : lon / sumW;
    const lt = sumW === 0 ? c.points[0].coordinates[1] : lat / sumW;
    return { pos: [lng, lt] as [number, number], count: totalCount, label: c.country };
  }), [countryData]);

  const detailedMarkers = useMemo(() => countryData.flatMap((c) => c.points.map((p) => ({
    pos: [p.coordinates[0], p.coordinates[1]] as [number, number],
    count: p.count,
    label: p.label,
  }))), [countryData]);

  const showDetail = zoom >= zoomDetailThreshold;
  const markers = showDetail ? detailedMarkers : aggregatedMarkers;

  // Create a simple pin element
  const makePin = (m: { pos: [number, number]; count: number | string; label?: string }, showCount: boolean) => {
    const el = document.createElement("div");
    el.style.width = "24px";
    el.style.height = "24px";
    el.style.borderRadius = "12px 12px 0 0"; // rounded top
    el.style.background = "#684F31";
    el.style.transform = "translate(-50%, -100%)";
    el.style.position = "relative";
    el.style.boxShadow = "0 1px 2px rgba(0,0,0,0.25)";
    if (showCount) {
      const label = document.createElement("span");
      label.textContent = String(m.count);
      label.style.position = "absolute";
      label.style.color = "#F8F5F1";
      label.style.fontSize = "12px";
      label.style.fontWeight = "700";
      label.style.left = "50%";
      label.style.top = "-18px";
      label.style.transform = "translateX(-50%)";
      el.appendChild(label);
    }
    return el;
  };

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_STYLE as unknown as string | maplibregl.StyleSpecification,
      center: initialCenter as LngLatLike,
      zoom: initialZoom,
      attributionControl: true,
      renderWorldCopies: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    mapRef.current = map;

    // Hover highlight setup (after style loads)
    let hoveredId: string | number | null = null;
    const onCountryMouseMove = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || !e.features.length) return;
      const f = e.features[0];
      const id = (f.id as string | number | undefined) ?? null;
      if (hoveredId !== null) {
        map.setFeatureState({ source: "countries", id: hoveredId }, { hover: false });
      }
      if (id !== null) {
        map.setFeatureState({ source: "countries", id }, { hover: true });
        hoveredId = id;
      }
      map.getCanvas().style.cursor = "pointer";
    };
    const onCountryMouseLeave = () => {
      if (hoveredId !== null) {
        map.setFeatureState({ source: "countries", id: hoveredId }, { hover: false });
        hoveredId = null;
      }
      map.getCanvas().style.cursor = "";
    };
    map.on("load", () => {
      map.on("mousemove", "country-fill", onCountryMouseMove);
      map.on("mouseleave", "country-fill", onCountryMouseLeave);
    });

    const onMoveEnd = () => {
  const z = map.getZoom();
  setZoom(z);
  // center kept internal; not exposed yet
    };
    map.on("moveend", onMoveEnd);
    return () => {
  map.off("mousemove", "country-fill", onCountryMouseMove);
  map.off("mouseleave", "country-fill", onCountryMouseLeave);
      map.off("moveend", onMoveEnd);
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom]);

  // Render markers whenever zoom/data changes
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    // Clear existing markers
    for (const mk of markersRef.current) mk.remove();
    markersRef.current = [];

    markers.forEach((m, idx) => {
      const el = makePin(m, !showDetail);
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(m.pos as LngLatLike)
        .addTo(map);
      // Tooltip
      el.addEventListener("mouseenter", () => setHoveredIdx(idx));
      el.addEventListener("mouseleave", () => setHoveredIdx(null));
      markersRef.current.push(marker);
    });
  }, [markers, showDetail]);

  return (
    <div className="w-full px-[120px] py-10 pb-20 flex flex-col items-start gap-6">
      <h2 className="text-wfzo-grey-900 font-montserrat text-[32px] font-normal leading-10 self-stretch">Members Worldwide</h2>
      <div className="flex items-center gap-3 self-stretch">
        <div className="relative flex-1 h-[616px] rounded-sm overflow-hidden">
          <div ref={containerRef} style={containerStyle} />

          {hoveredIdx !== null && markers[hoveredIdx] && (
            <div className="absolute z-20 px-2 py-1 rounded bg-white shadow text-sm"
                 style={{ left: "50%", top: 12, transform: "translateX(-50%)" }}>
              <span className="font-semibold">
                {showDetail
                  ? markers[hoveredIdx].label || "Company"
                  : `${markers[hoveredIdx].label || ""} • ${Number(markers[hoveredIdx].count) || 0} ${Number(markers[hoveredIdx].count) === 1 ? "company" : "companies"}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
