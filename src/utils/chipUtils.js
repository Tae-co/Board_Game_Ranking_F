import { V } from './cssUtils';

// 칩 게임(BoardGame.ratingType === 'CHIP') 표시용. 순위가 아니라 판마다 바이인 손익을 누적한다.

export const isChipGame = (game) => game?.ratingType === 'CHIP';

// +1,200 / -300 / 0
export const formatChipDelta = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v > 0 ? '+' : ''}${v.toLocaleString()}`;
};

export const chipDeltaColor = (n) => (n > 0 ? '#16a34a' : n < 0 ? '#dc2626' : V('--th-text-sub'));

// 입력칸 표시용 천 단위 쉼표. 상태에는 숫자만 담는다 ('1500000' → '1,500,000')
export const formatChipDigits = (digits) => (digits ? Number(digits).toLocaleString('en-US') : '');

// 입력값에서 숫자만 남긴다 (쉼표·앞자리 0 제거)
export const chipDigitsOf = (raw, maxDigits) => raw.replace(/\D/g, '').slice(0, maxDigits).replace(/^0+(?=\d)/, '');

/**
 * 바이인 한 판의 손익. 우승자가 판돈을 전부 가져간다.
 * 진 사람: -(바이인 × 횟수), 우승자: 판돈 - 본인 바이인.
 * 바이인 10,000 / Vanna 1·Tae 2·Yuna 1 / Yuna 우승 → -10,000 / -20,000 / +30,000
 *
 * @return { memberId: 손익 }. 바이인 금액이나 우승자가 없으면 null
 */
export const buyInResults = (players, buyIn, buyIns, winnerId) => {
  if (!(buyIn > 0) || winnerId == null) return null;
  const paid = (id) => buyIn * (buyIns[id] ?? 1);
  const pot = players.reduce((sum, p) => sum + paid(p.memberId), 0);
  return Object.fromEntries(players.map(p => [
    p.memberId, p.memberId === winnerId ? pot - paid(p.memberId) : -paid(p.memberId),
  ]));
};
