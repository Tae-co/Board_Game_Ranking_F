import { V } from './cssUtils';

// 칩 게임(BoardGame.ratingType === 'CHIP') 표시용. 순위가 아니라 딴/잃은 칩을 누적한다.

export const isChipGame = (game) => game?.ratingType === 'CHIP';

// +1,200 / -300 / 0
export const formatChipDelta = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v > 0 ? '+' : ''}${v.toLocaleString()}`;
};

export const chipDeltaColor = (n) => (n > 0 ? '#16a34a' : n < 0 ? '#dc2626' : V('--th-text-sub'));

// 입력값 { sign: '+' | '-', amount: '300' } → -300. 비어 있으면 null
export const chipDeltaOf = (input) => {
  if (!input || input.amount === '' || input.amount == null) return null;
  const n = Number(input.amount);
  return input.sign === '-' ? -n : n;
};

// 저장된 증감(-300) → 입력값. 수정·읽기 화면에서 이전 값을 되살린다
export const chipInputOf = (delta) => (
  delta == null ? { sign: '+', amount: '' } : { sign: delta < 0 ? '-' : '+', amount: String(Math.abs(delta)) }
);

// 입력칸 표시용 천 단위 쉼표. 상태에는 숫자만 담는다 ('1500000' → '1,500,000')
export const formatChipDigits = (digits) => (digits ? Number(digits).toLocaleString('en-US') : '');

// 입력값에서 숫자만 남긴다 (쉼표·앞자리 0 제거)
export const chipDigitsOf = (raw, maxDigits) => raw.replace(/\D/g, '').slice(0, maxDigits).replace(/^0+(?=\d)/, '');

// 이번 판을 시작할 때 테이블에 놓인 칩. 잔고가 0이면 서버가 시작 칩으로 리바이시키므로 시작 칩이다
export const chipStackBefore = (balance, startingChips) => (balance > 0 ? balance : startingChips);
