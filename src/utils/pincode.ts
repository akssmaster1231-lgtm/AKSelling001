/**
 * Indian Postal Pincode Auto-lookup Utility
 * Provides fast city/district/state lookup using India Post API + offline high-density prefix cache
 */

export interface PincodeInfo {
  pincode: string;
  city: string;
  district: string;
  state: string;
  country: string;
  isDeliverable: boolean;
  area?: string;
  colony?: string;
  areas?: string[];
}

// Prefix mappings for instant 0ms offline fallback for major Indian logistics hubs
const REGION_PREFIX_MAP: Record<string, { city: string; state: string; area: string }> = {
  // Delhi NCR
  '1100': { city: 'New Delhi', state: 'Delhi', area: 'Connaught Place / Central Area' },
  '1210': { city: 'Faridabad', state: 'Haryana', area: 'Sector 15 / Industrial Area' },
  '1220': { city: 'Gurugram', state: 'Haryana', area: 'DLF Phase 2 / Udyog Vihar' },
  '2013': { city: 'Noida', state: 'Uttar Pradesh', area: 'Sector 62 / Electronic City' },
  '2010': { city: 'Ghaziabad', state: 'Uttar Pradesh', area: 'Raj Nagar / Kavi Nagar' },
  // Maharashtra
  '4000': { city: 'Mumbai', state: 'Maharashtra', area: 'Fort / Colaba / Marine Lines' },
  '4006': { city: 'Thane', state: 'Maharashtra', area: 'Panchpakhadi / Naupada' },
  '4007': { city: 'Navi Mumbai', state: 'Maharashtra', area: 'Vashi / Nerul Sector' },
  '4110': { city: 'Pune', state: 'Maharashtra', area: 'Shivajinagar / Kothrud' },
  '4400': { city: 'Nagpur', state: 'Maharashtra', area: 'Sitabuldi / Dharampeth' },
  // Karnataka
  '5600': { city: 'Bengaluru', state: 'Karnataka', area: 'Koramangala / MG Road' },
  '5601': { city: 'Bengaluru', state: 'Karnataka', area: 'Electronic City / HSR Layout' },
  '5700': { city: 'Mysuru', state: 'Karnataka', area: 'Gokulam / Saraswathipuram' },
  // Tamil Nadu
  '6000': { city: 'Chennai', state: 'Tamil Nadu', area: 'T. Nagar / Anna Nagar' },
  '6410': { city: 'Coimbatore', state: 'Tamil Nadu', area: 'Gandhipuram / RS Puram' },
  '6250': { city: 'Madurai', state: 'Tamil Nadu', area: 'Simmakkal / KK Nagar' },
  // Telangana & Andhra Pradesh
  '5000': { city: 'Hyderabad', state: 'Telangana', area: 'Banjara Hills / Hitec City' },
  '5300': { city: 'Visakhapatnam', state: 'Andhra Pradesh', area: 'Dwaraka Nagar / Beach Road' },
  '5200': { city: 'Vijayawada', state: 'Andhra Pradesh', area: 'Benz Circle / Governorpet' },
  // West Bengal
  '7000': { city: 'Kolkata', state: 'West Bengal', area: 'Park Street / Salt Lake' },
  '7111': { city: 'Howrah', state: 'West Bengal', area: 'Shibpur / Salkia' },
  '7340': { city: 'Siliguri', state: 'West Bengal', area: 'Pradhan Nagar / Hakim Para' },
  // Gujarat
  '3800': { city: 'Ahmedabad', state: 'Gujarat', area: 'Navrangpura / Satellite' },
  '3950': { city: 'Surat', state: 'Gujarat', area: 'Ring Road / Varachha' },
  '3900': { city: 'Vadodara', state: 'Gujarat', area: 'Alkapuri / Sayajigunj' },
  '3600': { city: 'Rajkot', state: 'Gujarat', area: 'Yagnik Road / Kalawad' },
  // Rajasthan
  '3020': { city: 'Jaipur', state: 'Rajasthan', area: 'C-Scheme / Malviya Nagar' },
  '3420': { city: 'Jodhpur', state: 'Rajasthan', area: 'Shastri Nagar / Sardarpura' },
  '3130': { city: 'Udaipur', state: 'Rajasthan', area: 'Panchwati / Hiran Magri' },
  // Uttar Pradesh
  '2260': { city: 'Lucknow', state: 'Uttar Pradesh', area: 'Hazratganj / Gomti Nagar' },
  '2080': { city: 'Kanpur', state: 'Uttar Pradesh', area: 'Civil Lines / Kakadeo' },
  '2210': { city: 'Varanasi', state: 'Uttar Pradesh', area: 'Cantt / Sigra' },
  '2820': { city: 'Agra', state: 'Uttar Pradesh', area: 'Sanjay Place / Tajganj' },
  '2500': { city: 'Meerut', state: 'Uttar Pradesh', area: 'Shastri Nagar / Begum Bridge' },
  // Bihar & Jharkhand
  '8000': { city: 'Patna', state: 'Bihar', area: 'Boring Road / Kankarbagh' },
  '8340': { city: 'Ranchi', state: 'Jharkhand', area: 'Doranda / Main Road' },
  '8310': { city: 'Jamshedpur', state: 'Jharkhand', area: 'Bistupur / Sakchi' },
  // Madhya Pradesh
  '4520': { city: 'Indore', state: 'Madhya Pradesh', area: 'Amrakunj Colony / Vijay Nagar' },
  '4620': { city: 'Bhopal', state: 'Madhya Pradesh', area: 'MP Nagar / Arera Colony' },
  '4820': { city: 'Jabalpur', state: 'Madhya Pradesh', area: 'Civil Lines / Wright Town' },
  // Punjab & Chandigarh
  '1600': { city: 'Chandigarh', state: 'Chandigarh', area: 'Sector 17 / Sector 35' },
  '1410': { city: 'Ludhiana', state: 'Punjab', area: 'Model Town / Sarabha Nagar' },
  '1430': { city: 'Amritsar', state: 'Punjab', area: 'Mall Road / Ranjit Avenue' },
  // Kerala
  '6820': { city: 'Kochi', state: 'Kerala', area: 'MG Road / Marine Drive' },
  '6950': { city: 'Thiruvananthapuram', state: 'Kerala', area: 'Palayam / Kowdiar' },
  // Odisha
  '7510': { city: 'Bhubaneswar', state: 'Odisha', area: 'Saheed Nagar / Jayadev Vihar' },
  '7530': { city: 'Cuttack', state: 'Odisha', area: 'Badambadi / Buxi Bazar' },
};

