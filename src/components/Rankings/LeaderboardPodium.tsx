import React from 'react';
import { MapPin } from 'lucide-react';

export type PodiumEntry = {
  rank: number;
  id: string;
  name: string;
  subtitle?: string;
  photoUrl?: string;
  rate: number;
  primaryStat?: string;
  secondaryStats?: Array<{ label: string; value: string | number }>;
};

type Props = {
  entries: PodiumEntry[];
  loading?: boolean;
  emptyMessage?: string;
  variant?: 'student' | 'hub';
};

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_ORDER = [1, 0, 2];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export const LeaderboardPodium: React.FC<Props> = ({
  entries,
  loading = false,
  emptyMessage = 'No rankings for this period yet.',
  variant = 'student',
}) => {
  const top3 = entries.slice(0, 3);
  const ordered = PODIUM_ORDER.map((i) => top3[i]).filter(Boolean) as PodiumEntry[];

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (top3.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-10">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      {ordered.map((entry) => {
        const isFirst = entry.rank === 1;
        return (
          <div
            key={entry.id}
            className={`relative rounded-[20px] border-2 bg-white p-5 flex flex-col items-center text-center transition-shadow ${
              isFirst
                ? 'border-[#0052CC] shadow-[0_8px_32px_rgba(0,82,204,0.18)] md:-translate-y-2 md:scale-[1.02]'
                : 'border-[rgba(0,82,204,0.08)]'
            } ${entry.rank === 2 ? 'md:order-1' : ''} ${entry.rank === 1 ? 'md:order-2' : ''} ${
              entry.rank === 3 ? 'md:order-3' : ''
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl" aria-hidden>
              {MEDALS[entry.rank - 1]}
            </span>
            {variant === 'student' ? (
              entry.photoUrl ? (
                <img
                  src={entry.photoUrl}
                  alt=""
                  className={`rounded-2xl object-cover border-2 border-white shadow-md ${
                    isFirst ? 'w-20 h-20' : 'w-16 h-16'
                  }`}
                />
              ) : (
                <div
                  className={`rounded-2xl bg-gradient-to-br from-[#0052CC] to-[#003D99] text-white font-bold flex items-center justify-center ${
                    isFirst ? 'w-20 h-20 text-xl' : 'w-16 h-16 text-lg'
                  }`}
                >
                  {initials(entry.name)}
                </div>
              )
            ) : (
              <div
                className={`rounded-2xl bg-[#EEF4FF] flex items-center justify-center ${
                  isFirst ? 'w-20 h-20' : 'w-16 h-16'
                }`}
              >
                <MapPin size={isFirst ? 28 : 22} className="text-[#0052CC]" />
              </div>
            )}
            <h4 className="mt-3 font-bold text-gray-900 text-sm sm:text-base line-clamp-2">{entry.name}</h4>
            {entry.subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 justify-center">
                {variant === 'hub' && <MapPin size={10} />}
                {entry.subtitle}
              </p>
            )}
            <p className="mt-2 text-2xl font-bold text-[#0052CC]">{entry.rate}%</p>
            {entry.primaryStat && <p className="text-xs text-gray-500">{entry.primaryStat}</p>}
            {entry.secondaryStats && entry.secondaryStats.length > 0 && (
              <div className="mt-3 w-full grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                {entry.secondaryStats.map((st) => (
                  <div key={st.label} className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">{st.label}</p>
                    <p className="text-sm font-bold text-gray-800">{st.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LeaderboardPodium;
