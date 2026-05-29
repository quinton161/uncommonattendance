import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_HUBS, fetchHubs, initialStaffHubFilter, type Hub } from '../services/hubService';
import { MapPin } from 'lucide-react';
import {
  attendanceAnalyticsService,
  type DateRange,
} from '../services/attendanceAnalyticsService';
import { computeAndSaveMonthlyAwards } from '../services/monthlyAwardsService';
import { createNotification } from '../services/notificationFeedService';
import { toast } from 'react-toastify';
import { LeaderboardMonthPicker } from '../components/Rankings/LeaderboardMonthPicker';
import { HubLeaderboardSection } from '../components/Rankings/HubLeaderboardSection';
import { StudentLeaderboardSection } from '../components/Rankings/StudentLeaderboardSection';

export const RankingsPage: React.FC = () => {
  const { user } = useAuth();
  const isStaff = user?.userType === 'admin' || user?.userType === 'instructor';
  const defaultHub = initialStaffHubFilter(user ?? null) || user?.hubId;
  const [selectedHub, setSelectedHub] = useState<string | undefined>(defaultHub);
  const [hubs, setHubs] = useState<Hub[]>(DEFAULT_HUBS);
  const [computing, setComputing] = useState(false);
  const [range, setRange] = useState<DateRange>(() =>
    attendanceAnalyticsService.currentCalendarMonthRange()
  );

  React.useEffect(() => {
    fetchHubs().then((h) => {
      if (h.length) setHubs(h);
    });
  }, []);

  const shiftMonth = (delta: number) => {
    const [y, m] = range.startDate.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1 + delta, 1);
    setRange(attendanceAnalyticsService.calendarMonthRange(d.getFullYear(), d.getMonth()));
  };

  const studentHubId = isStaff ? selectedHub : user?.hubId;

  const handleComputeAwards = async () => {
    const hub = studentHubId || selectedHub;
    if (!hub || !isStaff) return;
    setComputing(true);
    try {
      const hubMeta = hubs.find((h) => h.id === hub);
      const doc = await computeAndSaveMonthlyAwards(range, hub, hubMeta?.name);
      if (doc.winners[0]) {
        await createNotification({
          type: 'award',
          title: 'Monthly awards updated',
          body: `${doc.winners[0].studentName} leads ${doc.hubName} for ${doc.period}`,
          hubId: hub,
          hubName: doc.hubName,
          studentId: doc.winners[0].studentId,
          studentName: doc.winners[0].studentName,
        });
      }
      toast.success('Monthly awards saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save awards');
    } finally {
      setComputing(false);
    }
  };

  const hubFilter =
    isStaff ? (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedHub(undefined)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            selectedHub === undefined
              ? 'bg-[#0052CC] text-white'
              : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          All hubs
        </button>
        {hubs.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setSelectedHub(h.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              selectedHub === h.id
                ? 'bg-[#0052CC] text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            <MapPin size={11} /> {h.name}
          </button>
        ))}
      </div>
    ) : undefined;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-8">
      <div>
        <p className="text-xs font-bold text-[#0052CC] uppercase tracking-widest">Recognition</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">Leaderboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monthly hub and student attendance rankings — visible to everyone.
        </p>
      </div>

      <div className="bg-white rounded-[20px] border border-[rgba(0,82,204,0.06)] p-5">
        <LeaderboardMonthPicker range={range} onShiftMonth={shiftMonth} />
      </div>

      <HubLeaderboardSection range={range} />

      <div className="h-px bg-[rgba(0,82,204,0.08)]" />

      <StudentLeaderboardSection range={range} hubId={studentHubId} hubFilter={hubFilter} />

      {isStaff && studentHubId && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={computing}
            onClick={handleComputeAwards}
            className="px-5 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-semibold hover:bg-[#003D99] disabled:opacity-50 transition-colors"
          >
            {computing ? 'Saving awards…' : 'Compute & save monthly awards'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RankingsPage;
