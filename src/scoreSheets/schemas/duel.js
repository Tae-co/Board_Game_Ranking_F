import { cl } from '../shared/scoreUtils';

export const duelSchema = {
  name: "DUEL FOR MIDDLE-EARTH",
  type: "duel",
  winConditions: [
    { key: "support_races", label: "종족의 지지",  labelEn: "Support of the Races",   icon: "🌿" },
    { key: "quest_ring",    label: "반지 원정",    labelEn: "Quest of the Ring",       icon: "💍" },
    { key: "dominating",    label: "중간계 지배",  labelEn: "Dominating Middle-earth", icon: "👁️" },
  ],
};

export const DuelTable = ({ schema, players, duelWinCondition, setDuelWinCondition, duelWinnerId, setDuelWinnerId, duelFellowshipId, setDuelFellowshipId, t, lang }) => {
  const fellowshipPlayer = players.find(p => p.memberId === duelFellowshipId) || players[0];
  const sauronPlayer = players.find(p => p.memberId !== duelFellowshipId) || players[1];

  const swapTeams = () => {
    setDuelFellowshipId(sauronPlayer.memberId);
    if (duelWinnerId === fellowshipPlayer.memberId) setDuelWinnerId(sauronPlayer.memberId);
    else if (duelWinnerId === sauronPlayer.memberId) setDuelWinnerId(fellowshipPlayer.memberId);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t('scoreSheet', 'teamAssignment')}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, borderRadius: 14, border: "2px solid #16a34a", background: "#f0fdf4", padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🌿</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#16a34a", marginBottom: 8 }}>{t('scoreSheet', 'fellowshipTeam')}</div>
            <button onClick={swapTeams} style={{ padding: "5px 12px", borderRadius: 20, border: "1.5px solid #16a34a", background: "#fff", color: "#16a34a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {fellowshipPlayer.nickname} ⇄
            </button>
          </div>
          <div style={{ flex: 1, borderRadius: 14, border: "2px solid #b91c1c", background: "#fef2f2", padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>👁️</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#b91c1c", marginBottom: 8 }}>{t('scoreSheet', 'sauronTeam')}</div>
            <div style={{ padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#b91c1c" }}>{sauronPlayer.nickname}</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t('scoreSheet', 'whoWon')}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { player: fellowshipPlayer, color: "#16a34a", emoji: "🌿", label: t('scoreSheet', 'fellowshipTeam') },
            { player: sauronPlayer,     color: "#b91c1c", emoji: "👁️", label: t('scoreSheet', 'sauronTeam') },
          ].map(({ player, color, emoji, label }) => (
            <button
              key={player.memberId}
              onClick={() => setDuelWinnerId(duelWinnerId === player.memberId ? null : player.memberId)}
              style={{
                flex: 1, padding: "18px 8px", borderRadius: 14, cursor: "pointer", textAlign: "center",
                border: `2px solid ${duelWinnerId === player.memberId ? color : "var(--th-border)"}`,
                background: duelWinnerId === player.memberId ? color : "var(--th-card)",
                color: duelWinnerId === player.memberId ? "#fff" : "var(--th-text)",
              }}
            >
              <div style={{ fontSize: 22 }}>{emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 900, marginTop: 6 }}>{label}</div>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, marginTop: 3 }}>{player.nickname}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t('scoreSheet', 'howWin')}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {schema.winConditions.map(wc => (
            <button
              key={wc.key}
              onClick={() => setDuelWinCondition(duelWinCondition === wc.key ? null : wc.key)}
              style={{
                padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left",
                border: `2px solid ${duelWinCondition === wc.key ? "var(--th-primary)" : "var(--th-border)"}`,
                background: duelWinCondition === wc.key ? "var(--th-primary)" : "var(--th-card)",
                color: duelWinCondition === wc.key ? "#fff" : "var(--th-text)",
              }}
            >
              {wc.icon} {cl(wc, lang)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