// State code zone map fallback based on first 2 digits
const ZONE_MAP: Record<string, { city: string; state: string }> = {
  '11': { city: 'Delhi', state: 'Delhi' },
  '12': { city: 'Haryana Central', state: 'Haryana' },
  '13': { city: 'Haryana North', state: 'Haryana' },
  '14': { city: 'Punjab', state: 'Punjab' },
  '15': { city: 'Punjab West', state: 'Punjab' },
  '16': { city: 'Chandigarh', state: 'Chandigarh' },
  '17': { city: 'Himachal Pradesh', state: 'Himachal Pradesh' },
  '18': { city: 'Jammu & Kashmir', state: 'Jammu & Kashmir' },
  '19': { city: 'Kashmir', state: 'Jammu & Kashmir' },
  '20': { city: 'Western UP', state: 'Uttar Pradesh' },
  '21': { city: 'Allahabad Region', state: 'Uttar Pradesh' },
  '22': { city: 'Lucknow Region', state: 'Uttar Pradesh' },
  '23': { city: 'Bareilly Region', state: 'Uttar Pradesh' },
  '24': { city: 'Moradabad / Dehradun', state: 'Uttarakhand' },
  '25': { city: 'Meerut Region', state: 'Uttar Pradesh' },
  '26': { city: 'Kumaon Region', state: 'Uttarakhand' },
  '27': { city: 'Gorakhpur Region', state: 'Uttar Pradesh' },
  '28': { city: 'Agra / Jhansi', state: 'Uttar Pradesh' },
  '30': { city: 'Jaipur Region', state: 'Rajasthan' },
  '31': { city: 'Udaipur Region', state: 'Rajasthan' },
  '32': { city: 'Kota Region', state: 'Rajasthan' },
  '33': { city: 'Bikaner Region', state: 'Rajasthan' },
  '34': { city: 'Jodhpur Region', state: 'Rajasthan' },
  '36': { city: 'Rajkot Region', state: 'Gujarat' },
  '37': { city: 'Kutch Region', state: 'Gujarat' },
  '38': { city: 'Ahmedabad Region', state: 'Gujarat' },
  '39': { city: 'Surat / Vadodara', state: 'Gujarat' },
  '40': { city: 'Mumbai', state: 'Maharashtra' },
  '41': { city: 'Pune Region', state: 'Maharashtra' },
  '42': { city: 'Nashik Region', state: 'Maharashtra' },
  '43': { city: 'Aurangabad Region', state: 'Maharashtra' },
  '44': { city: 'Nagpur Region', state: 'Maharashtra' },
  '45': { city: 'Indore Region', state: 'Madhya Pradesh' },
  '46': { city: 'Bhopal Region', state: 'Madhya Pradesh' },
  '47': { city: 'Gwalior Region', state: 'Madhya Pradesh' },
  '48': { city: 'Jabalpur Region', state: 'Madhya Pradesh' },
  '49': { city: 'Raipur Region', state: 'Chhattisgarh' },
  '50': { city: 'Hyderabad Region', state: 'Telangana' },
  '51': { city: 'Kurnool Region', state: 'Andhra Pradesh' },
  '52': { city: 'Vijayawada Region', state: 'Andhra Pradesh' },
  '53': { city: 'Visakhapatnam Region', state: 'Andhra Pradesh' },
  '56': { city: 'Bengaluru Region', state: 'Karnataka' },
  '57': { city: 'Mangaluru / Mysuru', state: 'Karnataka' },
  '58': { city: 'Hubli / Belgaum', state: 'Karnataka' },
  '59': { city: 'Belagavi Region', state: 'Karnataka' },
  '60': { city: 'Chennai Region', state: 'Tamil Nadu' },
  '61': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '62': { city: 'Madurai Region', state: 'Tamil Nadu' },
  '63': { city: 'Salem / Vellore', state: 'Tamil Nadu' },
  '64': { city: 'Coimbatore Region', state: 'Tamil Nadu' },
  '67': { city: 'Kozhikode Region', state: 'Kerala' },
  '68': { city: 'Ernakulam / Kochi', state: 'Kerala' },
  '69': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '70': { city: 'Kolkata Region', state: 'West Bengal' },
  '71': { city: 'Howrah / Hooghly', state: 'West Bengal' },
  '72': { city: 'Midnapore', state: 'West Bengal' },
  '73': { city: 'North Bengal', state: 'West Bengal' },
  '74': { city: 'North 24 Parganas', state: 'West Bengal' },
  '75': { city: 'Bhubaneswar Region', state: 'Odisha' },
  '76': { city: 'Berhampur Region', state: 'Odisha' },
  '77': { city: 'Sambalpur Region', state: 'Odisha' },
  '78': { city: 'Guwahati / Assam', state: 'Assam' },
  '79': { city: 'North East Region', state: 'North East' },
  '80': { city: 'Patna Region', state: 'Bihar' },
  '81': { city: 'Bhagalpur Region', state: 'Bihar' },
  '82': { city: 'Gaya Region', state: 'Bihar' },
  '83': { city: 'Ranchi / Jamshedpur', state: 'Jharkhand' },
  '84': { city: 'Muzaffarpur Region', state: 'Bihar' },
  '85': { city: 'Purnea Region', state: 'Bihar' },
};

