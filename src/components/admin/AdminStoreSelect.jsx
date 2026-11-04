import { useLanguage } from '../../i18n/LanguageContext';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';

/** 어드민 매장 탭·통계 탭이 같이 쓰는 "관리할 매장" 선택. 고른 매장은 Admin.jsx가 들고 있어 탭을 옮겨도 유지된다. */
const AdminStoreSelect = ({ items, value, onChange }) => {
  const { t } = useLanguage();
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '13px', fontWeight: 500, color: V('--th-text') }}>{t('admin', 'storeSelect')}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ height: 48, borderRadius: '12px', border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), padding: '0 12px', fontSize: '15px', color: V('--th-text') }}
      >
        {items.map(({ store }) => (
          <option key={store.id} value={store.id}>
            {storeTitle(store)}{store.closed ? ` (${t('store', 'closedBadge')})` : ''}
          </option>
        ))}
      </select>
    </label>
  );
};

export default AdminStoreSelect;
