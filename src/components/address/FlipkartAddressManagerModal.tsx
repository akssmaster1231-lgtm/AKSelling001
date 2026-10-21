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
  Building,
  User,
  Phone,
  Plus,
  Trash2,
  Globe,
} from 'lucide-react';
import {
  reverseGeocodeOpenStreetMap,
  searchLocationsOpenStreetMap,
  getCurrentDeviceLocation,
  DEFAULT_MAP_CENTER,
  type ReverseGeocodeResult,
  type LocationSearchResult,
} from '@/utils/reverseGeocoding';
import { useAuth, type AddressEntry } from '@/auth-context';
import { lookupPincode } from '@/utils/pincode';

export interface FullAddressDetails {
  id?: string;
  name: string;
  phone: string;
  houseNo: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'Home' | 'Work';
  fullAddress: string;
}

interface FlipkartAddressManagerModalProps {
  currentAddress?: Partial<FullAddressDetails>;
  selectedAddressId?: string | null;
  onSelectAddress: (address: FullAddressDetails) => void;
  onClose: () => void;
}

// Major delivery cities across India for "Away from my location" quick search
const POPULAR_DESTINATION_HUBS = [
  { name: 'Indore', lat: 22.7196, lng: 75.8577, pincode: '452001', state: 'Madhya Pradesh' },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.209, pincode: '110001', state: 'Delhi' },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, pincode: '400001', state: 'Maharashtra' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, pincode: '560001', state: 'Karnataka' },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126, pincode: '462001', state: 'Madhya Pradesh' },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867, pincode: '500001', state: 'Telangana' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, pincode: '302001', state: 'Rajasthan' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, pincode: '226001', state: 'Uttar Pradesh' },
];

