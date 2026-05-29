import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../Common/StatCard';
import DataService from '../../services/DataService';
import { qrCodeService } from '../../services/qrCodeService';
import { DEFAULT_HUBS, fetchHubs, initialStaffHubFilter, resolvedHubLabel, type Hub } from '../../services/hubService';
import type { DailyQRCode } from '../../services/qrCodeService';
import { format } from 'date-fns';
import { Users, CheckCircle2, Clock, XCircle, QrCode, RefreshCw, Copy, TrendingUp, Zap, MapPin, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import { LateStudentsPanel } from './LateStudentsPanel';
import { AdminTopStudentsPreview } from '../Rankings/AdminTopStudentsPreview';
const DataSvc = DataService.getInstance();

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const isGlobalAdmin = user?.userType === 'admin' || user?.userType === 'instructor';

  const defaultHub = initialStaffHubFilter(user ?? null) || undefined;
  const [selectedHub, setSelectedHub] = useState<string | undefined>(defaultHub);

  const [todaySummary, setTodaySummary] = useState<any>(null);
  const [students, setStudents] = useState<Record<string, unknown>[]>([]);
  const [qrCode, setQrCode] = useState<DailyQRCode | null>(null);

  const [loading, setLoading] = useState(true);
  const [genQr, setGenQr] = useState(false);
  const [allHubs, setAllHubs] = useState<Hub[]>(DEFAULT_HUBS);

  const pageRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchHubs()
      .then((h) => {
        if (h.length > 0) setAllHubs(h);
      })
      .catch(() => {});
  }, []);

  const hubs = isGlobalAdmin ? allHubs : allHubs.filter((h) => h.id === defaultHub);
  void hubs;


  const loadHub = useCallback(
    async (hubId: string | undefined) => {
      setLoading(true);

      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }

      // QR code
      try {
        let qr = await qrCodeService.getDailyCode();
        if (!qr) {
          await qrCodeService.generateDailyCode();
          qr = await qrCodeService.getDailyCode();
        }
        setQrCode(qr ?? null);
      } catch {
        setQrCode(null);
      }

      // Students
      try {
        const users = await DataSvc.getUsers(hubId);
        setStudents(users as unknown as Record<string, unknown>[]);
      } catch {
        setStudents([]);
      }

      // Real-time summary
      try {
        const unsub = (DataSvc as any).subscribeToTodayAttendance
          ? (DataSvc as any).subscribeToTodayAttendance(
              (r: any) => {
                // subscribeToTodayAttendance emits a summary object, not an attendance array
                setTodaySummary(r);
                setLoading(false);
              },
              hubId
            )
          : () => {};

        unsubRef.current = unsub;
      } catch {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadHub(selectedHub);
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [selectedHub, loadHub]);

  useEffect(() => {
    const unsub = qrCodeService.subscribeToDailyCode((qr) => setQrCode(qr));
    return unsub;
  }, []);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const els = pageRef.current.querySelectorAll('.gsap-target');
    gsap.fromTo(
      els,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power2.out' }
    );
  }, [loading, selectedHub]);

  const generateQr = async () => {
    setGenQr(true);
    try {
      await qrCodeService.generateDailyCode();
      const code = await qrCodeService.getDailyCode();
      if (code) setQrCode(code);
      toast.success('New code generated!');
    } finally {
      setGenQr(false);
    }
  };

  const present = todaySummary?.presentCount ?? todaySummary?.presentCount === 0 ? todaySummary.presentCount : 0;
  const late = todaySummary?.lateCount ?? 0;
  const absent = todaySummary?.absentCount ?? 0;

  const total = students.length;
  const checkedIn = present + late;
  const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
  const chartData = [
    { name: 'Present', value: present, color: '#0052CC' },
    { name: 'Late', value: late, color: '#f59e0b' },
    { name: 'Absent', value: absent, color: '#f87171' },
    { name: 'No data', value: Math.max(0, total - checkedIn - absent), color: '#e0e7ff' },
  ].filter((d) => d.value > 0);

  const greetHour = new Date().getHours();
  const greet = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div ref={pageRef} className="space-y-5">
      <div className="gsap-target flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-0.5">
            {greet}, {user?.displayName?.split(' ')[0]} 👋
          </h2>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <MapPin size={11} /> {resolvedHubLabel({ hubId: selectedHub })}
          </div>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${
            rate >= 80
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : rate >= 60
                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          <TrendingUp size={15} />
          {loading ? '…' : `${rate}% today`}
        </div>
      </div>

      {isGlobalAdmin && (
        <div className="gsap-target flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedHub(undefined)}
            title="All Hubs"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              selectedHub === undefined
                ? 'bg-[#0052CC] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-200'
            }`}
          >
            <Building2 size={14} /> All Hubs
          </button>
          {allHubs.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setSelectedHub(h.id)}
              title={h.name}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedHub === h.id
                  ? 'bg-[#0052CC] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-200'
              }`}
            >
              <MapPin size={13} /> {h.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={loading ? '—' : total} icon={<Users size={19} />} color="blue" sub="Enrolled" />
        <StatCard label="Present" value={loading ? '—' : present} icon={<CheckCircle2 size={19} />} color="green" sub="On time" />
        <StatCard label="Late" value={loading ? '—' : late} icon={<Clock size={19} />} color="orange" sub="After 9 AM" />
        <StatCard label="Absent" value={loading ? '—' : absent} icon={<XCircle size={19} />} color="red" sub="No check-in" />
      </div>

      <div className="gsap-target">
        <LateStudentsPanel
          attendanceList={todaySummary?.attendanceList}
          loading={loading}
          showHubColumn={isGlobalAdmin && selectedHub === undefined}
        />
      </div>

      <div className="gsap-target">
        <AdminTopStudentsPreview hubId={selectedHub} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="gsap-target xl:col-span-2 bg-white rounded-[20px] border border-[rgba(0,82,204,0.06)] p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">Today's Attendance</h3>
            <p className="text-xs text-gray-400 mt-0.5">{format(new Date(), 'MMMM d, yyyy')} · {resolvedHubLabel({ hubId: selectedHub })}</p>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${rate >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {rate}% rate
            </span>
          </div>

          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={48} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5FF" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: 'Chillax' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: 'none',
                      borderRadius: '14px',
                      boxShadow: '0 8px 24px rgba(0,82,204,0.12)',
                      fontSize: '13px',
                      fontFamily: 'Chillax',
                    }}
                    cursor={{ fill: 'rgba(0,82,204,0.03)' }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-medium">Overall attendance rate</span>
                  <span className="text-xs font-bold text-gray-800">{rate}%</span>
                </div>
                <div className="h-2 bg-[#EEF2FF] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${rate}%`, background: '#0052CC' }}
                    />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="gsap-target bg-gradient-to-br from-[#0052CC] to-[#003D99] rounded-[20px] p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Today's QR</p>
                <p className="text-sm font-bold">{format(new Date(), 'MMM d')}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {qrCode && <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-bold">AUTO</span>}
                <QrCode size={16} className="text-white/60" />
              </div>
            </div>

            {qrCode ? (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-2xl">
                  <QRCodeSVG value={qrCode.code} size={110} level="H" />
                </div>

                <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-4 py-2 w-full justify-between">
                  <span className="text-base font-bold tracking-[0.2em] font-mono">{qrCode.code}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(qrCode.code);
                      toast.success('Code copied!');
                    }}
                    title="Copy code"
                    aria-label="Copy code"
                  >
                    <Copy size={14} className="text-white/70 hover:text-white" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={generateQr}
                  disabled={genQr}
                  className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors"
                  title="Regenerate QR"
                >
                  <RefreshCw size={11} className={genQr ? 'animate-spin' : ''} /> Regenerate
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                  <QrCode size={28} className="text-white/50" />
                </div>
                <button
                  type="button"
                  onClick={generateQr}
                  disabled={genQr}
                  className="px-5 py-2.5 bg-white text-[#0052CC] text-sm font-bold rounded-xl"
                  title="Generate Code"
                >
                  {genQr ? 'Generating…' : 'Generate Code'}
                </button>
              </div>
            )}
          </div>

          <div className="gsap-target bg-white rounded-[20px] border border-[rgba(0,82,204,0.06)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Staff on Duty</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#0052CC] to-[#1a7fff] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.displayName?.[0]?.toUpperCase() ?? 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.displayName}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.userType === 'attendee' ? 'Student' : user?.userType}</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-start gap-2">
                <Zap size={12} className="text-violet-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Today's QR was auto-generated at startup. Students can scan it or enter the code manually to check in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
);
};

export default AdminDashboard;

