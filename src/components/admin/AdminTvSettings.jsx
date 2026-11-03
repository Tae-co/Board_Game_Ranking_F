import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAdminTvSetting, saveAdminTvSetting } from '../../api/services/admin';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import { fmt, num } from '../store/fmt';
import { deviceSeen } from '../store/deviceSeen';
import { ArrowDownIcon, ArrowUpIcon, BackIcon, CloseIcon, NextIcon } from '../store/StoreIcons';
import AdminSubPage, { AdminPopup } from './AdminSubPage';
import AdminStoreEvents from './AdminStoreEvents';
import { contestWhen } from '../contest/contestUtils';

const SCREENS = ['MVP', 'TOP10', 'QR', 'EVENT', 'CONTEST', 'SEASON'];
const INTERVALS = [5, 10, 15, 20];

const cardStyle = {
  backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
  padding: '18px', display: 'flex', flexDirection: 'column', gap: '4px',
};
const h2Style = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };
const subStyle = { fontSize: '12px', lineHeight: 1.45, color: V('--th-text-sub') };
const iconButton = (enabled, danger) => ({
  height: 36, width: 36, flexShrink: 0, padding: 0, borderRadius: '10px', cursor: enabled ? 'pointer' : 'default',
  border: `1px solid ${danger ? '#FECACA' : V('--th-border')}`, backgroundColor: V('--th-card'),
  color: danger ? '#DC2626' : enabled ? V('--th-text') : V('--th-border'),
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});

// ── 미리 보기 (16:9 작은 TV) ──

const PV = { bg: '#0F0F1F', card: '#1A1A2E', text: '#F8FAFC', sub: '#94A3B8', label: '#A5B4FC', gold: '#FCD34D', bar: '#818CF8' };

const PvTile = ({ label, name, value }) => (
  <span style={{ backgroundColor: PV.card, borderRadius: 8, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
    <span style={{ fontSize: 8, color: PV.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    <span style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    <span style={{ fontSize: 8, color: PV.gold }}>{value}</span>
  </span>
);

const Preview = ({ screen, data, top10Game, lang, t }) => {
  const label = (text) => <span style={{ fontSize: 9, fontWeight: 700, color: PV.label }}>{text}</span>;
  if (screen === 'MVP') {
    const leader = data.mvp?.gameLeaders?.[0];
    return (
      <>
        {label(t('store', 'tvMvpTitle'))}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
          <PvTile label={leader ? fmt(t('store', 'tvLeaderOf'), { game: leader.name }) : t('store', 'tvGameLeaders')} name={leader?.nickname ?? '—'} value={leader ? num(leader.score) : ''} />
          <PvTile label={t('store', 'tvMostVisits')} name={data.mvp?.mostVisits?.nickname ?? '—'} value={data.mvp?.mostVisits ? fmt(t('store', 'tvDays'), { n: data.mvp.mostVisits.count }) : ''} />
          <PvTile label={t('store', 'tvMostGames')} name={data.mvp?.mostGames?.nickname ?? '—'} value={data.mvp?.mostGames ? fmt(t('store', 'tvGames'), { n: data.mvp.mostGames.count }) : ''} />
        </div>
      </>
    );
  }
  if (screen === 'TOP10') {
    if (!top10Game) return label(t('admin', 'tvPreviewNoData'));
    const max = top10Game.items[0]?.score || 1;
    return (
      <>
        {label(fmt(t('store', 'tvTop10'), { game: top10Game.name }))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {top10Game.items.slice(0, 5).map(item => (
            <span key={item.memberId} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9 }}>
              <span style={{ width: 10, fontWeight: 700, color: item.rank === 1 ? PV.gold : PV.text }}>{item.rank}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nickname}</span>
              <span style={{ height: 5, width: Math.max(8, Math.round((item.score / max) * 60)), borderRadius: 999, backgroundColor: PV.bar }} />
            </span>
          ))}
        </div>
      </>
    );
  }
  if (screen === 'QR' || screen === 'NONE') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25, whiteSpace: 'pre-line' }}>{t('store', 'deviceQrTitle')}</span>
          <span style={{ fontSize: 8, color: PV.sub }}>{t('admin', 'tvPreviewQrSteps')}</span>
        </span>
        <span style={{ width: 92, height: 92, borderRadius: 8, backgroundColor: '#FFFFFF', color: PV.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>QR</span>
      </div>
    );
  }
  if (screen === 'SEASON' && data.seasonResult) {
    const r = data.seasonResult;
    return (
      <>
        {label(fmt(t('store', 'tvSeasonFinal'), { name: r.name }))}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
          {r.winners.slice(0, 3).map(w => (
            <PvTile key={w.boardGameId} label={fmt(t('store', 'tvWinnerOf'), { game: w.name })} name={w.nickname ?? '—'} value={num(w.score)} />
          ))}
        </div>
      </>
    );
  }
  if (screen === 'EVENT') {
    const e = data.events?.[0];
    const c = data.recruiting?.[0];
    if (!e && !c) return label(t('admin', 'tvScreenEVENT'));
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        {label(t('contest', c && !e ? 'tvContestBadge' : 'badgeStoreEvent'))}
        <span style={{ fontSize: 17, fontWeight: 700 }}>{e ? e.title : c.title}</span>
        <span style={{ fontSize: 9, color: PV.sub }}>
          {e ? (e.benefitText ?? '') : fmt(t('contest', 'tvContestWhen'), { when: contestWhen(c.startsAt, lang), a: c.applied, b: c.capacity, r: c.rounds })}
        </span>
      </div>
    );
  }
  if (screen === 'CONTEST' && data.contestBoard) {
    const b = data.contestBoard;
    return (
      <>
        {label(fmt(t('contest', 'tvBoardBadge'), { n: b.rounds, d: b.roundsDone }))}
        <span style={{ fontSize: 13, fontWeight: 700 }}>{b.title}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {b.standings.slice(0, 4).map(s => (
            <span key={s.memberId ?? s.nickname} style={{ display: 'flex', gap: 6, fontSize: 9 }}>
              <span style={{ width: 10, fontWeight: 700, color: s.rank === 1 ? PV.gold : PV.text }}>{s.rank}</span>
              <span style={{ flex: 1 }}>{s.nickname ?? '—'}</span>
              <span style={{ fontWeight: 700, color: PV.label }}>{s.total}</span>
            </span>
          ))}
        </div>
      </>
    );
  }
  return label(t('admin', `tvScreen${screen}`));
};

