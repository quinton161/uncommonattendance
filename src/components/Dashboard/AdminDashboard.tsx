import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../Common/StatCard';
import DataService from '../../services/DataService';
import { qrCodeService } from '../../services/qrCodeService';
import { DEFAULT_HUBS, fetchHubs, initialStaffHubFilter, resolvedHubLabel, type Hub } from '../../services/hubService';
import type { DailyQRCode } from '../../services/qrCodeService';
import { format } from 'date-fns';
import { Users, CheckCircle2, Clock, XCircle, QrCode, RefreshCw, Copy, TrendingUp, Zap, MapPin, Building2, Smartphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import { LateStudentsPanel } from './LateStudentsPanel';
import { AdminTopStudentsPreview } from '../Rankings/AdminTopStudentsPreview';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const DataSvc = DataService.getInstance();

const PageWrap = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const GreetingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const GreetingDate = styled.p`
  font-size: 12px;
  font-weight: 700;
  color: ${theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0;
`;

const Greeting = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin: 0;
  letter-spacing: -0.03em;
`;

const LocationBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin-top: 2px;
`;

const RateBadge = styled.div<{ $rate: number }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  background: ${({ $rate }) => $rate >= 80 ? '#ecfdf5' : $rate >= 60 ? '#fffbeb' : '#fef2f2'};
  color: ${({ $rate }) => $rate >= 80 ? '#059669' : $rate >= 60 ? '#d97706' : '#dc2626'};
  border: 1px solid ${({ $rate }) => $rate >= 80 ? 'rgba(5, 150, 105, 0.2)' : $rate >= 60 ? 'rgba(217, 119, 6, 0.2)' : 'rgba(220, 38, 38, 0.2)'};
`;

const TopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
`;

const Space = styled.div<{ size?: string }>`
  height: ${({ size }) => size || '20px'};
`;

const HubFilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 20px;
`;

const HubBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $active }) => ($active ? '#0052CC' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : theme.colors.textSecondary)};
  box-shadow: ${({ $active }) => ($active ? '0 2px 8px rgba(0, 82, 204, 0.25)' : '0 1px 2px rgba(0,0,0,0.04)')};
  border: ${({ $active }) => ($active ? 'none' : '1px solid rgba(0, 82, 204, 0.08)')};

  &:hover {
    background: ${({ $active }) => ($active ? '#003D99' : '#f8faff')};
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const HealthCard = styled.div`
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 82, 204, 0.06);
  padding: 14px 18px;
  margin-bottom: 20px;
`;

const HealthText = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: ${theme.colors.textSecondary};
`;

const HealthLabel = styled.span`
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const MismatchTag = styled.span`
  font-weight: 700;
  color: #d97706;
`;

const ChartRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-top: 20px;

  @media (max-width: ${theme.breakpoints.laptop}) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 82, 204, 0.06);
  padding: 24px;
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: ${theme.colors.textPrimary};
`;

const ChartSub = styled.p`
  font-size: 12px;
  color: ${theme.colors.textLight};
  margin: 2px 0 0;
`;

const RatePill = styled.span<{ $rate: number }>`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 100px;
  background: ${({ $rate }) => $rate >= 80 ? '#ecfdf5' : '#fffbeb'};
  color: ${({ $rate }) => $rate >= 80 ? '#059669' : '#d97706'};
`;

const ProgressBar = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 82, 204, 0.04);
`;

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ProgressLabel = styled.span`
  font-size: 12px;
  color: ${theme.colors.textLight};
  font-weight: 500;
`;

const ProgressValue = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const ProgressTrack = styled.div`
  height: 8px;
  background: #EEF2FF;
  border-radius: 100px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $width: number }>`
  height: 100%;
  border-radius: 100px;
  background: linear-gradient(90deg, #0052CC, #1a7fff);
  width: ${({ $width }) => $width}%;
  transition: width 1s ease;
`;

const QrCard = styled.div`
  background: linear-gradient(135deg, #0052CC 0%, #003D99 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -20%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
  }
`;

const QrHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
`;

const QrTitle = styled.p`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
`;

const QrDate = styled.p`
  font-size: 14px;
  font-weight: 700;
  margin: 2px 0 0;
`;

const AutoBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 10px;
  border-radius: 100px;
`;

const QrBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
`;

const QrBox = styled.div`
  padding: 12px;
  background: #ffffff;
  border-radius: 16px;
`;

const CodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  border-radius: 10px;
  padding: 10px 14px;
  width: 100%;
  justify-content: space-between;
`;

const CodeText = styled.span`
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.2em;
  font-family: 'Fira Code', monospace;
  user-select: all;
`;

const CopyBtn = styled.button`
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #ffffff;
  }
`;

const RegenerateBtn = styled.button`
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;

  &:hover {
    color: #ffffff;
  }
`;

const StaffCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 82, 204, 0.06);
  padding: 20px;
