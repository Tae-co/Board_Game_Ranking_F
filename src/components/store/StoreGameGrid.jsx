import { useState } from 'react';
import StorageImage from '../StorageImage';
import GameImageFallback from '../shared/GameImageFallback';
import { STORE_GAME_GRID_LIMIT } from '../../constants/store';
import { V } from '../../utils/cssUtils';

const GameTile = ({ game, onClick }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        padding: 0, textAlign: 'left', cursor: onClick ? 'pointer' : 'default', minWidth: 0,
        backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '16px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ height: 96, width: '100%', backgroundColor: V('--th-bg-deep'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {game.imageUrl && !imgError ? (
          <StorageImage src={game.imageUrl} alt={game.name} loading="lazy" decoding="async" onError={() => setImgError(true)}
            transform={{ width: 360, height: 192, quality: 70 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <GameImageFallback size={40} />
        )}
      </div>
      {/* 시안의 "참여 N명"은 매장 기록이 생기는 2단계에서 더한다 */}
      <div style={{ padding: '10px 12px 12px' }}>
        <span style={{
          display: 'block', fontSize: '15px', fontWeight: 700, color: V('--th-text'),
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {game.name}
        </span>
      </div>
    </button>
  );
};

/**
 * 매장 게임 2열 그리드 (시안 2 · 2d). 4개 먼저, 더보기로 전부. 구경(2d)은 제목 옆에 개수가 붙고 누를 수 없다.
 * 1단계엔 게임방이 없어 멤버가 누르면 onGameClick("곧 열려요")
 */
const StoreGameGrid = ({ games, onGameClick, showCount, t }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? games : games.slice(0, STORE_GAME_GRID_LIMIT);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>
          {t('store', 'storeGames')}
          {showCount && (
            <span style={{ fontSize: '14px', fontWeight: 500, color: V('--th-text-sub') }}>
              {' '}{t('store', 'gameCountShort').replace('{n}', games.length)}
            </span>
          )}
        </h2>
        {!expanded && games.length > STORE_GAME_GRID_LIMIT && (
          <button
            onClick={() => setExpanded(true)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: V('--th-primary') }}
          >
            {t('store', 'more')}
          </button>
        )}
      </div>
      {games.length === 0 ? (
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), textAlign: 'center', padding: '16px 0', margin: 0 }}>
          {t('store', 'noStoreGames')}
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
          {visible.map(game => (
            <GameTile key={game.storeRoomId} game={game} onClick={onGameClick ? () => onGameClick(game) : undefined} />
          ))}
        </div>
      )}
    </section>
  );
};

export default StoreGameGrid;
