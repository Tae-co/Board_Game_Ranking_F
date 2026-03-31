import { cl } from '../shared/scoreUtils';

export const splendorDuelSchema = {
  name: "Splendor Duel",
  type: "splendorduel",
  winConditions: [
    { key: "prestige",  label: "승점 20점",       labelEn: "20 Prestige Points",   icon: "💎" },
    { key: "crowns",    label: "왕관 10개",        labelEn: "10 Crowns",            icon: "👑" },
    { key: "oneColor",  label: "한 색깔 10점",     labelEn: "10 Points One Color",  icon: "🎨" },
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

      {/* 승리 조건 선택 (드롭다운) */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t('scoreSheet', 'howWin')}
        </div>
        <select
          value={duelWinCondition ?? ""}
          onChange={e => setDuelWinCondition(e.target.value || null)}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, fontWeight: 600,
            border: `2px solid ${duelWinCondition ? "var(--th-primary)" : "var(--th-border)"}`,
            background: "var(--th-card)", color: duelWinCondition ? "var(--th-primary)" : "var(--th-text-sub)",
            outline: "none", cursor: "pointer", appearance: "auto",
          }}
        >
          <option value="">{lang === 'en' ? 'Select win condition...' : '우승 조건 선택...'}</option>
          {schema.winConditions.map(wc => (
            <option key={wc.key} value={wc.key}>
              {wc.icon} {cl(wc, lang)}
            </option>
          ))}
        </select>
      </div>

      {/* 선택된 조건 설명 */}
      {duelWinCondition && (() => {
        const wc = schema.winConditions.find(w => w.key === duelWinCondition);
        const descs = lang === 'en' ? {
          prestige:  "Total prestige points from development cards ≥ 20",
          crowns:    "Total crown symbols on owned cards = 10",
          oneColor:  "Total prestige from one color of cards ≥ 10",
        } : {
          prestige:  "발전 카드 승점 합계 20점 이상",
          crowns:    "보유 카드의 왕관 심볼 합계 10개",
          oneColor:  "같은 색깔 카드의 승점 합계 10점 이상",
        };
        return (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "var(--th-bg)", border: "1px solid var(--th-border)" }}>
            <div style={{ fontSize: 12, color: "var(--th-text-sub)" }}>
              {wc?.icon} {descs[duelWinCondition]}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
