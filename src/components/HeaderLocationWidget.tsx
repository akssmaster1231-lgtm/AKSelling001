import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, X, Check, Loader2 } from 'lucide-react';
import { lookupPincode, getStoredDeliveryLocation, setStoredDeliveryLocation, type PincodeInfo } from '@/utils/pincode';
import { useAuth } from '@/auth-context';

export default function HeaderLocationWidget() {
  const { user } = useAuth();
  const [location, setLocation] = useState<PincodeInfo>(getStoredDeliveryLocation);
  const [isOpen, setIsOpen] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewInfo, setPreviewInfo] = useState<PincodeInfo | null>(null);

  // Sync if saved address exists in user profile
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const primary = user.addresses[0];
      if (primary.pincode && /^\d{6}$/.test(primary.pincode)) {
        lookupPincode(primary.pincode).then(info => {
          if (info) {
            setLocation(info);
            setStoredDeliveryLocation(info);
          }
        });
      }
    }
  }, [user]);

  // Listen to external location updates
  useEffect(() => {
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent<PincodeInfo>;
      if (customEvent.detail) {
        setLocation(customEvent.detail);
      }
    };
    window.addEventListener('akselling:delivery_location_changed', handleLocationChange);
    return () => window.removeEventListener('akselling:delivery_location_changed', handleLocationChange);
  }, []);

  const handleOpen = () => {
    setInputPin(location.pincode || '');
    setPreviewInfo(null);
    setError('');
    setIsOpen(true);
  };

  const handlePinInput = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setInputPin(clean);
    setError('');

    if (clean.length === 6) {
      setIsLoading(true);
      try {
        const info = await lookupPincode(clean);
        if (info) {
          setPreviewInfo(info);
        } else {
          setError('Could not verify pincode. Please try again.');
        }
      } catch {
        setError('Error detecting location.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setPreviewInfo(null);
    }
  };

  const handleApply = async () => {
    if (inputPin.length !== 6) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setIsLoading(true);
    try {
      const info = await lookupPincode(inputPin);
      if (info) {
        setLocation(info);
        setStoredDeliveryLocation(info);
        setIsOpen(false);
      } else {
        setError('Invalid PIN code. Please enter a valid Indian pincode.');
      }
    } catch {
      setError('Failed to update delivery location.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSavedAddress = async (pin: string) => {
    if (!pin) return;
    setIsLoading(true);
    try {
      const info = await lookupPincode(pin);
      if (info) {
        setLocation(info);
        setStoredDeliveryLocation(info);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Flipkart-Style Header Location Pill */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1 text-[11px] sm:text-xs text-white/95 hover:text-white bg-white/15 hover:bg-white/20 active:bg-white/25 px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer truncate max-w-[200px] sm:max-w-xs"
        title="Change delivery location"
        id="header-location-selector-btn"
      >
        <MapPin size={13} className="text-accent-300 shrink-0" />
        <span className="truncate">
          Deliver to <strong className="font-bold text-white">{location.city} {location.pincode}</strong>
        </span>
        <ChevronDown size={12} className="opacity-80 shrink-0 ml-0.5" />
      </button>

      {/* Location Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 animate-scale-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-flipkart-600 to-flipkart-700 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-accent-300" />
                <h3 className="font-bold text-sm">Select Delivery Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600">
                Enter your pincode to check product availability and accurate delivery timelines for your area.
              </p>

              {/* Pincode Input Box */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Enter 6-Digit PIN Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      maxLength={6}
                      value={inputPin}
                      onChange={e => handlePinInput(e.target.value)}
                      placeholder="e.g. 452001 or 110001"
                      className="w-full pl-8 pr-3 py-2 text-sm font-bold tracking-wider bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-flipkart-500"
                      autoFocus
                    />
                    <MapPin size={15} className="absolute left-2.5 top-3 text-gray-400" />
                  </div>

                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isLoading || inputPin.length !== 6}
                    className="px-4 py-2 text-xs font-extrabold text-white bg-flipkart-600 hover:bg-flipkart-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {error && <p className="text-[11px] text-red-600 font-semibold mt-1.5">{error}</p>}
              </div>

              {/* Detected Location Preview */}
              {(previewInfo || (location && inputPin === location.pincode)) && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Check size={14} className="text-emerald-600" />
                    <span>Deliverable Area Detected:</span>
                  </div>
                  <p className="text-xs text-emerald-900 font-extrabold pl-5">
                    {(previewInfo || location).city}, {(previewInfo || location).state} - {(previewInfo || location).pincode}
                  </p>
                  <p className="text-[10px] text-emerald-700 pl-5">
                    ⚡ Standard Delivery: 2-3 Business Days • Free Shipping Available
                  </p>
                </div>
              )}

              {/* Saved Addresses from user profile if available */}
              {user?.addresses && user.addresses.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-700 block mb-2">
                    Or select from your saved addresses:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {user.addresses.map((addr, idx) => (
                      <button
                        key={addr.id || `addr_${idx}`}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr.pincode)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                          location.pincode === addr.pincode
                            ? 'border-flipkart-500 bg-blue-50/50 ring-1 ring-flipkart-400 font-bold text-gray-900'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-gray-900">{addr.name}</span>
                          <span className="text-gray-500 text-[11px] block truncate">
                            {addr.address}, {addr.city} ({addr.pincode})
                          </span>
                        </div>
                        {location.pincode === addr.pincode && (
                          <Check size={15} className="text-flipkart-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Preset Buttons */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">
                  Popular Delivery Hubs:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { city: 'Indore', pin: '452001' },
                    { city: 'Bhopal', pin: '462001' },
                    { city: 'New Delhi', pin: '110001' },
                    { city: 'Mumbai', pin: '400001' },
                    { city: 'Bengaluru', pin: '560001' },
                  ].map(hub => (
                    <button
                      key={hub.pin}
                      type="button"
                      onClick={() => handleSelectSavedAddress(hub.pin)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        location.pincode === hub.pin
                          ? 'bg-flipkart-50 text-flipkart-700 border-flipkart-300'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {hub.city} ({hub.pin})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