/**
 * 6k 매장 TV 화면 (전체 화면, 관리자만): 미리 보기 · 돌아가는 순서(↑↓·빼기·다시 넣기) · 방금 끝난 경기 ·
 * 넘기는 간격 · TOP 10 게임 · 매장 이벤트 목록(추가·수정·삭제 → 6j). 저장하면 TV가 30초 재조회 때 반영.
 */
const AdminTvSettings = ({ store, onBack }) => {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(null);
  const [pv, setPv] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const key = ['adminTvSetting', store.id];

  const { data } = useQuery({ queryKey: key, queryFn: () => getAdminTvSetting(store.id) });

  if (!data) {
    return (
      <AdminSubPage title={t('admin', 'tvScreen')} info={t('admin', 'tvInfo')} onBack={onBack} t={t}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: V('--th-text-sub') }}>{t('common', 'loading')}</div>
      </AdminSubPage>
    );
  }

  const setting = draft ?? data.setting;
  const update = (patch) => setDraft({ ...setting, ...patch });
  const order = setting.order;
  const offList = SCREENS.filter(s => !order.includes(s));
  const hidden = setting.top10HiddenGameIds;
  const shownGames = data.games.filter(g => !hidden.includes(g.boardGameId));
  const top10Game = data.top10.find(g => !hidden.includes(g.boardGameId));

  const move = (i, d) => {
    const next = order.slice();
    [next[i], next[i + d]] = [next[i + d], next[i]];
    update({ order: next });
  };

  // 미리 보기: 지금 순서대로. 뺀 화면만 남았으면(QR은 못 빼니 사실상 없음) 체크인 QR만
  const pvList = order.length ? order : ['NONE'];
  const pvIdx = Math.min(pv, pvList.length - 1);
  const pk = pvList[pvIdx];
  const pvName = pk === 'NONE' ? t('admin', 'tvPreviewQrOnly') : t('admin', `tvScreen${pk}`);
  const skipKey = (pk === 'EVENT' && !data.events?.length && !data.recruiting?.length ? 'tvSkipEvent' : null)
    ?? (pk === 'CONTEST' && !data.contestBoard ? 'tvSkipContest' : null)
    ?? (pk === 'TOP10' && !top10Game ? 'tvSkipTop10' : null)
    ?? (pk === 'MVP' && !data.mvp ? 'tvSkipMvp' : null)
    ?? (pk === 'SEASON' && !data.seasonResult ? 'tvSkipSeason' : null);

  const lastTv = data.tvLastSeenAt
    ? deviceSeen({ connected: true, lastSeenAt: data.tvLastSeenAt }, t).text
    : t('admin', 'tvSeenNever');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      queryClient.setQueryData(key, await saveAdminTvSetting(store.id, setting));
      queryClient.invalidateQueries({ queryKey: ['adminStores'] });
      setDraft(null);
      setSaved(true);
    } catch {
      setError(t('admin', 'tvSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSubPage title={t('admin', 'tvScreen')} info={t('admin', 'tvInfo')} onBack={onBack} t={t}>
      <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
        {fmt(t('admin', 'tvHeaderLine'), { store: storeTitle(store), n: data.tvCount, seen: lastTv })}
      </span>

      <section style={{ ...cardStyle, padding: '14px', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 style={h2Style}>{t('admin', 'tvPreview')}</h2>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
            {pk === 'NONE' ? t('admin', 'tvPreviewNone') : fmt(t('admin', 'tvPreviewCount'), { i: pvIdx + 1, n: pvList.length, s: setting.intervalSec })}
          </span>
        </div>
        <div role="img" aria-label={fmt(t('admin', 'tvPreviewAria'), { name: pvName })} style={{
          position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: '12px', overflow: 'hidden',
          backgroundColor: PV.bg, color: PV.text, boxSizing: 'border-box', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <Preview screen={pk} data={data} top10Game={top10Game} lang={lang} t={t} />
        </div>
        {skipKey && <span style={{ fontSize: '12px', lineHeight: 1.5, color: '#B4500A' }}>{t('admin', skipKey)}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setPv((pvIdx - 1 + pvList.length) % pvList.length)} aria-label={t('admin', 'tvPreviewPrev')} style={{ ...iconButton(true), width: 44, height: 40, borderRadius: '12px' }}>
            <BackIcon size={18} />
          </button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: 700, color: V('--th-text') }}>{pvName}</span>
          <button onClick={() => setPv((pvIdx + 1) % pvList.length)} aria-label={t('admin', 'tvPreviewNext')} style={{ ...iconButton(true), width: 44, height: 40, borderRadius: '12px' }}>
            <NextIcon />
          </button>
        </div>
        <span style={{ fontSize: '12px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('admin', 'tvPreviewNote')}</span>
      </section>

      <AdminStoreEvents store={store} eventsOnly />

      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={h2Style}>{t('admin', 'tvOrderTitle')}</h2>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('admin', 'tvOrderCount'), { n: order.length })}</span>
        </div>
        {order.map((k, i) => {
          const name = t('admin', `tvScreen${k}`);
          const first = i === 0;
          const last = i === order.length - 1;
          return (
            <div key={k} style={{ minHeight: 64, display: 'flex', alignItems: 'center', gap: '8px', borderTop: first ? 'none' : `1px solid ${V('--th-border')}` }}>
              <span style={{
                width: 28, height: 28, flexShrink: 0, borderRadius: 999, fontSize: '13px', fontWeight: 700,
                backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.12)`, color: V('--th-primary'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{name}</span>
                <span style={subStyle}>{t('admin', `tvScreen${k}Sub`)}</span>
              </span>
              <button onClick={() => !first && move(i, -1)} disabled={first} aria-label={fmt(t('admin', 'tvMoveUp'), { name })} style={iconButton(!first)}>
                <ArrowUpIcon />
              </button>
              <button onClick={() => !last && move(i, 1)} disabled={last} aria-label={fmt(t('admin', 'tvMoveDown'), { name })} style={iconButton(!last)}>
                <ArrowDownIcon />
              </button>
              {k === 'QR' ? (
                <span style={{ height: 36, width: 36, flexShrink: 0 }} />
              ) : (
                <button onClick={() => update({ order: order.filter(x => x !== k) })} aria-label={fmt(t('admin', 'tvRemove'), { name })} style={iconButton(true, true)}>
                  <CloseIcon />
                </button>
              )}
            </div>
          );
        })}
        {offList.length > 0 && (
          <>
            <span style={{ marginTop: 10, paddingTop: 12, borderTop: `1px solid ${V('--th-border')}`, fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>
              {t('admin', 'tvOffTitle')}
            </span>
            {offList.map(k => (
              <div key={k} style={{ minHeight: 56, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text-sub') }}>{t('admin', `tvScreen${k}`)}</span>
                  <span style={{ fontSize: '12px', color: V('--th-text-sub'), opacity: 0.8 }}>{t('admin', `tvScreen${k}Sub`)}</span>
                </span>
                <button onClick={() => update({ order: [...order, k] })} style={{
                  height: 36, padding: '0 14px', borderRadius: 999, flexShrink: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                  border: `1px solid rgba(${V('--th-primary-rgb')}, 0.3)`, backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.12)`, color: V('--th-primary'),
                }}>{t('admin', 'tvAddBack')}</button>
              </div>
            ))}
          </>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={{ ...h2Style, marginBottom: 6 }}>{t('admin', 'tvInterruptTitle')}</h2>
        <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{t('admin', 'tvJustFinished')}</span>
            <span style={subStyle}>{t('admin', 'tvJustFinishedSub')}</span>
          </span>
          <button
            role="switch"
            aria-checked={setting.showJustFinished}
            aria-label={t('admin', 'tvJustFinished')}
            onClick={() => update({ showJustFinished: !setting.showJustFinished })}
            style={{
              width: 52, height: 32, flexShrink: 0, padding: 3, border: 'none', borderRadius: 999, cursor: 'pointer',
              backgroundColor: setting.showJustFinished ? V('--th-primary') : '#D1D5DB',
              display: 'flex', justifyContent: setting.showJustFinished ? 'flex-end' : 'flex-start',
            }}
          >
            <span style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(17,24,39,0.2)' }} />
          </button>
        </div>
      </section>

      <section style={{ ...cardStyle, gap: '12px' }}>
        <h2 style={h2Style}>{t('admin', 'tvIntervalTitle')}</h2>
        <div role="radiogroup" aria-label={t('admin', 'tvIntervalTitle')} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
          {INTERVALS.map(n => {
            const on = setting.intervalSec === n;
            return (
              <button key={n} role="radio" aria-checked={on} onClick={() => update({ intervalSec: n })} style={{
                height: 44, borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
                border: `1px solid ${on ? V('--th-primary') : V('--th-border')}`,
                backgroundColor: on ? `rgba(${V('--th-primary-rgb')}, 0.12)` : V('--th-card'),
                color: on ? V('--th-primary') : V('--th-text'),
              }}>{fmt(t('admin', 'tvIntervalSec'), { n })}</button>
            );
          })}
        </div>
        <span style={subStyle}>{t('admin', 'tvIntervalNote')}</span>
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={h2Style}>{t('admin', 'tvTop10Title')}</h2>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('admin', 'tvTop10Count'), { n: shownGames.length, total: data.games.length })}</span>
        </div>
        {data.games.map((g, i) => {
          const on = !hidden.includes(g.boardGameId);
          return (
            <label key={g.boardGameId} style={{ minHeight: 52, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}` }}>
              <input
                type="checkbox"
                checked={on}
                onChange={() => update({ top10HiddenGameIds: on ? [...hidden, g.boardGameId] : hidden.filter(id => id !== g.boardGameId) })}
                style={{ width: 22, height: 22, margin: 0, accentColor: '#4F46E5' }}
              />
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>{g.name}</span>
                <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
                  {g.matchCount ? fmt(t('admin', 'tvGameMatches'), { n: g.matchCount }) : t('admin', 'tvGameNoMatches')}
                </span>
              </span>
            </label>
          );
        })}
        <span style={{ marginTop: 6, ...subStyle, lineHeight: 1.5 }}>{t('admin', 'tvTop10Note')}</span>
      </section>

      {error && <span role="alert" style={{ fontSize: '13px', color: '#B91C1C' }}>{error}</span>}
      <button onClick={handleSave} disabled={saving} style={{
        height: 52, border: 'none', borderRadius: '14px', cursor: saving ? 'default' : 'pointer',
        backgroundColor: V('--th-primary'), color: '#fff', fontSize: '16px', fontWeight: 700, opacity: saving ? 0.6 : 1,
      }}>{t('admin', 'tvSave')}</button>

      {saved && (
        <AdminPopup
          title={t('admin', 'tvSaved')}
          onDismiss={() => setSaved(false)}
          actions={[{ label: t('admin', 'tvBackToAdmin'), onClick: onBack }]}
        >
          {t('admin', 'tvSavedBody')}
        </AdminPopup>
      )}
    </AdminSubPage>
  );
};

export default AdminTvSettings;
