// 커뮤니티 커스텀 게임(CustomGameBuilder)의 점수판 스키마. 만든 뒤에는 바꿀 수 없어서
// 여기서 만든 JSON이 그 게임의 점수판·랭킹 방식으로 영원히 남는다 (parseSchema가 읽는다).

// 항목 색상은 사용자에게 묻지 않고 순서대로 배정한다
const PALETTE = ['#1d4ed8', '#0f766e', '#7c3aed', '#b91c1c', '#c2410c', '#0369a1', '#4d7c0f', '#a21caf'];

// 항목 하나에 총점을 적는 경우가 있어서 상한을 100 → 999로 올려둔다 (ScoreCell의 maxScore)
const MAX_SCORE = 999;

// 항목 입력 칸 하나. uid는 화면 key용이고 저장되지 않는다 (저장 키는 순서대로 c1, c2…)
export const newCategory = () => ({ uid: Math.random().toString(36).slice(2, 8), label: '', negative: false });

// scoreType: 'simple' | 'flat' | 'outcome' | 'chip'. chipMode는 칩 게임만 ('buyin' | 'count')
export const buildCustomSchemaJson = ({ name, scoreType, chipMode, denominations, categories }) => {
  // chip을 고르면 서버가 랭킹도 Elo 대신 칩 누적으로 만든다. 만든 뒤에는 바꿀 수 없다.
  if (scoreType === 'chip' && chipMode === 'count') {
    return JSON.stringify({ name: name.trim(), type: scoreType, chipMode, denominations });
  }
  if (scoreType === 'simple' || scoreType === 'outcome' || scoreType === 'chip') {
    return JSON.stringify({ name: name.trim(), type: scoreType });
  }
  return JSON.stringify({
    name: name.trim(),
    type: 'flat',
    categories: categories.map((c, i) => ({
      key: `c${i + 1}`,
      label: c.label.trim(),
      color: PALETTE[i % PALETTE.length],
      maxScore: MAX_SCORE,
      ...(c.negative && { negative: true }),
    })),
  });
};

// 만들기 전 검사. 막히면 lobby 번역 키를, 통과하면 null을 돌려준다.
export const validateCustomGame = ({ name, minPlayers, maxPlayers, scoreType, chipMode, denominations, categories }) => {
  if (!name.trim()) return 'customNameRequired';
  if (minPlayers < 1 || maxPlayers < minPlayers) return 'customPlayersInvalid';
  if (scoreType === 'chip' && chipMode === 'count' && denominations.length === 0) return 'customChipDenomsRequired';
  // 항목은 하나 이상, 빈 칸 없이
  if (scoreType === 'flat' && (categories.length === 0 || categories.some(c => !c.label.trim()))) return 'customCategoryRequired';
  return null;
};
