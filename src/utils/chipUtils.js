import { V } from './cssUtils';

// 칩 게임(BoardGame.ratingType === 'CHIP') 표시용. 순위가 아니라 판마다 손익을 누적한다.
// 점수판은 바이인 방식(기본)과 칩 세기 방식 두 가지다.

export const isChipGame = (game) => game?.ratingType === 'CHIP';

// +1,200 / -300 / 0
export const formatChipDelta = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v > 0 ? '+' : ''}${v.toLocaleString()}`;
};

// 서버 chip_delta가 32비트 정수라 이 범위를 넘는 손익은 저장할 수 없다
export const MAX_CHIP_DELTA = 2147483647;
export const isChipDeltaTooLarge = (deltas) => Object.values(deltas).some(d => Math.abs(d) > MAX_CHIP_DELTA);

export const chipDeltaColor = (n) => (n > 0 ? '#16a34a' : n < 0 ? '#dc2626' : V('--th-text-sub'));

// 입력칸 표시용 천 단위 쉼표. 상태에는 숫자만 담는다 ('1500000' → '1,500,000')
export const formatChipDigits = (digits) => (digits ? Number(digits).toLocaleString('en-US') : '');

// 입력값에서 숫자만 남긴다 (쉼표·앞자리 0 제거)
export const chipDigitsOf = (raw, maxDigits) => raw.replace(/\D/g, '').slice(0, maxDigits).replace(/^0+(?=\d)/, '');

/**
 * 바이인 한 판의 손익. 우승자들이 판돈을 똑같이 나눠 갖는다.
 * 진 사람: -(바이인 × 횟수), 우승자: 판돈 ÷ 우승자 수 - 본인 바이인.
 * 바이인 10,000 / Vanna 1·Tae 2·Yuna 1 / Yuna 우승 → -10,000 / -20,000 / +30,000
 * 나누어떨어지지 않으면 남는 1씩을 목록 앞쪽 우승자부터 준다 (합계가 0으로 맞도록).
 *
 * @return { memberId: 손익 }. 바이인 금액이나 우승자가 없으면 null
 */
export const buyInResults = (players, buyIn, buyIns, winnerIds) => {
  const winners = players.filter(p => winnerIds.includes(p.memberId));
  if (!(buyIn > 0) || winners.length === 0) return null;
  const paid = (id) => buyIn * (buyIns[id] ?? 1);
  const pot = players.reduce((sum, p) => sum + paid(p.memberId), 0);
  const share = Math.floor(pot / winners.length);
  const remainder = pot - share * winners.length;
  const winnerIndex = new Map(winners.map((p, i) => [p.memberId, i]));
  return Object.fromEntries(players.map(p => {
    const i = winnerIndex.get(p.memberId);
    const won = i == null ? 0 : share + (i < remainder ? 1 : 0);
    return [p.memberId, won - paid(p.memberId)];
  }));
};

// ── 칩 세기 방식 (schema.chipMode === 'count') ──
// 판마다 1인 시작 칩을 적고, 끝나면 칩 종류별 남은 개수를 센다. 손익 = 남은 칩 - 시작 칩

export const chipModeOf = (schema) => (schema?.chipMode === 'count' ? 'count' : 'buyin');

export const DEFAULT_CHIP_DENOMINATIONS = [1000, 500, 100, 10];
export const MAX_CHIP_DENOMINATIONS = 6;

// 큰 칩부터 실물 칩처럼 색을 나눈다
const DENOM_COLORS = ['#f59e0b', '#7c3aed', '#475569', '#2563eb', '#16a34a', '#dc2626'];
export const chipDenomColor = (index) => DENOM_COLORS[index % DENOM_COLORS.length];

// 스키마의 칩 종류. 중복·0 이하를 빼고 큰 값부터
export const chipDenominationsOf = (denominations) => {
  const list = Array.isArray(denominations) ? denominations.map(Number).filter(n => n > 0) : [];
  return list.length ? [...new Set(list)].sort((a, b) => b - a) : DEFAULT_CHIP_DENOMINATIONS;
};

// 칩 종류별 개수({ 1000: '2', 100: '5' }) → 합계. 안 적은 칩은 0개로 본다
export const chipCountTotal = (counts, denominations) => (
  denominations.reduce((sum, d) => sum + d * Number(counts?.[d] || 0), 0)
);
