declare module 'react-simple-maps' {
  import * as React from 'react';

  // Minimal, safe typings to satisfy TS without relying on external @types
  type AnyProps = Record<string, unknown>;

  export const ComposableMap: React.FC<AnyProps>;

  export const Geographies: React.FC<AnyProps & {
    geography?: unknown;
    children?: ((props: unknown) => React.ReactNode) | React.ReactNode;
  }>;

  export const Geography: React.FC<AnyProps>;

  export const Marker: React.FC<AnyProps & {
    coordinates: [number, number];
    children?: React.ReactNode;
  }>;

  export const ZoomableGroup: React.FC<AnyProps & {
    zoom?: number;
    center?: [number, number];
    minZoom?: number;
    maxZoom?: number;
    disablePanning?: boolean;
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    children?: React.ReactNode;
  }>;
}
