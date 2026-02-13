"use client";

import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";

type MarkerData = {
  coordinates: [number, number]; // [lon, lat]
  count: number | string;
  label?: string;
};

type CountryMarkers = {
  country: string;
  code?: string;
  points: MarkerData[];
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function MembersWorldwideSection({
  data,
  zoomDetailThreshold = 2.5,
}: {
  data?: CountryMarkers[];
  zoomDetailThreshold?: number;
}) {
  // Zoom/pan state
  const [zoom, setZoom] = useState<number>(1.1);
  const [center, setCenter] = useState<[number, number]>([0, 10]); // [lon, lat] shift north to reduce southern ocean
  // Hover state for tooltips
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Demo dataset — can be replaced by `data` prop from CMS
  const demoData: CountryMarkers[] = [
    {
      country: "Brazil",
      points: [{ coordinates: [-51.9253, -14.235], count: 26, label: "Brazil" }],
    },
    {
      country: "Spain",
      points: [{ coordinates: [-3.7038, 40.4168], count: 8, label: "Spain" }],
    },
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
  const aggregatedMarkers: MarkerData[] = useMemo(() => {
    return countryData.map((c) => {
      if (!c.points.length) return { coordinates: [0, 0], count: 0, label: c.country };
      let sumW = 0;
      let lon = 0;
      let lat = 0;
      let totalCount = 0;
      for (const p of c.points) {
        const w = typeof p.count === "number" ? p.count : Number(p.count) || 1;
        sumW += w;
        lon += p.coordinates[0] * w;
        lat += p.coordinates[1] * w;
        totalCount += w;
      }
      if (sumW === 0) {
        const fallback = c.points[0];
        return { coordinates: fallback.coordinates, count: totalCount, label: c.country };
      }
      return { coordinates: [lon / sumW, lat / sumW] as [number, number], count: totalCount, label: c.country };
    });
  }, [countryData]);

  const detailedMarkers: MarkerData[] = useMemo(() => countryData.flatMap((c) => c.points), [countryData]);
  const showDetail = zoom >= zoomDetailThreshold;
  const markersToRender = showDetail ? detailedMarkers : aggregatedMarkers;

  const formatCompanies = (n: number) => `${n} ${n === 1 ? "company" : "companies"}`;

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  const handleZoomIn = () => setZoom((z) => clamp(z * 1.4, 1, 12));
  const handleZoomOut = () => setZoom((z) => clamp(z / 1.4, 1, 12));
  const PAN_THRESHOLD = 1.15; // below this, no panning; above this, allow but clamp
  const clampCenterForZoom = (lon: number, lat: number, z: number): [number, number] => {
    if (z <= PAN_THRESHOLD) {
      // keep the initial framing when not zoomed in
      return [0, 10];
    }
    // When zoomed, clamp within sensible bounds to avoid vast empty oceans
    const lonLimit = 130; // -130..130 still covers most landmasses without deep Pacific
    const latMin = -40;
    const latMax = 75;
    return [clamp(lon, -lonLimit, lonLimit), clamp(lat, latMin, latMax)];
  };

  const handleReset = () => {
    setZoom(1.1);
    setCenter([0, 10]);
  };

  return (
    <div className="w-full px-[120px] py-10 pb-20 flex flex-col items-start gap-6">
      <h2 className="text-wfzo-grey-900 font-montserrat text-[32px] font-normal leading-10 self-stretch">
        Members Worldwide
      </h2>
      <div className="flex items-center gap-3 self-stretch">
        <div
          className="relative flex-1 h-[616px] rounded-sm overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, #6F95E8 0%, #8DB1F6 50%, #B1CBFE 80%, #C9DBFF 100%)",
          }}
        >
          {/* Zoom controls */}
          <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={handleZoomIn}
              className="h-10 w-10 rounded-md bg-white/90 text-wfzo-grey-900 shadow hover:bg-white"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={handleZoomOut}
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

          <ComposableMap projectionConfig={{ scale: 220 }} style={{ width: "100%", height: "100%" }}>
            <ZoomableGroup
              zoom={zoom}
              center={center}
              minZoom={1}
              maxZoom={12}
              // Emulate panning restriction by clamping center in onMoveEnd when zoomed out
              onMoveEnd={(pos) => {
                if (!pos) return;
                // defensive parsing
                const nextZoom = typeof pos.zoom === "number" ? pos.zoom : zoom;
                const rawCenter = Array.isArray(pos.coordinates) ? (pos.coordinates as [number, number]) : center;
                const clampedZoom = clamp(nextZoom, 1, 12);
                const [nextLon, nextLat] = clampCenterForZoom(rawCenter[0], rawCenter[1], clampedZoom);
                setZoom(clampedZoom);
                setCenter([nextLon, nextLat]);
              }}
            >
              <Geographies geography={geoUrl}>
                {(p) => {
                  // p carries geographies depending on library version; cast for safety
                  const allGeos = (p as unknown as { geographies: Array<{ rsmKey: string; properties?: Record<string, unknown> }> }).geographies;
                  const landNoAntarctica = allGeos.filter((g) => {
                    const name = (g.properties?.NAME || g.properties?.name) as string | undefined;
                    return name !== "Antarctica";
                  });
                  return landNoAntarctica.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo as unknown}
                      style={{
                        // Solid medium-dark beige fills (no gradients)
                        default: { fill: "#f2e0ccff", stroke: "#adb7edff", strokeWidth: 0.5 },
                        hover: { fill: "#ebd2b6ff", stroke: "#E5E7EB", strokeWidth: 0.5 },
                        pressed: { fill: "#B89772", stroke: "#E5E7EB", strokeWidth: 0.5 },
                      }}
                    />
                  ));
                }}
              </Geographies>

              {markersToRender.map((m, idx) => (
                <Marker key={idx} coordinates={m.coordinates}>
                  {/* Pin icon anchored at (0,0) as the tip */}
                  <g
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Pin with rounded circular top and smooth pointer */}
                    <path
                      d="M0,0 C 9,-12 12,-18 12,-24 A 12 12 0 1 0 -12,-24 C -12,-18 -9,-12 0,0 Z"
                      fill="#684F31"
                    />
                    {/* Number inside the pin (only for aggregated/country view) */}
                    {!showDetail && (
                      <text
                        x="0"
                        y="-24"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#F8F5F1"
                        fontSize="12"
                        fontWeight={700}
                        fontFamily="Source Sans 3"
                      >
                        {m.count}
                      </text>
                    )}

                    {/* Tooltip: country + count at low zoom, company name at detailed zoom */}
                    {hoveredIdx === idx && (
                      (() => {
                        const num = typeof m.count === "number" ? m.count : Number(m.count) || 0;
                        const text = showDetail ? (m.label || "Company") : `${m.label || ""} • ${formatCompanies(num)}`;
                        const w = Math.max(80, Math.min(280, 10 * text.length));
                        const h = 40;
                        const radius = 8;
                        return (
                          <g transform={`translate(0, ${-48})`}>
                            <rect x={-w / 2} y={-h} width={w} height={h} rx={radius} fill="#ffffffff" opacity={0.92} />
                            {/* pointer triangle */}
                            <path d={`M -6,0 L 6,0 L 0,8 Z`} fill="#111827" opacity={0.92} />
                            <text
                              x={0}
                              y={-h / 2}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#8B6941"
                              fontSize="12"
                              fontWeight={600}
                              fontFamily="Source Sans 3"
                            >
                              {text}
                            </text>
                          </g>
                        );
                      })()
                    )}
                  </g>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>
    </div>
  );
}
