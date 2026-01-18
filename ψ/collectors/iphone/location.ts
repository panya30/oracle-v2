/**
 * Location Collector
 *
 * Receives location data from iPhone Shortcuts
 * Enriches with place names and labels
 *
 * This file documents the expected format and provides utilities
 */

// ============================================
// TYPES
// ============================================

export interface RawLocation {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  timestamp?: string;
}

export interface EnrichedLocation extends RawLocation {
  label?: string;        // "home", "work", "gym", "cafe", etc.
  placeName?: string;    // "Starbucks Silom"
  address?: string;
  isMoving?: boolean;
  distanceFromHome?: number;  // meters
}

// ============================================
// KNOWN PLACES
// ============================================

// TODO: Fill in your actual coordinates
export const KNOWN_PLACES: Record<string, { lat: number; lng: number; radius: number }> = {
  home: {
    lat: 0,   // Your home latitude
    lng: 0,   // Your home longitude
    radius: 100  // meters
  },
  work: {
    lat: 0,
    lng: 0,
    radius: 200
  },
  gym: {
    lat: 0,
    lng: 0,
    radius: 50
  }
};

// ============================================
// UTILITIES
// ============================================

/**
 * Calculate distance between two points (Haversine formula)
 */
export function distanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if location is at a known place
 */
export function detectPlace(lat: number, lng: number): string | null {
  for (const [name, place] of Object.entries(KNOWN_PLACES)) {
    const distance = distanceMeters(lat, lng, place.lat, place.lng);
    if (distance <= place.radius) {
      return name;
    }
  }
  return null;
}

/**
 * Check if user is moving based on speed
 */
export function isMoving(speed?: number): boolean {
  if (speed === undefined) return false;
  return speed > 1; // m/s, roughly walking speed
}

/**
 * Enrich raw location with labels
 */
export function enrichLocation(raw: RawLocation): EnrichedLocation {
  const label = detectPlace(raw.lat, raw.lng);
  const homePlace = KNOWN_PLACES.home;

  let distanceFromHome: number | undefined;
  if (homePlace.lat !== 0 && homePlace.lng !== 0) {
    distanceFromHome = distanceMeters(raw.lat, raw.lng, homePlace.lat, homePlace.lng);
  }

  return {
    ...raw,
    label: label || undefined,
    isMoving: isMoving(raw.speed),
    distanceFromHome
  };
}

// ============================================
// EXAMPLE SHORTCUT OUTPUT
// ============================================

/*
iPhone Shortcut should send JSON like this:

{
  "lat": 13.7563,
  "lng": 100.5018,
  "altitude": 15,
  "accuracy": 10,
  "speed": 0
}

POST to: http://YOUR_MAC_IP:3030/location
*/
