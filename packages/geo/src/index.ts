/**
 * @citadel/geo
 *
 * Geography utilities for the Citadel platform.
 * Haiti admin boundaries, spatial helpers, coordinate transforms.
 */

/**
 * Haiti administrative hierarchy constants.
 * 10 departments → 42 arrondissements → 145 communes → 571 sections communales
 */
export const HAITI_DEPARTMENTS = [
  "Artibonite",
  "Centre",
  "Grand'Anse",
  "Nippes",
  "Nord",
  "Nord-Est",
  "Nord-Ouest",
  "Ouest",
  "Sud",
  "Sud-Est",
] as const;

export type HaitiDepartment = (typeof HAITI_DEPARTMENTS)[number];

/** Haiti bounding box [west, south, east, north] */
export const HAITI_BBOX = [-74.48, 18.02, -71.62, 20.09] as const;

/** Port-au-Prince center coordinates */
export const PAP_CENTER = { lng: -72.338, lat: 18.541 } as const;

/**
 * Check if a coordinate pair falls within Haiti's bounding box.
 */
export function isWithinHaiti(lng: number, lat: number): boolean {
  return (
    lng >= HAITI_BBOX[0] &&
    lng <= HAITI_BBOX[2] &&
    lat >= HAITI_BBOX[1] &&
    lat <= HAITI_BBOX[3]
  );
}

/**
 * Approximate distance between two points in meters (Haversine).
 */
export function distanceMeters(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