export default function FlipkartAddressManagerModal({
  currentAddress,
  selectedAddressId,
  onSelectAddress,
  onClose,
}: FlipkartAddressManagerModalProps) {
  const { user, addAddress, removeAddress } = useAuth();
  const savedAddresses = user?.addresses || [];

  // View state: 'list' (if saved addresses exist) or 'map_and_form' (to add new address)
  const [view, setView] = useState<'list' | 'map_and_form'>(() => {
    return savedAddresses.length > 0 ? 'list' : 'map_and_form';
  });

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(DEFAULT_MAP_CENTER);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [isAwayMode, setIsAwayMode] = useState(false);

  // Geocoded data
  const [addressData, setAddressData] = useState<ReverseGeocodeResult | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Detailed Address Form State
  const [houseNo, setHouseNo] = useState(currentAddress?.houseNo || '');
  const [street, setStreet] = useState(currentAddress?.street || '');
  const [landmark, setLandmark] = useState(currentAddress?.landmark || '');
  const [city, setCity] = useState(currentAddress?.city || 'Indore');
  const [stateName, setStateName] = useState(currentAddress?.state || 'Madhya Pradesh');
  const [pincode, setPincode] = useState(currentAddress?.pincode || '452005');
  const [fullName, setFullName] = useState(currentAddress?.name || user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(
    currentAddress?.phone || user?.phone?.replace(/\D/g, '').slice(-10) || ''
  );
  const [addressType, setAddressType] = useState<'Home' | 'Work'>(
    (currentAddress?.addressType as 'Home' | 'Work') || 'Home'
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Reverse Geocode coordinates via OpenStreetMap Nominatim
   */
  const handleReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const res = await reverseGeocodeOpenStreetMap(lat, lng);
      setAddressData(res);

      if (res.houseNo && !houseNo) {
        setHouseNo(res.houseNo);
      }
      if (res.street || res.area) {
        setStreet(res.street || res.area);
      }
      if (res.city) {
        setCity(res.city);
      }
      if (res.state) {
        setStateName(res.state);
      }
      if (res.pincode && /^\d{6}$/.test(res.pincode)) {
        setPincode(res.pincode);
      }
    } catch (err) {
      console.warn('Geocoding notice:', err);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [houseNo]);

  /**
   * Initialize Leaflet map when entering 'map_and_form' view
   */
  useEffect(() => {
    if (view !== 'map_and_form' || !mapContainerRef.current) return;

    const startLat = currentCoords.lat || DEFAULT_MAP_CENTER.lat;
    const startLng = currentCoords.lng || DEFAULT_MAP_CENTER.lng;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

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

    // Auto-locate GPS on mount if not in away mode and no initial pincode
    if (!isAwayMode && (!currentAddress?.pincode || currentAddress.pincode.length !== 6)) {
      getCurrentDeviceLocation()
        .then((loc) => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([loc.lat, loc.lng], 17);
            handleReverseGeocode(loc.lat, loc.lng);
          }
        })
        .catch(() => {
          handleReverseGeocode(startLat, startLng);
        });
    } else {
      handleReverseGeocode(startLat, startLng);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [view, isAwayMode]);

  /**
   * Search Input Autocomplete
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
   * Select Search Result & Pan Map
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
   * Use Current Location GPS
   */
  const handleUseCurrentLocation = async () => {
    setIsLocatingGPS(true);
    setGpsError('');
    setIsAwayMode(false);

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
      setTimeout(() => setGpsError(''), 4500);
    } finally {
      setIsLocatingGPS(false);
    }
  };

  /**
   * Away From My Location (Deliver to Family / Friends in other cities)
   */
  const handleAwayFromLocation = (hub?: typeof POPULAR_DESTINATION_HUBS[0]) => {
    setIsAwayMode(true);
    setGpsError('');

    const target = hub || POPULAR_DESTINATION_HUBS[0];
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], 15, {
        duration: 1.2,
      });
      handleReverseGeocode(target.lat, target.lng);
    }
  };

  /**
   * Pincode change handler in detailed form
   */
  const handleFormPincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);

    if (clean.length === 6) {
      try {
        const info = await lookupPincode(clean);
        if (info) {
          setCity(info.city);
          setStateName(info.state);
          if (!street && info.area) {
            setStreet(info.area);
          }
        }
      } catch {
        // silent
      }
    }
  };

  /**
   * Form Validation & Save Action
   */
  const handleSaveAndDeliver = async () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Please enter recipient full name';
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length !== 10) {
      errors.phoneNumber = 'Please enter a valid 10-digit mobile number';
    }
    if (!houseNo.trim()) {
      errors.houseNo = 'Please enter flat / house / building number';
    }
    if (!street.trim()) {
      errors.street = 'Please enter street, road or area name';
    }
    if (!city.trim()) {
      errors.city = 'Please enter city or district';
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      errors.pincode = 'Please enter a valid 6-digit postal pincode';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    try {
      const fullStreetParts: string[] = [];
      if (houseNo.trim()) fullStreetParts.push(houseNo.trim());
      if (street.trim()) fullStreetParts.push(street.trim());
      if (landmark.trim()) fullStreetParts.push(`Near ${landmark.trim()}`);
      const fullDoorstep = fullStreetParts.join(', ');

      const finalFullAddress = [
        fullDoorstep,
        city.trim(),
        stateName.trim(),
        pincode.trim(),
      ]
        .filter(Boolean)
        .join(', ');

      // Save to user profile / Firestore / localStorage
      await addAddress({
        label: addressType,
        name: fullName.trim(),
        phone: phoneNumber.trim(),
        address: fullDoorstep,
        city: city.trim(),
        pincode: pincode.trim(),
      });

      // Dispatch to active checkout state
      onSelectAddress({
        name: fullName.trim(),
        phone: phoneNumber.trim(),
        houseNo: houseNo.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        addressType,
        fullAddress: finalFullAddress,
      });

      onClose();
    } catch (err) {
      console.error('Error saving address:', err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Select an existing saved address from the list
   */
  const handleSelectExistingAddress = (addr: AddressEntry) => {
    onSelectAddress({
      id: addr.id,
      name: addr.name,
      phone: addr.phone,
      houseNo: '',
      street: addr.address,
      landmark: '',
      city: addr.city,
      state: 'Madhya Pradesh',
      pincode: addr.pincode,
      addressType: (addr.label as 'Home' | 'Work') || 'Home',
      fullAddress: `${addr.address}, ${addr.city} - ${addr.pincode}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 animate-fade-in">
      <div className="relative w-full h-[96dvh] sm:h-[720px] sm:max-w-xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-flipkart-600 to-flipkart-700 px-4 py-3.5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            {view === 'map_and_form' && savedAddresses.length > 0 ? (
              <button
                type="button"
                onClick={() => setView('list')}
                className="p-1 -ml-1 text-white/90 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Back to saved addresses"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white/20 text-accent-300 flex items-center justify-center font-black">
                <MapPin size={18} />
              </div>
            )}
            <div>
              <h2 className="text-sm sm:text-base font-black leading-tight">
                {view === 'list' ? 'Select Delivery Address' : 'Add New Delivery Address'}
              </h2>
              <p className="text-[11px] text-blue-100">
                {view === 'list'
                  ? `${savedAddresses.length} saved addresses in your account`
                  : 'Pinpoint doorstep on interactive map & confirm'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: SAVED ADDRESSES LIST WITH EXPLICIT '+ Add new address' */}
        {/* ------------------------------------------------------------- */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/70">
            {/* Explicit '+ Add new address' trigger button */}
            <button
              type="button"
              onClick={() => {
                setView('map_and_form');
                setIsAwayMode(false);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between transition-all cursor-pointer group"
              id="checkout-add-new-address-btn"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <Plus size={20} className="stroke-[3]" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black block tracking-tight leading-tight">
                    + Add New Address
                  </span>
                  <span className="text-[11px] text-blue-100 font-medium">
                    Use interactive map & GPS auto-detection
                  </span>
                </div>
              </div>
              <div className="bg-white/20 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                <Navigation size={13} />
                <span>Map Drop</span>
              </div>
            </button>

            {/* List of Saved Addresses */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">
                Saved Delivery Addresses
              </span>

              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectExistingAddress(addr)}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'border-flipkart-500 ring-2 ring-flipkart-500/20 shadow-md bg-blue-50/20'
                        : 'border-gray-200 hover:border-gray-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {/* Radio selector indicator */}
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-flipkart-600 bg-flipkart-600' : 'border-gray-400'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm font-black text-gray-900">{addr.name}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 flex items-center gap-1">
                          {addr.label === 'Work' ? <Briefcase size={10} /> : <Home size={10} />}
                          <span>{addr.label || 'Home'}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAddress(addr.id);
                        }}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <p className="text-xs text-gray-700 pl-6 leading-relaxed">
                      {addr.address}, {addr.city} - <strong className="text-gray-900">{addr.pincode}</strong>
                    </p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 pl-6 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-medium text-gray-600">
                        <Phone size={12} className="text-gray-400" />
                        +91 {addr.phone}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectExistingAddress(addr);
                        }}
                        className={`text-xs font-black px-3 py-1 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-flipkart-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-flipkart-50 hover:text-flipkart-700'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Deliver Here'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: ZOMATO / FLIPKART-STYLE MAP & DETAILED ADDRESS FORM   */}
        {/* ------------------------------------------------------------- */}
        {view === 'map_and_form' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Top Search & GPS Actions Bar */}
            <div className="absolute top-2 left-2 right-2 z-[400] space-y-1.5 pointer-events-auto">
              <div className="flex items-center gap-2">
                {/* Search Bar with Autocomplete */}
                <div className="flex-1 relative">
                  <div className="flex items-center bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-flipkart-500 transition-all">
                    <Search size={16} className="text-gray-400 ml-3 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search area, street, landmark, city..."
                      className="w-full px-2.5 py-2.5 text-xs text-gray-900 outline-none bg-transparent placeholder:text-gray-400 font-medium"
                    />
                    {isSearching ? (
                      <Loader2 size={14} className="animate-spin text-flipkart-600 mr-2.5 shrink-0" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className="p-1 mr-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-48 overflow-y-auto z-[500] animate-fade-in divide-y divide-gray-100">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSearchResult(item)}
                          className="w-full text-left p-2.5 hover:bg-blue-50/70 active:bg-blue-100 transition-colors flex items-start gap-2 cursor-pointer"
                        >
                          <MapPin size={15} className="text-flipkart-600 shrink-0 mt-0.5" />
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

              {/* Away From Location Quick Destination Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocatingGPS}
                  className={`text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md border flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                    !isAwayMode
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {isLocatingGPS ? (
                    <Loader2 size={12} className="animate-spin text-amber-400" />
                  ) : (
                    <Crosshair size={12} className="text-amber-400" />
                  )}
                  <span>Use Current Location</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAwayFromLocation()}
                  className={`text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md border flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                    isAwayMode
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Globe size={12} className="text-blue-300" />
                  <span>Away from my location</span>
                </button>

                {POPULAR_DESTINATION_HUBS.slice(0, 4).map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => handleAwayFromLocation(hub)}
                    className="bg-white/95 hover:bg-white text-gray-800 text-[10px] font-bold px-2 py-1 rounded-xl shadow-sm border border-gray-200 shrink-0 cursor-pointer"
                  >
                    {hub.name}
                  </button>
                ))}
              </div>

              {gpsError && (
                <div className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center justify-between animate-shake">
                  <span>{gpsError}</span>
                  <button onClick={() => setGpsError('')} className="p-0.5">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Leaflet Map View (Responsive height) */}
            <div className="relative h-48 sm:h-56 w-full bg-slate-100 overflow-hidden shrink-0 border-b border-gray-200">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* ZOMATO / BLINKIT STYLE PIN DROP OVERLAY (Center fixed) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[300] flex flex-col items-center">
                <div
                  className={`bg-slate-900/95 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-2xl border border-slate-700 mb-1 flex items-center gap-1 whitespace-nowrap transition-transform duration-200 ${
                    isMapMoving ? '-translate-y-2 scale-95 opacity-80' : 'translate-y-0 scale-100 opacity-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span>Order will be delivered here</span>
                </div>

                <div
                  className={`transition-transform duration-200 origin-bottom ${
                    isMapMoving ? '-translate-y-2 scale-110' : 'translate-y-0 scale-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xl border-2 border-white">
                    <MapPin size={20} className="fill-white stroke-rose-600" />
                  </div>
                </div>

                <div
                  className={`w-3.5 h-1 bg-black/40 rounded-full blur-[1px] transition-all duration-200 ${
                    isMapMoving ? 'scale-75 opacity-30' : 'scale-100 opacity-80'
                  }`}
                />
              </div>

              {/* Floating Re-center button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="absolute right-3 bottom-3 z-[350] bg-white text-slate-900 p-2 rounded-xl shadow-lg border border-gray-200 flex items-center gap-1 text-[11px] font-black active:scale-95 cursor-pointer"
                title="Current location"
              >
                <Crosshair size={14} className="text-flipkart-600" />
                <span className="hidden sm:inline">GPS</span>
              </button>
            </div>

            {/* Auto-detected Location Card & Detailed Address Form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white">
              {/* Detected Location Card */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-emerald-950">
                      {isLoadingAddress ? (
                        <span className="text-gray-500 flex items-center gap-1 font-normal">
                          <Loader2 size={12} className="animate-spin" /> Detecting location...
                        </span>
                      ) : (
                        addressData?.area || city || 'Selected Spot'
                      )}
                    </span>
                    <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">
                      Auto-Detected
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 line-clamp-1 mt-0.5 font-medium">
                    {addressData?.formattedAddress || `${city}, ${stateName} - ${pincode}`}
                  </p>
                </div>
              </div>

              {/* Detailed Form Fields */}
              <div className="space-y-3 text-left">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Complete Doorstep Details
                </span>

                {/* Flat / House No & Street */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                      <Building size={12} className="text-gray-400" /> Flat / House / Floor No. *
                    </label>
                    <input
                      type="text"
                      value={houseNo}
                      onChange={(e) => {
                        setHouseNo(e.target.value);
                        if (formErrors.houseNo) setFormErrors((p) => ({ ...p, houseNo: '' }));
                      }}
                      placeholder="e.g. Flat 302, 3rd Floor"
                      className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:bg-white focus:border-flipkart-500 transition-all ${
                        formErrors.houseNo ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.houseNo && (
                      <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                        {formErrors.houseNo}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                      <Navigation size={12} className="text-gray-400" /> Area / Street / Colony *
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => {
                        setStreet(e.target.value);
                        if (formErrors.street) setFormErrors((p) => ({ ...p, street: '' }));
                      }}
                      placeholder="e.g. 60 Feet Road, Near Mandir"
                      className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:bg-white focus:border-flipkart-500 transition-all ${
                        formErrors.street ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.street && (
                      <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                        {formErrors.street}
                      </span>
                    )}
                  </div>
                </div>

                {/* Landmark & Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Famous Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Behind Water Tank"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:bg-white focus:border-flipkart-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between mb-1">
                      <span>Delivery Pincode *</span>
                      <span className="text-[10px] text-blue-600 font-bold">Auto-Verified</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        handleFormPincodeChange(e.target.value);
                        if (formErrors.pincode) setFormErrors((p) => ({ ...p, pincode: '' }));
                      }}
                      placeholder="6-digit postal pincode"
                      className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:bg-white focus:border-flipkart-500 font-mono font-bold tracking-wider ${
                        formErrors.pincode ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.pincode && (
                      <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                        {formErrors.pincode}
                      </span>
                    )}
                  </div>
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">City / District *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (formErrors.city) setFormErrors((p) => ({ ...p, city: '' }));
                      }}
                      placeholder="City"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:bg-white focus:border-flipkart-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">State *</label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="State"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:bg-white focus:border-flipkart-500"
                    />
                  </div>
                </div>

                {/* Recipient Details: Name & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                      <User size={12} className="text-gray-400" /> Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (formErrors.fullName) setFormErrors((p) => ({ ...p, fullName: '' }));
                      }}
                      placeholder="Recipient full name"
                      className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-xs text-gray-900 outline-none focus:bg-white focus:border-flipkart-500 ${
                        formErrors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                      }`}
                    />
                    {formErrors.fullName && (
                      <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                        {formErrors.fullName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                      <Phone size={12} className="text-gray-400" /> Phone Number *
                    </label>
                    <div
                      className={`flex items-center border rounded-xl overflow-hidden bg-gray-50 focus-within:bg-white focus-within:border-flipkart-500 ${
                        formErrors.phoneNumber ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                      }`}
                    >
                      <span className="px-2.5 py-2 bg-gray-100 text-xs font-bold text-gray-600 border-r border-gray-200">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                          if (formErrors.phoneNumber) setFormErrors((p) => ({ ...p, phoneNumber: '' }));
                        }}
                        placeholder="10-digit mobile number"
                        className="w-full px-2.5 py-2 text-xs text-gray-900 outline-none bg-transparent"
                      />
                    </div>
                    {formErrors.phoneNumber && (
                      <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                        {formErrors.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Address Type Tag Selector (Home / Work) */}
                <div className="pt-1">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Address Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAddressType('Home')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        addressType === 'Home'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Home size={14} />
                      <span>Home (All day delivery)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddressType('Work')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        addressType === 'Work'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Briefcase size={14} />
                      <span>Work (10 AM - 5 PM)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Address & Deliver Here CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveAndDeliver}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-flipkart-500 to-flipkart-600 hover:from-flipkart-600 hover:to-flipkart-700 text-white font-black text-sm py-3.5 px-4 rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  id="checkout-save-and-deliver-btn"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  <span>Save Address & Deliver Here</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
