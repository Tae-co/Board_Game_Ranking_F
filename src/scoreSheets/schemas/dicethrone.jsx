import { useState } from "react";

export const diceThroneSchema = {
  name: "Dice Throne",
  type: "dicethrone",
  lowestWins: false,
};

const TEAM_COLORS = [
  null,
  { badge: "#ef4444", text: "#fff", label: "A" },
  { badge: "#3b82f6", text: "#fff", label: "B" },
  { badge: "#22c55e", text: "#fff", label: "C" },
  { badge: "#f59e0b", text: "#fff", label: "D" },
];

const modeBtn = (active) => ({
  flex: 1,
  padding: "12px 8px",
  borderRadius: 12,
  border: active ? "2px solid var(--th-primary)" : "2px solid var(--th-border)",
  background: active ? "var(--th-primary)" : "var(--th-card)",
  color: active ? "#fff" : "var(--th-text)",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  transition: "all 0.15s",
});

const resultBtn = (active) => ({
  flex: 1,
  minWidth: 0,
  padding: "16px 8px",
  borderRadius: 14,
  border: active ? "2px solid var(--th-primary)" : "2px solid var(--th-border)",
  background: active ? "var(--th-primary)" : "var(--th-card)",
  color: active ? "#fff" : "var(--th-text)",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  transition: "all 0.15s",
});

export const DiceThroneTable = ({ players, scores, onTotalsChange, handleChange, readOnly, t }) => {
  const saved = (() => { try { return JSON.parse(scores?.['_data']?.['all']) ?? {}; } catch { return {}; } })();

  const [mode, setMode] = useState(saved.mode ?? null);
  const [teamAssign, setTeamAssign] = useState(() => {
    if (saved.teamAssign) return saved.teamAssign;
    const init = {};
    players.forEach((p, i) => { init[p.memberId] = (i % 2) + 1; });
    return init;
  });
  const [winnerId, setWinnerId] = useState(saved.winnerId ?? null);
  const [winningTeam, setWinningTeam] = useState(saved.winningTeam ?? null);
  const [isTie, setIsTie] = useState(saved.isTie ?? false);

  const save = (patch) => {
    const next = { mode, teamAssign, winnerId, winningTeam, isTie, ...patch };
    handleChange('_data', 'all', JSON.stringify(next));
    return next;
  };

  const pickMode = (m) => {
    if (readOnly) return;
    setMode(m);
    setWinnerId(null);
    setWinningTeam(null);
    setIsTie(false);
    onTotalsChange({});
    save({ mode: m, winnerId: null, winningTeam: null, isTie: false });
  };

  const pickWinner = (id) => {
    if (readOnly) return;
    setWinnerId(id);
    setIsTie(false);
    const totals = {};
    players.forEach(p => { totals[p.memberId] = p.memberId === id ? 2 : 1; });
    onTotalsChange(totals);
    save({ winnerId: id, isTie: false });
  };

  const pickTeamWin = (team) => {
    if (readOnly) return;
    setWinningTeam(team);
    setIsTie(false);
    const totals = {};
    players.forEach(p => { totals[p.memberId] = teamAssign[p.memberId] === team ? 2 : 1; });
    onTotalsChange(totals);
    save({ winningTeam: team, isTie: false });
  };

  const pickTie = () => {
    if (readOnly) return;
    setWinnerId(null);
    setWinningTeam(null);
    setIsTie(true);
    const totals = {};
    players.forEach(p => { totals[p.memberId] = 1; });
    onTotalsChange(totals);
    save({ winnerId: null, winningTeam: null, isTie: true });
  };

  const updateTeam = (memberId, team) => {
    if (readOnly) return;
    const next = { ...teamAssign, [memberId]: team };
    setTeamAssign(next);
    setWinningTeam(null);
    setIsTie(false);
    onTotalsChange({});
    save({ teamAssign: next, winningTeam: null, isTie: false });
  };

  const maxTeams = Math.min(4, Math.floor(players.length / 1));
  const distinctTeams = [...new Set(Object.values(teamAssign))].sort();

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* 모드 선택 */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("scoreSheet", "diceThroneSetup")}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => pickMode("solo")} disabled={readOnly} style={modeBtn(mode === "solo")}>
            ⚔️ {t("scoreSheet", "solo")}
          </button>
          <button onClick={() => pickMode("team")} disabled={readOnly} style={modeBtn(mode === "team")}>
            🛡️ {t("scoreSheet", "team")}
          </button>
        </div>
      </div>

      {/* Solo: 플레이어 중 승자 선택 */}
      {mode === "solo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {t("scoreSheet", "selectWinner")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {players.map(p => (
              <button key={p.memberId} onClick={() => pickWinner(p.memberId)} disabled={readOnly}
                style={resultBtn(winnerId === p.memberId && !isTie)}>
                ⚔️ {p.nickname}
              </button>
            ))}
          </div>
          <button onClick={pickTie} disabled={readOnly} style={{ ...resultBtn(isTie), flex: "unset" }}>
            🤝 {t("scoreSheet", "draw")}
          </button>
        </div>
      )}

      {/* Team: 팀 배정 → 우승 팀 선택 */}
      {mode === "team" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 팀 배정 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("scoreSheet", "teamAssignment")}
            </div>
            {players.map(p => (
              <div key={p.memberId} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--th-text)", flex: 1 }}>{p.nickname}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {Array.from({ length: Math.min(maxTeams, 4) }, (_, i) => i + 1).map(team => {
                    const tc = TEAM_COLORS[team];
                    const active = teamAssign[p.memberId] === team;
                    return (
                      <button key={team} onClick={() => updateTeam(p.memberId, team)} disabled={readOnly}
                        style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: readOnly ? "default" : "pointer", fontWeight: 800, fontSize: 13, background: active ? tc.badge : "var(--th-bg)", color: active ? tc.text : "var(--th-text-sub)", outline: active ? `2px solid ${tc.badge}` : `1px solid var(--th-border)` }}>
                        {tc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 우승 팀 선택 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("scoreSheet", "selectWinningTeam")}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {distinctTeams.map(team => {
                const tc = TEAM_COLORS[team];
                const active = winningTeam === team && !isTie;
                const teamPlayers = players.filter(p => teamAssign[p.memberId] === team);
                return (
                  <button key={team} onClick={() => pickTeamWin(team)} disabled={readOnly}
                    style={{ flex: 1, minWidth: 0, padding: "14px 8px", borderRadius: 14, border: active ? `2px solid ${tc.badge}` : "2px solid var(--th-border)", background: active ? tc.badge : "var(--th-card)", color: active ? tc.text : "var(--th-text)", fontWeight: 800, fontSize: 13, cursor: readOnly ? "default" : "pointer", transition: "all 0.15s" }}>
                    <div>{t("scoreSheet", "teamPrefix")}{tc.label}</div>
                    <div style={{ fontSize: 10, marginTop: 3, opacity: 0.8 }}>{teamPlayers.map(p => p.nickname).join(", ")}</div>
                  </button>
                );
              })}
              <button onClick={pickTie} disabled={readOnly}
                style={{ flex: 1, minWidth: 0, padding: "14px 8px", borderRadius: 14, border: isTie ? "2px solid var(--th-primary)" : "2px solid var(--th-border)", background: isTie ? "var(--th-primary)" : "var(--th-card)", color: isTie ? "#fff" : "var(--th-text)", fontWeight: 800, fontSize: 13, cursor: readOnly ? "default" : "pointer", transition: "all 0.15s" }}>
                🤝 {t("scoreSheet", "draw")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
