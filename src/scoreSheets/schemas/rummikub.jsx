import { useState, useEffect } from "react";

export const rummikubSchema = {
  name: "루미큐브",
  type: "rummikub",
  supportsRankMode: true,
  lowestWins: true, // 낮은 점수가 유리
};

// 라운드 점수 계산
// - 승자: 나머지 플레이어 패널티 합계를 플러스로 획득
// - 패배자: -(남은 타일 합 + 조커*30 + 초기오픈실패*30)
const calcRoundScore = (round, players) => {
  const scores = {};
  players.forEach((p) => {
    const data = round.playerData?.[p.memberId] || {};
    if (p.memberId === round.winnerId) {
      scores[p.memberId] = 0; // 승자는 나중에 계산
    } else {
      const penalty = (Number(data.tiles) || 0) + (data.joker ? 30 : 0) + (data.failedOpen ? 30 : 0);
      scores[p.memberId] = -penalty;
    }
  });
  // 승자 점수 = 패배자 패널티 합의 절댓값
  if (round.winnerId) {
    const winnerScore = players.reduce((sum, p) => {
      return p.memberId !== round.winnerId ? sum + Math.abs(scores[p.memberId]) : sum;
    }, 0);
    scores[round.winnerId] = winnerScore;
  }
  return scores;
};

const defaultRound = () => ({ winnerId: null, playerData: {} });

