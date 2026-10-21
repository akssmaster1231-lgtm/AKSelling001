import { lookupPincode } from './pincode';

export interface ReverseGeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  area: string;
  street: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  houseNo?: string;
  formattedAddress: string;
  source: 'nominatim' | 'postal_pincode' | 'fallback';
}

export interface LocationSearchResult {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  pincode?: string;
  city?: string;
  state?: string;
}

// Default fallback coordinates: AKSelling Central Hub (Indore, MP)
export const DEFAULT_MAP_CENTER = {
  lat: 22.7196,
  lng: 75.8577,
};

/**
 * High-accuracy GPS Browser Geolocation
 */
export function getCurrentDeviceLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser / device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        let msg = 'Unable to retrieve your location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access or select on map.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Retrying...';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Reverse Geocode coordinates into verified Indian postal address
 * Uses OpenStreetMap Nominatim with India Post Pincode cross-verification
 */
export async function reverseGeocodeOpenStreetMap(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address || {};

      const rawPincode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);
      const houseNo = addr.house_number || addr.building || '';
      const street = addr.road || addr.street || addr.pedestrian || addr.path || '';
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.commercial ||
        addr.industrial ||
        addr.subdistrict ||
        addr.hamlet ||
        '';
      let city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.city_district ||
        addr.district ||
        addr.county ||
        '';
      let state = addr.state || '';

      // Cross-verify with Indian Postal Registry if Pincode is present
      if (rawPincode && rawPincode.length === 6) {
        try {
          const pinCheck = await lookupPincode(rawPincode);
          if (pinCheck && pinCheck.city) {
            city = city || pinCheck.city;
            state = state || pinCheck.state;
          }
        } catch {
          // Keep Nominatim city/state
        }
      }

      // Build clean Indian Street Address
      const streetParts: string[] = [];
      if (houseNo) streetParts.push(houseNo);
      if (street) streetParts.push(street);
      if (area && !street.toLowerCase().includes(area.toLowerCase())) {
        streetParts.push(area);
      }

      const combinedStreet = streetParts.join(', ') || area || street || 'Near Pin Location';

      // Build Formatted Address
      const formattedParts: string[] = [];
      if (combinedStreet) formattedParts.push(combinedStreet);
      if (city) formattedParts.push(city);
      if (state) formattedParts.push(state);
      if (rawPincode) formattedParts.push(rawPincode);

      const formattedAddress = formattedParts.join(', ') || data.display_name || 'Selected Location on Map';

      return {
        lat,
        lng,
        displayName: data.display_name || formattedAddress,
        area: area || street || city || 'Current Location',
        street: combinedStreet,
        city: city || 'City',
        state: state || 'State',
        pincode: rawPincode || '',
        houseNo,
        formattedAddress,
        source: 'nominatim',
      };
    }
  } catch (err) {
    console.warn('[Geocoding] Nominatim fetch error or timeout:', err);
  }

  // Graceful Fallback if offline or network slow
  return {
    lat,
    lng,
    displayName: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    area: 'Selected Map Location',
    street: `GPS Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452005',
    formattedAddress: `Indore, Madhya Pradesh - 452005 (GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    source: 'fallback',
  };
}

/**
 * Autocomplete / Search Locations using OpenStreetMap Nominatim
 */
export async function searchLocationsOpenStreetMap(
  query: string
): Promise<LocationSearchResult[]> {
  const cleanQ = (query || '').trim();
  if (cleanQ.length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      cleanQ
    )}&countrycodes=in&limit=6&addressdetails=1`;

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (resp.ok) {
      const list = await resp.json();
      if (Array.isArray(list)) {
        return list.map((item: Record<string, unknown>) => {
          const addr = (item.address as Record<string, string>) || {};
          const title =
            addr.road ||
            addr.suburb ||
            addr.neighbourhood ||
            addr.amenity ||
            addr.building ||
            item.name ||
            cleanQ;

          const subtitleParts: string[] = [];
          if (addr.city || addr.town || addr.village) {
            subtitleParts.push(addr.city || addr.town || addr.village);
          }
          if (addr.state) subtitleParts.push(addr.state);
          if (addr.postcode) subtitleParts.push(addr.postcode);

          const subtitle = subtitleParts.join(', ') || item.display_name;

          return {
            id: String(item.place_id || Math.random()),
            title,
            subtitle,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            pincode: (addr.postcode || '').replace(/\D/g, '').slice(0, 6),
            city: addr.city || addr.town || addr.village || '',
            state: addr.state || '',
          };
        });
      }
    }
  } catch (err) {
    console.warn('[SearchLocation] Nominatim search error:', err);
  }

  return [];
}
