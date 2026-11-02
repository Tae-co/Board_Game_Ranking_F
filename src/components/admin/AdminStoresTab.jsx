import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAdminStores } from '../../api/services/admin';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import AdminStoreForm from './AdminStoreForm';
import AdminStoreStaff from './AdminStoreStaff';
import AdminStoreRooms from './AdminStoreRooms';

const h2Style = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };
const ghostButton = {
  boxSizing: 'border-box', padding: '0 16px', borderRadius: '12px', cursor: 'pointer',
  border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: V('--th-text'), fontWeight: 500,
};

/**
 * 6 어드민 매장 탭: 매장 선택 → 매장 정보(수정 6f) · STAFF 지정(6h) · 게임방 관리(6i) · "+ 매장 등록"(6e).
 * 매장 기기·TV 화면·시즌·이벤트·신고·요청·통계 칸은 뒤 단계에서 더한다.
 */
const AdminStoresTab = () => {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(null); // null | 'create' | 'edit' | 'staff' | 'rooms'

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['adminStores'],
    queryFn: getAdminStores,
    staleTime: 1000 * 30,
  });

  const selected = items.find(i => i.store.id === selectedId) ?? items[0] ?? null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['adminStores'] });
  const handleSaved = (item) => { refresh(); setSelectedId(item.store.id); };

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
        {items.length > 0 && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: V('--th-text') }}>{t('admin', 'storeSelect')}</span>
            <select
              value={selected.store.id}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              style={{ height: 48, borderRadius: '12px', border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), padding: '0 12px', fontSize: '15px', color: V('--th-text') }}
            >
              {items.map(({ store }) => (
                <option key={store.id} value={store.id}>
                  {storeTitle(store)}{store.closed ? ` (${t('store', 'closedBadge')})` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
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
          {/* 매장 기기(6g)는 3단계에서 이 줄에 더한다 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPage('staff')} style={{ ...ghostButton, height: 44, flex: 1, fontSize: '14px' }}>
              {t('admin', 'assignStaffTitle')}
            </button>
          </div>
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

      {(page === 'create' || (page === 'edit' && selected)) && (
        <AdminStoreForm
          key={page === 'edit' ? selected.store.id : 'new'}
          item={page === 'edit' ? selected : null}
          onBack={() => setPage(null)}
          onSaved={handleSaved}
          onClosed={() => { refresh(); setPage(null); }}
          onAssignStaff={(item) => { setSelectedId(item.store.id); setPage('staff'); }}
        />
      )}
      {page === 'rooms' && selected && <AdminStoreRooms store={selected.store} onBack={() => setPage(null)} />}
      {page === 'staff' && selected && (
        <AdminStoreStaff store={selected.store} staff={selected.staff} onBack={() => setPage(null)} />
      )}
    </div>
  );
};

export default AdminStoresTab;