const cache = new Map<string, PincodeInfo>();

/**
 * Look up City and State from a 6-digit Indian Pincode.
 * Tries India Post public API first, falling back cleanly to offline table.
 */
export async function lookupPincode(pincode: string): Promise<PincodeInfo | null> {
  const clean = pincode.replace(/\D/g, '').slice(0, 6);
  if (clean.length !== 6) return null;

  if (cache.has(clean)) {
    return cache.get(clean)!;
  }

  // 1. Try public postal API with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const allAreas = data[0].PostOffice
          .map((p: Record<string, string>) => p.Name)
          .filter(Boolean);
        const areaName = po.Name || po.Block || po.Circle || '';
        const info: PincodeInfo = {
          pincode: clean,
          city: po.District || po.Block || po.Circle || 'City',
          district: po.District || '',
          state: po.State || '',
          country: po.Country || 'India',
          isDeliverable: true,
          area: areaName,
          colony: areaName,
          areas: allAreas,
        };
        cache.set(clean, info);
        return info;
      }
    }
  } catch {
    // network or abort error -> fallback to local offline map
  }

  // 2. High-precision 4-digit prefix
  const prefix4 = clean.slice(0, 4);
  if (REGION_PREFIX_MAP[prefix4]) {
    const r = REGION_PREFIX_MAP[prefix4];
    const info: PincodeInfo = {
      pincode: clean,
      city: r.city,
      district: r.city,
      state: r.state,
      country: 'India',
      isDeliverable: true,
      area: r.area,
      colony: r.area,
      areas: [r.area],
    };
    cache.set(clean, info);
    return info;
  }

  // 3. High-level 2-digit regional zone
  const prefix2 = clean.slice(0, 2);
  if (ZONE_MAP[prefix2]) {
    const z = ZONE_MAP[prefix2];
    const info: PincodeInfo = {
      pincode: clean,
      city: z.city,
      district: z.city,
      state: z.state,
      country: 'India',
      isDeliverable: true,
    };
    cache.set(clean, info);
    return info;
  }

  return {
    pincode: clean,
    city: 'City',
    district: '',
    state: 'India',
    country: 'India',
    isDeliverable: true,
  };
}

export const DELIVERY_LOCATION_KEY = 'akselling_delivery_location';

export function getStoredDeliveryLocation(): PincodeInfo {
  try {
    const raw = localStorage.getItem(DELIVERY_LOCATION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    pincode: '452001',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    country: 'India',
    isDeliverable: true,
  };
}

export function setStoredDeliveryLocation(info: PincodeInfo) {
  try {
    localStorage.setItem(DELIVERY_LOCATION_KEY, JSON.stringify(info));
    window.dispatchEvent(new CustomEvent('akselling:delivery_location_changed', { detail: info }));
  } catch {
    // silent
  }
}

