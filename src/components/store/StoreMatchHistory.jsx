import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStoreRoomMatches, reportStoreMatch, storeErrorCode } from '../../api/services/stores';
import { V } from '../../utils/cssUtils';
import { fmt } from './fmt';
import { card } from './storeStyles';
import { BackIcon, NextIcon } from './StoreIcons';
import { Skeleton } from '../Skeleton';

const PER_PAGE = 5;
const REASONS = [['NOT_PLAYED', 'reasonNotPlayed'], ['THROWING', 'reasonThrowing'], ['OTHER', 'reasonOther']];

const FlagIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4h11l-2 4 2 4H5" /></svg>
);

/** 오늘 / 어제 / 10/28 + 15:42 */
const dayTime = (iso, t) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const day = same(d, today) ? t('store', 'today') : same(d, yesterday) ? t('store', 'yesterday') : `${d.getMonth() + 1}/${d.getDate()}`;
  return `${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const ReportSheet = ({ match, gameName, onClose, t }) => {
  const [reason, setReason] = useState('NOT_PLAYED');
  const [memo, setMemo] = useState('');
  const [state, setState] = useState(null); // null | 'sent' | 'already' | 'failed'
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      await reportStoreMatch(match.id, reason, memo);
      setState('sent');
    } catch (e) {
      setState(storeErrorCode(e) === 'ALREADY_REPORTED' ? 'already' : 'failed');
    } finally {
      setBusy(false);
    }
  };
  const done = state === 'sent' || state === 'already';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 230, backgroundColor: 'rgba(17,24,39,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div role="dialog" aria-modal="true" style={{
        width: '100%', maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', backgroundColor: V('--th-card'),
        borderRadius: '24px 24px 0 0', padding: '12px 20px calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <span aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: V('--th-border') }} />
        {done ? (
          <>
            <h2 style={{ margin: '4px 0 0', fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>
              {t('store', state === 'sent' ? 'reportSent' : 'reportAlready')}
            </h2>
            <span style={{ fontSize: '14px', lineHeight: 1.6, color: V('--th-text-sub') }}>{fmt(t('store', 'reportSentBody'), { game: gameName })}</span>
            <button onClick={onClose} style={{ height: 52, border: 'none', borderRadius: '14px', cursor: 'pointer', backgroundColor: V('--th-primary'), color: '#fff', fontSize: '16px', fontWeight: 700 }}>
              {t('store', 'infoOk')}
            </button>
          </>
        ) : (
          <>
            <h2 style={{ margin: '4px 0 0', fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'reportTitle')}</h2>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
              {fmt(t('store', 'reportMeta'), { when: dayTime(match.endedAt, t), game: gameName, n: match.participants.length })}
            </span>
            {REASONS.map(([value, key]) => (
              <button key={value} onClick={() => setReason(value)} aria-pressed={reason === value} style={{
                height: 52, boxSizing: 'border-box', padding: '0 16px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                border: `2px solid ${reason === value ? '#DC2626' : V('--th-border')}`,
                backgroundColor: reason === value ? '#FEF2F2' : V('--th-card'), color: V('--th-text'), fontSize: '15px', fontWeight: 500,
              }}>{t('store', key)}</button>
            ))}
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={300} placeholder={t('store', 'reportMemo')} style={{
              height: 80, boxSizing: 'border-box', padding: '12px', borderRadius: '14px', border: `1px solid ${V('--th-border')}`,
              backgroundColor: V('--th-card'), color: V('--th-text'), fontSize: '14px', resize: 'none', fontFamily: 'inherit',
            }} />
            {state === 'failed' && <span role="alert" style={{ fontSize: '13px', color: '#B91C1C' }}>{t('store', 'actionFailed')}</span>}
            <button onClick={send} disabled={busy} style={{ height: 52, border: 'none', borderRadius: '14px', cursor: 'pointer', backgroundColor: '#DC2626', color: '#fff', fontSize: '16px', fontWeight: 700, opacity: busy ? 0.6 : 1 }}>
              {t('store', 'reportSend')}
            </button>
            <button onClick={onClose} style={{ height: 44, border: 'none', borderRadius: '14px', cursor: 'pointer', backgroundColor: V('--th-bg-deep'), color: V('--th-text'), fontSize: '15px', fontWeight: 700 }}>
              {t('common', 'cancel')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/** 매장 게임방 매치기록 탭 (시안 3g): 최근 25경기를 5개씩 넘기고, 경기마다 익명 신고 */
const StoreMatchHistory = ({ storeId, roomId, gameName, t }) => {
  const [page, setPage] = useState(0);
  const [reporting, setReporting] = useState(null);
  const scroller = useRef(null);
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['store', 'room', Number(roomId), 'matches'],
    queryFn: () => getStoreRoomMatches(storeId, roomId),
  });
  if (isLoading) return <Skeleton height={120} radius={20} />;
  if (matches.length === 0) return <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'noMatches')}</p>;

  const pages = [];
  for (let i = 0; i < matches.length; i += PER_PAGE) pages.push(matches.slice(i, i + PER_PAGE));
  const go = (p) => {
    const target = Math.max(0, Math.min(pages.length - 1, p));
    scroller.current?.scrollTo({ left: target * scroller.current.clientWidth, behavior: 'smooth' });
    setPage(target);
  };
  const arrow = (enabled) => ({
    width: 40, height: 40, border: 'none', borderRadius: 999, background: 'none', cursor: 'pointer',
    color: enabled ? V('--th-primary') : V('--th-border'), display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <>
      <div ref={scroller} onScroll={(e) => {
        const p = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
        if (p !== page) setPage(p);
      }} style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', overscrollBehaviorX: 'contain', scrollbarWidth: 'none' }}>
        {pages.map((pg, i) => (
          <div key={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pg.map(m => {
              const minutes = m.startedAt ? Math.max(1, Math.round((new Date(m.endedAt) - new Date(m.startedAt)) / 60000)) : null;
              return (
                <div key={m.id} style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
                      {dayTime(m.endedAt, t)}{minutes ? ` · ${fmt(t('store', 'minutesShort'), { n: minutes })}` : ''}
                    </span>
                    <button onClick={() => setReporting(m)} aria-label={t('store', 'reportAria')} style={{
                      height: 32, padding: '0 10px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${V('--th-border')}`,
                      backgroundColor: V('--th-card'), color: V('--th-text-sub'), fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px',
                    }}><FlagIcon />{t('store', 'reportBtn')}</button>
                  </div>
                  {m.participants.map((p, k) => (
                    <span key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: p.placement === 1 ? V('--th-primary') : V('--th-text'), fontWeight: p.placement === 1 ? 700 : 400 }}>
                        {fmt(t('store', 'placeName'), { n: p.placement, name: p.nickname ?? t('store', 'leftMember') })}
                      </span>
                      <span style={{ color: V('--th-text-sub') }}>
                        {p.ratingChange == null ? '' : p.ratingChange > 0 ? `+${p.ratingChange}` : p.ratingChange}
                      </span>
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {pages.length > 1 && (
        <nav aria-label={t('store', 'matchPages')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <button onClick={() => go(page - 1)} aria-label={t('store', 'prevPage')} style={arrow(page > 0)}><BackIcon size={18} /></button>
          {pages.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-current={i === page ? 'page' : undefined} style={{
              width: 40, height: 40, border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: '14px', fontWeight: 700,
              backgroundColor: i === page ? V('--th-primary') : 'transparent', color: i === page ? '#fff' : V('--th-text-sub'),
            }}>{i + 1}</button>
          ))}
          <button onClick={() => go(page + 1)} aria-label={t('store', 'nextPage')} style={arrow(page < pages.length - 1)}><NextIcon /></button>
        </nav>
      )}
      {reporting && <ReportSheet match={reporting} gameName={gameName} onClose={() => setReporting(null)} t={t} />}
    </>
  );
};

export default StoreMatchHistory;
