// Minimal Google Maps typings used in MembersWorldwideGoogleMap
// If you install @types/google.maps, this file can be removed.

declare namespace google {
  namespace maps {
    interface LatLngBoundsLiteral {
      north: number; south: number; east: number; west: number;
    }

    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      getZoom(): number | null;
      setZoom(zoom: number): void;
      getCenter(): { lat(): number; lng(): number } | null;
      setCenter(latLng: { lat: number; lng: number }): void;
    }

    interface MapOptions {
      styles?: MapTypeStyle[];
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      fullscreenControl?: boolean;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      draggable?: boolean;
      restriction?: { latLngBounds: LatLngBoundsLiteral; strictBounds?: boolean };
      minZoom?: number;
      maxZoom?: number;
    }

    interface MapTypeStyle { featureType?: string; elementType?: string; stylers?: Array<Record<string, unknown>> }

    class Point { constructor(x: number, y: number) }
    class Size { constructor(width: number, height: number) }

    interface MarkerLabel { text: string; color?: string; fontWeight?: string | number; fontSize?: string }

    type SymbolPath = string | number;
    interface Symbol {
      path: SymbolPath;
      fillColor?: string; fillOpacity?: number; strokeColor?: string; strokeOpacity?: number; strokeWeight?: number;
      scale?: number; anchor?: Point; labelOrigin?: Point;
    }
  }
}

interface Window { google?: typeof google }
