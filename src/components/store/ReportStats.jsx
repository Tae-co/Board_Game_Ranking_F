import { V } from '../../utils/cssUtils';
import { fmt } from './fmt';
import { DAY_KEYS } from './reportUtils';

const tile = { backgroundColor: V('--th-bg'), borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' };

const delta = (cur, prev, t) => {
  const d = cur - prev;
  return d === 0 ? t('store', 'reportSame') : fmt(t('store', 'reportDelta'), { n: d > 0 ? `+${d}` : d });
};

/** 경기 수 · 방문 멤버 · 새 멤버 · 재방문율 (시안 8 · 6 통계). withDelta면 지난달 대비 줄 */
export const ReportTiles = ({ report, withDelta, size = 22, t }) => {
  const rows = [
    ['reportMatches', fmt(t('store', 'gamesCount'), { n: report.matches }), delta(report.matches, report.matchesPrev, t)],
    ['reportVisitors', fmt(t('store', 'peopleCount'), { n: report.visitors }), delta(report.visitors, report.visitorsPrev, t)],
    ['reportNewMembers', fmt(t('store', 'peopleCount'), { n: report.newMembers }), delta(report.newMembers, report.newMembersPrev, t)],
    ['reportRevisit', `${report.revisitRate}%`, t('store', 'reportRevisitNote')],
  ];
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
      {rows.map(([key, value, sub]) => (
        <div key={key} style={tile}>
          <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{t('store', key)}</span>
          <span style={{ fontSize: `${size}px`, fontWeight: 700, color: V('--th-text') }}>{value}</span>
          {withDelta && <span style={{ fontSize: '12px', color: '#2F6B4C' }}>{sub}</span>}
        </div>
      ))}
    </section>
  );
};

/** 인기 게임 막대 (가장 많은 게임 = 100%) */
export const PopularBars = ({ popular, labelWidth = 76 }) => {
  const max = popular[0]?.count || 1;
  return popular.map(g => (
    <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: labelWidth, fontSize: '13px', color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
      <div style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: V('--th-bg-deep') }}>
        <div style={{ width: `${Math.round((g.count / max) * 100)}%`, height: '100%', borderRadius: 999, backgroundColor: V('--th-primary') }} />
      </div>
      <span style={{ width: 32, fontSize: '13px', textAlign: 'right', color: V('--th-text') }}>{g.count}</span>
    </div>
  ));
};

/** 요일 × 시간 붐비는 정도 (시안 8). 많을수록 진한 색 4단계 */
export const HeatGrid = ({ report, t }) => {
  const max = Math.max(1, ...report.heat.flat());
  const shade = (n) => {
    if (n === 0) return V('--th-bg-deep');
    const r = n / max;
    return r > 0.75 ? '#4F46E5' : r > 0.5 ? '#818CF8' : '#C7D2FE';
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(4, minmax(0, 1fr))', gap: '4px', fontSize: '12px', color: V('--th-text-sub') }}>
      <span />
      {report.heatHours.map(h => <span key={h}>{fmt(t('store', 'hourLabel'), { h })}</span>)}
      {report.heat.map((row, d) => [
        <span key={`d${d}`}>{t('store', DAY_KEYS[d])}</span>,
        ...row.map((n, b) => <span key={`${d}-${b}`} title={String(n)} style={{ height: 22, borderRadius: '6px', backgroundColor: shade(n) }} />),
      ])}
    </div>
  );
};
