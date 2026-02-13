import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from 'geojson';

/**
 * Compute centroid of a Polygon geometry.
 * Uses simple average of all coordinate points (sufficient for coarse country display).
 */
function centroidOfPolygon(polygon: Polygon): [number, number] | null {
  const coords = polygon.coordinates;
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (const ring of coords) {
    for (const [x, y] of ring) {
      sumX += x;
      sumY += y;
      count++;
    }
  }
  if (!count) return null;
  return [sumX / count, sumY / count];
}

/**
 * Compute centroid of a MultiPolygon by averaging centroids of constituent polygons
 * weighted by vertex count (approximation).
 */
function centroidOfMultiPolygon(multi: MultiPolygon): [number, number] | null {
  let totalX = 0;
  let totalY = 0;
  let totalPoints = 0;
  for (const polygon of multi.coordinates) {
    let sumX = 0, sumY = 0, count = 0;
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        sumX += x; sumY += y; count++;
      }
    }
    if (count) {
      totalX += sumX / count * count;
      totalY += sumY / count * count;
      totalPoints += count;
    }
  }
  if (!totalPoints) return null;
  return [totalX / totalPoints, totalY / totalPoints];
}

/**
 * Compute centroid of any Polygon or MultiPolygon geometry.
 */
export function computeGeometryCentroid(geometry: Geometry): [number, number] | null {
  if (geometry.type === 'Polygon') return centroidOfPolygon(geometry as Polygon);
  if (geometry.type === 'MultiPolygon') return centroidOfMultiPolygon(geometry as MultiPolygon);
  return null;
}

export interface CountryCentroidOptions {
  /** Property name that contains ISO2/ISO3 or country name; fallback tries common patterns */
  codePropertyCandidates?: string[];
  namePropertyCandidates?: string[];
}

/**
 * Build a map of country code/name to centroid from a GeoJSON FeatureCollection.
 * Returns keys in lowercase for case-insensitive lookups.
 */
export function buildCountryCentroidMap(fc: FeatureCollection, opts: CountryCentroidOptions = {}) {
  const {
    codePropertyCandidates = ['iso_a2', 'ISO_A2', 'iso2', 'code'],
    namePropertyCandidates = ['name', 'NAME', 'admin', 'ADMIN', 'country'],
  } = opts;
  const map = new Map<string, [number, number]>();
  for (const feature of fc.features) {
    if (!feature.geometry) continue;
    const centroid = computeGeometryCentroid(feature.geometry as Geometry);
    if (!centroid) continue;
  interface Props { [k: string]: unknown; }
  const props: Props = (feature as Feature).properties || {};
    let key: string | undefined;

    for (const c of codePropertyCandidates) {
      const val = props[c];
      if (typeof val === 'string' && val.trim() && val !== '-99') { key = val; break; }
    }
    if (!key) {
      for (const c of namePropertyCandidates) {
        const val = props[c];
        if (typeof val === 'string' && val.trim()) { key = val; break; }
      }
    }
    if (!key) continue;
    map.set(key.toLowerCase(), centroid);
  }
  return map;
}

/**
 * Helper to resolve a centroid by trying several keys (iso2, iso3, name variants).
 */
export function lookupCountryCentroid(
  centroidMap: Map<string, [number, number]>,
  { iso2, iso3, name }: { iso2?: string; iso3?: string; name?: string }
): [number, number] | undefined {
  const candidates = [iso2, iso3, name].filter(Boolean).map(v => v!.toLowerCase());
  for (const c of candidates) {
    const hit = centroidMap.get(c);
    if (hit) return hit;
  }
  return undefined;
}
