import React, { useState } from 'react';
import {
  MapPin,
  X,
  Plus,
  Phone,
  Home,
  Briefcase,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import InteractiveMapAddressPicker, { type SelectedMapAddress } from './InteractiveMapAddressPicker';
import type { AddressEntry } from '@/auth-context';

interface InteractiveAddressManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: AddressEntry[];
  selectedAddressId?: string | null;
  currentAddressSummary?: {
    name: string;
    phone: string;
    houseNo: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    addressType: 'Home' | 'Work' | 'Other';
  };
  onSelectAddress: (address: {
    id?: string;
    name: string;
    phone: string;
    houseNo: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    addressType: 'Home' | 'Work' | 'Other';
  }) => void;
  onAddNewAddressToProfile?: (address: Omit<AddressEntry, 'id'>) => Promise<void>;
}

export default function InteractiveAddressManagerModal({
  isOpen,
  onClose,
  addresses,
  selectedAddressId,
  currentAddressSummary,
  onSelectAddress,
  onAddNewAddressToProfile,
}: InteractiveAddressManagerModalProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(selectedAddressId || null);

  if (!isOpen) return null;

  const handleChooseExisting = (addr: AddressEntry) => {
    setActiveId(addr.id);
    onSelectAddress({
      id: addr.id,
      name: addr.name,
      phone: addr.phone,
      houseNo: '',
      street: addr.address,
      city: addr.city,
      state: 'Madhya Pradesh',
      pincode: addr.pincode,
      addressType: (addr.label as 'Home' | 'Work' | 'Other') || 'Home',
    });
    onClose();
  };

  const handleMapAddressSaved = async (mapAddr: SelectedMapAddress) => {
    // If logged in, add to saved addresses
    if (onAddNewAddressToProfile) {
      try {
        await onAddNewAddressToProfile({
          name: mapAddr.name,
          phone: mapAddr.phone,
          label: mapAddr.addressType,
          address: `${mapAddr.houseNo ? mapAddr.houseNo + ', ' : ''}${mapAddr.street}${mapAddr.landmark ? ', Near ' + mapAddr.landmark : ''}`,
          city: mapAddr.city,
          pincode: mapAddr.pincode,
        });
      } catch (err) {
        console.warn('Failed to save to profile:', err);
      }
    }

    onSelectAddress({
      name: mapAddr.name,
      phone: mapAddr.phone,
      houseNo: mapAddr.houseNo,
      street: mapAddr.street,
      landmark: mapAddr.landmark,
      city: mapAddr.city,
      state: mapAddr.state,
      pincode: mapAddr.pincode,
      addressType: mapAddr.addressType,
    });

    setShowMapPicker(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-flipkart-50 text-flipkart-600 flex items-center justify-center font-bold">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Delivery Address</h3>
                <p className="text-[11px] text-gray-500">Choose where to deliver your order</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body: Saved addresses list + Add New trigger */}
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
            {/* Explicit Add New Address Button (Zomato/Flipkart style) */}
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 hover:from-blue-100 hover:to-amber-100 border-2 border-dashed border-flipkart-300 hover:border-flipkart-500 rounded-2xl p-3.5 text-left transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-flipkart-500 text-white flex items-center justify-center shadow-md shadow-flipkart-500/20 group-hover:scale-105 transition-transform">
                  <Plus size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-flipkart-700">
                      + Add New Address
                    </span>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                      <Sparkles size={9} /> Map & GPS
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Drop pin on interactive map or auto-detect via GPS
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-flipkart-500 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Saved Addresses Section */}
            {addresses && addresses.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">
                  Saved Addresses ({addresses.length})
                </span>

                <div className="space-y-2">
                  {addresses.map((addr) => {
                    const isSelected = activeId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleChooseExisting(addr)}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-flipkart-500 bg-flipkart-50/40 ring-2 ring-flipkart-500/20 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                                isSelected ? 'border-flipkart-600 bg-flipkart-600' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-gray-900">{addr.name}</span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 uppercase flex items-center gap-0.5">
                                  {addr.label?.toLowerCase() === 'work' ? (
                                    <Briefcase size={10} />
                                  ) : (
                                    <Home size={10} />
                                  )}
                                  {addr.label || 'Home'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                {addr.address}, {addr.city} - <span className="font-bold text-gray-900">{addr.pincode}</span>
                              </p>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold mt-1">
                                <Phone size={11} className="text-gray-400" />
                                <span>+91 {addr.phone}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChooseExisting(addr);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                              isSelected
                                ? 'bg-flipkart-600 text-white shadow-xs'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                            }`}
                          >
                            {isSelected ? 'Delivering Here' : 'Deliver Here'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 space-y-2">
                <MapPin size={32} className="mx-auto text-gray-300" />
                <p className="text-xs font-semibold">No saved addresses yet in your profile.</p>
                <p className="text-[11px] text-gray-400">
                  Click "+ Add New Address" above to place a pin on the map.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Picker Sub-modal */}
      {showMapPicker && (
        <InteractiveMapAddressPicker
          initialName={currentAddressSummary?.name}
          initialPhone={currentAddressSummary?.phone}
          initialPincode={currentAddressSummary?.pincode}
          initialAddress={currentAddressSummary?.houseNo}
          initialCity={currentAddressSummary?.city}
          initialState={currentAddressSummary?.state}
          onSelectAddress={handleMapAddressSaved}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </>
  );
}
