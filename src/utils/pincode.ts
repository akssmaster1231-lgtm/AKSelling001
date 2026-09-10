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
}

// Prefix mappings for instant 0ms offline fallback for major Indian logistics hubs
const REGION_PREFIX_MAP: Record<string, { city: string; state: string }> = {
  // Delhi NCR
  '1100': { city: 'New Delhi', state: 'Delhi' },
  '1210': { city: 'Faridabad', state: 'Haryana' },
  '1220': { city: 'Gurugram', state: 'Haryana' },
  '2013': { city: 'Noida', state: 'Uttar Pradesh' },
  '2010': { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  // Maharashtra
  '4000': { city: 'Mumbai', state: 'Maharashtra' },
  '4006': { city: 'Thane', state: 'Maharashtra' },
  '4007': { city: 'Navi Mumbai', state: 'Maharashtra' },
  '4110': { city: 'Pune', state: 'Maharashtra' },
  '4400': { city: 'Nagpur', state: 'Maharashtra' },
  // Karnataka
  '5600': { city: 'Bengaluru', state: 'Karnataka' },
  '5601': { city: 'Bengaluru', state: 'Karnataka' },
  '5700': { city: 'Mysuru', state: 'Karnataka' },
  // Tamil Nadu
  '6000': { city: 'Chennai', state: 'Tamil Nadu' },
  '6410': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '6250': { city: 'Madurai', state: 'Tamil Nadu' },
  // Telangana & Andhra Pradesh
  '5000': { city: 'Hyderabad', state: 'Telangana' },
  '5300': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '5200': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  // West Bengal
  '7000': { city: 'Kolkata', state: 'West Bengal' },
  '7111': { city: 'Howrah', state: 'West Bengal' },
  '7340': { city: 'Siliguri', state: 'West Bengal' },
  // Gujarat
  '3800': { city: 'Ahmedabad', state: 'Gujarat' },
  '3950': { city: 'Surat', state: 'Gujarat' },
  '3900': { city: 'Vadodara', state: 'Gujarat' },
  '3600': { city: 'Rajkot', state: 'Gujarat' },
  // Rajasthan
  '3020': { city: 'Jaipur', state: 'Rajasthan' },
  '3420': { city: 'Jodhpur', state: 'Rajasthan' },
  '3130': { city: 'Udaipur', state: 'Rajasthan' },
  // Uttar Pradesh
  '2260': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '2080': { city: 'Kanpur', state: 'Uttar Pradesh' },
  '2210': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '2820': { city: 'Agra', state: 'Uttar Pradesh' },
  '2500': { city: 'Meerut', state: 'Uttar Pradesh' },
  // Bihar & Jharkhand
  '8000': { city: 'Patna', state: 'Bihar' },
  '8340': { city: 'Ranchi', state: 'Jharkhand' },
  '8310': { city: 'Jamshedpur', state: 'Jharkhand' },
  // Madhya Pradesh
  '4520': { city: 'Indore', state: 'Madhya Pradesh' },
  '4620': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '4820': { city: 'Jabalpur', state: 'Madhya Pradesh' },
  // Punjab & Chandigarh
  '1600': { city: 'Chandigarh', state: 'Chandigarh' },
  '1410': { city: 'Ludhiana', state: 'Punjab' },
  '1430': { city: 'Amritsar', state: 'Punjab' },
  // Kerala
  '6820': { city: 'Kochi', state: 'Kerala' },
  '6950': { city: 'Thiruvananthapuram', state: 'Kerala' },
  // Odisha
  '7510': { city: 'Bhubaneswar', state: 'Odisha' },
  '7530': { city: 'Cuttack', state: 'Odisha' },
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
        const info: PincodeInfo = {
          pincode: clean,
          city: po.District || po.Block || po.Circle || 'City',
          district: po.District || '',
          state: po.State || '',
          country: po.Country || 'India',
          isDeliverable: true,
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
