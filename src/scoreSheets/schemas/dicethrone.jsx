import { useState, useEffect } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export const diceThroneSchema = {
  name: "Dice Throne",
  type: "dicethrone",
  lowestWins: false,
};

const HP_MAX = 99;

const HpBar = ({ hp, maxHp }) => {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color = hp <= 0 ? "#6b7280" : hp <= 10 ? "#dc2626" : hp <= 20 ? "#f97316" : "#16a34a";
  return (
    <div style={{ height: 6, borderRadius: 3, background: "var(--th-border)", overflow: "hidden", margin: "4px 0" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.2s, background 0.2s" }} />
    </div>
  );
};

export const DiceThroneTable = ({ players, handleChange, onTotalsChange, readOnly }) => {
  const { t } = useLanguage();

  // 설정 단계: HP 및 캐릭터 초기 설정
  const [setupDone, setSetupDone] = useState(readOnly);
  const [setupHp, setSetupHp] = useState(() => {
    const init = {};
    players.forEach(p => { init[p.memberId] = 50; });
    return init;
  });
  const [setupChar, setSetupChar] = useState(() => {
    const init = {};
    players.forEach(p => { init[p.memberId] = ""; });
    return init;
  });

  const [hpMap, setHpMap] = useState(() => {
    const init = {};
    players.forEach(p => { init[p.memberId] = 50; });
    return init;
  });
  const [charMap, setCharMap] = useState(() => {
    const init = {};
    players.forEach(p => { init[p.memberId] = ""; });
    return init;
  });

  const handleStartGame = () => {
    setHpMap({ ...setupHp });
    setCharMap({ ...setupChar });
    setSetupDone(true);
  };

  const adjust = (memberId, delta) => {
    if (readOnly) return;
    setHpMap(prev => ({
      ...prev,
      [memberId]: Math.max(0, Math.min(HP_MAX, (prev[memberId] ?? 50) + delta)),
    }));
  };

  useEffect(() => {
    if (!setupDone) return;
    const totals = {};
    players.forEach(p => { totals[p.memberId] = hpMap[p.memberId] ?? 50; });
    onTotalsChange?.(totals);
    handleChange("_data", "all", JSON.stringify({ hpMap, charMap }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hpMap, setupDone]);

  // 순위별 정렬 (HP 높은 순) - 하단 요약에만 사용
  const sorted = [...players].sort((a, b) => (hpMap[b.memberId] ?? 0) - (hpMap[a.memberId] ?? 0));

  // ── 설정 화면 ──────────────────────────────────────────────
  if (!setupDone) {
    return (
      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--th-text-sub)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          게임 설정
        </div>
        {players.map(p => (
          <div
            key={p.memberId}
            style={{
              marginBottom: 16, padding: "14px 16px", borderRadius: 14,
              border: "1px solid var(--th-border)", background: "var(--th-card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--th-primary)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 14,
              }}>
                {p.nickname[0]}
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--th-text)" }}>{p.nickname}</span>
            </div>

            {/* 캐릭터 */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--th-text-sub)", marginBottom: 4 }}>캐릭터</div>
              <input
                type="text"
                value={setupChar[p.memberId] || ""}
                onChange={e => setSetupChar(prev => ({ ...prev, [p.memberId]: e.target.value }))}
                placeholder="캐릭터 이름 입력"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13,
                  border: "1px solid var(--th-border)", background: "var(--th-bg)",
                  color: "var(--th-text)", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* 초기 HP */}
            <div>
              <div style={{ fontSize: 11, color: "var(--th-text-sub)", marginBottom: 6 }}>초기 HP</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setSetupHp(prev => ({ ...prev, [p.memberId]: Math.max(1, (prev[p.memberId] ?? 50) - 1) }))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", background: "#fee2e2", color: "#dc2626", fontWeight: 800, fontSize: 16 }}
                >−</button>
                <input
                  type="number"
                  value={setupHp[p.memberId] ?? 50}
                  min={1} max={HP_MAX}
                  onChange={e => {
                    const v = Math.max(1, Math.min(HP_MAX, Number(e.target.value) || 1));
                    setSetupHp(prev => ({ ...prev, [p.memberId]: v }));
                  }}
                  style={{
                    flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 8, fontSize: 18,
                    fontWeight: 900, border: "1px solid var(--th-border)", background: "var(--th-bg)",
                    color: "var(--th-text)", outline: "none",
                  }}
                />
                <button
                  onClick={() => setSetupHp(prev => ({ ...prev, [p.memberId]: Math.min(HP_MAX, (prev[p.memberId] ?? 50) + 1) }))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", background: "#dcfce7", color: "#16a34a", fontWeight: 800, fontSize: 16 }}
                >+</button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleStartGame}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 50, border: "none",
            background: "var(--th-primary)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer",
          }}
        >
          게임 시작
        </button>
      </div>
    );
  }

  // ── HP 트래커 화면 ─────────────────────────────────────────
  return (
    <div>
      {/* 안내 */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--th-border)", backgroundColor: "var(--th-bg)" }}>
        <span style={{ fontSize: 12, color: "var(--th-text-sub)" }}>
          {t('scoreSheet', 'diceThroneHint')}
        </span>
      </div>

      {/* HP 트래커 - 원래 플레이어 순서 유지 */}
      <div style={{ padding: "12px 16px" }}>
        {players.map((p) => {
          const hp = hpMap[p.memberId] ?? 50;
          const maxHp = setupHp[p.memberId] ?? 50;
          const isEliminated = hp <= 0;
          const isLow = hp > 0 && hp <= 10;
          const hpColor = isEliminated ? "#6b7280" : isLow ? "#dc2626" : "var(--th-text)";
          const charName = charMap[p.memberId];

          return (
            <div
              key={p.memberId}
              style={{
                marginBottom: 12, padding: "14px 16px", borderRadius: 14,
                border: `2px solid ${isEliminated ? "var(--th-border)" : isLow ? "#dc2626" : "var(--th-primary)"}`,
                background: isEliminated ? "var(--th-bg)" : "var(--th-card)",
                opacity: isEliminated ? 0.6 : 1, transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: isEliminated ? "var(--th-border)" : "var(--th-primary)",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: 14,
                  }}>
                    {p.nickname[0]}
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15, color: isEliminated ? "var(--th-text-sub)" : "var(--th-text)" }}>
                      {p.nickname}
                    </span>
                    {charName && (
                      <div style={{ fontSize: 11, color: "var(--th-text-sub)", marginTop: 1 }}>{charName}</div>
                    )}
                  </div>
                  {isEliminated && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", padding: "2px 8px", borderRadius: 10, background: "var(--th-border)" }}>
                      탈락
                    </span>
                  )}
                  {isLow && !isEliminated && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>⚠️ 위험</span>
                  )}
                </div>
                <div style={{ fontWeight: 900, fontSize: 24, color: hpColor, minWidth: 44, textAlign: "right" }}>
                  {hp}
                </div>
              </div>

              <HpBar hp={hp} maxHp={maxHp} />

              {!readOnly && (
                <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
                  {[
                    { delta: -5, label: "−5" },
                    { delta: -1, label: "−1" },
                    { delta: +1, label: "+1" },
                    { delta: +5, label: "+5" },
                  ].map(({ delta, label }) => {
                    const isNeg = delta < 0;
                    return (
                      <button
                        key={delta}
                        onClick={() => adjust(p.memberId, delta)}
                        disabled={isEliminated && isNeg}
                        style={{
                          width: 44, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                          fontWeight: 800, fontSize: 13,
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

      {/* 현재 순위 요약 */}
      <div style={{ background: "#2C1F0E", padding: "12px 16px" }}>
        <div style={{ fontSize: 11, color: "#A08060", marginBottom: 8, fontWeight: 700 }}>현재 HP 순위</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sorted.map((p, i) => {
            const hp = hpMap[p.memberId] ?? 50;
            const isFirst = i === 0 && hp > 0;
            return (
              <div
                key={p.memberId}
                style={{
                  flex: 1, minWidth: 60, padding: "8px 10px", borderRadius: 10, textAlign: "center",
                  background: isFirst ? "var(--th-primary)" : "rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 10, color: isFirst ? "rgba(255,255,255,0.8)" : "#A08060", marginBottom: 2 }}>
                  {i + 1}위 · {p.nickname}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: isFirst ? "#fff" : hp > 0 ? "#F5E6D0" : "#6b7280" }}>
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
