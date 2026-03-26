import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { UncommonLogo } from '../Common/UncommonLogo';
import { AttendanceService } from '../../services/attendanceService';
import DataService from '../../services/DataService';
import { TimeService } from '../../services/timeService';
import { uniqueToast } from '../../utils/toastUtils';
import { FiChevronLeft, FiCalendar, FiUser, FiCheckCircle, FiClock, FiXCircle, FiTrendingUp, FiLogIn, FiLogOut, FiMapPin } from 'react-icons/fi';

// ── Styled components ─────────────────────────────────────────────────────────
const Page    = styled.div<{e?:boolean}>`padding:${p=>p.e?'0':theme.spacing.xl};width:100%;min-height:100vh;background:${theme.colors.backgroundSecondary};`;
const Wrap    = styled.div<{e?:boolean}>`padding:${p=>p.e?theme.spacing.lg:'0'};`;
const Header  = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:${theme.spacing.xl};padding-bottom:${theme.spacing.lg};border-bottom:2px solid ${theme.colors.primary};gap:${theme.spacing.md};@media(max-width:${theme.breakpoints.tablet}){flex-direction:column;align-items:stretch;}`;
const HTitle  = styled.div`h1{font-family:${theme.fonts.heading};font-size:${theme.fontSizes['3xl']};font-weight:${theme.fontWeights.bold};color:${theme.colors.textPrimary};margin:0 0 ${theme.spacing.sm} 0;}p{color:${theme.colors.textSecondary};margin:0;font-size:${theme.fontSizes.lg};}`;
const Controls= styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:${theme.spacing.xl};gap:${theme.spacing.md};@media(max-width:${theme.breakpoints.tablet}){flex-direction:column;align-items:stretch;}`;
const DateNav = styled.div`display:flex;align-items:center;gap:${theme.spacing.md};background:${theme.colors.white};padding:${theme.spacing.md};border-radius:${theme.borderRadius.lg};box-shadow:${theme.shadows.sm};`;
const DateDisp= styled.div`font-size:${theme.fontSizes.lg};font-weight:${theme.fontWeights.medium};color:${theme.colors.textPrimary};min-width:200px;text-align:center;`;
const NavBtn  = styled.button`background:none;border:1px solid ${theme.colors.gray300};border-radius:${theme.borderRadius.md};padding:${theme.spacing.sm};cursor:pointer;color:${theme.colors.textSecondary};display:flex;align-items:center;&:hover{border-color:${theme.colors.primary};color:${theme.colors.primary};}`;
const Grid4   = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:${theme.spacing.lg};margin-bottom:${theme.spacing.xl};`;
const Stat    = styled.div<{v?:string}>`background:${p=>{switch(p.v){case'present':return'linear-gradient(135deg,#22c55e,#16a34a)';case'absent':return'linear-gradient(135deg,#ef4444,#dc2626)';case'late':return'linear-gradient(135deg,#f59e0b,#d97706)';case'total':return`linear-gradient(135deg,${theme.colors.primary},${theme.colors.primaryDark})`;default:return theme.colors.white;}}};color:${p=>p.v?theme.colors.white:theme.colors.textPrimary};padding:${theme.spacing.lg};border-radius:${theme.borderRadius.lg};box-shadow:${theme.shadows.md};text-align:center;position:relative;overflow:hidden;`;
const SVal    = styled.div`font-size:${theme.fontSizes['2xl']};font-weight:${theme.fontWeights.bold};margin-bottom:${theme.spacing.xs};`;
const SLbl    = styled.div`font-size:${theme.fontSizes.sm};opacity:0.9;`;
const Section = styled.div`background:${theme.colors.white};border-radius:${theme.borderRadius.lg};box-shadow:${theme.shadows.md};overflow:hidden;`;
const SecHdr  = styled.div`padding:${theme.spacing.lg};background:${theme.colors.gray50};border-bottom:1px solid ${theme.colors.gray200};h3{margin:0;font-size:${theme.fontSizes.xl};font-weight:${theme.fontWeights.semibold};color:${theme.colors.textPrimary};display:flex;align-items:center;gap:${theme.spacing.sm};}`;
const TblHdr  = styled.div`display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr;gap:${theme.spacing.md};padding:${theme.spacing.md} ${theme.spacing.lg};background:${theme.colors.gray100};font-weight:${theme.fontWeights.semibold};color:${theme.colors.textSecondary};font-size:${theme.fontSizes.sm};text-transform:uppercase;@media(max-width:${theme.breakpoints.tablet}){display:none;}`;
const TblRow  = styled.div<{p?:boolean}>`display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr;gap:${theme.spacing.md};padding:${theme.spacing.lg};border-bottom:1px solid ${theme.colors.gray100};align-items:center;background:${p=>p.p===false?'#fef2f2':'transparent'};&:hover{background:${theme.colors.gray50};}&:last-child{border-bottom:none;}@media(max-width:${theme.breakpoints.tablet}){grid-template-columns:1fr;gap:${theme.spacing.sm};}`;
const StuInfo = styled.div`display:flex;align-items:center;gap:${theme.spacing.md};`;
const Avatar  = styled.div`width:40px;height:40px;border-radius:50%;background:${theme.colors.primary};color:${theme.colors.white};display:flex;align-items:center;justify-content:center;font-weight:${theme.fontWeights.bold};font-size:${theme.fontSizes.sm};`;
const StuDet  = styled.div`.name{font-weight:${theme.fontWeights.medium};color:${theme.colors.textPrimary};margin-bottom:2px;}.email{font-size:${theme.fontSizes.sm};color:${theme.colors.textSecondary};}`;
const Badge   = styled.div<{s:'present'|'absent'|'late'}>`display:inline-flex;align-items:center;gap:${theme.spacing.xs};padding:${theme.spacing.xs} ${theme.spacing.sm};border-radius:${theme.borderRadius.full};font-size:${theme.fontSizes.sm};font-weight:${theme.fontWeights.medium};${p=>{switch(p.s){case'present':return'background:rgba(34,197,94,0.1);color:#16a34a;';case'late':return'background:rgba(245,158,11,0.1);color:#d97706;';default:return'background:rgba(239,68,68,0.1);color:#dc2626;';}}}`;
const TimeD   = styled.div`display:flex;align-items:center;gap:${theme.spacing.xs};font-size:${theme.fontSizes.sm};color:${theme.colors.textSecondary};.time{font-weight:${theme.fontWeights.medium};color:${theme.colors.textPrimary};}`;
const Loading = styled.div`display:flex;justify-content:center;align-items:center;padding:${theme.spacing['3xl']};color:${theme.colors.textSecondary};`;
const Empty   = styled.div`text-align:center;padding:${theme.spacing['3xl']};color:${theme.colors.textSecondary};h3{font-size:${theme.fontSizes.xl};margin-bottom:${theme.spacing.sm};color:${theme.colors.textPrimary};}`;
// ─────────────────────────────────────────────────────────────────────────────

interface StudentRow {
  studentId: string; studentName: string; email: string;
  status: 'present'|'absent'|'late';
  checkInTime?: Date; checkOutTime?: Date; deviceIp?: string;
}

interface Props { onBack?:()=>void; isEmbedded?:boolean; }

export const DailyAttendanceTracker: React.FC<Props> = ({ onBack, isEmbedded=true }) => {
  const ts = TimeService.getInstance();
  const [date,    setDate]    = useState(ts.getCurrentTime());
  const [rows,    setRows]    = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState({ total:0, present:0, absent:0, late:0 });

  const attendanceService = AttendanceService.getInstance();
  const dataService       = DataService.getInstance();

  /** FIXED: determine lateness via Harare timezone parsing, not raw getHours() */
  const calcLate = (t: Date): boolean => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(t);
    const h = Number(parts.find(p=>p.type==='hour')?.value ?? NaN);
    const m = Number(parts.find(p=>p.type==='minute')?.value ?? NaN);
    return Number.isFinite(h) && Number.isFinite(m) && (h > 9 || (h === 9 && m >= 0));
  };

  const load = async () => {
    try {
      setLoading(true);
      const today    = ts.getCurrentDateString();
      const dateStr  = new Intl.DateTimeFormat('en-CA', { timeZone:'Africa/Harare', year:'numeric', month:'2-digit', day:'2-digit' }).format(date);
      const finalDate = dateStr > today ? today : dateStr;
      if (finalDate !== dateStr) setDate(ts.getCurrentTime());

      const [users, records] = await Promise.all([
        dataService.getUsers(),
        attendanceService.getAttendanceByDateRange(finalDate, finalDate),
      ]);

      const students = users.filter((u:any) => u.userType === 'attendee');
      const map      = new Map(records.map((r:any) => [r.studentId || r.id, r]));

      const built: StudentRow[] = students.map((s:any) => {
        const rec = map.get(s.id) || map.get(s.uid);
        if (rec) {
          const late = rec.checkInTime ? calcLate(rec.checkInTime) : false;
          return { studentId:s.id||s.uid, studentName:s.displayName||'Unknown', email:s.email||'',
                   status: late ? 'late' : 'present', checkInTime:rec.checkInTime, checkOutTime:rec.checkOutTime,
                   deviceIp: rec.location?.ip || '-' };
        }
        return { studentId:s.id||s.uid, studentName:s.displayName||'Unknown', email:s.email||'', status:'absent' };
      });

      setRows(built);
      setStats({
        total:   students.length,
        present: built.filter(r=>r.status==='present').length,
        late:    built.filter(r=>r.status==='late').length,
        absent:  built.filter(r=>r.status==='absent').length,
      });
    } catch (e) {
      console.error(e);
      uniqueToast.error('Failed to load attendance data');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [date]);

  const nav = (dir: 'prev'|'next') => {
    const d = new Date(date);
    d.setDate(d.getDate() + (dir==='prev' ? -1 : 1));
    setDate(d);
  };

  const fmt = (d:Date) => d.toLocaleDateString('en-US',{ weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const fmtT= (d?:Date|null) => d ? d.toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit', hour12:true }) : '-';
  const ini = (n:string) => n.split(' ').map(w=>w[0]).join('').toUpperCase();
  const wknd= (d:Date) => d.getDay()===0||d.getDay()===6;

  if (loading) return <Page e={isEmbedded}><Wrap e={isEmbedded}><Loading>Loading daily attendance...</Loading></Wrap></Page>;

  return (
    <Page e={isEmbedded}>
      <Wrap e={isEmbedded}>
        <Header>
          <HTitle>
            <h1 style={{ display:'flex', alignItems:'center', gap:theme.spacing.lg, margin:0 }}>
              <UncommonLogo size="lg" showSubtitle={false} />
              <span>Daily Attendance Tracker</span>
            </h1>
            <p>Monitor student attendance by day</p>
          </HTitle>
        </Header>

        <Controls>
          <DateNav>
            <NavBtn onClick={()=>nav('prev')}><FiChevronLeft size={16}/></NavBtn>
            <DateDisp>
              <FiCalendar size={20} style={{ marginRight:theme.spacing.xs }}/>
              {fmt(date)}
              {wknd(date) && <span style={{ color:theme.colors.warning, fontSize:theme.fontSizes.sm, marginLeft:theme.spacing.xs }}>(Weekend)</span>}
            </DateDisp>
            <NavBtn onClick={()=>nav('next')}><FiChevronLeft size={16} style={{ transform:'rotate(180deg)' }}/></NavBtn>
          </DateNav>
          <Button variant="outline" onClick={()=>setDate(ts.getCurrentTime())}>Go to Today</Button>
          <Button variant="danger" onClick={async()=>{
            if(!window.confirm('Clear ALL attendance records for today?')) return;
            setLoading(true);
            const n = await attendanceService.clearTodayAttendance();
            uniqueToast.success(`Cleared ${n} records`);
            load();
          }}>Clear Today</Button>
        </Controls>

        <Grid4>
          {(['total','present','late','absent'] as const).map(v=>(
            <Stat key={v} v={v}>
              {v==='total'&&<FiUser size={24} style={{position:'absolute',top:8,right:8,opacity:0.3}}/>}
              {v==='present'&&<FiCheckCircle size={24} style={{position:'absolute',top:8,right:8,opacity:0.3}}/>}
              {v==='late'&&<FiClock size={24} style={{position:'absolute',top:8,right:8,opacity:0.3}}/>}
              {v==='absent'&&<FiXCircle size={24} style={{position:'absolute',top:8,right:8,opacity:0.3}}/>}
              <SVal>{stats[v]}</SVal>
              <SLbl>{v==='total'?'Total Students':v==='present'?'Present (On Time)':v==='late'?'Present (Late)':'Absent'}</SLbl>
            </Stat>
          ))}
        </Grid4>

        <Section>
          <SecHdr><h3><FiCalendar size={20}/>Student Attendance Details</h3></SecHdr>
          {rows.length===0 ? (
            <Empty><FiUser size={64}/><h3>No Students</h3><p>No student records for this date.</p></Empty>
          ) : (
            <>
              <TblHdr><div>Student</div><div>Status</div><div>Check In</div><div>Check Out</div><div>IP</div><div>Location</div></TblHdr>
              {rows.map(s=>(
                <TblRow key={s.studentId} p={s.status!=='absent'}>
                  <StuInfo>
                    <Avatar>{ini(s.studentName)}</Avatar>
                    <StuDet><div className="name">{s.studentName}</div><div className="email">{s.email}</div></StuDet>
                  </StuInfo>
                  <Badge s={s.status}>
                    {s.status==='present'&&<FiCheckCircle size={12}/>}
                    {s.status==='late'&&<FiTrendingUp size={12}/>}
                    {s.status==='absent'&&<FiXCircle size={12}/>}
                    {s.status.charAt(0).toUpperCase()+s.status.slice(1)}
                  </Badge>
                  <TimeD>{s.checkInTime&&<FiLogIn size={14}/>}<span className="time">{fmtT(s.checkInTime)}</span></TimeD>
                  <TimeD>{s.checkOutTime&&<FiLogOut size={14}/>}<span className="time">{fmtT(s.checkOutTime)}</span></TimeD>
                  <TimeD><span className="time" style={{fontSize:'11px'}}>{s.deviceIp||'-'}</span></TimeD>
                  <TimeD>{s.deviceIp&&s.deviceIp!=='-'&&<FiMapPin size={14}/>}<span className="time">{s.deviceIp||'-'}</span></TimeD>
                </TblRow>
              ))}
            </>
          )}
        </Section>
      </Wrap>
    </Page>
  );
};