export const RummikubTable = ({ players, handleChange, onTotalsChange, readOnly }) => {
  const [rounds, setRounds] = useState([defaultRound()]);

  // 누적 합계 계산
  const totals = {};
  players.forEach((p) => { totals[p.memberId] = 0; });
  rounds.forEach((round) => {
    const scores = calcRoundScore(round, players);
    players.forEach((p) => {
      totals[p.memberId] = (totals[p.memberId] || 0) + (scores[p.memberId] || 0);
    });
  });

  // 부모에 totals 및 게임 데이터 전달
  useEffect(() => {
    onTotalsChange?.(totals);
    handleChange("_data", "all", JSON.stringify({ rounds }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds]);

  const setWinner = (roundIdx, memberId) => {
    setRounds((prev) => {
      const next = [...prev];
      next[roundIdx] = {
        ...next[roundIdx],
        winnerId: memberId,
        playerData: { ...next[roundIdx].playerData },
      };
      return next;
    });
  };

  const updatePlayerData = (roundIdx, memberId, field, value) => {
    setRounds((prev) => {
      const next = [...prev];
      next[roundIdx] = {
        ...next[roundIdx],
        playerData: {
          ...next[roundIdx].playerData,
          [memberId]: {
            ...next[roundIdx].playerData?.[memberId],
            [field]: value,
          },
        },
      };
      return next;
    });
  };

  const addRound = () => setRounds((prev) => [...prev, defaultRound()]);
  const removeRound = (idx) =>
    setRounds((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  // 가장 낮은 합계를 가진 플레이어 찾기
  const leaderId = players.reduce((a, b) =>
    (totals[a.memberId] ?? 0) <= (totals[b.memberId] ?? 0) ? a : b,
    players[0]
  )?.memberId;

  return (
    <div>
      {/* 안내 */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--th-border)", backgroundColor: "var(--th-bg)" }}>
        <span style={{ fontSize: 12, color: "var(--th-text-sub)" }}>
          🏆 낮은 점수가 유리 · 조커 잔여 −30 · 초기 오픈 실패 −30
        </span>
      </div>

      {/* 라운드 목록 */}
      {rounds.map((round, rIdx) => {
        const roundScores = calcRoundScore(round, players);
        return (
          <div
            key={rIdx}
            style={{
              borderBottom: "1px solid var(--th-border)",
              padding: "12px 16px",
              background: rIdx % 2 === 0 ? "var(--th-card)" : "var(--th-bg)",
            }}
          >
            {/* 라운드 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--th-primary)" }}>
                R{rIdx + 1}
              </span>
              {!readOnly && (
                <button
                  onClick={() => removeRound(rIdx)}
                  style={{ background: "transparent", border: "none", color: "var(--th-text-sub)", cursor: "pointer", fontSize: 16 }}
                >
                  ×
                </button>
              )}
            </div>

            {/* 승자 선택 */}
            {!readOnly && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "var(--th-text-sub)", marginBottom: 6 }}>이 라운드 승자</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {players.map((p) => (
                    <button
                      key={p.memberId}
                      onClick={() => setWinner(rIdx, p.memberId)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        border: `2px solid ${round.winnerId === p.memberId ? "var(--th-primary)" : "var(--th-border)"}`,
                        background: round.winnerId === p.memberId ? "var(--th-primary)" : "transparent",
                        color: round.winnerId === p.memberId ? "#fff" : "var(--th-text)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {p.nickname}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 플레이어별 입력 */}
            {players.map((p) => {
              const isWinner = round.winnerId === p.memberId;
              const data = round.playerData?.[p.memberId] || {};
              const score = roundScores[p.memberId];
              return (
                <div
                  key={p.memberId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    borderBottom: "1px solid var(--th-border)",
                    opacity: !round.winnerId && !readOnly ? 0.5 : 1,
                  }}
                >
                  {/* 플레이어 이름 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isWinner ? "var(--th-primary)" : "var(--th-text)" }}>
                      {isWinner ? "🏆 " : ""}{p.nickname}
                    </span>
                  </div>

                  {isWinner ? (
                    // 승자: 자동 계산된 점수 표시
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "var(--th-primary)" }}>
                        +{score ?? 0}
                      </span>
                    </div>
                  ) : (
                    // 패배자: 남은 타일 + 패널티 입력
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* 타일 합 입력 */}
                      {readOnly ? (
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", minWidth: 40, textAlign: "center" }}>
                          {score ?? 0}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          value={data.tiles ?? ""}
                          placeholder="타일"
                          disabled={!round.winnerId}
                          onChange={(e) => updatePlayerData(rIdx, p.memberId, "tiles", Math.max(0, Number(e.target.value) || 0))}
                          style={{
                            width: 56,
                            height: 36,
                            textAlign: "center",
                            fontSize: 14,
                            fontWeight: 700,
                            border: "1px solid var(--th-border)",
                            borderRadius: 8,
                            background: "var(--th-bg)",
                            color: "var(--th-text)",
                          }}
                        />
                      )}
                      {/* 조커 체크박스 */}
                      {!readOnly && (
                        <>
                          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: round.winnerId ? "pointer" : "default" }}>
                            <span style={{ fontSize: 10, color: "var(--th-text-sub)" }}>🃏−30</span>
                            <input
                              type="checkbox"
                              checked={!!data.joker}
                              disabled={!round.winnerId}
                              onChange={(e) => updatePlayerData(rIdx, p.memberId, "joker", e.target.checked)}
                              style={{ width: 16, height: 16 }}
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: round.winnerId ? "pointer" : "default" }}>
                            <span style={{ fontSize: 10, color: "var(--th-text-sub)" }}>미오픈</span>
                            <input
                              type="checkbox"
                              checked={!!data.failedOpen}
                              disabled={!round.winnerId}
                              onChange={(e) => updatePlayerData(rIdx, p.memberId, "failedOpen", e.target.checked)}
                              style={{ width: 16, height: 16 }}
                            />
                          </label>
                          {/* 계산된 점수 미리보기 */}
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", minWidth: 36, textAlign: "right" }}>
                            {round.winnerId ? score : ""}
                          </span>
                        </>
                      )}
                      {readOnly && (
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>
                          {score ?? 0}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* 누적 합계 */}
      <div style={{ background: "#2C1F0E", padding: "12px 16px" }}>
        <div style={{ fontSize: 11, color: "#A08060", marginBottom: 8, fontWeight: 700 }}>누적 합계 (낮을수록 유리)</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[...players]
            .sort((a, b) => (totals[a.memberId] ?? 0) - (totals[b.memberId] ?? 0))
            .map((p, i) => {
              const isLeader = p.memberId === leaderId;
              return (
                <div
                  key={p.memberId}
                  style={{
                    flex: 1,
                    minWidth: 60,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: isLeader ? "var(--th-primary)" : "rgba(255,255,255,0.08)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 10, color: isLeader ? "rgba(255,255,255,0.8)" : "#A08060", marginBottom: 2 }}>
                    {i + 1}위 · {p.nickname}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: isLeader ? "#fff" : "#F5E6D0" }}>
                    {totals[p.memberId] ?? 0}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 라운드 추가 버튼 */}
      {!readOnly && (
        <div style={{ padding: "12px 16px" }}>
          <button
            onClick={addRound}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 10,
              border: "2px dashed var(--th-border)",
              background: "transparent",
              color: "var(--th-text-sub)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + 라운드 추가
          </button>
        </div>
      )}
    </div>
  );
};
