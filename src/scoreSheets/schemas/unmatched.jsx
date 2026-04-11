import { useState, useEffect } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export const unmatchedSchema = {
  name: "Unmatched",
  type: "unmatched",
  lowestWins: false,
};

const HP_MAX = 30;

const TEAM_COLORS = [
  null,
  { border: "#ef4444", badge: "#ef4444", text: "#fff", label: "A" },
  { border: "#3b82f6", badge: "#3b82f6", text: "#fff", label: "B" },
  { border: "#22c55e", badge: "#22c55e", text: "#fff", label: "C" },
  { border: "#f59e0b", badge: "#f59e0b", text: "#fff", label: "D" },
];

// Auto-detect available modes based on player count
const getAvailableModes = (playerCount) => {
  if (playerCount === 2) return ["1v1"];
  if (playerCount === 3) return ["ffa"];
  if (playerCount === 4) return ["2v2", "ffa"];
  return ["ffa"];
};

const HpBar = ({ hp, maxHp }) => {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color =
    hp <= 0 ? "#6b7280" : hp <= 3 ? "#dc2626" : hp <= 6 ? "#f97316" : "#16a34a";
  return (
    <div
      style={{
        height: 6,
        borderRadius: 3,
        background: "var(--th-border)",
        overflow: "hidden",
        margin: "4px 0",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: "width 0.2s, background 0.2s",
        }}
      />
    </div>
  );
};

