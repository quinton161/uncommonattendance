import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchHubs, type Hub } from '../../services/hubService';
import { MapPin, ArrowRight, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';

export const HubSelectGate: React.FC = () => {
  const { setHub, logout } = useAuth();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchHubs().then(setHubs); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hub = hubs.find(h => h.id === selected);
    if (!hub) { toast.error('Select a hub'); return; }
    setLoading(true);
    try {
      await setHub({ id: hub.id, name: hub.name });
    } catch {
      toast.error('Failed to set hub. Please try again or sign out.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      toast.error('Sign out failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center page-bg" style={{ background: 'linear-gradient(135deg, #001466 0%, #0052CC 60%, #1a7fff 100%)' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0052CC]/10 flex items-center justify-center mb-6 mx-auto">
          <MapPin size={24} className="text-[#0052CC]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Select Your Hub</h2>
        <p className="text-gray-400 text-sm text-center mb-8">Choose the Uncommon hub you're attending</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {hubs.map(hub => (
              <label key={hub.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected === hub.id ? 'border-[#0052CC] bg-[#0052CC]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="hub" value={hub.id} checked={selected === hub.id} onChange={() => setSelected(hub.id)} className="sr-only" />
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected === hub.id ? 'border-[#0052CC]' : 'border-gray-300'}`}>
                  {selected === hub.id && <div className="w-2 h-2 rounded-full bg-[#0052CC]" />}
                </div>
                <span className="text-sm font-medium text-gray-700">{hub.name}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={!selected || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#003D99] !text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4 [&_*]:!text-white"
          >
            {loading ? 'Saving...' : <>Continue <ArrowRight size={16} /></>}
          </button>
        </form>

        {/* Safety escape hatch — prevents users from being trapped */}
        <button
          onClick={handleSignOut}
          className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
};
