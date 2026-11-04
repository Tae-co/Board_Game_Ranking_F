import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { closeAdminStoreReport, getAdminStoreReport, resetAdminStoreRatings, undoAdminStoreReset } from '../../api/services/admin';
import { V } from '../../utils/cssUtils';
import MemberDiceAvatar from '../shared/MemberDiceAvatar';
import { fmt, num } from '../store/fmt';
import { CheckIcon } from '../store/StoreIcons';
import { ConfirmDialog } from '../store/StorePopup';
import AdminSubPage from './AdminSubPage';

const REASON_KEYS = { NOT_PLAYED: 'reasonNotPlayed', THROWING: 'reasonThrowing', OTHER: 'reasonOther' };

const listStyle = { backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '4px 16px' };
const h2Style = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };

/** 10-29 / 10-29 16:02 */
const mmdd = (iso) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const mmddTime = (iso) => {
  const d = new Date(iso);
  return `${mmdd(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * 6b 신고 확인 · 점수 초기화 (전체 화면). 묶음 = (게임, 신고된 경기의 1등). 신고 내용 · 대상의 최근 경기 ·
 * 처리(같이 한 사람 중 고른 사람 → 이 매장 그 게임 500점 / 신고 닫기). 처리 뒤엔 초기화 전 점수와 되돌리기.
 */
const AdminReportReview = ({ store, group, onBack }) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const key = ['adminStoreReport', store.id, group.boardGameId, group.targetMemberId];
  const { data } = useQuery({ queryKey: key, queryFn: () => getAdminStoreReport(store.id, group.boardGameId, group.targetMemberId) });
  const [off, setOff] = useState({});
  const [undoOpen, setUndoOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      queryClient.setQueryData(key, await fn());
      queryClient.invalidateQueries({ queryKey: ['adminStoreReports', store.id] });
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <AdminSubPage title={t('admin', 'reportReview')} info={t('admin', 'reportInfo')} onBack={onBack} t={t}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: V('--th-text-sub') }}>{t('common', 'loading')}</div>
      </AdminSubPage>
    );
  }

  const picked = data.candidates.filter(c => !off[c.memberId]);
  const game = data.gameName;
  const leftName = t('store', 'leftMember');

  return (
    <AdminSubPage title={t('admin', 'reportReview')} info={fmt(t('admin', 'reportInfo'), { game })} onBack={onBack} t={t}>
      <section style={{ ...listStyle, padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <MemberDiceAvatar memberId={group.targetMemberId} nickname={data.targetNickname} size={44} />
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{data.targetNickname ?? leftName}</span>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
            {data.targetRank
              ? fmt(t('admin', 'reportTargetLine'), { game, rank: data.targetRank, score: num(data.targetScore), n: data.targetGames })
              : game}
          </span>
        </span>
        <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: '#FEE2E2', color: '#B91C1C', flexShrink: 0 }}>
          {fmt(t('admin', 'reportCount'), { n: data.reports.length })}
        </span>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={h2Style}>{t('admin', 'reportContents')}</h2>
        <div style={listStyle}>
          {data.reports.map((r, i) => (
            <div key={i} style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}` }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: V('--th-text') }}>{t('store', REASON_KEYS[r.reason])}</span>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{mmdd(r.createdAt)} · {r.memo ? `"${r.memo}"` : t('admin', 'reportNoMemo')}</span>
            </div>
          ))}
        </div>
      </section>

      {data.recent.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={h2Style}>{t('admin', 'reportRecent')}</h2>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('admin', 'reportWins'), { n: data.recentTotal, w: data.recentWins })}</span>
          </div>
          <div style={listStyle}>
            {data.recent.map((m, i) => (
              <div key={i} style={{ height: 52, display: 'flex', alignItems: 'center', gap: '10px', borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}` }}>
                <span style={{ width: 80, fontSize: '13px', color: V('--th-text-sub') }}>{mmddTime(m.endedAt)}</span>
                <span style={{ flex: 1, fontSize: '14px', color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.others.map(o => o ?? leftName).join(' · ')}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: m.placement === 1 ? V('--th-primary') : V('--th-text-sub') }}>
                  {fmt(t('store', 'placeN'), { n: m.placement })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={h2Style}>{t('admin', 'reportResolve')}</h2>
        {data.status === 'OPEN' ? (
          <div style={{ ...listStyle, padding: '4px 16px 16px' }}>
            <span style={{ display: 'block', padding: '12px 0 4px', fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('admin', 'reportPick'), { game })}</span>
            {data.candidates.map(c => {
              const on = !off[c.memberId];
              return (
                <button key={c.memberId} role="checkbox" aria-checked={on} onClick={() => setOff({ ...off, [c.memberId]: on })} style={{
                  width: '100%', height: 52, padding: 0, border: 'none', borderTop: `1px solid ${V('--th-border')}`, background: 'none',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', color: V('--th-text'),
                }}>
                  <span style={{
                    width: 20, height: 20, boxSizing: 'border-box', borderRadius: 5, border: `2px solid ${on ? '#DC2626' : V('--th-border')}`,
                    backgroundColor: on ? '#DC2626' : V('--th-card'), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{on && <CheckIcon size={14} />}</span>
                  <span style={{ flex: 1, fontSize: '15px', fontWeight: 500 }}>{c.nickname ?? leftName}</span>
                  <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
                    {c.target ? t('admin', 'reportTargetNote') : fmt(t('admin', 'reportTogether'), { n: c.together })}
                  </span>
                </button>
              );
            })}
            <button disabled={busy || picked.length === 0} onClick={() => run(() => resetAdminStoreRatings(store.id, group.boardGameId, group.targetMemberId, picked.map(c => c.memberId)))} style={{
              marginTop: 12, width: '100%', height: 52, border: 'none', borderRadius: '14px', cursor: picked.length ? 'pointer' : 'default',
              backgroundColor: picked.length ? '#DC2626' : '#FCA5A5', color: '#fff', fontSize: '16px', fontWeight: 700,
            }}>
              {picked.length ? fmt(t('admin', 'reportResetButton'), { n: picked.length, game }) : t('admin', 'reportPickNone')}
            </button>
            <button disabled={busy} onClick={() => run(() => closeAdminStoreReport(store.id, group.boardGameId, group.targetMemberId))} style={{
              marginTop: 8, width: '100%', height: 48, borderRadius: '14px', cursor: 'pointer',
              border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: V('--th-text'), fontSize: '15px', fontWeight: 700,
            }}>{t('admin', 'reportCloseButton')}</button>
          </div>
        ) : (
          <div style={{ ...listStyle, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>
              {data.status === 'CLOSED' ? t('admin', 'reportClosed')
                : data.status === 'UNDONE' ? t('admin', 'reportUndone')
                  : fmt(t('admin', 'reportResetDone'), { n: data.resets.length, game, date: data.resolvedAt ? mmdd(data.resolvedAt) : '' })}
            </span>
            {data.status !== 'CLOSED' && (
              <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>
                {data.status === 'UNDONE'
                  ? fmt(t('admin', 'reportUndoneBody'), { names: data.resets.map(r => r.nickname ?? leftName).join(' · '), game })
                  : `${data.resets.map(r => `${r.nickname ?? leftName} ${num(r.before)} → 500`).join(' · ')}. ${t('admin', 'reportBeforeSaved')}`}
              </span>
            )}
            {data.status === 'RESET' && (
              <button onClick={() => setUndoOpen(true)} disabled={busy} style={{
                height: 48, borderRadius: '14px', cursor: 'pointer', border: `1px solid ${V('--th-border')}`,
                backgroundColor: V('--th-card'), color: V('--th-text'), fontSize: '15px', fontWeight: 700,
              }}>{t('admin', 'reportUndoButton')}</button>
            )}
          </div>
        )}
      </section>

      {undoOpen && (
        <ConfirmDialog
          title={t('admin', 'reportUndoTitle')}
          body={fmt(t('admin', 'reportUndoBody'), { game })}
          cancelLabel={t('common', 'cancel')}
          actionLabel={t('admin', 'reportUndoAction')}
          danger={false}
          onCancel={() => setUndoOpen(false)}
          onAction={() => { setUndoOpen(false); run(() => undoAdminStoreReset(store.id, group.boardGameId, group.targetMemberId)); }}
        />
      )}
    </AdminSubPage>
  );
};

export default AdminReportReview;
