// 저장된 경기(participants[].scoresJson)를 점수판이 다시 그릴 수 있는 savedScores로 되돌린다.
// submitPayload의 역방향. 라운드제·HP제는 한 사람의 scoresJson에 전체 게임이 들어 있어서 그대로 넘긴다.
export const buildSavedScores = (participants) => {
  const first = participants.find(p => p.scoresJson);
  if (!first) return null;
  try {
    const sample = JSON.parse(first.scoresJson);
    if (Array.isArray(sample.rounds) || sample.hpMap !== undefined) {
      return { "_data": { "all": first.scoresJson } };
    }
  } catch { return null; }
  const savedScores = {};
  participants.forEach((p) => {
    if (!p.scoresJson) return;
    try {
      const parsed = JSON.parse(p.scoresJson);
      Object.entries(parsed).forEach(([catKey, val]) => {
        if (!savedScores[catKey]) savedScores[catKey] = {};
        savedScores[catKey][p.memberId] = val;
      });
    } catch { /* ignore */ }
  });
  return Object.keys(savedScores).length > 0 ? savedScores : null;
};
