import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreDirectory } from '../hooks/useStoreDirectory';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreDirectoryList from '../components/store/StoreDirectoryList';
import StoreTopBar from '../components/store/StoreTopBar';
import { SearchIcon } from '../components/store/StoreIcons';
import { storeArea } from '../constants/store';
import { Skeleton } from '../components/Skeleton';

const SEARCH_DEBOUNCE_MS = 300;

/** 1g 입점 매장 전체. 이름 검색, 동네(주소 앞 두 단어)별 묶음. 가입함 → 2, 나머지 → 2d */
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

  // 묶음 안은 서버 순서(이름 순)를 따른다
  const byArea = stores.reduce((groups, store) => {
    (groups[storeArea(store)] ??= []).push(store);
    return groups;
  }, {});
  const areas = Object.keys(byArea).sort((a, b) => a.localeCompare(b));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('store', 'directoryTitle')} onBack={() => navigate('/community')} backLabel={t('common', 'back')} />

      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '16px 20px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label style={{
          height: 48, boxSizing: 'border-box', padding: '0 14px', borderRadius: '12px',
          border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'),
          display: 'flex', alignItems: 'center', gap: '10px', color: V('--th-text-sub'),
        }}>
          <SearchIcon />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('store', 'searchPlaceholder')}
            aria-label={t('store', 'searchPlaceholder')}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: V('--th-text') }}
          />
        </label>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2].map(i => <Skeleton key={i} height={64} radius={14} />)}
          </div>
        ) : stores.length === 0 ? (
          <p style={{ fontSize: '14px', color: V('--th-text-sub'), textAlign: 'center', padding: '32px 0' }}>
            {t('store', query ? 'noSearchResult' : 'noStores')}
          </p>
        ) : (
          areas.map(area => (
            <section key={area} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>
                {area}{' '}
                <span style={{ fontWeight: 500, color: V('--th-text-sub') }}>{t('store', 'placeCount').replace('{n}', byArea[area].length)}</span>
              </h2>
              <StoreDirectoryList stores={byArea[area]} onOpen={(s) => navigate(`/store/${s.id}`)} t={t} />
            </section>
          ))
        )}
        <span style={{ textAlign: 'center', fontSize: '12px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('store', 'directoryFootnote')}</span>
      </main>
    </div>
  );
};

export default StoreList;
