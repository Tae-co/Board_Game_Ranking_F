import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAdminStoreMonthlyReport, getAdminStores } from '../../api/services/admin';
import { V } from '../../utils/cssUtils';
import AdminStoreSelect from './AdminStoreSelect';
import { PopularBars, ReportTiles } from '../store/ReportStats';
import { peakText } from '../store/reportUtils';

const h2Style = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };

/** 어드민 통계 탭: 매장 선택 → 이번 달 통계 (매장 탭 맨 밑에 있던 칸을 따로 뺐다). */
const AdminStatsTab = ({ selectedId, onSelect }) => {
  const { t } = useLanguage();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['adminStores'],
    queryFn: getAdminStores,
    staleTime: 1000 * 30,
  });
  const selected = items.find(i => i.store.id === selectedId) ?? items[0] ?? null;

  const { data: stats } = useQuery({
    queryKey: ['adminStoreStats', selected?.store.id],
    queryFn: () => getAdminStoreMonthlyReport(selected.store.id),
    enabled: !!selected,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={h2Style}>{t('admin', 'statsTab')}</h2>
        {items.length > 0 && <AdminStoreSelect items={items} value={selected.store.id} onChange={onSelect} />}
      </section>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: V('--th-text-sub') }}>{t('common', 'loading')}</div>
      ) : !selected ? (
        <div style={{ borderRadius: '20px', padding: '32px', border: `2px dashed ${V('--th-border')}`, textAlign: 'center', color: V('--th-text-sub') }}>
          {t('admin', 'noStoresYet')}
        </div>
      ) : stats && (
        <section style={{
          backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
          padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={h2Style}>{t('admin', 'stats')}</h2>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('admin', 'thisMonth')}</span>
          </div>
          <ReportTiles report={stats} size={20} t={t} />
          {stats.popular.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: V('--th-text') }}>{t('store', 'reportPopular')}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <PopularBars popular={stats.popular.slice(0, 3)} labelWidth={64} />
              </div>
            </div>
          )}
          {stats.matches > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: V('--th-text') }}>{t('admin', 'peakTime')}</span>
              <span style={{ fontSize: '14px', color: V('--th-text') }}>{peakText(stats, t)}</span>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminStatsTab;