export const UnmatchedTable = ({ players, handleChange, onTotalsChange, readOnly }) => {
  const { t } = useLanguage();

  const availableModes = getAvailableModes(players.length);
  const [gameMode, setGameMode] = useState(availableModes[0]);

  const [teamAssign, setTeamAssign] = useState(() => {
    const init = {};
    players.forEach((p, i) => {
      init[p.memberId] = (i % 2) + 1;
    });
    return init;
  });

  const [setupDone, setSetupDone] = useState(readOnly);
  const [setupHp, setSetupHp] = useState(() => {
    const init = {};
    players.forEach((p) => {
      init[p.memberId] = 16;
    });
    return init;
  });
  const [setupChar, setSetupChar] = useState(() => {
    const init = {};
    players.forEach((p) => {
      init[p.memberId] = "";
    });
    return init;
  });

  const [hpMap, setHpMap] = useState(() => {
    const init = {};
    players.forEach((p) => {
      init[p.memberId] = 16;
    });
    return init;
  });
  const [charMap, setCharMap] = useState(() => {
    const init = {};
    players.forEach((p) => {
      init[p.memberId] = "";
    });
    return init;
  });

  const [winningTeam, setWinningTeam] = useState(null);

  const handleStartGame = () => {
    setHpMap({ ...setupHp });
    setCharMap({ ...setupChar });
    setSetupDone(true);
  };

  const adjust = (memberId, delta) => {
    if (readOnly) return;
    setHpMap((prev) => ({
      ...prev,
      [memberId]: Math.max(0, Math.min(HP_MAX, (prev[memberId] ?? 16) + delta)),
    }));
  };

  useEffect(() => {
    if (!setupDone) return;
    let totalsToEmit = {};
    if (gameMode === "2v2" && winningTeam !== null) {
      players.forEach((p) => {
        totalsToEmit[p.memberId] =
          teamAssign[p.memberId] === winningTeam ? 100 : 0;
      });
    } else {
      players.forEach((p) => {
        totalsToEmit[p.memberId] = hpMap[p.memberId] ?? 16;
      });
    }
    onTotalsChange?.(totalsToEmit);
    handleChange(
      "_data",
      "all",
      JSON.stringify({ hpMap, charMap, teamAssign, winningTeam, gameMode })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hpMap, setupDone, winningTeam]);

  const sorted = [...players].sort(
    (a, b) => (hpMap[b.memberId] ?? 0) - (hpMap[a.memberId] ?? 0)
  );
  const distinctTeams =
    gameMode === "2v2"
      ? [...new Set(Object.values(teamAssign))].sort()
      : [];

  // ── Setup screen ─────────────────────────────────────────────
  if (!setupDone) {
    return (
      <div style={{ padding: "16px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "var(--th-text-sub)",
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {t("scoreSheet", "unmatchedSetup")}
        </div>

        {/* Game mode toggle (only show when multiple modes available) */}
        {availableModes.length > 1 && (
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid var(--th-border)",
            }}
          >
            {availableModes.map((mode) => (
              <button
                key={mode}
                onClick={() => setGameMode(mode)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background:
                    gameMode === mode ? "var(--th-primary)" : "var(--th-card)",
                  color:
                    gameMode === mode ? "#fff" : "var(--th-text-sub)",
                }}
              >
                {t("scoreSheet", mode === "2v2" ? "teamMode2v2" : "freeForAll")}
              </button>
            ))}
          </div>
        )}

        {/* 1v1 badge */}
        {availableModes.length === 1 && availableModes[0] === "1v1" && (
          <div
            style={{
              marginBottom: 14,
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 20,
              background: "var(--th-primary)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {t("scoreSheet", "mode1v1")}
          </div>
        )}

        {players.map((p) => (
          <div
            key={p.memberId}
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid var(--th-border)",
              background: "var(--th-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--th-primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 14,
                }}
              >
                {p.nickname[0]}
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--th-text)",
                }}
              >
                {p.nickname}
              </span>
            </div>

            {/* Team assignment (2v2 mode only) */}
            {gameMode === "2v2" && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--th-text-sub)",
                    marginBottom: 6,
                  }}
                >
                  {t("scoreSheet", "teamLabel")}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2].map((teamNum) => {
                    const tc = TEAM_COLORS[teamNum];
                    const isSelected = teamAssign[p.memberId] === teamNum;
                    return (
                      <button
                        key={teamNum}
                        onClick={() =>
                          setTeamAssign((prev) => ({
                            ...prev,
                            [p.memberId]: teamNum,
                          }))
                        }
                        style={{
                          padding: "5px 24px",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: 13,
                          background: isSelected ? tc.badge : "var(--th-bg)",
                          color: isSelected ? tc.text : "var(--th-text-sub)",
                          outline: isSelected
                            ? `2px solid ${tc.badge}`
                            : `1px solid var(--th-border)`,
                        }}
                      >
                        {t("scoreSheet", "teamPrefix")}
                        {tc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Character / Hero name */}
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--th-text-sub)",
                  marginBottom: 4,
                }}
              >
                {t("scoreSheet", "hero")}
              </div>
              <input
                type="text"
                value={setupChar[p.memberId] || ""}
                onChange={(e) =>
                  setSetupChar((prev) => ({
                    ...prev,
                    [p.memberId]: e.target.value,
                  }))
                }
                placeholder={t("scoreSheet", "heroPlaceholder")}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 13,
                  border: "1px solid var(--th-border)",
                  background: "var(--th-bg)",
                  color: "var(--th-text)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Initial HP */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--th-text-sub)",
                  marginBottom: 6,
                }}
              >
                {t("scoreSheet", "initialHp")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() =>
                    setSetupHp((prev) => ({
                      ...prev,
                      [p.memberId]: Math.max(1, (prev[p.memberId] ?? 16) - 1),
                    }))
                  }
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: "#fee2e2",
                    color: "#dc2626",
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={setupHp[p.memberId] ?? 16}
                  min={1}
                  max={HP_MAX}
                  onChange={(e) => {
                    const v = Math.max(
                      1,
                      Math.min(HP_MAX, Number(e.target.value) || 1)
                    );
                    setSetupHp((prev) => ({ ...prev, [p.memberId]: v }));
                  }}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 4px",
                    borderRadius: 8,
                    fontSize: 18,
                    fontWeight: 900,
                    border: "1px solid var(--th-border)",
                    background: "var(--th-bg)",
                    color: "var(--th-text)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() =>
                    setSetupHp((prev) => ({
                      ...prev,
                      [p.memberId]: Math.min(HP_MAX, (prev[p.memberId] ?? 16) + 1),
                    }))
                  }
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: "#dcfce7",
                    color: "#16a34a",
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleStartGame}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 50,
            border: "none",
            background: "var(--th-primary)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {t("scoreSheet", "startGame")}
        </button>
      </div>
    );
  }

  // ── HP tracker screen ─────────────────────────────────────────
  return (
    <div>
      {/* Hint */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--th-border)",
          backgroundColor: "var(--th-bg)",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--th-text-sub)" }}>
          {gameMode === "2v2"
            ? t("scoreSheet", "unmatchedHintTeam")
            : t("scoreSheet", "unmatchedHint")}
        </span>
      </div>

      {/* HP tracker cards */}
      <div style={{ padding: "12px 16px" }}>
        {players.map((p) => {
          const hp = hpMap[p.memberId] ?? 16;
          const maxHp = setupHp[p.memberId] ?? 16;
          const isEliminated = hp <= 0;
          const isLow = hp > 0 && hp <= 3;
          const hpColor = isEliminated
            ? "#6b7280"
            : isLow
            ? "#dc2626"
            : "var(--th-text)";
          const heroName = charMap[p.memberId];
          const teamNum = gameMode === "2v2" ? teamAssign[p.memberId] : null;
          const tc = teamNum ? TEAM_COLORS[teamNum] : null;
          const borderColor = isEliminated
            ? "var(--th-border)"
            : tc
            ? tc.border
            : isLow
            ? "#dc2626"
            : "var(--th-primary)";

          return (
            <div
              key={p.memberId}
              style={{
                marginBottom: 12,
                padding: "14px 16px",
                borderRadius: 14,
                border: `2px solid ${borderColor}`,
                background: isEliminated ? "var(--th-bg)" : "var(--th-card)",
                opacity: isEliminated ? 0.6 : 1,
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: tc
                        ? tc.badge
                        : isEliminated
                        ? "var(--th-border)"
                        : "var(--th-primary)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 14,
                    }}
                  >
                    {p.nickname[0]}
                  </div>
                  <div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: isEliminated
                          ? "var(--th-text-sub)"
                          : "var(--th-text)",
                      }}
                    >
                      {p.nickname}
                    </span>
                    {(heroName || tc) && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--th-text-sub)",
                          marginTop: 1,
                        }}
                      >
                        {tc && (
                          <span
                            style={{
                              color: tc.badge,
                              fontWeight: 700,
                              marginRight: heroName ? 4 : 0,
                            }}
                          >
                            {t("scoreSheet", "teamPrefix")}
                            {tc.label}
                          </span>
                        )}
                        {heroName}
                      </div>
                    )}
                  </div>
                  {isEliminated && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#6b7280",
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: "var(--th-border)",
                      }}
                    >
                      {t("scoreSheet", "eliminated")}
                    </span>
                  )}
                  {isLow && !isEliminated && (
                    <span
                      style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}
                    >
                      {t("scoreSheet", "danger")}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 24,
                    color: hpColor,
                    minWidth: 44,
                    textAlign: "right",
                  }}
                >
                  {hp}
                </div>
              </div>

              <HpBar hp={hp} maxHp={maxHp} />

              {!readOnly && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 10,
                    justifyContent: "flex-end",
                  }}
                >
                  {[
                    { delta: -3, label: "−3" },
                    { delta: -1, label: "−1" },
                    { delta: +1, label: "+1" },
                    { delta: +3, label: "+3" },
                  ].map(({ delta, label }) => {
                    const isNeg = delta < 0;
                    return (
                      <button
                        key={delta}
                        onClick={() => adjust(p.memberId, delta)}
                        disabled={isEliminated && isNeg}
                        style={{
                          width: 44,
                          height: 32,
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: 13,
                          background: isNeg ? "#fee2e2" : "#dcfce7",
                          color: isNeg ? "#dc2626" : "#16a34a",
                          opacity: isEliminated && isNeg ? 0.3 : 1,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Winning team selector (2v2 mode only) */}
      {gameMode === "2v2" && !readOnly && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--th-border)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "var(--th-text-sub)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {t("scoreSheet", "selectWinningTeam")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {distinctTeams.map((teamNum) => {
              const tc = TEAM_COLORS[teamNum];
              const isSelected = winningTeam === teamNum;
              const teamPlayers = players.filter(
                (p) => teamAssign[p.memberId] === teamNum
              );
              return (
                <button
                  key={teamNum}
                  onClick={() =>
                    setWinningTeam(isSelected ? null : teamNum)
                  }
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: isSelected ? tc.badge : "var(--th-card)",
                    color: isSelected ? tc.text : "var(--th-text-sub)",
                    fontWeight: 800,
                    fontSize: 13,
                    outline: isSelected
                      ? `2px solid ${tc.badge}`
                      : `1px solid ${tc.badge}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div>
                    {t("scoreSheet", "teamPrefix")}
                    {tc.label}
                  </div>
                  <div
                    style={{ fontSize: 10, marginTop: 3, opacity: 0.8 }}
                  >
                    {teamPlayers.map((p) => p.nickname).join(", ")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current HP ranking summary */}
      <div style={{ background: "#1a1a2e", padding: "12px 16px" }}>
        <div
          style={{
            fontSize: 11,
            color: "#8888aa",
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          {t("scoreSheet", "hpRanking")}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sorted.map((p, i) => {
            const hp = hpMap[p.memberId] ?? 16;
            const isFirst = i === 0 && hp > 0;
            const teamNum = gameMode === "2v2" ? teamAssign[p.memberId] : null;
            const tc = teamNum ? TEAM_COLORS[teamNum] : null;
            return (
              <div
                key={p.memberId}
                style={{
                  flex: 1,
                  minWidth: 60,
                  padding: "8px 10px",
                  borderRadius: 10,
                  textAlign: "center",
                  background: isFirst
                    ? "var(--th-primary)"
                    : tc
                    ? `${tc.badge}22`
                    : "rgba(255,255,255,0.08)",
                  outline: tc ? `1px solid ${tc.badge}44` : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: isFirst ? "rgba(255,255,255,0.8)" : "#8888aa",
                    marginBottom: 2,
                  }}
                >
                  {i + 1}
                  {t("scoreSheet", "rankSuffix")} · {p.nickname}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: isFirst ? "#fff" : hp > 0 ? "#d0d0f0" : "#6b7280",
                  }}
                >
                  {hp > 0 ? hp : "✗"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
