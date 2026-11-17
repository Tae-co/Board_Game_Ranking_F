import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getPracticeState, setPracticeState } from './practiceState';
import { PracticeActions } from './practiceActions';
import { reset as resetPracticeServer } from './practiceServer';
import { clearPracticeMemory, notifySelectedCommunityUpdated } from '../utils/storage';
import { AUTH_CHANGED_EVENT, getAuthUserId } from '../auth/storage';

/**
 * 연습 시작·진행·끝. 시작과 끝에 react-query 캐시를 비운다 —
 * 실제 목록과 연습 목록이 한 화면에 섞이지 않게.
 */
export const PracticeProvider = ({ children }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const actions = useMemo(() => {
    const wipe = () => {
      resetPracticeServer();
      clearPracticeMemory();
      queryClient.clear();
    };
    return {
      start: () => {
        wipe();
        setPracticeState({ active: true, step: 'createCommunity', userId: getAuthUserId() });
        notifySelectedCommunityUpdated();
        navigate('/create-community');
      },
      // 지금 단계에서 보여 준 버튼을 눌렀을 때만 넘어간다
      advance: (from, to) => {
        const { active, step } = getPracticeState();
        if (active && step === from) setPracticeState({ step: to });
      },
      finish: (to = '/community') => {
        setPracticeState({ active: false, step: null });
        wipe();
        notifySelectedCommunityUpdated();
        navigate(to, { replace: true });
      },
    };
  }, [navigate, queryClient]);

  // 연습 중에 로그아웃하면 다음 로그인까지 가짜 서버가 붙어 있지 않게 끈다
  useEffect(() => {
    const onAuthChanged = () => {
      const { active, userId } = getPracticeState();
      if (!active || getAuthUserId() === userId) return; // 닉네임 저장도 이 이벤트를 낸다 — 계정이 바뀐 때만
      setPracticeState({ active: false, step: null });
      resetPracticeServer();
      clearPracticeMemory();
      queryClient.clear();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [queryClient]);

  return <PracticeActions.Provider value={actions}>{children}</PracticeActions.Provider>;
};
