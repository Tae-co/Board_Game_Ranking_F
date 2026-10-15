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
