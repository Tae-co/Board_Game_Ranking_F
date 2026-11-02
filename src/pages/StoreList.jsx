import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useStoreDirectory } from '../hooks/useStoreDirectory';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreDirectoryList from '../components/store/StoreDirectoryList';
import { Skeleton } from '../components/Skeleton';

const SEARCH_DEBOUNCE_MS = 300;

/** 1g 입점 매장 전체. 이름 검색, 지역별 묶음 (서버가 지역·이름 순으로 준다). 가입함 → 2, 나머지 → 2d */
const StoreList = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const { data: stores = [], isLoading } = useStoreDirectory(query);

  const byRegion = stores.reduce((groups, store) => {
    (groups[store.region] ??= []).push(store);
    return groups;
  }, {});

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid ${V('--th-border')}` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px' }}>
          <button
            onClick={() => navigate('/community')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: V('--th-primary'), display: 'flex' }}
          >
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontSize: '17px', fontWeight: '700', color: V('--th-text') }}>{t('store', 'directoryTitle')}</span>
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '16px 20px 40px' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={16} color={V('--th-text-sub')} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('store', 'searchPlaceholder')}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px 12px 38px', borderRadius: '12px',
              border: `1px solid ${V('--th-border')}`, outline: 'none',
              backgroundColor: V('--th-card'), color: V('--th-text'), fontSize: '15px',
            }}
          />
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2].map(i => <Skeleton key={i} height={64} radius={14} />)}
          </div>
        ) : stores.length === 0 ? (
          <p style={{ fontSize: '14px', color: V('--th-text-sub'), textAlign: 'center', padding: '32px 0' }}>
            {t('store', query ? 'noSearchResult' : 'noStores')}
          </p>
        ) : (
          Object.entries(byRegion).map(([region, list]) => (
            <div key={region} style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: V('--th-text-sub'), margin: '0 0 8px' }}>{region}</p>
              <StoreDirectoryList stores={list} onOpen={(s) => navigate(`/store/${s.id}`)} t={t} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StoreList;
