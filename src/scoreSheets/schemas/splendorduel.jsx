import { cl } from '../shared/scoreUtils';

export const splendorDuelSchema = {
  name: "Splendor Duel",
  type: "splendorduel",
  winConditions: [
    { key: "prestige",  label: "명성 20점",   labelEn: "20 Prestige Points", icon: "💎" },
    { key: "crowns",    label: "왕관 10개",    labelEn: "10 Crowns",          icon: "👑" },
    { key: "colors",    label: "6색 완성",     labelEn: "6 Color Mastery",    icon: "🌈" },
  ],
};

export const SplendorDuelTable = ({
  schema, players,
  duelWinCondition, setDuelWinCondition,
  duelWinnerId, setDuelWinnerId,
  t, lang,
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
                onClick={() => setDuelWinnerId(isWinner ? null : player.memberId)}
                style={{
                  flex: 1, padding: "20px 8px", borderRadius: 14, cursor: "pointer", textAlign: "center",
                  border: `2px solid ${isWinner ? "var(--th-primary)" : "var(--th-border)"}`,
                  background: isWinner ? "var(--th-primary)" : "var(--th-card)",
                  color: isWinner ? "#fff" : "var(--th-text)",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>💎</div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{player.nickname}</div>
                {isWinner && <div style={{ fontSize: 11, marginTop: 4, color: "rgba(255,255,255,0.85)" }}>승리!</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 승리 조건 선택 */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t('scoreSheet', 'howWin')}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {schema.winConditions.map(wc => {
            const isSelected = duelWinCondition === wc.key;
            return (
              <button
                key={wc.key}
                onClick={() => setDuelWinCondition(isSelected ? null : wc.key)}
                style={{
                  padding: "14px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", textAlign: "left",
                  border: `2px solid ${isSelected ? "var(--th-primary)" : "var(--th-border)"}`,
                  background: isSelected ? "var(--th-primary)" : "var(--th-card)",
                  color: isSelected ? "#fff" : "var(--th-text)",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ marginRight: 8, fontSize: 16 }}>{wc.icon}</span>
                {cl(wc, lang)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 승리 조건 설명 */}
      <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: "var(--th-bg)", border: "1px solid var(--th-border)" }}>
        <div style={{ fontSize: 11, color: "var(--th-text-sub)", lineHeight: 1.6 }}>
          <div>💎 명성 20점 — 발전 카드 점수 합계 20점 이상</div>
          <div>👑 왕관 10개 — 보유 카드의 왕관 심볼 합계 10개</div>
          <div>🌈 6색 완성 — 6가지 보석 색 각 1점 이상의 카드 보유</div>
        </div>
      </div>
    </div>
  );
};
