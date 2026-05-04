"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, Area, AreaChart, RadarChart,
  Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  ShieldCheck, ShieldAlert, Users, TrendingUp,
  Activity, CheckCircle2, AlertCircle, ArrowUpRight,
  Clock, Trophy, Zap, Target, Eye,
} from 'lucide-react';
import { referralData, ReferralRecord } from '../lib/data';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       '#0a0c10',
  surface:  '#111318',
  elevated: '#181b22',
  border:   '#1e2230',
  borderHi: '#2a3040',
  text:     '#e8ecf4',
  muted:    '#5a6480',
  faint:    '#2a3040',
  cyan:     '#22d3ee',
  blue:     '#3b82f6',
  violet:   '#7c3aed',
  emerald:  '#10b981',
  amber:    '#f59e0b',
  rose:     '#f43f5e',
  indigo:   '#6366f1',
};

const PIE_COLORS   = [T.emerald, T.amber, T.rose, T.blue, T.violet];
const CLUB_COLORS  = [T.cyan, T.blue, T.violet, T.emerald, T.amber];
const LABEL_MAP: Record<string, string> = {
  'Berhasil':       'Successful',
  'Menunggu':       'Pending',
  'Tidak Berhasil': 'Failed',
};
const STATUS_MAP: Record<string, string> = {
  'Berhasil':       T.emerald,
  'Menunggu':       T.amber,
  'Tidak Berhasil': T.rose,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function shortId(id: string) { return id === 'N/A' ? '—' : id.slice(0, 8) + '…'; }
function fmtDate(d: string)  { return d === 'N/A' ? null : d.slice(0, 10); }
function parseWeek(dateStr: string): string | null {
  if (!dateStr || dateStr === 'N/A') return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function Pulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ background: T.emerald }} />
      <span className="relative inline-flex rounded-full h-2 w-2"
        style={{ background: T.emerald }} />
    </span>
  );
}

function AnimatedNumber({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 50));
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [target]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

