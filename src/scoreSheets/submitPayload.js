// 점수판 저장 시 서버로 보낼 participants(순위·점수 기록)를 만드는 순수 함수들.
// 화면(ScoreSheet)은 입력 상태만 넘기고, 경고창·서버 호출은 화면이 한다.
import { getAllCategories } from './shared/scoreUtils';
import { OUTCOME_TIER } from './components/WinDrawLossTable';
import { isChipDeltaTooLarge } from '../utils/chipUtils';

export const ROUND_BASED_TYPES = ['uno', 'rummikub', 'dicethrone', 'saboteur', 'radlands'];

/** 플레이어별 합계. 라운드제는 테이블이 계산해 준 roundTotals를 그대로 쓴다. */
export const computeTotals = ({ schema, players, scores, roundTotals }) => {
  if (ROUND_BASED_TYPES.includes(schema?.type)) return roundTotals;
  const allCategories = schema ? getAllCategories(schema) : [];
  const totals = {};
  players.forEach(p => {
    if (schema?.type === 'catan') {
      totals[p.memberId] = schema.categories.reduce((sum, cat) => {
        const v = scores[cat.key]?.[p.memberId];
        if (cat.type === 'exclusive_check') return sum + (v ? cat.bonus : 0);
        return sum + (Number(v) || 0) * (cat.multiplier || 1);
      }, 0);
    } else {
      totals[p.memberId] = allCategories.reduce((sum, cat) => {
        const v = Number(scores[cat.key]?.[p.memberId]) || 0;
        return cat.negative && !cat.allowNegative ? sum - Math.abs(v) : sum + v;
      }, 0);
    }
  });
  return totals;
};

/** 합계로 등수를 매긴다. 같은 점수는 동순위, 다음 사람은 인원수만큼 건너뛴다 (10,7,7,3 → 1,2,2,4). lowestWins면 낮은 점수가 1위. */
export const rankByScore = (players, totals, lowestWins) => {
  const entries = players.map(p => ({ memberId: p.memberId, score: totals[p.memberId] }));
  const sorted = [...entries].sort((a, b) => lowestWins ? a.score - b.score : b.score - a.score);
  const placements = {};
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score === sorted[i - 1].score) {
      placements[sorted[i].memberId] = placements[sorted[i - 1].memberId];
    } else {
      placements[sorted[i].memberId] = currentRank;
    }
    currentRank++;
  }
  return placements;
};

/**
 * 저장할 participants를 만든다.
 * 반환: { error: 'scoreSheet 번역 키' } — 입력이 모자람, 저장하지 않는다
 *       { participants, confirmChipSum? } — confirmChipSum이 있으면(칩 세기 합계가 0이 아님) 화면이 확인을 받은 뒤 저장한다
 */
