import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { deleteMatch } from '../api/services/matches';
import { buildSavedScores } from '../scoreSheets/savedScores';

/**
 * 매치 기록 탭의 보기·수정·삭제.
 * 점수판에서 돌아올 때 같은 탭·같은 페이지로 오도록 page를 backState에 실어 보낸다.
 */
export const useMatchActions = ({ roomId, page, t }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const openScoreSheet = useCallback((match, readOnly = false) => {
    const savedScores = buildSavedScores(match.participants);
    navigate(`/score-sheet/${match.boardGameId}`, {
      state: {
        roomId: Number(roomId), gameName: match.gameName,
        players: match.participants.map(p => ({ memberId: p.memberId, nickname: p.nickname })),
        savedScores, backTo: `/invite/${roomId}`,
        backState: { activeTab: 'matches', matchPage: page },
        ...(readOnly ? { readOnly: true } : { editMatchId: match.matchId }),
      },
    });
  }, [navigate, roomId, page]);

  const handleViewMatch = useCallback((match) => openScoreSheet(match, true), [openScoreSheet]);
  const handleEditMatch = useCallback((match) => openScoreSheet(match, false), [openScoreSheet]);

  const handleDeleteMatch = useCallback(async (matchId) => {
    if (!window.confirm(t('ranking', 'matchDeleteConfirm'))) return;
    try {
      await deleteMatch(matchId);
      queryClient.setQueryData(['matches', roomId], (old) =>
        Array.isArray(old) ? old.filter(m => m.matchId !== matchId) : old
      );
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
      queryClient.invalidateQueries({ queryKey: ['communityStatus'] });
    } catch { alert(t('ranking', 'matchDeleteFailed')); }
  }, [queryClient, roomId, t]);

  return { handleViewMatch, handleEditMatch, handleDeleteMatch };
};
