import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAdminScoreRequests, getAdminStoreReports, getAdminStores, getAdminTvSetting } from '../../api/services/admin';
import { V } from '../../utils/cssUtils';
import AdminStoreForm from './AdminStoreForm';
import AdminStoreStaff from './AdminStoreStaff';
import AdminStoreRooms from './AdminStoreRooms';
import AdminStoreDevices from './AdminStoreDevices';
import AdminTvSettings from './AdminTvSettings';
import AdminStoreSeason from './AdminStoreSeason';
import AdminStoreEvents from './AdminStoreEvents';
import AdminReportReview from './AdminReportReview';
import AdminScoreRequests from './AdminScoreRequests';
import AdminStoreSelect from './AdminStoreSelect';
import { REQUEST_PILL, SCORE_REQUESTS_KEY } from '../store/requestStatus';
import { fmt } from '../store/fmt';

const h2Style = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };
const sectionCard = {
  backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
  padding: '18px', display: 'flex', flexDirection: 'column',
};
const rowButton = {
  height: 56, display: 'flex', alignItems: 'center', gap: '12px', padding: 0, border: 'none', background: 'none',
  borderTop: `1px solid ${V('--th-border')}`, cursor: 'pointer', textAlign: 'left',
};
const mmdd = (iso) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const ghostButton = {
  boxSizing: 'border-box', padding: '0 16px', borderRadius: '12px', cursor: 'pointer',
  border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: V('--th-text'), fontWeight: 500,
};

/**
 * 6 어드민 매장 탭: 매장 선택 → 매장 정보(수정 6f) · 매장 기기(6g) · STAFF 지정(6h) · 매장 TV 화면(6k) ·
 * 게임방 관리(6i) · 시즌 · 이벤트(6j) · 신고(6b) · 점수판 요청(6c) · "+ 매장 등록"(6e).
 */
