import { useState } from 'react';
import { Share } from '@capacitor/share';
import { EVENTS, logEvent } from '../api/services/events';
import { formatChipDelta } from '../utils/chipUtils';
import { getNickname } from '../auth/storage';

/**
 * 게임방 로비의 공유 두 가지(내 순위, 방금 경기 결과).
 * sharedCopiedKind는 공유 시트가 없어 클립보드로 복사했을 때 2초 동안 그 종류('my_rank' | 'match_result')다.
 */
export const useInviteShare = ({ roomId, gameInfo, roomInfo, isChip, myRank, myRankPosition, myWinRate, matchResult, t }) => {
  const [sharedCopiedKind, setSharedCopiedKind] = useState(null);

  // 바이럴 퍼널의 시작점. 그룹 로비 진입이 아니라 "실제로 공유를 시도했다"만 센다.
  //
  // @capacitor/share는 네이티브에선 OS 공유 시트를, 웹에선 navigator.share를 쓴다.
  // 예전에는 navigator.share가 없으면 그냥 return해서 버튼이 죽어 있었다 — 안드로이드
  // WebView는 Web Share API를 구현하지 않아서 앱 유저가 눌러도 아무 일이 없었다.
  // 공유 시트가 없는 환경에서는 클립보드로 떨어뜨린다.
  //
  // 계측은 분기보다 앞에 둔다. 뒤에 두면 공유 시트가 없는 플랫폼의 시도가 통째로 빠져
  // 바이럴 퍼널이 iOS 유저만의 것처럼 보인다.
  const nativeShare = async (title, text, kind) => {
    logEvent(EVENTS.INVITE_SHARED, { roomId: Number(roomId), props: { kind } });

    let canShare = false;
    try { canShare = (await Share.canShare()).value; } catch { canShare = false; }

    if (canShare) {
      // 사용자가 시트를 닫은 것도 reject다. 폴백으로 떨어뜨리면 취소가 곧 복사가 된다.
      await Share.share({ title, text }).catch(() => {});
      return;
    }

    try {
      await navigator.clipboard.writeText(`${title}\n${text}`);
      setSharedCopiedKind(kind);
      setTimeout(() => setSharedCopiedKind(null), 2000);
    } catch {
      alert(t('invite', 'shareUnavailable'));
    }
  };

  const shareMyRank = () => {
    if (!myRank || !myRankPosition) return;
    const gameName = gameInfo?.name || roomInfo?.roomName || t('invite', 'defaultGameName');
    const nickname = getNickname() || myRank.nickname;
    nativeShare(
      t('invite', 'shareMyRankTitle').replace('{nickname}', nickname).replace('{game}', gameName),
      t('invite', isChip ? 'shareMyRankTextChip' : 'shareMyRankText')
        .replace('{rank}', myRankPosition).replace('{rating}', isChip ? formatChipDelta(myRank.rating) : Math.round(myRank.rating))
        .replace('{winRate}', myWinRate).replace('{wins}', myRank.winCount).replace('{losses}', myRank.loseCount),
      'my_rank',
    );
  };

  const shareMatchResult = () => {
    if (!matchResult) return;
    const gameName = gameInfo?.name || roomInfo?.roomName || t('invite', 'defaultGameName');
    const lines = [...matchResult]
      .sort((a, b) => b.ratingChange - a.ratingChange)
      .map(r => `${r.nickname} ${isChip ? formatChipDelta(r.ratingChange) : `${r.ratingChange >= 0 ? '+' : ''}${Math.round(r.ratingChange)}`}`)
      .join(' · ');
    nativeShare(
      t('invite', 'shareMatchTitle').replace('{game}', gameName),
      t('invite', 'shareMatchText').replace('{lines}', lines),
      'match_result',
    );
  };

  return { sharedCopiedKind, shareMyRank, shareMatchResult };
};
