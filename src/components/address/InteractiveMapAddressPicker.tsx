import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Crosshair,
  X,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Home,
  Briefcase,
  Navigation,
  ShieldCheck,
  Building,
  User,
  Phone,
  Compass,
} from 'lucide-react';
import {
  reverseGeocodeOpenStreetMap,
  searchLocationsOpenStreetMap,
  getCurrentDeviceLocation,
  DEFAULT_MAP_CENTER,
  type ReverseGeocodeResult,
  type LocationSearchResult,
} from '@/utils/reverseGeocoding';

export interface SelectedMapAddress {
  name: string;
  phone: string;
  houseNo: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  fullAddress: string;
  addressType: 'Home' | 'Work' | 'Other';
  lat: number;
  lng: number;
}

interface InteractiveMapAddressPickerProps {
  initialPincode?: string;
  initialAddress?: string;
  initialCity?: string;
  initialState?: string;
  initialName?: string;
  initialPhone?: string;
  onSelectAddress: (address: SelectedMapAddress) => void;
  onClose: () => void;
}

const POPULAR_HUBS = [
  { name: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
];

export default function InteractiveMapAddressPicker({
  initialPincode,
  initialAddress,
  initialCity,
  initialState,
  initialName = '',
  initialPhone = '',
  onSelectAddress,
  onClose,
}: InteractiveMapAddressPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Map state
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(DEFAULT_MAP_CENTER);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [showAwayHubs, setShowAwayHubs] = useState(false);

  // Geocoded Address state
  const [addressData, setAddressData] = useState<ReverseGeocodeResult | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Detailed address form fields
  const [houseNo, setHouseNo] = useState(initialAddress || '');
  const [name, setName] = useState(initialName || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [landmark, setLandmark] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');

  // Form validation errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string; houseNo?: string }>({});

  /**
   * Reverse geocode with debounce on map move end
   */
  const handleReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const res = await reverseGeocodeOpenStreetMap(lat, lng);
      setAddressData(res);
      if (res.houseNo && !houseNo) {
        setHouseNo(res.houseNo);
      }
    } catch (err) {
      console.warn('Geocoding failed:', err);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [houseNo]);

  /**
   * Initialize Leaflet OpenStreetMap View
   */
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default start position
    const startLat = DEFAULT_MAP_CENTER.lat;
    const startLng = DEFAULT_MAP_CENTER.lng;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false, // Clean mobile-first UI
      attributionControl: false,
    });

    // Add free OpenStreetMap Raster Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Track user movement on map
    map.on('movestart', () => {
      setIsMapMoving(true);
      setShowSearchResults(false);
    });

    map.on('moveend', () => {
      setIsMapMoving(false);
      const center = map.getCenter();
      setCurrentCoords({ lat: center.lat, lng: center.lng });
      handleReverseGeocode(center.lat, center.lng);
    });

    // Initial Geocode
    handleReverseGeocode(startLat, startLng);

    // Auto-prompt GPS location or use initial pincode search
    if (initialPincode && initialPincode.length === 6) {
      searchLocationsOpenStreetMap(initialPincode).then((res) => {
        if (res.length > 0 && mapInstanceRef.current) {
          const first = res[0];
          mapInstanceRef.current.setView([first.lat, first.lng], 16);
          handleReverseGeocode(first.lat, first.lng);
        }
      });
    } else {
      // Auto-locate GPS on mount if permitted
      getCurrentDeviceLocation()
        .then((loc) => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([loc.lat, loc.lng], 17);
            handleReverseGeocode(loc.lat, loc.lng);
          }
        })
        .catch(() => {
          // Silent fallback to default city
        });
    }

    // Leaflet resize fix after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  /**
   * Handle Search Input with Debounce
   */
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setGpsError('');

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    if (!val.trim() || val.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceTimer.current = setTimeout(async () => {
      const results = await searchLocationsOpenStreetMap(val);
      setSearchResults(results);
      setShowSearchResults(true);
      setIsSearching(false);
    }, 350);
  };

  /**
   * Pick search result and fly to location
   */
  const handleSelectSearchResult = (item: LocationSearchResult) => {
    setShowSearchResults(false);
    setSearchQuery('');
    setGpsError('');

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 17, {
        duration: 1.2,
      });
      handleReverseGeocode(item.lat, item.lng);
    }
  };

  /**
   * Fly to away hub (ordering for someone in another city)
   */
  const handleSelectAwayHub = (hub: { name: string; lat: number; lng: number }) => {
    setShowAwayHubs(false);
    setSearchQuery('');
    setGpsError('');

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hub.lat, hub.lng], 15, {
        duration: 1.2,
      });
      handleReverseGeocode(hub.lat, hub.lng);
    }
  };

  /**
   * GPS "Use Current Location" handler
   */
  const handleUseCurrentLocation = async () => {
    setIsLocatingGPS(true);
    setGpsError('');
    setShowAwayHubs(false);

    try {
      const loc = await getCurrentDeviceLocation();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([loc.lat, loc.lng], 17, {
          duration: 1.2,
        });
        handleReverseGeocode(loc.lat, loc.lng);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not access GPS. Please choose location on map.';
      setGpsError(msg);
      setTimeout(() => setGpsError(''), 4000);
    } finally {
      setIsLocatingGPS(false);
    }
  };

  /**
   * Trigger "Away from my location" option
   */
  const handleAwayFromLocationClick = () => {
    setShowAwayHubs(!showAwayHubs);
    if (!showAwayHubs) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  /**
   * Validate and Save Address
   */
  const handleSaveAddress = () => {
    const newErrors: { name?: string; phone?: string; houseNo?: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Please enter recipient full name';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!houseNo.trim()) {
      newErrors.houseNo = 'Please enter Flat / House / Building details';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const streetPart = addressData?.street || addressData?.area || 'Nearby Location';
    const finalCity = addressData?.city || initialCity || 'Indore';
    const finalState = addressData?.state || initialState || 'Madhya Pradesh';
    const finalPincode = addressData?.pincode || initialPincode || '452001';

    const fullParts: string[] = [];
    if (houseNo.trim()) fullParts.push(houseNo.trim());
    if (streetPart.trim()) fullParts.push(streetPart.trim());
    if (landmark.trim()) fullParts.push(`Near ${landmark.trim()}`);
    if (finalCity) fullParts.push(finalCity);
    if (finalState) fullParts.push(finalState);
    if (finalPincode) fullParts.push(finalPincode);

    const fullAddress = fullParts.join(', ');

    onSelectAddress({
      name: name.trim(),
      phone: cleanPhone,
      houseNo: houseNo.trim(),
      street: streetPart.trim(),
      landmark: landmark.trim(),
      city: finalCity,
      state: finalState,
      pincode: finalPincode,
      fullAddress,
      addressType,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 animate-fade-in">
      {/* Main Map Modal Box */}
      <div className="relative w-full h-[96dvh] sm:h-[720px] sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Floating App Bar & Search */}
        <div className="absolute top-0 left-0 right-0 z-[400] p-3 space-y-2 pointer-events-auto bg-gradient-to-b from-slate-950/80 via-slate-900/50 to-transparent">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/95 text-slate-800 flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition-all cursor-pointer border border-gray-100 shrink-0"
              title="Close Map"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Top Autocomplete Search Input */}
            <div className="flex-1 relative">
              <div className="flex items-center bg-white/95 rounded-2xl shadow-lg border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-flipkart-500 transition-all">
                <Search size={18} className="text-gray-400 ml-3.5 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by area, street, landmark, pincode..."
                  className="w-full px-3 py-2.5 text-xs sm:text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
                />
                {isSearching ? (
                  <Loader2 size={16} className="animate-spin text-flipkart-600 mr-3 shrink-0" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="p-1 mr-2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>

              {/* Autocomplete Dropdown List */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-56 overflow-y-auto z-[500] animate-fade-in divide-y divide-gray-100">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left p-3 hover:bg-blue-50/60 active:bg-blue-100 transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <MapPin size={16} className="text-flipkart-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-gray-900 truncate">{item.title}</div>
                        <div className="text-[11px] text-gray-500 truncate">{item.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location Mode Control Action Pills: "Use Current Location" & "Away from my location" */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocatingGPS}
              className="flex-1 bg-white/95 hover:bg-white text-slate-900 py-1.5 px-3 rounded-xl shadow-md border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isLocatingGPS ? (
                <Loader2 size={14} className="animate-spin text-flipkart-600" />
              ) : (
                <Crosshair size={14} className="text-flipkart-600" />
              )}
              <span>Use Current Location</span>
            </button>

            <button
              type="button"
              onClick={handleAwayFromLocationClick}
              className={`flex-1 py-1.5 px-3 rounded-xl shadow-md border flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                showAwayHubs
                  ? 'bg-amber-400 text-slate-950 border-amber-500'
                  : 'bg-white/95 hover:bg-white text-slate-900 border-gray-200'
              }`}
            >
              <Compass size={14} className="text-amber-600" />
              <span>Away from my location</span>
            </button>
          </div>

          {/* Quick Away Hubs Dropdown Bar */}
          {showAwayHubs && (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-gray-200 space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-gray-700">Quick jump to deliver away from your spot:</span>
                <button
                  type="button"
                  onClick={() => setShowAwayHubs(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {POPULAR_HUBS.map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => handleSelectAwayHub(hub)}
                    className="bg-gray-100 hover:bg-amber-100 hover:text-amber-900 text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 border border-gray-200 transition-colors cursor-pointer"
                  >
                    {hub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GPS Error Toast if any */}
          {gpsError && (
            <div className="bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center justify-between animate-shake">
              <span>{gpsError}</span>
              <button onClick={() => setGpsError('')} className="p-0.5">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* The Leaflet Map Container */}
        <div className="relative flex-1 w-full bg-slate-100 overflow-hidden min-h-[220px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* ZOMATO / BLINKIT STYLE PIN DROP OVERLAY (Center of Map) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[300] flex flex-col items-center">
            {/* Tooltip Header Pill */}
            <div
              className={`bg-slate-900/95 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-2xl border border-slate-700/80 mb-1 flex items-center gap-1.5 whitespace-nowrap transition-transform duration-200 ${
                isMapMoving ? '-translate-y-2 scale-95 opacity-80' : 'translate-y-0 scale-100 opacity-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>Place pin on the exact location</span>
            </div>

            {/* Custom SVG Pin Marker */}
            <div
              className={`transition-transform duration-200 origin-bottom ${
                isMapMoving ? '-translate-y-3 scale-110' : 'translate-y-0 scale-100'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xl border-2 border-white">
                <MapPin size={22} className="fill-white stroke-rose-600" />
              </div>
            </div>

            {/* Ground Shadow Ripple */}
            <div
              className={`w-4 h-1.5 bg-black/40 rounded-full blur-[1.5px] transition-all duration-200 ${
                isMapMoving ? 'scale-75 opacity-30' : 'scale-100 opacity-80'
              }`}
            />
          </div>

          {/* Floating GPS Location Button directly on bottom right */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocatingGPS}
            className="absolute right-4 bottom-4 z-[350] bg-white hover:bg-slate-50 text-slate-900 p-2.5 rounded-2xl shadow-xl border border-gray-200 flex items-center gap-1.5 text-xs font-black transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Use current GPS location"
          >
            {isLocatingGPS ? (
              <Loader2 size={16} className="animate-spin text-flipkart-600" />
            ) : (
              <Crosshair size={16} className="text-flipkart-600" />
            )}
            <span className="text-[11px]">GPS Detect</span>
          </button>
        </div>

        {/* BOTTOM SHEET: Detected Address & Detailed Address Form */}
        <div className="bg-white border-t border-gray-200 p-4 sm:p-5 z-[400] shadow-2xl relative space-y-3 max-h-[55dvh] overflow-y-auto">
          {/* Detected Address Display */}
          <div className="flex items-start gap-2.5 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-tight truncate">
                  {isLoadingAddress ? (
                    <span className="text-gray-400 flex items-center gap-1">
                      <Loader2 size={14} className="animate-spin" /> Detecting address...
                    </span>
                  ) : (
                    addressData?.area || 'Selected Delivery Spot'
                  )}
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0">
                  <ShieldCheck size={11} /> Verified Spot
                </span>
              </div>

              <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                {isLoadingAddress ? (
                  'Translating coordinates and postal delivery area...'
                ) : (
                  addressData?.formattedAddress || 'Move pin on map to detect exact doorstep'
                )}
              </p>

              {addressData?.pincode && (
                <div className="text-[11px] font-bold text-flipkart-600 mt-0.5">
                  Pincode: {addressData.pincode} • {addressData.city}, {addressData.state}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Address Form & Validation */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Flat / House / Building */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                  <Building size={13} className="text-gray-400" />
                  Flat / House / Building *
                </label>
                <input
                  type="text"
                  value={houseNo}
                  onChange={(e) => {
                    setHouseNo(e.target.value);
                    if (errors.houseNo) setErrors((prev) => ({ ...prev, houseNo: undefined }));
                  }}
                  placeholder="e.g. Flat 302, Sunrise Apt"
                  className={`w-full bg-white border rounded-xl px-3 py-2 text-xs text-gray-900 outline-none transition-all shadow-inner ${
                    errors.houseNo ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-200 focus:border-flipkart-500'
                  }`}
                />
                {errors.houseNo && <p className="text-[10px] text-rose-500 mt-0.5 font-bold">{errors.houseNo}</p>}
              </div>

              {/* Landmark */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                  <Navigation size={13} className="text-gray-400" />
                  Famous Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Shiv Mandir / Metro"
                  className="w-full bg-white border border-gray-200 focus:border-flipkart-500 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Recipient Full Name & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                  <User size={13} className="text-gray-400" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Receiver full name"
                  className={`w-full bg-white border rounded-xl px-3 py-2 text-xs text-gray-900 outline-none transition-all shadow-inner ${
                    errors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-200 focus:border-flipkart-500'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-rose-500 mt-0.5 font-bold">{errors.name}</p>}
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                  <Phone size={13} className="text-gray-400" />
                  Phone Number *
                </label>
                <div
                  className={`flex items-center border rounded-xl overflow-hidden shadow-inner ${
                    errors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-200 focus-within:border-flipkart-500'
                  }`}
                >
                  <span className="px-2.5 py-2 bg-gray-50 text-[11px] font-bold text-gray-500 border-r border-gray-200">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full px-2.5 py-2 text-xs outline-none bg-white text-gray-900"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-500 mt-0.5 font-bold">{errors.phone}</p>}
              </div>
            </div>

            {/* Address Type Selector */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Address Type</label>
              <div className="flex gap-2">
                {(['Home', 'Work'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAddressType(tag)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      addressType === tag
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {tag === 'Home' ? <Home size={13} /> : <Briefcase size={13} />}
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save Address Button */}
          <button
            type="button"
            onClick={handleSaveAddress}
            disabled={isLoadingAddress}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-black py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>Save Address & Deliver Here (पता सेव करें)</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
