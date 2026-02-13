'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, DivIcon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { type Zone, zoneTypeColors } from '../data/atlasData';

interface MapViewProps {
  zones: Zone[];
  onZoneClick: (zone: Zone) => void;
  englishBasemap?: boolean;
}

// Component to update map view when zones change
function MapUpdater({ zones }: { zones: Zone[] }) {
  const map = useMap();

  useEffect(() => {
    if (zones.length > 0) {
      // Calculate bounds to fit all markers
      const bounds = zones.map((zone) => [zone.latitude, zone.longitude] as [number, number]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        // Ensure zoom doesn't go below 2
        if (map.getZoom() < 2) {
          map.setZoom(2);
        }
      }
    }
  }, [zones, map]);

  return null;
}

export default function MapView({ zones, onZoneClick, englishBasemap = true }: MapViewProps) {
  // Basemap selection. For English-only labels we use MapTiler outdoor-v4 which provides consistent English labeling.
  const tileUrl = englishBasemap
    ? `https://api.maptiler.com/maps/outdoor-v4/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Create custom marker icons based on zone type
  const createMarkerIcon = (zone: Zone): DivIcon => {
    const color = zoneTypeColors[zone.zoneType];
    
    return divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          display: flex;
          width: 24px;
          padding: 4px;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 10px;
          border-radius: 12px;
          background: ${color};
          overflow: hidden;
          position: relative;
        ">
          <div style="
            align-self: stretch;
            color: #FFF;
            text-align: center;
            font-family: 'Source Sans Pro', -apple-system, Roboto, Helvetica, sans-serif;
            font-size: 12px;
            font-style: normal;
            font-weight: 700;
            line-height: 16px;
            position: relative;
          ">${zone.count}</div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  // Create hover marker icon (larger with background)
  const createHoverMarkerIcon = (zone: Zone): DivIcon => {
    const color = zoneTypeColors[zone.zoneType];
    const bgColor = `${color}33`; // Add alpha for transparency
    
    return divIcon({
      className: 'custom-marker-hover',
      html: `
        <div style="
          display: flex;
          width: 40px;
          padding: 8px;
          justify-content: center;
          align-items: center;
          aspect-ratio: 1/1;
          border-radius: 20px;
          background: ${bgColor};
          position: relative;
        ">
          <div style="
            display: flex;
            width: 24px;
            padding: 4px;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
            border-radius: 12px;
            background: ${color};
            overflow: hidden;
            position: absolute;
            left: 8px;
            top: 8px;
          ">
            <div style="
              align-self: stretch;
              color: #FFF;
              text-align: center;
              font-family: 'Source Sans Pro', -apple-system, Roboto, Helvetica, sans-serif;
              font-size: 12px;
              font-style: normal;
              font-weight: 700;
              line-height: 16px;
              position: relative;
            ">${zone.count}</div>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  };

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={16}
      maxBounds={[[-90, -180], [90, 180]]}
      className="w-full h-full relative z-10"
      maxBoundsViscosity={1.0}
      worldCopyJump={false}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={true}
      
    >
      <TileLayer
        attribution={englishBasemap
          ? '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
        url={tileUrl}
      />
      
      {zones.map((zone) => (
        <Marker
          key={zone.id}
          position={[zone.latitude, zone.longitude]}
          icon={createMarkerIcon(zone)}
          eventHandlers={{
            click: () => onZoneClick(zone),
          }}
        >
        </Marker>
      ))}
      
      <MapUpdater zones={zones} />
    </MapContainer>
  );
}
