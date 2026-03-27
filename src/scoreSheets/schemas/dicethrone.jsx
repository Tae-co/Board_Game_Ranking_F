import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export const diceThroneSchema = {
  name: "Dice Throne",
  type: "dicethrone",
  supportsRankMode: true,
  lowestWins: false,
};

const DEFAULT_HP = 50;
const HP_MAX = 99;

const HpBar = ({ hp }) => {
  const pct = Math.max(0, Math.min(100, (hp / DEFAULT_HP) * 100));
  const color = hp <= 0 ? "#6b7280" : hp <= 10 ? "#dc2626" : hp <= 20 ? "#f97316" : "#16a34a";
  return (
    <div style={{ height: 6, borderRadius: 3, background: "var(--th-border)", overflow: "hidden", margin: "4px 0" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.2s, background 0.2s" }} />
    </div>
  );
};

export const DiceThroneTable = ({ players, handleChange, onTotalsChange, readOnly }) => {
  const { t } = useLanguage();
  const [hpMap, setHpMap] = useState(() => {
    const init = {};
    players.forEach(p => { init[p.memberId] = DEFAULT_HP; });
    return init;
  });

  const adjust = (memberId, delta) => {
    if (readOnly) return;
    setHpMap(prev => ({
      ...prev,
      [memberId]: Math.max(0, Math.min(HP_MAX, (prev[memberId] ?? DEFAULT_HP) + delta)),
    }));
  };

  useEffect(() => {
    const totals = {};
    players.forEach(p => { totals[p.memberId] = hpMap[p.memberId] ?? DEFAULT_HP; });
    onTotalsChange?.(totals);
    handleChange("_data", "all", JSON.stringify({ hpMap }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hpMap]);

  // 순위별 정렬 (HP 높은 순)
  const sorted = [...players].sort((a, b) => (hpMap[b.memberId] ?? 0) - (hpMap[a.memberId] ?? 0));

  return (
    <div>
      {/* 안내 */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--th-border)", backgroundColor: "var(--th-bg)" }}>
        <span style={{ fontSize: 12, color: "var(--th-text-sub)" }}>
          {t('scoreSheet', 'diceThroneHint')}
        </span>
      </div>

      {/* HP 트래커 */}
      <div style={{ padding: "12px 16px" }}>
        {sorted.map((p, rank) => {
          const hp = hpMap[p.memberId] ?? DEFAULT_HP;
          const isEliminated = hp <= 0;
          const isLow = hp > 0 && hp <= 10;
          const hpColor = isEliminated ? "#6b7280" : isLow ? "#dc2626" : "var(--th-text)";

          return (
            <div
              key={p.memberId}
              style={{
                marginBottom: 12,
                padding: "14px 16px",
                borderRadius: 14,
                border: `2px solid ${isEliminated ? "var(--th-border)" : isLow ? "#dc2626" : "var(--th-primary)"}`,
                background: isEliminated ? "var(--th-bg)" : "var(--th-card)",
                opacity: isEliminated ? 0.6 : 1,
                transition: "all 0.2s",
              }}
            >
              {/* 플레이어 이름 + 순위 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: isEliminated ? "var(--th-border)" : "var(--th-primary)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 900, fontSize: 14,
                    }}
                  >
                    {p.nickname[0]}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: isEliminated ? "var(--th-text-sub)" : "var(--th-text)" }}>
                    {p.nickname}
                  </span>
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

              {/* HP 바 */}
              <HpBar hp={hp} />

              {/* 조절 버튼 */}
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
            const hp = hpMap[p.memberId] ?? DEFAULT_HP;
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
