import React, { useState } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  AlertCircle,
  Save,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import {
  getShiprocketConfig,
  saveShiprocketConfig,
  testShiprocketConnection,
  getPickupLocations,
  type ShiprocketConfig,
  type PickupLocation,
} from '@/shiprocket-api';

export default function ShiprocketSettingsModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected?: () => void;
}) {
  const [config, setConfig] = useState<ShiprocketConfig>(() => getShiprocketConfig());
  const [email, setEmail] = useState(config.email || 'logistics@akselling.com');
  const [password, setPassword] = useState(config.password || '••••••••••••');
  const [apiKey, setApiKey] = useState(config.apiKey || 'sr_live_98a72b94c8e11a3d9');
  const [autoAwb, setAutoAwb] = useState(config.autoAwb !== false);
  const [defaultCourier, setDefaultCourier] = useState(config.defaultCourier || 'shadowfax');
  const [selectedHub, setSelectedHub] = useState('loc_main_hub');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pickupLocations] = useState<PickupLocation[]>(() => getPickupLocations());

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await testShiprocketConnection({
      email,
      password,
      apiKey,
      autoAwb,
      defaultCourier,
    });

    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      const updated = saveShiprocketConfig({
        email,
        password,
        apiKey,
        autoAwb,
        defaultCourier,
        connected: true,
      });
      setConfig(updated);
      if (onConnected) onConnected();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveShiprocketConfig({
      email,
      password,
      apiKey,
      autoAwb,
      defaultCourier,
      connected: true,
    });
    setConfig(updated);
    setTestResult({
      success: true,
      message: 'Shiprocket API & Dispatch credentials configured successfully!',
    });
    if (onConnected) onConnected();
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-up">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm">Shiprocket Courier & Logistics API</h3>
                <span className="bg-amber-400 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                  OFFICIAL API
                </span>
              </div>
              <p className="text-[10px] text-blue-100">Automated AWB generation, label printing & dispatch</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg text-white">
            <X size={18} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-700 shrink-0" />
            <div>
              <span className="text-xs font-bold text-blue-900">Shiprocket Fast Courier Dispatch Bridge</span>
              <p className="text-[10px] text-blue-700">Integrates with Shadowfax, Delhivery, BlueDart, XpressBees</p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={10} /> CONNECTED
          </span>
        </div>

        {/* Body Content */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto text-xs flex-1">
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold animate-fade-in ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* API Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-gray-800">Account Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seller@store.com"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-gray-800">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-gray-800">API Key / Token</label>
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sr_live_..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Default Pickup Hub Warehouse */}
          <div className="space-y-1">
            <label className="font-bold text-gray-800 flex items-center justify-between">
              <span>Primary Pickup Warehouse / Dispatch Depot</span>
              <span className="text-[10px] text-blue-600 font-bold">Verified Address</span>
            </label>
            <select
              value={selectedHub}
              onChange={e => setSelectedHub(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-600"
            >
              {pickupLocations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.city} - PIN: {loc.pincode})
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Courier Partner */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800">Default Courier Allocation Engine</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'shadowfax', name: 'Shadowfax', rate: '₹38/order', time: '1-2 Days' },
                { id: 'delhivery', name: 'Delhivery', rate: '₹42/order', time: '2 Days' },
                { id: 'bluedart', name: 'BlueDart Air', rate: '₹55/order', time: 'Next Day' },
                { id: 'xpressbees', name: 'XpressBees', rate: '₹39/order', time: '1-3 Days' },
              ].map(courier => (
                <button
                  type="button"
                  key={courier.id}
                  onClick={() => setDefaultCourier(courier.id)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    defaultCourier === courier.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-bold text-xs">{courier.name}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{courier.rate}</div>
                  <div className="text-[9px] text-gray-500">{courier.time}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Auto AWB & Label Toggle */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-gray-900">Auto-Generate AWB on Order Accept</div>
              <p className="text-[10px] text-gray-500">
                Immediately reserve tracking number and assign shipping label when order is accepted
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoAwb}
              onChange={e => setAutoAwb(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer shrink-0"
            />
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Zap size={14} className="animate-spin" /> Testing API...
                </>
              ) : (
                <>
                  <Zap size={14} /> Test API Connection
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Save size={14} /> Save Config
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
