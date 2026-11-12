import { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { V } from '../../utils/cssUtils';
import { useSwipePaging } from '../../hooks/useSwipePaging';
import GameImageFallback from '../shared/GameImageFallback';

const PAGE_SIZE = 15;

const searchInputStyle = {
  width: '100%', padding: '10px 12px 10px 34px', borderRadius: '10px',
  backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
  color: V('--th-text'), fontSize: '13px', outline: 'none', boxSizing: 'border-box',
};

/**
 * 게임방 만들기의 게임 고르기 — 검색, 15개씩 페이지(1부터 센다), 3열 카드.
 * canManage(커뮤니티 어드민)면 커스텀 게임 삭제(🗑)와 "직접 점수판 만들기"가 보인다.
 * onCreateCustom(검색어)로 점수판 만들기를 연다.
 */
const GamePicker = ({ games, selectedGameId, onSelect, canManage, deletingGameId, onDelete, onCreateCustom, t }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredGames = search
    ? games.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : games;
  const totalPages = Math.ceil(filteredGames.length / PAGE_SIZE);
  const pagedGames = filteredGames.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const swipe = useSwipePaging(currentPage - 1, totalPages, (p) => setCurrentPage(p + 1));

  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: '10px' }}>
        {t('lobby', 'selectGameLabel')}
      </p>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search style={{
          position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
          width: 14, height: 14, color: V('--th-text-sub'),
        }} />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder={t('lobby', 'gameSearchPlaceholder')}
          style={searchInputStyle}
          onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
        />
      </div>

      {/* Game Grid */}
      <div {...swipe} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {pagedGames.map((game) => {
          const selected = selectedGameId === game.id;
          // 커스텀 게임(communityId 있음)만 커뮤니티 어드민이 지울 수 있다
          const canDelete = canManage && game.communityId != null;
          return (
            <div key={game.id} style={{ position: 'relative' }}>
              <button
                onClick={() => onSelect(game.id)}
                style={{
                  width: '100%', display: 'block',
                  borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                  border: `2px solid ${selected ? 'var(--th-primary)' : 'var(--th-border)'}`,
                  backgroundColor: V('--th-card'),
                  transition: 'border-color 0.2s',
                }}
              >
                {game.imageUrl ? (
                  <img src={game.imageUrl} alt={game.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GameImageFallback size={44} />
                  </div>
                )}
                <p style={{
                  fontSize: '11px', padding: '6px 4px', textAlign: 'center',
                  color: selected ? V('--th-primary') : V('--th-text'),
                  fontWeight: selected ? '700' : '400',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  margin: 0,
                }}>
                  {game.name}
                </p>
              </button>

              {canDelete && (
                <button
                  onClick={() => onDelete(game)}
                  disabled={deletingGameId === game.id}
                  aria-label={t('lobby', 'deleteGameAria').replace('{n}', game.name)}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.55)', border: 'none', padding: 0,
                    cursor: deletingGameId === game.id ? 'wait' : 'pointer',
                  }}
                >
                  <Trash2 style={{ width: 12, height: 12, color: '#fff' }} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 목록에 없는 게임: 직접 점수판 만들기 */}
      {canManage && (
        <>
          {filteredGames.length === 0 && (
            <p style={{
              textAlign: 'center', fontSize: '13px', color: V('--th-text-sub'),
              margin: '20px 0 12px',
            }}>
              {t('lobby', 'noGameResult')}
            </p>
          )}
          <button
            onClick={() => onCreateCustom(search.trim())}
            style={{
              width: '100%', marginTop: '12px', padding: '12px', borderRadius: '12px',
              backgroundColor: 'transparent', border: `1px dashed var(--th-border)`,
              color: V('--th-primary'), fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            {search.trim()
              ? t('lobby', 'customGameCreate').replace('{n}', search.trim())
              : t('lobby', 'customGameCreateEmpty')}
          </button>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                width: 32, height: 32, borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: currentPage === page ? '700' : '400',
                backgroundColor: currentPage === page ? 'var(--th-primary)' : 'var(--th-card)',
                color: currentPage === page ? '#fff' : 'var(--th-text-sub)',
                transition: 'background-color 0.15s',
              }}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GamePicker;
