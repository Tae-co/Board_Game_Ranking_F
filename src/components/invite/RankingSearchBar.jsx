import { useEffect, useRef } from 'react';
import { Search, X, Info } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/** 랭킹 표 위의 점수 안내(i) 버튼과 플레이어 검색 */
const RankingSearchBar = ({ showSearch, setShowSearch, searchQuery, setSearchQuery, onShowRatingInfo, t }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (showSearch) setTimeout(() => inputRef.current?.focus(), 50);
    else setSearchQuery('');
  }, [showSearch, setSearchQuery]);

  const iconButtonStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', color: V('--th-text-sub') };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6 }}>
      <button onClick={onShowRatingInfo} style={iconButtonStyle}>
        <Info size={18} />
      </button>
      {showSearch ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          backgroundColor: V('--th-card'), border: `1px solid var(--th-primary)`,
          borderRadius: 12, padding: '8px 12px',
        }}>
          <Search size={14} color="var(--th-primary)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('invite', 'searchPlayerPlaceholder')}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 13, fontWeight: 500, color: V('--th-text'),
            }}
          />
          <button
            onClick={() => setShowSearch(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <X size={16} color="var(--th-text-sub)" />
          </button>
        </div>
      ) : (
        <button onClick={() => setShowSearch(true)} style={iconButtonStyle}>
          <Search size={18} />
        </button>
      )}
    </div>
  );
};

export default RankingSearchBar;
