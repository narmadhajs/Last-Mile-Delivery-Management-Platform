/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in kilometers.
 * 
 * Formula:
 * a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c (where R is Earth radius = 6371 km)
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  return Math.round(distanceKm * 100) / 100; // Round to 2 decimal places
}

/**
 * Estimate travel duration in minutes based on urban delivery speed profile (average 25 km/h in city traffic)
 */
export function estimateTravelTimeMinutes(distanceKm: number): number {
  const avgSpeedKmh = 25;
  const hours = distanceKm / avgSpeedKmh;
  return Math.max(5, Math.round(hours * 60)); // Minimum 5 mins
}