`;

const StaffTitle = styled.h3`
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  color: ${theme.colors.textPrimary};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ActiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
`;

const StaffRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
`;

const StaffAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #0052CC, #1a7fff);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 82, 204, 0.15);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const StaffName = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StaffRole = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  color: ${theme.colors.textLight};
  text-transform: capitalize;
`;

const ActiveTag = styled.span`
  font-size: 11px;
  font-weight: 700;
  background: #ecfdf5;
  color: #059669;
  padding: 2px 10px;
  border-radius: 100px;
  margin-left: auto;
`;

const StaffNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 82, 204, 0.04);
`;

const StaffNoteText = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${theme.colors.textLight};
  line-height: 1.5;
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

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
  const summarySigRef = useRef<string>('');

  useEffect(() => {
    fetchHubs()
      .then((h) => {
        if (h.length > 0) setAllHubs(h);
      })
      .catch(() => {});
  }, []);

  const loadHub = useCallback(
    async (hubId: string | undefined) => {
      setLoading(true);

      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }

      try {
        const qr = await qrCodeService.ensureTodayCode(true);
        setQrCode(qr ?? null);
        if (!qr) {
          toast.warn('Could not load today\'s check-in code. Tap Generate Code.');
        }
      } catch (err: unknown) {
        setQrCode(null);
        const code =
          err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : '';
        toast.error(
          code === 'permission-denied'
            ? 'No permission to create today\'s check-in code.'
            : 'Failed to load check-in code.'
        );
      }

      try {
        const users = await DataSvc.getUsers(hubId);
        setStudents(users as unknown as Record<string, unknown>[]);
      } catch {
        setStudents([]);
      }

      try {
        const unsub = (DataSvc as any).subscribeToTodayAttendance
          ? (DataSvc as any).subscribeToTodayAttendance(
              (r: any) => {
                const nextSig = JSON.stringify({
                  totalUsers: r?.totalUsers ?? 0,
                  presentCount: r?.presentCount ?? 0,
                  absentCount: r?.absentCount ?? 0,
                  lateCount: r?.lateCount ?? 0,
                  attendanceSize: Array.isArray(r?.attendanceList) ? r.attendanceList.length : 0,
                });
                if (nextSig !== summarySigRef.current) {
                  summarySigRef.current = nextSig;
                  setTodaySummary(r);
                }
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
    let healing = false;
    const unsub = qrCodeService.subscribeToDailyCode((qr) => {
      if (qr) {
        setQrCode(qr);
        return;
      }
      if (healing) return;
      healing = true;
      void qrCodeService
        .ensureTodayCode(true)
        .then((fresh) => {
          if (fresh) setQrCode(fresh);
        })
        .catch(() => {})
        .finally(() => {
          healing = false;
        });
    });
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
    } catch (err: unknown) {
      toast.error('Could not generate code. Check connection and permissions.');
    } finally {
      setGenQr(false);
    }
  };

  const copyCheckInCode = async (code: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        toast.success('Code copied!');
        return;
      }
    } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) {
        toast.success('Code copied!');
        return;
      }
    } catch {}
    toast.info('Select the code and copy manually (long-press on mobile).');
  };

  const isStudent = (u: Record<string, unknown>) => {
    const t = String(u?.userType || '').trim().toLowerCase();
    return !t || t === 'attendee' || t === 'student';
  };

  const present = todaySummary?.presentCount ?? todaySummary?.presentCount === 0 ? todaySummary.presentCount : 0;
  const late = todaySummary?.lateCount ?? 0;
  const absent = todaySummary?.absentCount ?? 0;

  const total =
    todaySummary?.totalUsers ??
    students.filter(isStudent).length;
  const checkedIn = present;
  const onTime = Math.max(0, present - late);
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
    <PageWrap ref={pageRef}>
      <TopRow>
        <GreetingSection>
          <GreetingDate>{format(new Date(), 'EEEE, MMMM d, yyyy')}</GreetingDate>
          <Greeting>{greet}, {user?.displayName?.split(' ')[0]}</Greeting>
          <LocationBadge>
            <MapPin size={12} /> {resolvedHubLabel({ hubId: selectedHub })}
          </LocationBadge>
        </GreetingSection>
        <RateBadge $rate={rate}>
          <TrendingUp size={15} />
          {loading ? '…' : `${rate}% today`}
        </RateBadge>
      </TopRow>

      {isGlobalAdmin && (
        <HubFilterRow>
          <HubBtn $active={selectedHub === undefined} onClick={() => setSelectedHub(undefined)}>
            <Building2 size={14} /> All Hubs
          </HubBtn>
          {allHubs.map((h) => (
            <HubBtn key={h.id} $active={selectedHub === h.id} onClick={() => setSelectedHub(h.id)}>
              <MapPin size={13} /> {h.name}
            </HubBtn>
          ))}
        </HubFilterRow>
      )}

      <StatsRow>
        <StatCard label="Total Students" value={loading ? '—' : total} icon={<Users size={19} />} color="blue" sub="Rostered" />
        <StatCard label="Present" value={loading ? '—' : present} icon={<CheckCircle2 size={19} />} color="green" sub={`On time: ${onTime}`} />
        <StatCard label="Late" value={loading ? '—' : late} icon={<Clock size={19} />} color="orange" sub="After 9 AM" />
        <StatCard label="Absent" value={loading ? '—' : absent} icon={<XCircle size={19} />} color="red" sub="No check-in" />
      </StatsRow>

      <HealthCard>
        {loading ? (
          <span style={{ fontSize: 13, color: theme.colors.textLight }}>Checking stats…</span>
        ) : (
          <HealthText>
            <HealthLabel>Health check:</HealthLabel>
            <span>Present ({present}) = On-time ({onTime}) + Late ({late})</span>
            <span>Total ({total}) = Present ({present}) + Absent ({absent})</span>
            {total !== present + absent && (
              <MismatchTag>
                ⚠ {total - (present + absent)} student(s) have no attendance row yet
              </MismatchTag>
            )}
          </HealthText>
        )}
      </HealthCard>

      <div className="gsap-target">
        <LateStudentsPanel
          attendanceList={todaySummary?.attendanceList}
          loading={loading}
          showHubColumn={isGlobalAdmin && selectedHub === undefined}
        />
      </div>

      <Space size="20px" />
      <div className="gsap-target">
        <AdminTopStudentsPreview hubId={selectedHub} />
      </div>

      <ChartRow>
        <ChartCard>
          <ChartHeader>
            <div>
              <ChartTitle>Today's Attendance</ChartTitle>
              <ChartSub>{format(new Date(), 'MMMM d, yyyy')} · {resolvedHubLabel({ hubId: selectedHub })}</ChartSub>
            </div>
            <RatePill $rate={rate}>{rate}% rate</RatePill>
          </ChartHeader>

          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 24, height: 24, border: '2px solid #0052CC', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={48} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5FF" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: 'none',
                      borderRadius: '14px',
                      boxShadow: '0 8px 24px rgba(0,82,204,0.12)',
                      fontSize: '13px',
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

              <ProgressBar>
                <ProgressRow>
                  <ProgressLabel>Overall attendance rate</ProgressLabel>
                  <ProgressValue>{rate}%</ProgressValue>
                </ProgressRow>
                <ProgressTrack>
                  <ProgressFill $width={rate} />
                </ProgressTrack>
              </ProgressBar>
            </>
          )}
        </ChartCard>

        <SideColumn>
          <QrCard>
            <QrHeader>
              <div>
                <QrTitle>Today's QR</QrTitle>
                <QrDate>{format(new Date(), 'MMM d')}</QrDate>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {qrCode && <AutoBadge>AUTO</AutoBadge>}
                <Smartphone size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
            </QrHeader>

            {qrCode ? (
              <QrBody>
                <QrBox>
                  <QRCodeSVG value={qrCode.code} size={110} level="H" />
                </QrBox>
                <CodeRow>
                  <CodeText>{qrCode.code}</CodeText>
                  <CopyBtn onClick={() => void copyCheckInCode(qrCode.code)} title="Copy code">
                    <Copy size={14} />
                  </CopyBtn>
                </CodeRow>
                <RegenerateBtn onClick={generateQr} disabled={genQr}>
                  <RefreshCw size={11} className={genQr ? 'animate-spin' : ''} /> Regenerate
                </RegenerateBtn>
              </QrBody>
            ) : (
              <QrBody>
                <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={28} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
                <button
                  onClick={generateQr}
                  disabled={genQr}
                  style={{ padding: '10px 24px', background: '#fff', color: '#0052CC', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  {genQr ? 'Generating…' : 'Generate Code'}
                </button>
              </QrBody>
            )}
          </QrCard>

          <StaffCard>
            <StaffTitle>
              Staff on Duty
              <ActiveDot />
            </StaffTitle>
            <StaffRow>
              <StaffAvatar>
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="" />
                ) : (
                  user?.displayName?.[0]?.toUpperCase() ?? 'U'
                )}
              </StaffAvatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <StaffName>{user?.displayName}</StaffName>
                <StaffRole>{user?.userType === 'attendee' ? 'Student' : user?.userType}</StaffRole>
              </div>
              <ActiveTag>Active</ActiveTag>
            </StaffRow>
            <StaffNote>
              <Zap size={12} style={{ color: '#8B5CF6', marginTop: 2, flexShrink: 0 }} />
              <StaffNoteText>
                Today's code is created when staff open this dashboard. Share the QR or code with students for check-in.
              </StaffNoteText>
            </StaffNote>
          </StaffCard>
        </SideColumn>
      </ChartRow>
    </PageWrap>
  );
};

export default AdminDashboard;
