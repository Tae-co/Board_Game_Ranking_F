import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { setAdminScoreRequestStatus } from '../../api/services/admin';
import { V } from '../../utils/cssUtils';
import { fmt } from '../store/fmt';
import { BackIcon, NextIcon } from '../store/StoreIcons';
import { REQUEST_PILL, REQUEST_STATUSES, SCORE_REQUESTS_KEY, storeCounts } from '../store/requestStatus';
import AdminSubPage from './AdminSubPage';

const PER_PAGE = 5;

const mmdd = (iso) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * 6c 점수판 요청 관리 (전체 화면). 같은 게임 묶음, 요청 많은 순, 한 페이지 5개. 펼치면 계산 방법·사진·상태 바꾸기·
 * "이 게임 점수판 만들기"(→ 게임 탭 게임 추가, 이름 미리 채움). 저장하면 서버가 같은 이름 요청을 추가됨으로 바꾼다.
 */
const AdminScoreRequests = ({ requests, onBack, onCreateGame }) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(null);

  const list = requests.filter(r => filter === 'ALL' || r.status === filter);
  const pageCount = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const cur = Math.min(page, pageCount - 1);
  const items = list.slice(cur * PER_PAGE, (cur + 1) * PER_PAGE);

  const change = async (id, status) => {
    queryClient.setQueryData(SCORE_REQUESTS_KEY, await setAdminScoreRequestStatus(id, status));
  };
  const go = (p) => { setPage(Math.max(0, Math.min(pageCount - 1, p))); setOpen(null); };
  const filters = ['ALL', ...REQUEST_STATUSES];

  return (
    <AdminSubPage title={t('admin', 'scoreRequests')} info={t('admin', 'scoreRequestsInfo')} onBack={onBack} t={t}>
      <div style={{ display: 'flex', gap: '8px', marginRight: -20, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {filters.map(f => {
          const on = f === filter;
          const count = f === 'ALL' ? requests.length : requests.filter(r => r.status === f).length;
          return (
            <button key={f} onClick={() => { setFilter(f); go(0); }} aria-pressed={on} style={{
              height: 36, padding: '0 14px', flexShrink: 0, borderRadius: 999, cursor: 'pointer', fontSize: '13px', fontWeight: 700,
              border: `1px solid ${on ? V('--th-primary') : V('--th-border')}`,
              backgroundColor: on ? V('--th-primary') : V('--th-card'), color: on ? '#fff' : V('--th-text-sub'),
            }}>{f === 'ALL' ? t('admin', 'filterAll') : t('store', REQUEST_PILL[f][2])} {count}</button>
          );
        })}
      </div>
      <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('admin', 'mostRequested')}</span>

      {items.map(r => {
        const expanded = open === r.id;
        const [bg, color, key] = REQUEST_PILL[r.status];
        return (
          <div key={r.id} style={{ backgroundColor: V('--th-card'), border: `1px solid ${expanded ? `rgba(${V('--th-primary-rgb')}, 0.4)` : V('--th-border')}`, borderRadius: '20px', overflow: 'hidden' }}>
            <button onClick={() => setOpen(expanded ? null : r.id)} aria-expanded={expanded} style={{
              width: '100%', boxSizing: 'border-box', padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', color: V('--th-text'),
            }}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>{r.name}</span>
                <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
                  {fmt(t('admin', 'requestLine'), { n: r.count, stores: storeCounts(r) || '—', last: mmdd(r.lastAt) })}
                </span>
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: 999, backgroundColor: bg, color }}>{t('store', key)}</span>
            </button>
            {expanded && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: `1px solid ${V('--th-border')}` }}>
                <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>{t('admin', 'requestNotes')}</span>
                  {r.notes.length === 0 && <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('admin', 'requestNoNotes')}</span>}
                  {r.notes.map((n, i) => (
                    <div key={i} style={{ backgroundColor: V('--th-bg'), borderRadius: '12px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '14px', lineHeight: 1.5, color: V('--th-text'), whiteSpace: 'pre-line' }}>{n.text}</span>
                      <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
                        {[n.visitor ? t('admin', 'requestVisitor') : (n.nickname ?? t('store', 'leftMember')), n.storeName].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  ))}
                </div>
                {r.photos.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>{fmt(t('admin', 'requestPhotos'), { n: r.photos.length })}</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {r.photos.map(url => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt="" style={{ width: 72, height: 72, borderRadius: '10px', objectFit: 'cover', backgroundColor: V('--th-bg-deep') }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>{t('admin', 'requestChangeStatus')}</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
                    {REQUEST_STATUSES.map(s => {
                      const on = s === r.status;
                      const [sbg, scolor, skey] = REQUEST_PILL[s];
                      return (
                        <button key={s} onClick={() => change(r.id, s)} aria-pressed={on} style={{
                          height: 40, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                          border: `1px solid ${on ? scolor : V('--th-border')}`, backgroundColor: on ? sbg : V('--th-card'), color: on ? scolor : V('--th-text-sub'),
                        }}>{t('store', skey)}</button>
                      );
                    })}
                  </div>
                </div>
                {r.status !== 'ADDED' && (
                  <button onClick={() => onCreateGame(r.name)} style={{
                    height: 52, border: 'none', borderRadius: '14px', cursor: 'pointer', backgroundColor: V('--th-primary'),
                    color: '#fff', fontSize: '16px', fontWeight: 700,
                  }}>{t('admin', 'requestCreateGame')}</button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {pageCount > 1 && (
        <nav aria-label={t('admin', 'requestPages')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <button onClick={() => go(cur - 1)} aria-label={t('store', 'prevPage')} style={{ width: 40, height: 40, border: 'none', borderRadius: 999, background: 'none', cursor: 'pointer', color: cur === 0 ? V('--th-border') : V('--th-primary'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BackIcon size={18} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => (
            <button key={i} onClick={() => go(i)} aria-current={i === cur ? 'page' : undefined} style={{
              width: 40, height: 40, border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: '14px', fontWeight: 700,
              backgroundColor: i === cur ? V('--th-primary') : 'transparent', color: i === cur ? '#fff' : V('--th-text-sub'),
            }}>{i + 1}</button>
          ))}
          <button onClick={() => go(cur + 1)} aria-label={t('store', 'nextPage')} style={{ width: 40, height: 40, border: 'none', borderRadius: 999, background: 'none', cursor: 'pointer', color: cur === pageCount - 1 ? V('--th-border') : V('--th-primary'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NextIcon />
          </button>
        </nav>
      )}
    </AdminSubPage>
  );
};

export default AdminScoreRequests;
