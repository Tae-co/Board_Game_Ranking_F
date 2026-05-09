import { useState } from 'react';
import { cl } from '../shared/scoreUtils';

const AVATAR_COLORS = ['#6B5CE7', '#7B8FF5', '#A78BFA', '#60A5FA', '#34D399', '#F472B6', '#FB923C'];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export const splendorDuelSchema = {
  name: "Splendor Duel",
  type: "splendorduel",
  winConditions: [
    { key: "prestige",  label: "승점 20점",    labelEn: "20 Prestige Points",  color: "#6B5CE7" },
    { key: "crowns",    label: "왕관 10개",     labelEn: "10 Crowns",           color: "#F59E0B" },
    { key: "oneColor",  label: "한 색깔 10점",  labelEn: "10 Points One Color", color: "#14B8A6" },
  ],
};

const PlayerAvatar = ({ player, isWinner }) => {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%', margin: '0 auto 8px',
      backgroundColor: isWinner ? 'rgba(255,255,255,0.3)' : avatarColor(player.memberId),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, fontWeight: 700, color: '#fff', overflow: 'hidden',
    }}>
      {player.profileImage && !imgFailed
        ? <img src={player.profileImage} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : (player.nickname || '?')[0].toUpperCase()
      }
    </div>
  );
};


export const SplendorDuelTable = ({
  schema, players,
  duelWinCondition, setDuelWinCondition,
  duelWinnerId, setDuelWinnerId,
  t, lang, readOnly,
}) => {
  const p1 = players[0];
  const p2 = players[1];

  if (!p1 || !p2) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "var(--th-text-sub)", fontSize: 14 }}>
        스플렌더 듀얼은 2인 전용 게임입니다.
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>

      {/* 승자 선택 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t('scoreSheet', 'whoWon')}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[p1, p2].map(player => {
            const isWinner = duelWinnerId === player.memberId;
            return (
              <button
                key={player.memberId}
                onClick={readOnly ? undefined : () => setDuelWinnerId(isWinner ? null : player.memberId)}
                disabled={readOnly}
                style={{
                  flex: 1, padding: "20px 8px", borderRadius: 14, cursor: readOnly ? "default" : "pointer", textAlign: "center",
                  border: `2px solid ${isWinner ? "var(--th-primary)" : "var(--th-border)"}`,
                  background: isWinner ? "var(--th-primary)" : "var(--th-card)",
                  color: isWinner ? "#fff" : "var(--th-text)",
                  transition: "all 0.15s",
                }}
              >
                <PlayerAvatar player={player} isWinner={isWinner} />
                <div style={{ fontSize: 14, fontWeight: 900 }}>{player.nickname}</div>
                {isWinner && <div style={{ fontSize: 11, marginTop: 4, color: "rgba(255,255,255,0.85)" }}>승리!</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 승리 조건 선택 — 카드 버튼 */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t('scoreSheet', 'howWin')}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {schema.winConditions.map(wc => {
            const isSelected = duelWinCondition === wc.key;
            const descs = lang === 'en' ? {
              prestige:  "Total prestige points from development cards >= 20",
              crowns:    "Total crown symbols on owned cards = 10",
              oneColor:  "Total prestige from one color of cards >= 10",
            } : {
              prestige:  "발전 카드 승점 합계 20점 이상",
              crowns:    "보유 카드의 왕관 심볼 합계 10개",
              oneColor:  "같은 색깔 카드의 승점 합계 10점 이상",
            };
            return (
              <button
                key={wc.key}
                onClick={readOnly ? undefined : () => setDuelWinCondition(isSelected ? null : wc.key)}
                disabled={readOnly}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12, border: "none",
                  cursor: readOnly ? "default" : "pointer", textAlign: "left",
                  background: isSelected ? wc.color : "var(--th-card)",
                  border: `2px solid ${isSelected ? wc.color : "var(--th-border)"}`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: isSelected ? "rgba(255,255,255,0.8)" : wc.color,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#fff" : "var(--th-text)" }}>
                    {cl(wc, lang)}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2, color: isSelected ? "rgba(255,255,255,0.75)" : "var(--th-text-sub)" }}>
                    {descs[wc.key]}
                  </div>
                </div>
                {isSelected && (
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: "rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
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

    </div>
  );
};
