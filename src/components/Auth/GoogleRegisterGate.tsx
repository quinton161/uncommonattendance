import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchHubs, type Hub } from '../../services/hubService';
import { ArrowRight, X } from 'lucide-react';
import { toast } from 'react-toastify';

export const GoogleRegisterGate: React.FC = () => {
  const { user, completeGoogleProfile, cancelGoogleRegistration } = useAuth();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [userType, setUserType] = useState<'attendee' | 'instructor'>('attendee');
  const [hubId, setHubId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchHubs().then(setHubs); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { toast.error('Enter your name'); return; }
    const hub = hubs.find(h => h.id === hubId);
    setLoading(true);
    try {
      await completeGoogleProfile(displayName, userType, hub ? { id: hub.id, name: hub.name } : undefined);
    } catch {
      toast.error('Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center page-bg">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Complete Profile</h2>
            <p className="text-gray-400 text-sm mt-1">Just a few more details</p>
          </div>
          <button onClick={cancelGoogleRegistration} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 text-sm bg-gray-50/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Role</label>
            <select
              value={userType}
              onChange={e => setUserType(e.target.value as 'attendee' | 'instructor')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 text-sm bg-gray-50/50"
            >
              <option value="attendee">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Hub</label>
            <select
              value={hubId}
              onChange={e => setHubId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 text-sm bg-gray-50/50"
            >
              <option value="">Select hub (optional)</option>
              {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#003D99] !text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2 [&_*]:!text-white"
          >
            {loading ? 'Saving...' : <>Complete Setup <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};
