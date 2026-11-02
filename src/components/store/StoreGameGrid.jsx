import { useState } from 'react';
import StorageImage from '../StorageImage';
import GameImageFallback from '../shared/GameImageFallback';
import { STORE_GAME_GRID_LIMIT } from '../../constants/store';
import { V } from '../../utils/cssUtils';

const GameTile = ({ game, onClick, t }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0,
        padding: '10px', borderRadius: '14px', textAlign: 'left', cursor: 'pointer',
        backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: V('--th-bg') }}>
        {game.imageUrl && !imgError ? (
          <StorageImage src={game.imageUrl} alt={game.name} loading="lazy" decoding="async" onError={() => setImgError(true)}
            transform={{ width: 80, height: 80, quality: 70 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GameImageFallback size={26} />
          </div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: V('--th-text'), margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {game.name}
        </p>
        <p style={{ fontSize: '11px', color: V('--th-text-sub'), margin: 0 }}>
          {t('store', 'playerRange').replace('{min}', game.minPlayers).replace('{max}', game.maxPlayers)}
        </p>
      </div>
    </button>
  );
};

/**
 * 매장 게임 2열 그리드. 8개 + 나머지 개수. 1단계엔 게임방이 없어 누르면 onGameClick("곧 열려요")
 */
const StoreGameGrid = ({ games, onGameClick, t }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? games : games.slice(0, STORE_GAME_GRID_LIMIT);
  const hidden = games.length - visible.length;

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), margin: '0 0 12px' }}>
        {t('store', 'storeGames')}
      </p>
      {games.length === 0 ? (
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), textAlign: 'center', padding: '16px 0' }}>
          {t('store', 'noStoreGames')}
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {visible.map(game => (
            <GameTile key={game.storeRoomId} game={game} onClick={() => onGameClick(game)} t={t} />
          ))}
          {hidden > 0 && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                padding: '10px', borderRadius: '14px', cursor: 'pointer',
                backgroundColor: V('--th-bg'), border: `1px dashed ${V('--th-border')}`,
                fontSize: '15px', fontWeight: '800', color: V('--th-text-sub'),
              }}
            >
              {t('store', 'moreGames').replace('{n}', hidden)}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreGameGrid;
