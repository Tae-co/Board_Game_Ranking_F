import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { closeAdminStore, getAdminStores } from '../../api/services/admin';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import AdminStoreForm from './AdminStoreForm';
import AdminStoreStaff from './AdminStoreStaff';

const InfoRow = ({ label, value }) => (
  <div className="flex gap-3 text-sm">
    <span className="flex-shrink-0 w-16" style={{ color: V('--th-text-sub') }}>{label}</span>
    <span className="min-w-0 break-words" style={{ color: V('--th-text') }}>{value || '—'}</span>
  </div>
);

/**
 * 6 어드민 매장 탭: 매장 선택 → 정보(수정 6f) · STAFF(6h) · "+ 매장 등록"(6e).
 * 게임방·시즌·이벤트·신고·요청·통계 칸은 뒤 단계에서 더한다.
 * 운영 끝내기는 1단계에선 closed_at만 남긴다 (그룹·대회·기기 정리는 각 단계에서).
 */
const AdminStoresTab = () => {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState(null); // null | 'create' | 'edit'
  const [error, setError] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['adminStores'],
    queryFn: getAdminStores,
    staleTime: 1000 * 30,
  });

  const selected = items.find(i => i.store.id === selectedId) ?? items[0] ?? null;

  const handleSaved = (item) => {
    queryClient.invalidateQueries({ queryKey: ['adminStores'] });
    setSelectedId(item.store.id);
    setMode(null);
  };

  const handleClose = async () => {
    const { store } = selected;
    if (!window.confirm(t('admin', 'closeStoreConfirm').replace('{name}', storeTitle(store)))) return;
    setError('');
    try {
      await closeAdminStore(store.id);
      queryClient.invalidateQueries({ queryKey: ['adminStores'] });
    } catch (e) {
      setError(e?.response?.data?.message || t('admin', 'saveFailed'));
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ color: V('--th-text') }}>{t('admin', 'storesTab')} ({items.length})</h2>
        {!mode && (
          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: V('--th-primary'), color: '#FFFFFF' }}
          >
            <Plus className="w-4 h-4" />
            {t('admin', 'addStore')}
          </button>
        )}
      </div>

      {mode && (
        <AdminStoreForm
          key={mode === 'edit' ? selected.store.id : 'new'}
          store={mode === 'edit' ? selected.store : null}
          onSaved={handleSaved}
          onCancel={() => setMode(null)}
        />
      )}

      {isLoading ? (
        <div className="text-center py-10" style={{ color: V('--th-text-sub') }}>{t('common', 'loading')}</div>
      ) : items.length === 0 ? (
        !mode && (
          <div className="rounded-2xl p-8 border-2 border-dashed text-center" style={{ borderColor: V('--th-border') }}>
            <p style={{ color: V('--th-text-sub') }}>{t('admin', 'noStoresYet')}</p>
          </div>
        )
      ) : !mode && (
        <div className="space-y-3">
          <select
            value={selected.store.id}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            aria-label={t('admin', 'storeSelect')}
            className="w-full px-4 py-3 rounded-lg border focus:outline-none"
            style={{ backgroundColor: V('--th-card'), borderColor: V('--th-border'), color: V('--th-text') }}
          >
            {items.map(({ store }) => (
              <option key={store.id} value={store.id}>
                {storeTitle(store)}{store.closed ? ` (${t('store', 'closedBadge')})` : ''}
              </option>
            ))}
          </select>

          <div className="rounded-xl p-4 border" style={{ backgroundColor: V('--th-card'), borderColor: V('--th-border') }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: V('--th-text') }}>{t('admin', 'storeInfo')}</p>
              {!selected.store.closed && (
                <button onClick={() => setMode('edit')} className="text-xs px-3 py-1 rounded-lg border" style={{ color: V('--th-primary'), borderColor: V('--th-border') }}>
                  {t('admin', 'storeEdit')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mb-3">
              {selected.store.imageUrl && (
                <img src={selected.store.imageUrl} alt={selected.store.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="truncate" style={{ color: V('--th-text') }}>{storeTitle(selected.store)}</p>
                <p className="text-xs" style={{ color: V('--th-text-sub') }}>
                  {t('admin', 'storeMembers').replace('{n}', selected.memberCount)}
                  {selected.closedAt && ` · ${t('admin', 'storeClosedAt').replace('{date}', formatDate(selected.closedAt))}`}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <InfoRow label={t('admin', 'storeAddress')} value={selected.store.address} />
              <InfoRow label={t('admin', 'storeRegion')} value={selected.store.region} />
              <InfoRow label={t('admin', 'storeHours')} value={`${selected.store.openTime}–${selected.store.closeTime}`} />
              <InfoRow label={t('admin', 'storePhoneShort')} value={selected.store.phone} />
            </div>
          </div>

          <AdminStoreStaff storeId={selected.store.id} staff={selected.staff} closed={selected.store.closed} />

          {!selected.store.closed && (
            <button onClick={handleClose} className="w-full py-3 rounded-full border text-sm" style={{ color: '#dc2626', borderColor: V('--th-border'), backgroundColor: V('--th-card') }}>
              {t('admin', 'closeStore')}
            </button>
          )}
          {error && <p className="text-xs text-center" style={{ color: '#ef4444' }}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default AdminStoresTab;