function KpiCard({ title, value, sub, icon, color, animate }: {
  title: string; value: string | number; sub: string;
  icon: React.ReactNode; color: string; animate?: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden group transition-all duration-200 cursor-default"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      {/* glow hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 40%, ${color}10 0%, transparent 70%)` }} />
      {/* top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: color }} />
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
        style={{ background: color + '20', color }}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: T.muted }}>
        {title}
      </p>
      <p className="text-3xl font-black leading-none tabular-nums" style={{ color: T.text }}>
        {animate && typeof value === 'number'
          ? <AnimatedNumber target={value} />
          : value}
      </p>
      <p className="text-xs mt-1.5" style={{ color: T.muted }}>{sub}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      <h2 className="text-sm font-bold uppercase tracking-[0.1em]" style={{ color: T.cyan }}>{title}</h2>
      {subtitle && <span className="text-xs" style={{ color: T.muted }}>{subtitle}</span>}
    </div>
  );
}

function Card({ children, className = '', style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{ background: T.surface, border: `1px solid ${T.border}`, ...style }}
    >
      {children}
    </div>
  );
}

function DarkTooltip({ active, payload, label, valueLabel = 'Count' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-sm"
      style={{ background: T.elevated, border: `1px solid ${T.borderHi}`, color: T.text }}>
      {label && <p className="font-bold mb-1" style={{ color: T.muted }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || T.cyan }}>
          {p.name || valueLabel}: <span className="font-mono font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 400 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="flex-1 rounded-full overflow-hidden h-1.5" style={{ background: T.faint }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── Core metrics ──────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total           = referralData.length;
    const valid           = referralData.filter(d => d.is_business_logic_valid).length;
    const invalid         = total - valid;
    const berhasil        = referralData.filter(d => d.referral_status === 'Berhasil').length;
    const menunggu        = referralData.filter(d => d.referral_status === 'Menunggu').length;
    const tidakBerhasil   = referralData.filter(d => d.referral_status === 'Tidak Berhasil').length;
    const convRate        = Math.round((berhasil / total) * 100);
    const validPct        = Math.round((valid / total) * 100);
    return { total, valid, invalid, berhasil, menunggu, tidakBerhasil, convRate, validPct };
  }, []);

  // ── Source distribution ───────────────────────────────────────────────────
  const sourceData = useMemo(() => {
    const map: Record<string, { total: number; berhasil: number }> = {};
    for (const r of referralData) {
      if (!map[r.referral_source]) map[r.referral_source] = { total: 0, berhasil: 0 };
      map[r.referral_source].total++;
      if (r.referral_status === 'Berhasil') map[r.referral_source].berhasil++;
    }
    return Object.entries(map).map(([name, v]) => ({
      name: name.length > 16 ? name.slice(0, 14) + '…' : name,
      total: v.total,
      berhasil: v.berhasil,
      convRate: Math.round((v.berhasil / v.total) * 100),
    }));
  }, []);

  // ── Status breakdown ─────────────────────────────────────────────────────
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of referralData) {
      const englishLabel = LABEL_MAP[r.referral_status] || r.referral_status;
      map[englishLabel] = (map[englishLabel] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  
  // ── Club leaderboard ──────────────────────────────────────────────────────
  const clubData = useMemo(() => {
    const map: Record<string, { total: number; berhasil: number; flagged: number }> = {};
    for (const r of referralData) {
      if (r.referrer_homeclub === 'N/A') continue;
      if (!map[r.referrer_homeclub]) map[r.referrer_homeclub] = { total: 0, berhasil: 0, flagged: 0 };
      map[r.referrer_homeclub].total++;
      if (r.referral_status === 'Berhasil') map[r.referrer_homeclub].berhasil++;
      if (!r.is_business_logic_valid) map[r.referrer_homeclub].flagged++;
    }
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, rate: Math.round((v.berhasil / v.total) * 100) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, []);

  // ── Time-based trends ─────────────────────────────────────────────────────
  const weeklyTrend = useMemo(() => {
    const map: Record<string, { total: number; berhasil: number; flagged: number }> = {};
    for (const r of referralData) {
      const wk = parseWeek(r.updated_at);
      if (!wk) continue;
      if (!map[wk]) map[wk] = { total: 0, berhasil: 0, flagged: 0 };
      map[wk].total++;
      if (r.referral_status === 'Berhasil') map[wk].berhasil++;
      if (!r.is_business_logic_valid) map[wk].flagged++;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, v]) => ({
        week: week.slice(5), // MM-DD
        ...v,
        convRate: Math.round((v.berhasil / v.total) * 100),
      }));
  }, []);

  const onlineOfflineTrend = useMemo(() => {
    const map: Record<string, { Online: number; Offline: number }> = {};
    for (const r of referralData) {
      const wk = parseWeek(r.updated_at);
      if (!wk) continue;
      if (!map[wk]) map[wk] = { Online: 0, Offline: 0 };
      const cat = r.referral_source_category === 'Online' ? 'Online' : 'Offline';
      map[wk][cat]++;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, v]) => ({ week: week.slice(5), ...v }));
  }, []);

  // ── Referrer intelligence ─────────────────────────────────────────────────
  const referrerLeaderboard = useMemo(() => {
    const map: Record<string, {
      id: string; homeclub: string; total: number;
      berhasil: number; menunggu: number; tidakBerhasil: number; flagged: number;
    }> = {};
    for (const r of referralData) {
      if (!r.referrer_id || r.referrer_id === 'N/A') continue;
      const id = r.referrer_id;
      if (!map[id]) map[id] = {
        id, homeclub: 'Unknown',
        total: 0, berhasil: 0, menunggu: 0, tidakBerhasil: 0, flagged: 0,
      };
      map[id].total++;
      if (r.referral_status === 'Berhasil')       map[id].berhasil++;
      if (r.referral_status === 'Menunggu')        map[id].menunggu++;
      if (r.referral_status === 'Tidak Berhasil')  map[id].tidakBerhasil++;
      if (!r.is_business_logic_valid)              map[id].flagged++;
      if (r.referrer_homeclub !== 'N/A')           map[id].homeclub = r.referrer_homeclub;
    }
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((r, i) => ({ ...r, rank: i + 1, convRate: Math.round((r.berhasil / r.total) * 100) }));
  }, []);

  // radar data for top referrer
  const topReferrer = referrerLeaderboard[0];
  const radarData = topReferrer ? [
    { metric: 'Volume',    value: Math.round((topReferrer.total / (referrerLeaderboard[0]?.total || 1)) * 100) },
    { metric: 'Conv %',    value: topReferrer.convRate },
    { metric: 'Reliability', value: Math.round(((topReferrer.total - topReferrer.flagged) / topReferrer.total) * 100) },
    { metric: 'Activity',  value: topReferrer.total > 5 ? 90 : topReferrer.total * 15 },
    { metric: 'Reach',     value: topReferrer.total > 3 ? 75 : 40 },
  ] : [];

  // fraud by club for heatmap-style bar
  const fraudByClub = useMemo(() => {
    return clubData.map(c => ({
      name: c.name,
      fraudRate: c.total > 0 ? Math.round((c.flagged / c.total) * 100) : 0,
      total: c.total,
    }));
  }, [clubData]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen font-sans" style={{ background: T.bg, color: T.text }}>

      {/* ── Subtle grid background ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px),
                          linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        opacity: 0.35,
      }} />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Pulse />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: T.muted }}>
                Live · PySpark Pipeline
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none"
              style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>
              Referral<br />
              <span style={{ color: T.cyan }}>Analytics</span>
            </h1>
            <p className="text-sm mt-3" style={{ color: T.muted }}>
              Monitoring{' '}
              <span className="font-mono font-bold" style={{ color: T.text }}>
                {metrics.total.toLocaleString()}
              </span>{' '}
              records · Fraud detection active
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <Activity size={14} style={{ color: T.cyan }} />
              <span style={{ color: T.muted }}>System:</span>
              <span className="font-bold" style={{ color: T.emerald }}>Active</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <Eye size={14} style={{ color: T.amber }} />
              <span style={{ color: T.muted }}>Fraud flags:</span>
              <span className="font-bold font-mono" style={{ color: T.amber }}>{metrics.invalid}</span>
            </div>
          </div>
        </header>

        {/* ── KPI row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard title="Total Volume"  value={metrics.total}            sub="in pipeline"            icon={<Users size={16}/>}         color={T.cyan}    animate />
          <KpiCard title="Valid Logic"   value={metrics.valid}            sub={`${metrics.validPct}% pass`} icon={<ShieldCheck size={16}/>} color={T.emerald} animate />
          <KpiCard title="Flagged"       value={metrics.invalid}          sub="fraud suspects"         icon={<ShieldAlert size={16}/>}   color={T.rose}    animate />
          <KpiCard title="Converted"     value={metrics.berhasil}         sub="Berhasil"               icon={<CheckCircle2 size={16}/>}  color={T.violet}  animate />
          <KpiCard title="Conv. Rate"    value={`${metrics.convRate}%`}   sub="overall"                icon={<TrendingUp size={16}/>}    color={T.amber} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — TIME-BASED TRENDS
        ════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader title="Time-Based Trends" subtitle="weekly activity from updated_at" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Weekly volume */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.muted }}>
                Weekly referral volume
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend}>
                    <defs>
                      <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.cyan}  stopOpacity={0.25} />
                        <stop offset="95%" stopColor={T.cyan}  stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.emerald} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={T.emerald} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false} />
                    <XAxis dataKey="week" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: T.muted }} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: T.muted }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Area type="monotone" dataKey="total"    name="Total"    stroke={T.cyan}    fill="url(#gTotal)"   strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="berhasil" name="Berhasil" stroke={T.emerald} fill="url(#gSuccess)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-5 mt-3">
                {[{ label: 'Total', color: T.cyan }, { label: 'Berhasil', color: T.emerald }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded" style={{ background: l.color }} />
                    <span className="text-xs" style={{ color: T.muted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Online vs Offline */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.muted }}>
                Online vs offline channel
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={onlineOfflineTrend} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false} />
                    <XAxis dataKey="week" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: T.muted }} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: T.muted }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="Online"  name="Online"  fill={T.cyan}    radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Offline" name="Offline" fill={T.violet}  radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-5 mt-3">
                {[{ label: 'Online', color: T.cyan }, { label: 'Offline', color: T.violet }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                    <span className="text-xs" style={{ color: T.muted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Fraud trend */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.muted }}>
                Weekly fraud flag rate
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.faint} vertical={false} />
                    <XAxis dataKey="week" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: T.muted }} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: T.muted }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Line type="monotone" dataKey="flagged" name="Flagged" stroke={T.rose}
                      strokeWidth={2} dot={{ fill: T.rose, r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="convRate" name="Conv %" stroke={T.amber}
                      strokeWidth={2} dot={false} strokeDasharray="4 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-5 mt-3">
                {[{ label: 'Flagged', color: T.rose }, { label: 'Conv %', color: T.amber }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded" style={{ background: l.color }} />
                    <span className="text-xs" style={{ color: T.muted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Status breakdown + source conv */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.muted }}>
                Source conversion comparison
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical" barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.faint} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={120}
                      tickLine={false} axisLine={false} tick={{ fill: T.muted }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="total"    name="Total"    fill={T.blue}    radius={[0, 3, 3, 0]} />
                    <Bar dataKey="berhasil" name="Berhasil" fill={T.emerald} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — REFERRER INTELLIGENCE
        ════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader title="Referrer Intelligence" subtitle="power referrer leaderboard + fraud profiling" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

            {/* Top referrer spotlight */}
            {topReferrer && (
              <Card style={{ borderColor: T.cyan + '50' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy size={14} style={{ color: T.amber }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.amber }}>
                    Top referrer
                  </p>
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                    style={{ background: T.cyan + '20', color: T.cyan }}>
                    #1
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold" style={{ color: T.text }}>{shortId(topReferrer.id)}</p>
                    <p className="text-xs mt-0.5" style={{ color: T.muted }}>{topReferrer.homeclub}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Total referrals', val: topReferrer.total, color: T.cyan },
                    { label: 'Converted',       val: topReferrer.berhasil, color: T.emerald },
                    { label: 'Pending',         val: topReferrer.menunggu, color: T.amber },
                    { label: 'Failed',          val: topReferrer.tidakBerhasil, color: T.rose },
                    { label: 'Fraud flags',     val: topReferrer.flagged, color: T.rose },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="text-xs w-32 shrink-0" style={{ color: T.muted }}>{row.label}</span>
                      <AnimatedBar
                        pct={Math.round((row.val / topReferrer.total) * 100)}
                        color={row.color}
                        delay={100}
                      />
                      <span className="text-xs font-mono font-bold w-6 text-right" style={{ color: row.color }}>
                        {row.val}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: T.muted }}>Conv. rate</span>
                    <span className="text-xs font-mono font-bold"
                      style={{ color: topReferrer.convRate >= 50 ? T.emerald : T.amber }}>
                      {topReferrer.convRate}%
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Radar chart */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.muted }}>
                Top referrer profile
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.faint} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: T.muted, fontSize: 10 }} />
                    <Radar name="Score" dataKey="value" stroke={T.cyan} fill={T.cyan} fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Fraud rate by club */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} style={{ color: T.rose }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.muted }}>
                  Fraud rate by club
                </p>
              </div>
              <div className="space-y-4">
                {fraudByClub.map((club, i) => (
                  <div key={club.name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium" style={{ color: T.text }}>{club.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono" style={{ color: T.muted }}>{club.total} total</span>
                        <span className="text-xs font-mono font-bold"
                          style={{ color: club.fraudRate > 30 ? T.rose : club.fraudRate > 10 ? T.amber : T.emerald }}>
                          {club.fraudRate}%
                        </span>
                      </div>
                    </div>
                    <AnimatedBar
                      pct={club.fraudRate}
                      color={club.fraudRate > 30 ? T.rose : club.fraudRate > 10 ? T.amber : T.emerald}
                      delay={i * 80}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Full leaderboard table */}
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-2">
                <Target size={14} style={{ color: T.cyan }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.muted }}>
                  Power referrer leaderboard — top 10
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['#', 'Referrer ID', 'Club', 'Total', 'Berhasil', 'Pending', 'Failed', 'Conv %', 'Flags'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider"
                        style={{ color: T.muted, fontSize: 10 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrerLeaderboard.map((r, i) => (
                    <tr key={r.id}
                      className="transition-colors duration-150"
                      style={{ borderBottom: i < referrerLeaderboard.length - 1 ? `1px solid ${T.border}` : undefined }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: r.rank === 1 ? T.amber : T.muted }}>
                        {r.rank === 1 ? '🥇' : r.rank}
                      </td>
                      <td className="px-4 py-3 font-mono" style={{ color: T.cyan }}>{shortId(r.id)}</td>
                      <td className="px-4 py-3" style={{ color: r.homeclub === 'Unknown' ? T.muted : T.text }}>
                        {r.homeclub === 'Unknown' ? '—' : r.homeclub}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: T.text }}>{r.total}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: T.emerald }}>{r.berhasil}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: T.amber }}>{r.menunggu}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: T.rose }}>{r.tidakBerhasil}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                          style={{
                            background: r.convRate >= 50 ? T.emerald + '25' : r.convRate > 0 ? T.amber + '25' : T.faint,
                            color:      r.convRate >= 50 ? T.emerald         : r.convRate > 0 ? T.amber         : T.muted,
                          }}>
                          {r.convRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.flagged > 0
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: T.rose + '20', color: T.rose }}>
                              ⚑ {r.flagged}
                            </span>
                          : <span style={{ color: T.muted }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3 — ORIGINAL CHARTS (redesigned)
        ════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader title="Pipeline Overview" subtitle="source, status & business logic health" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Status donut */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.muted }}>
                Referral status
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%"
                      innerRadius={55} outerRadius={75} paddingAngle={5}
                      dataKey="value" stroke="none">
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_MAP[entry.name] || PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: STATUS_MAP[s.name] || PIE_COLORS[i] }} />
                      <span className="text-xs" style={{ color: T.muted }}>{s.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: T.text }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top clubs */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={13} style={{ color: T.violet }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.muted }}>
                  Top clubs by volume
                </p>
              </div>
              <div className="space-y-4 mt-2">
                {clubData.map((c, i) => (
                  <div key={c.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs" style={{ color: T.text }}>{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono" style={{ color: T.muted }}>{c.rate}% conv</span>
                        <span className="text-xs font-mono font-bold" style={{ color: CLUB_COLORS[i] }}>{c.total}</span>
                      </div>
                    </div>
                    <AnimatedBar
                      pct={Math.round((c.total / (clubData[0]?.total || 1)) * 100)}
                      color={CLUB_COLORS[i]}
                      delay={i * 80}
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Business logic health */}
            <Card style={{ borderColor: metrics.invalid > 0 ? T.rose + '40' : T.emerald + '40' }}>
              <div className="flex items-center gap-2 mb-5">
                {metrics.invalid > 0
                  ? <AlertCircle size={14} style={{ color: T.rose }} />
                  : <ShieldCheck size={14} style={{ color: T.emerald }} />}
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.muted }}>
                  Business logic health
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: metrics.invalid > 0 ? T.rose + '15' : T.emerald + '15' }}>
                  <span className="text-3xl font-black" style={{ color: metrics.invalid > 0 ? T.rose : T.emerald }}>
                    {metrics.validPct}%
                  </span>
                </div>
                <p className="text-sm font-bold" style={{ color: T.text }}>
                  {metrics.invalid === 0 ? 'All records clean' : `${metrics.invalid} records flagged`}
                </p>
                <p className="text-xs max-w-[200px]" style={{ color: T.muted }}>
                  {metrics.invalid > 0
                    ? 'Potential fraud detected in pipeline batch.'
                    : 'No violations found in this batch.'}
                </p>
              </div>

              <div className="space-y-3 mt-2">
                {[
                  { label: `Valid (${metrics.validPct}%)`,   val: metrics.valid,   color: T.emerald },
                  { label: `Flagged (${100 - metrics.validPct}%)`, val: metrics.invalid, color: T.rose },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: T.muted }}>
                      <span>{row.label}</span>
                      <span className="font-mono font-bold" style={{ color: row.color }}>{row.val}</span>
                    </div>
                    <AnimatedBar pct={Math.round((row.val / metrics.total) * 100)} color={row.color} />
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="flex justify-between items-center pt-2 pb-4"
          style={{ borderTop: `1px solid ${T.border}`, color: T.muted }}>
          <span className="text-[10px] uppercase tracking-widest">Referral Analytics Dashboard</span>
          <span className="text-[10px] font-mono">{metrics.total} records · PySpark pipeline</span>
        </footer>

      </div>
    </div>
  );
}