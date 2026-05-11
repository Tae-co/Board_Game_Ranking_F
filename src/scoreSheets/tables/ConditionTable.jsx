import { useState } from 'react';
import { cl } from '../shared/scoreUtils';

const AVATAR_COLORS = ['#6B5CE7', '#7B8FF5', '#A78BFA', '#60A5FA', '#34D399', '#F472B6', '#FB923C', '#38BDF8'];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const PlayerAvatar = ({ player, isWinner }) => {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%', margin: '0 auto 6px',
      backgroundColor: isWinner ? 'rgba(255,255,255,0.3)' : avatarColor(player.memberId),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, fontWeight: 700, color: '#fff', overflow: 'hidden', flexShrink: 0,
    }}>
      {player.profileImage && !imgFailed
        ? <img src={player.profileImage} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : (player.nickname || '?')[0].toUpperCase()
      }
    </div>
  );
};

const ConditionTable = ({
  schema, players,
  duelWinnerId, setDuelWinnerId,
  duelWinCondition, setDuelWinCondition,
  t, lang, readOnly,
}) => {
  const cols = Math.min(players.length, 4);
  return (
    <div style={{ padding: 20 }}>

      {/* 승자 선택 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--th-text-sub)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('scoreSheet', 'whoWon')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
          {players.map(player => {
            const isWinner = duelWinnerId === player.memberId;
            return (
              <button
                key={player.memberId}
                onClick={readOnly ? undefined : () => setDuelWinnerId(isWinner ? null : player.memberId)}
                disabled={readOnly}
                style={{
                  padding: '14px 6px', borderRadius: 12, cursor: readOnly ? 'default' : 'pointer', textAlign: 'center',
                  border: `2px solid ${isWinner ? 'var(--th-primary)' : 'var(--th-border)'}`,
                  background: isWinner ? 'var(--th-primary)' : 'var(--th-card)',
                  color: isWinner ? '#fff' : 'var(--th-text)',
                  transition: 'all 0.15s',
                }}
              >
                <PlayerAvatar player={player} isWinner={isWinner} />
                <div style={{ fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.nickname}
                </div>
                {isWinner && (
                  <div style={{ fontSize: 10, marginTop: 3, color: 'rgba(255,255,255,0.85)' }}>승리!</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 승리 조건 선택 */}
      {schema.winConditions?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--th-text-sub)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('scoreSheet', 'howWin')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {schema.winConditions.map(wc => {
              const isSelected = duelWinCondition === wc.key;
              const desc = lang === 'en' ? wc.descEn : wc.desc;
              return (
                <button
                  key={wc.key}
                  onClick={readOnly ? undefined : () => setDuelWinCondition(isSelected ? null : wc.key)}
                  disabled={readOnly}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    cursor: readOnly ? 'default' : 'pointer', textAlign: 'left',
                    background: isSelected ? wc.color : 'var(--th-card)',
                    border: `2px solid ${isSelected ? wc.color : 'var(--th-border)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : wc.color,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#fff' : 'var(--th-text)' }}>
                      {cl(wc, lang)}
                    </div>
                    {desc && (
                      <div style={{ fontSize: 11, marginTop: 2, color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--th-text-sub)' }}>
                        {desc}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default ConditionTable;
