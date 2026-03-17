import { useState, useRef, useEffect } from "react";

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

const CatanScrollCell = ({ catKey, playerId, value, limits, color, handleChange }) => {
  const divRef = useRef(null);
  const touchStartY = useRef(null);
  const [active, setActive] = useState(false);
  const stateRef = useRef({ value, handleChange, catKey, playerId, limits });
  useEffect(() => { stateRef.current = { value, handleChange, catKey, playerId, limits }; });

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; setActive(true); };
    const onTouchEnd = () => setActive(false);
    const onTouchMove = (e) => {
      if (touchStartY.current === null) return;
      const diff = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(diff) > 8) {
        e.preventDefault();
        const { value: v, handleChange: hc, catKey: ck, playerId: pid, limits: lim } = stateRef.current;
        const delta = diff > 0 ? 1 : -1;
        const next = Math.min(lim.max, Math.max(lim.min, Number(v) + delta));
        if (next !== Number(v)) if (navigator.vibrate) navigator.vibrate(10);
        hc(ck, pid, next);
        touchStartY.current = e.touches[0].clientY;
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const atMin = value <= limits.min;
  const atMax = value >= limits.max;
  return (
    <div
      ref={divRef}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;
        const next = Math.min(limits.max, Math.max(limits.min, value + delta));
        if (next !== value) if (navigator.vibrate) navigator.vibrate(10);
        handleChange(catKey, playerId, next);
      }}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", cursor: "ns-resize" }}
    >
      <span style={{
        width: 52, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 15,
        color: atMax ? color : atMin ? "#A08060" : "var(--th-text)",
        borderRadius: 8,
        border: `2px solid ${active ? color : (value > 0 ? color : "#E5D5C0")}`,
        boxShadow: active ? `0 0 0 2px ${color}44` : "none",
        background: "var(--th-bg)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}>{value}</span>
    </div>
  );
};

export const CatanTable = ({ schema, players, scores, totals, handleChange, handleCatanCheck, t }) => (
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
                  onClick={() => handleCatanCheck(cat.key, p.memberId)}
                  style={{
                    width: 40, height: 36, borderRadius: 8, cursor: "pointer",
                    border: `2px solid ${scores[cat.key]?.[p.memberId] ? cat.color : "#E5D5C0"}`,
                    background: scores[cat.key]?.[p.memberId] ? cat.color + "22" : "var(--th-bg)",
                    color: scores[cat.key]?.[p.memberId] ? cat.color : "#A08060",
                    fontWeight: 900, fontSize: 14,
                  }}
                >
                  {scores[cat.key]?.[p.memberId] ? "✓" : "—"}
                </button>
              ) : (() => {
                const limits = CATAN_LIMITS[cat.key];
                const value = Number(scores[cat.key]?.[p.memberId] ?? 0);
                return (
                  <CatanScrollCell catKey={cat.key} playerId={p.memberId} value={value} limits={limits} color={cat.color} handleChange={handleChange} />
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