const AdminStoresTab = ({ selectedId, onSelect, onCreateGame }) => {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(null); // null | 'create' | 'edit' | 'staff' | 'rooms' | 'devices' | 'tv' | 'report' | 'requests'
  const [reportGroup, setReportGroup] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['adminStores'],
    queryFn: getAdminStores,
    staleTime: 1000 * 30,
  });

  const selected = items.find(i => i.store.id === selectedId) ?? items[0] ?? null;
  const showTv = selected && !selected.store.closed;

  // 매장 TV 화면 줄의 요약 (MVP → TOP 10 → … · 10초마다)
  const { data: tv } = useQuery({
    queryKey: ['adminTvSetting', selected?.store.id],
    queryFn: () => getAdminTvSetting(selected.store.id),
    enabled: !!showTv,
    staleTime: 1000 * 30,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['adminStores'] });
  const handleSaved = (item) => { refresh(); onSelect(item.store.id); };

  const { data: reports = [] } = useQuery({
    queryKey: ['adminStoreReports', selected?.store.id],
    queryFn: () => getAdminStoreReports(selected.store.id),
    enabled: !!selected,
  });
  const { data: requests = [] } = useQuery({ queryKey: SCORE_REQUESTS_KEY, queryFn: getAdminScoreRequests });
  const openReports = reports.filter(r => r.status === 'OPEN').length;
  const newRequests = requests.filter(r => r.status === 'REVIEW').length;

  const formatDate = (iso) => new Date(iso).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={h2Style}>{t('admin', 'storesTab')}</h2>
          <button
            onClick={() => setPage('create')}
            style={{ height: 36, padding: '0 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: V('--th-primary'), color: '#fff', fontSize: '13px', fontWeight: 700 }}
          >
            + {t('admin', 'addStore')}
          </button>
        </div>
        {items.length > 0 && <AdminStoreSelect items={items} value={selected.store.id} onChange={onSelect} />}
      </section>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: V('--th-text-sub') }}>{t('common', 'loading')}</div>
      ) : !selected ? (
        <div style={{ borderRadius: '20px', padding: '32px', border: `2px dashed ${V('--th-border')}`, textAlign: 'center', color: V('--th-text-sub') }}>
          {t('admin', 'noStoresYet')}
        </div>
      ) : (
        <section style={{
          backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
          padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={h2Style}>{t('admin', 'storeInfo')}</h2>
            {!selected.store.closed && (
              <button onClick={() => setPage('edit')} style={{ ...ghostButton, height: 36, fontSize: '13px' }}>{t('admin', 'storeEdit')}</button>
            )}
          </div>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
            {[
              selected.store.address,
              `${selected.store.openTime}–${selected.store.closeTime}`,
              t('admin', 'storeMembers').replace('{n}', selected.memberCount),
            ].join(' · ')}
          </span>
          {selected.closedAt && (
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>
              {t('admin', 'storeClosedAt').replace('{date}', formatDate(selected.closedAt))}
            </span>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPage('devices')} style={{ ...ghostButton, height: 44, flex: 1, fontSize: '14px' }}>
              {t('admin', 'storeDevices')}
            </button>
            <button onClick={() => setPage('staff')} style={{ ...ghostButton, height: 44, flex: 1, fontSize: '14px' }}>
              {t('admin', 'assignStaffTitle')}
            </button>
          </div>
        </section>
      )}

      {showTv && (
        <section style={{
          backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
          padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={h2Style}>{t('admin', 'tvScreen')}</h2>
            <button onClick={() => setPage('tv')} style={{ ...ghostButton, height: 36, fontSize: '13px' }}>{t('admin', 'tvSettingsButton')}</button>
          </div>
          {tv && (
            <span style={{ fontSize: '14px', lineHeight: 1.5, color: V('--th-text-sub') }}>
              {tv.setting.order.map(k => t('admin', `tvShort${k}`)).join(' → ')} · {fmt(t('admin', 'tvEvery'), { n: tv.setting.intervalSec })}
            </span>
          )}
        </section>
      )}

      {selected && !selected.store.closed && (
        <section style={{
          backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
          padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={h2Style}>{t('admin', 'storeRooms')}</h2>
          <button onClick={() => setPage('rooms')} style={{ ...ghostButton, height: 36, fontSize: '13px' }}>{t('admin', 'manageRooms')}</button>
        </section>
      )}

      {selected && !selected.store.closed && <AdminStoreSeason store={selected.store} />}

      {selected && !selected.store.closed && <AdminStoreEvents key={selected.store.id} store={selected.store} />}

      {selected && (
        <section style={{ ...sectionCard, gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={h2Style}>{t('admin', 'reports')}</h2>
            {openReports > 0 && (
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                {fmt(t('admin', 'reportsOpen'), { n: openReports })}
              </span>
            )}
          </div>
          <div style={{ height: 8 }} />
          {reports.length === 0 && <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('admin', 'reportsEmpty')}</span>}
          {reports.map(g => (
            <button key={`${g.boardGameId}-${g.targetMemberId}`} onClick={() => { setReportGroup(g); setPage('report'); }} style={rowButton}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>{g.targetNickname ?? t('store', 'leftMember')} · {g.gameName}</span>
                <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
                  {fmt(t('admin', g.count > 1 ? 'reportsLineMany' : 'reportsLineOne'), { n: g.count, last: mmdd(g.lastAt) })}
                  {g.status !== 'OPEN' ? ` · ${t('admin', `reportStatus${g.status}`)}` : ''}
                </span>
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-primary') }}>{t('admin', 'reportCheck')}</span>
            </button>
          ))}
        </section>
      )}

      <section style={{ ...sectionCard, gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={h2Style}>{t('admin', 'scoreRequests')}</h2>
          {newRequests > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.12)`, color: V('--th-primary') }}>
              {fmt(t('admin', 'requestsNew'), { n: newRequests })}
            </span>
          )}
        </div>
        <div style={{ height: 8 }} />
        {requests.length === 0 && <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('admin', 'requestsEmpty')}</span>}
        {requests.slice(0, 2).map(r => {
          const [bg, color, key] = REQUEST_PILL[r.status];
          return (
            <button key={r.id} onClick={() => setPage('requests')} style={rowButton}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>{r.name}</span>
                <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
                  {fmt(t('admin', 'requestSummary'), { n: r.count, stores: r.stores.length, last: mmdd(r.lastAt) })}
                </span>
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: bg, color }}>{t('store', key)}</span>
            </button>
          );
        })}
        {requests.length > 0 && (
          <button onClick={() => setPage('requests')} style={{ marginTop: 8, alignSelf: 'center', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: V('--th-primary') }}>
            {t('admin', 'requestsAll')}
          </button>
        )}
      </section>

      {(page === 'create' || (page === 'edit' && selected)) && (
        <AdminStoreForm
          key={page === 'edit' ? selected.store.id : 'new'}
          item={page === 'edit' ? selected : null}
          onBack={() => setPage(null)}
          onSaved={handleSaved}
          onClosed={() => { refresh(); setPage(null); }}
          onAssignStaff={(item) => { onSelect(item.store.id); setPage('staff'); }}
        />
      )}
      {page === 'rooms' && selected && <AdminStoreRooms store={selected.store} onBack={() => setPage(null)} />}
      {page === 'devices' && selected && <AdminStoreDevices store={selected.store} onBack={() => setPage(null)} />}
      {page === 'tv' && selected && <AdminTvSettings store={selected.store} onBack={() => setPage(null)} />}
      {page === 'report' && selected && reportGroup && (
        <AdminReportReview store={selected.store} group={reportGroup} onBack={() => setPage(null)} />
      )}
      {page === 'requests' && (
        <AdminScoreRequests requests={requests} onBack={() => setPage(null)} onCreateGame={onCreateGame} />
      )}
      {page === 'staff' && selected && (
        <AdminStoreStaff store={selected.store} staff={selected.staff} onBack={() => setPage(null)} />
      )}
    </div>
  );
};

export default AdminStoresTab;
