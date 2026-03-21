import { useState, useEffect } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export const unoSchema = {
  name: "UNO",
  type: "uno",
  supportsRankMode: true,
  defaultTarget: 500,
};

// 라운드별 점수 입력 테이블
export const UnoTable = ({ players, handleChange, onTotalsChange, readOnly }) => {
  const { t } = useLanguage();
  const [rounds, setRounds] = useState([{}]);
  const [target, setTarget] = useState(500);

  const totals = {};
  players.forEach((p) => {
    totals[p.memberId] = rounds.reduce(
      (sum, r) => sum + (Number(r[p.memberId]) || 0),
      0
    );
  });

  useEffect(() => {
    onTotalsChange?.(totals);
    handleChange("_data", "all", JSON.stringify({ rounds, target }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds, target]);

  const updateCell = (roundIdx, memberId, value) => {
    const num = Math.max(0, Number(value) || 0);
    setRounds((prev) => {
      const next = [...prev];
      next[roundIdx] = { ...next[roundIdx], [memberId]: num };
      return next;
    });
  };

  const addRound = () => setRounds((prev) => [...prev, {}]);
  const removeRound = (idx) =>
    setRounds((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const colW = Math.max(64, Math.floor((320 - 48) / players.length));

  return (
    <div>
      {/* 목표 점수 설정 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderBottom: "1px solid var(--th-border)",
          backgroundColor: "var(--th-bg)",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--th-text-sub)", flex: 1 }}>
          {t('scoreSheet', 'targetScore')}
        </span>
        {readOnly ? (
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--th-primary)" }}>
            {target}{t('scoreSheet', 'pts')}
          </span>
        ) : (
          <input
            type="number"
            value={target}
            min={1}
            onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 500))}
            style={{
              width: 72,
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid var(--th-border)",
              backgroundColor: "var(--th-card)",
              color: "var(--th-primary)",
              fontWeight: 700,
              fontSize: 14,
              textAlign: "center",
            }}
          />
        )}
        <span style={{ fontSize: 12, color: "var(--th-text-sub)" }}>{t('scoreSheet', 'pts')}</span>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 48 + players.length * colW }}>
          <thead>
            <tr style={{ background: "#2C1F0E" }}>
              <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#A08060", width: 48 }}>
                {t('scoreSheet', 'round')}
              </th>
              {players.map((p) => {
                const reached = totals[p.memberId] >= target;
                return (
                  <th
                    key={p.memberId}
                    style={{
                      padding: "10px 4px",
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      color: reached ? "var(--th-primary)" : "#F5E6D0",
                      width: colW,
                    }}
                  >
                    {reached ? "👑 " : ""}{p.nickname}
                  </th>
                );
              })}
              {!readOnly && <th style={{ width: 28 }} />}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, rIdx) => (
              <tr
                key={rIdx}
                style={{ borderBottom: "1px solid var(--th-border)", background: rIdx % 2 === 0 ? "var(--th-card)" : "var(--th-bg)" }}
              >
                <td style={{ padding: "8px", fontSize: 12, color: "var(--th-text-sub)", fontWeight: 600 }}>
                  R{rIdx + 1}
                </td>
                {players.map((p) => (
                  <td key={p.memberId} style={{ padding: "6px 4px", textAlign: "center" }}>
                    {readOnly ? (
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--th-text)" }}>
                        {round[p.memberId] || 0}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={round[p.memberId] ?? ""}
                        placeholder="0"
                        onChange={(e) => updateCell(rIdx, p.memberId, e.target.value)}
                        style={{
                          width: colW - 12,
                          height: 40,
                          textAlign: "center",
                          fontSize: 15,
                          fontWeight: 700,
                          border: "1px solid var(--th-border)",
                          borderRadius: 8,
                          background: "var(--th-bg)",
                          color: "var(--th-text)",
                        }}
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td style={{ padding: "4px", textAlign: "center" }}>
                    <button
                      onClick={() => removeRound(rIdx)}
                      style={{
                        width: 24, height: 24, borderRadius: "50%", border: "none",
                        background: "transparent", color: "var(--th-text-sub)", cursor: "pointer",
                        fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {/* 합계 행 */}
            <tr style={{ background: "#2C1F0E", borderTop: "2px solid var(--th-primary)" }}>
              <td style={{ padding: "10px 8px", fontSize: 12, fontWeight: 700, color: "#A08060" }}>
                {t('scoreSheet', 'totalShort')}
              </td>
              {players.map((p) => {
                const total = totals[p.memberId];
                const reached = total >= target;
                return (
                  <td key={p.memberId} style={{ padding: "10px 4px", textAlign: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: reached ? "var(--th-primary)" : "#F5E6D0" }}>
                      {total}
                    </span>
                    {reached && (
                      <div style={{ fontSize: 10, color: "var(--th-primary)" }}>{t('scoreSheet', 'targetReached')}</div>
                    )}
                  </td>
                );
              })}
              {!readOnly && <td />}
            </tr>
          </tbody>
        </table>
      </div>

      {/* 라운드 추가 버튼 */}
      {!readOnly && (
        <div style={{ padding: "12px 16px" }}>
          <button
            onClick={addRound}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 10,
              border: "2px dashed var(--th-border)", background: "transparent",
              color: "var(--th-text-sub)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t('scoreSheet', 'addRound')}
          </button>
        </div>
      )}
    </div>
  );
};
