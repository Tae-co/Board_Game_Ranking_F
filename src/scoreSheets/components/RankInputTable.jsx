/**
 * RankInputTable - 재사용 가능한 순위 직접 입력 컴포넌트
 * supportsRankMode: true 인 게임 스키마에서 사용
 * Props: players, rankInputs, onChange, readOnly, t
 */
const RankInputTable = ({ players, rankInputs, onChange, readOnly }) => {
  const usedRanks = new Set(Object.values(rankInputs).filter(Boolean));

  return (
    <div style={{ padding: "8px 0" }}>
      {players.map((player) => {
        const selected = rankInputs[player.memberId] || "";
        return (
          <div
            key={player.memberId}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--th-border)",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--th-text)" }}>
              {player.nickname}
            </span>
            <select
              value={selected}
              disabled={readOnly}
              onChange={(e) => onChange(player.memberId, Number(e.target.value) || "")}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: `2px solid ${selected ? "var(--th-primary)" : "var(--th-border)"}`,
                backgroundColor: "var(--th-bg)",
                color: selected ? "var(--th-primary)" : "var(--th-text-sub)",
                fontSize: 14,
                fontWeight: selected ? 700 : 400,
                cursor: readOnly ? "default" : "pointer",
                outline: "none",
              }}
            >
              <option value="">순위 선택</option>
              {players.map((_, i) => {
                const rank = i + 1;
                const isUsedByOther = usedRanks.has(rank) && rankInputs[player.memberId] !== rank;
                return (
                  <option key={rank} value={rank} disabled={isUsedByOther}>
                    {rank}등
                  </option>
                );
              })}
            </select>
          </div>
        );
      })}
    </div>
  );
};

export default RankInputTable;