export const buildParticipants = ({
  schema, players, scores,
  duelWinnerId, duelWinCondition,
  outcomeInputs,
  chipCountDeltas, chipStart, chipCounts,
  chipResults, chipWinnerIds, chipBuyIns, chipBuyIn,
  rankMode, rankInputs,
  roundTotals,
}) => {
  const type = schema?.type;
  const isChip = type === 'chip';

  if (type === 'conditional') {
    if (!duelWinnerId) return { error: 'winnerRequired' };
    return {
      participants: players.map(p => ({
        memberId: p.memberId,
        placement: p.memberId === duelWinnerId ? 1 : 2,
        scoresJson: JSON.stringify({
          win_condition: duelWinCondition,
          won: p.memberId === duelWinnerId,
        }),
      })),
    };
  }

  if (type === 'duel' || type === 'splendorduel') {
    if (!duelWinnerId) return { error: 'winnerRequired' };
    const allCats = getAllCategories(schema);
    return {
      participants: players.map(p => ({
        memberId: p.memberId,
        placement: p.memberId === duelWinnerId ? 1 : 2,
        scoresJson: JSON.stringify({
          ...Object.fromEntries(allCats.map(cat => [cat.key, scores[cat.key]?.[p.memberId] ?? 0])),
          win_condition: duelWinCondition,
          won: p.memberId === duelWinnerId,
        }),
      })),
    };
  }

  if (type === 'outcome') {
    // 승=1티어, 무=2티어, 패=3티어로 줄 세운 뒤 같은 티어끼리 동순위로 묶는다.
    // 동순위 다음 사람은 인원수만큼 건너뛴다 (승/무/무/패 → 1, 2, 2, 4).
    if (!players.every(p => outcomeInputs[p.memberId])) return { error: 'outcomeRequired' };
    const sorted = [...players].sort(
      (a, b) => OUTCOME_TIER[outcomeInputs[a.memberId]] - OUTCOME_TIER[outcomeInputs[b.memberId]]
    );
    const placements = {};
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && outcomeInputs[sorted[i].memberId] === outcomeInputs[sorted[i - 1].memberId]) {
        placements[sorted[i].memberId] = placements[sorted[i - 1].memberId];
      } else {
        placements[sorted[i].memberId] = currentRank;
      }
      currentRank++;
    }
    return {
      participants: players.map(p => ({
        memberId: p.memberId,
        placement: placements[p.memberId],
        scoresJson: JSON.stringify({ outcome: outcomeInputs[p.memberId] }),
      })),
    };
  }

  if (isChip && schema?.chipMode === 'count') {
    const deltas = chipCountDeltas;
    if (players.some(p => deltas[p.memberId] == null)) return { error: 'chipCountRequired' };
    if (isChipDeltaTooLarge(deltas)) return { error: 'chipTooLarge' };
    // 많이 남긴 순서로 등수를 매긴다. 같은 금액은 동순위 (+300, 0, 0, -300 → 1, 2, 2, 4). 1등만 승리
    const sorted = [...players].sort((a, b) => deltas[b.memberId] - deltas[a.memberId]);
    const placements = {};
    sorted.forEach((p, i) => {
      placements[p.memberId] = i > 0 && deltas[p.memberId] === deltas[sorted[i - 1].memberId]
        ? placements[sorted[i - 1].memberId]
        : i + 1;
    });
    const participants = players.map(p => ({
      memberId: p.memberId,
      placement: placements[p.memberId],
      chipDelta: deltas[p.memberId],
      buyIns: 1,
      scoresJson: JSON.stringify({
        chip: deltas[p.memberId],
        chipStart: Number(chipStart),
        chipCounts: chipCounts[p.memberId],
      }),
    }));
    // 합계가 0이 아니면 세다가 틀렸을 수 있다 — 경고만 하고 저장은 사용자가 고른다
    const sum = Object.values(deltas).reduce((a, b) => a + b, 0);
    return sum !== 0 ? { participants, confirmChipSum: sum } : { participants };
  }

  if (isChip) {
    if (!chipResults) return { error: 'chipRequired' };
    // 전원 우승이면 판돈이 각자에게 그대로 돌아가 아무 의미가 없고, 모두 승으로 잡힌다
    if (chipWinnerIds.length >= players.length) return { error: 'chipAllWinners' };
    if (isChipDeltaTooLarge(chipResults)) return { error: 'chipTooLarge' };
    // 우승자는 모두 1등(승리), 나머지는 모두 2등(패배)
    return {
      participants: players.map(p => ({
        memberId: p.memberId,
        placement: chipWinnerIds.includes(p.memberId) ? 1 : 2,
        chipDelta: chipResults[p.memberId],
        buyIns: chipBuyIns[p.memberId],
        scoresJson: JSON.stringify({
          chip: chipResults[p.memberId],
          buyIn: Number(chipBuyIn),
          buyIns: chipBuyIns[p.memberId],
          chipWon: chipWinnerIds.includes(p.memberId),
        }),
      })),
    };
  }

  if (rankMode || type === 'simple') {
    // 순위 직접 입력 모드: rankInputs의 순위를 그대로 쓴다
    if (!players.every(p => rankInputs[p.memberId])) return { error: 'selectAllRanks' };
    return {
      participants: players.map(p => ({
        memberId: p.memberId,
        placement: rankInputs[p.memberId],
        scoresJson: null,
      })),
    };
  }

  const lowestWins = !!schema?.lowestWins;
  const totals = computeTotals({ schema, players, scores, roundTotals });

  if (ROUND_BASED_TYPES.includes(type)) {
    // 라운드 기반: roundTotals로 등수 계산, 전체 게임 데이터를 scoresJson으로 전달
    if ((type === 'radlands' || type === 'dicethrone') && Object.keys(roundTotals).length === 0) {
      return { error: 'selectWinLoss' };
    }
    const placements = rankByScore(players, totals, lowestWins);
    const roundData = scores['_data']?.['all'] || null;
    return {
      participants: players.map(p => ({
        memberId: p.memberId,
        placement: placements[p.memberId],
        scoresJson: roundData,
      })),
    };
  }

  const placements = rankByScore(players, totals, lowestWins);
  const allCats = getAllCategories(schema);
  return {
    participants: players.map(p => ({
      memberId: p.memberId,
      placement: placements[p.memberId],
      scoresJson: JSON.stringify(
        Object.fromEntries(allCats.map(cat => [cat.key, scores[cat.key]?.[p.memberId]]))
      ),
    })),
  };
};
