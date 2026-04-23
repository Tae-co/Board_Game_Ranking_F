/* eslint-disable react-refresh/only-export-components */
export const catanSchema = {
  name: "CATAN",
  type: "catan",
  categories: [
    { key: "settlement",   label: "정착지",    labelEn: "Settlements",   icon: "🏘️", color: "#92400e", multiplier: 1 },
    { key: "cities",       label: "도시",      labelEn: "Cities",        icon: "🏙️", color: "#1d4ed8", multiplier: 2 },
    { key: "longest_road", label: "최장 도로", labelEn: "Longest Road",  icon: "🛤️", color: "#15803d", type: "exclusive_check", bonus: 2 },
    { key: "largest_army", label: "최대 군대", labelEn: "Largest Army",  icon: "⚔️", color: "#dc2626", type: "exclusive_check", bonus: 2 },
    { key: "vp_cards",     label: "승점 카드", labelEn: "Victory Cards", icon: "🃏", color: "#7c3aed", multiplier: 1 },
  ],
};

const CATAN_LIMITS = {
  settlement: { min: 0, max: 5 },
  cities:     { min: 0, max: 4 },
  vp_cards:   { min: 0, max: 5 },
};

const clampCatanValue = (rawValue, limits) => {
  if (rawValue === "") return "";
  const parsed = Number(rawValue);
  if (Number.isNaN(parsed)) return limits.min;
  return Math.min(limits.max, Math.max(limits.min, parsed));
};

const CatanInputCell = ({ catKey, playerId, value, limits, color, handleChange, readOnly }) => {
  const displayValue = value === "" ? "" : Number(value) || 0;
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={displayValue}
      readOnly={readOnly}
      placeholder="0"
      onChange={(e) => handleChange(catKey, playerId, clampCatanValue(e.target.value, limits))}
      onBlur={(e) => {
        const nextValue = e.target.value === "" ? limits.min : clampCatanValue(e.target.value, limits);
        handleChange(catKey, playerId, nextValue);
      }}
      style={{
        width: 52,
        height: 44,
        textAlign: "center",
        fontSize: 15,
        fontWeight: 800,
        borderRadius: 8,
        border: `2px solid ${displayValue > 0 ? color : "#E5D5C0"}`,
        background: "var(--th-bg)",
        color: displayValue >= limits.max ? color : displayValue > limits.min ? "var(--th-text)" : "#A08060",
        outline: "none",
        padding: 0,
      }}
    />
  );
};

export const CatanTable = ({ schema, players, scores, totals, handleChange, handleCatanCheck, t, readOnly }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
    <thead>
      <tr style={{ background: "#2C1F0E" }}>
        <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 9, fontWeight: 700, color: "#A08060", width: 80, whiteSpace: "nowrap" }}>{t('scoreSheet', 'category')}</th>
        {players.map(p => {
          const total = totals[p.memberId] ?? 0;
          const canWin = total >= 10;
          return (
            <th key={p.memberId} style={{ padding: "10px 4px", textAlign: "center", fontSize: 12, fontWeight: 800, color: canWin ? "var(--th-primary)" : "#F5E6D0", minWidth: 64 }}>
              {canWin ? "👑 " : ""}{p.nickname}
            </th>
          );
        })}
      </tr>
    </thead>
    <tbody>
      {schema.categories.map((cat, idx) => (
        <tr key={cat.key} style={{ background: idx % 2 === 0 ? "var(--th-card)" : "var(--th-bg)", height: 44 }}>
          <td style={{ padding: "8px 4px 8px 8px", fontSize: 11, fontWeight: 700, color: "var(--th-text)", borderBottom: "1px solid var(--th-border)" }}>
            <span>{cat.icon}</span>
          </td>
          {players.map(p => (
            <td key={p.memberId} style={{ padding: "4px 4px", textAlign: "center", borderBottom: "1px solid var(--th-border)", height: 44 }}>
              {cat.type === "exclusive_check" ? (
                <button
                  onClick={readOnly ? undefined : () => handleCatanCheck(cat.key, p.memberId)}
                  disabled={readOnly}
                  style={{
                    width: 40, height: 36, borderRadius: 8,
                    border: `2px solid ${scores[cat.key]?.[p.memberId] ? cat.color : "#E5D5C0"}`,
                    background: scores[cat.key]?.[p.memberId] ? cat.color + "22" : "var(--th-bg)",
                    color: scores[cat.key]?.[p.memberId] ? cat.color : "#A08060",
                    fontWeight: 900, fontSize: 14,
                    opacity: readOnly ? 0.7 : 1,
                    cursor: readOnly ? "default" : "pointer",
                  }}
                >
                  {scores[cat.key]?.[p.memberId] ? "✓" : "—"}
                </button>
              ) : (() => {
                const limits = CATAN_LIMITS[cat.key];
                const value = Number(scores[cat.key]?.[p.memberId] ?? 0);
                return (
                  <CatanInputCell
                    catKey={cat.key}
                    playerId={p.memberId}
                    value={value}
                    limits={limits}
                    color={cat.color}
                    handleChange={handleChange}
                    readOnly={readOnly}
                  />
                );
              })()}
            </td>
          ))}
        </tr>
      ))}
      <tr style={{ background: "#2C1F0E" }}>
        <td style={{ padding: "10px 8px", fontWeight: 900, color: "var(--th-primary)", fontSize: 13 }}>{t('scoreSheet', 'total')}</td>
        {players.map(p => {
          const total = totals[p.memberId] ?? 0;
          const canWin = total >= 10;
          return (
            <td key={p.memberId} style={{ padding: "10px 4px", textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: canWin ? "var(--th-primary)" : "#F5E6D0" }}>{total}</div>
              {canWin && <div style={{ fontSize: 9, color: "var(--th-primary)", fontWeight: 700, marginTop: 2 }}>🏆 {t('scoreSheet', 'canWin')}</div>}
            </td>
          );
        })}
      </tr>
    </tbody>
  </table>
);
