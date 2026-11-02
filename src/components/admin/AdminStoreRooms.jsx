import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminStoreRooms, setAdminStoreRoomClosed } from '../../api/services/admin';
import { storeTitle } from '../../constants/store';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';
import AdminSubPage from './AdminSubPage';
import { SearchIcon } from '../store/StoreIcons';

/**
 * 6i 게임방 관리: 이 매장 게임방 전체(열림 N / 전체 N) · 검색 · 기록 시간·판 수 · 잠시 닫기 / 다시 열기.
 * 예정된 대회 표시는 5단계, 점수판 요청 보기(6c)는 4단계
 */
const AdminStoreRooms = ({ store, onBack }) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  const key = ['adminStoreRooms', store.id];
  const { data: rooms = [] } = useQuery({ queryKey: key, queryFn: () => getAdminStoreRooms(store.id) });

  const toggle = async (room) => {
    setBusyId(room.storeRoomId);
    try {
      queryClient.setQueryData(key, await setAdminStoreRoomClosed(store.id, room.storeRoomId, !room.closed));
    } catch {
      alert(t('admin', 'saveFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const shown = rooms.filter(r => r.name.toLowerCase().includes(q.trim().toLowerCase()));
  const open = rooms.filter(r => !r.closed).length;

  return (
    <AdminSubPage title={t('admin', 'roomsTitle')} info={t('admin', 'roomsInfo')} onBack={onBack} t={t}>
      <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
        {t('admin', 'roomsMeta').replace('{store}', storeTitle(store)).replace('{open}', open).replace('{total}', rooms.length)}
      </span>
      <label style={{ height: 48, boxSizing: 'border-box', padding: '0 14px', borderRadius: '12px', border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), display: 'flex', alignItems: 'center', gap: '10px', color: V('--th-text-sub') }}>
        <SearchIcon />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('store', 'gameSearch')} aria-label={t('store', 'gameSearch')}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: V('--th-text') }} />
      </label>
      <section style={{ backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '4px 16px' }}>
        {shown.map((r, i) => (
          <div key={r.storeRoomId} style={{ minHeight: 64, padding: '10px 0', display: 'flex', alignItems: 'center', gap: '12px', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 700, color: r.closed ? V('--th-text-sub') : V('--th-text') }}>
                {r.name}
                {r.closed && <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 8px', borderRadius: 999, backgroundColor: V('--th-bg-deep'), color: V('--th-text-sub') }}>{t('admin', 'roomClosedBadge')}</span>}
              </span>
              <span style={{ fontSize: '12px', color: r.minMinutes == null ? '#B4500A' : V('--th-text-sub') }}>
                {r.minMinutes == null
                  ? t('admin', 'roomNoMinutes')
                  : t('admin', 'roomSub').replace('{a}', r.minMinutes).replace('{b}', r.maxMinutes).replace('{n}', r.matchCount)}
              </span>
            </span>
            <button onClick={() => toggle(r)} disabled={busyId === r.storeRoomId} style={{
              height: 36, padding: '0 12px', borderRadius: 999, cursor: 'pointer', flexShrink: 0,
              border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'),
              color: r.closed ? V('--th-primary') : '#B91C1C', fontSize: '13px', fontWeight: 700,
            }}>{t('admin', r.closed ? 'roomReopen' : 'roomClose')}</button>
          </div>
        ))}
      </section>
    </AdminSubPage>
  );
};

export default AdminStoreRooms;
