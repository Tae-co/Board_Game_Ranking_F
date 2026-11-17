import { useState } from 'react';
import { usePractice } from './usePractice';

/**
 * 게임방(Invite) 화면의 연습 단계: 게임 시작(startGame) → 랭킹·매치기록·시즌 둘러보기.
 * 같이 할 사람은 미리 체크하지 않는다 — 사용자가 직접 눌러 최소·최대 인원을 겪게 한다.
 * 인원이 모자란 채로 「게임 시작」을 누른 적이 있으면 말풍선이 최소 인원을 알려준다.
 */
export const useRoomPractice = ({ selectedCount, canStart, overMax, minPlayers, maxPlayers, matchResult, t }) => {
  const practice = usePractice();
  const starting = practice.at('startGame');
  const [triedEarly, setTriedEarly] = useState(false);

  const fill = (s) => s.replace('{min}', minPlayers).replace('{max}', maxPlayers)
    .replace('{n}', minPlayers - selectedCount).replace('{count}', selectedCount).replace('{over}', maxPlayers + 1);
  const startKey = canStart ? 'startReady'
    : overMax ? 'startOver'
      : triedEarly && selectedCount > 0 ? 'startTooFew'
        : 'startGame';

  // 연습 7의 말풍선: 1등 이름과 오른 점수는 방금 넣은 경기 결과에서 가져온다
  const winner = matchResult?.find(r => r.placement === 1);

  return {
    starting,
    // 「게임 시작」을 눌렀는데 인원이 안 맞을 때
    markTriedEarly: () => { if (starting) setTriedEarly(true); },
    startNote: starting
      ? { title: fill(t('practice', `${startKey}Title`)), desc: fill(t('practice', `${startKey}Desc`)) }
      : null,
    highlightPlayers: starting && selectedCount === 0 && !triedEarly,
    highlightList: starting && !canStart,
    highlightStart: starting && canStart,
    highlightTab: practice.at('viewRanking') ? 'matches' : practice.at('viewMatches') ? 'season' : undefined,
    rankingDesc: t('practice', 'rankingDesc')
      .replace('{name}', winner?.nickname ?? '')
      .replace('{change}', Math.round(winner?.ratingChange ?? 0)),
  };
};
