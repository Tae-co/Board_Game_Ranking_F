import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getPracticeState, setPracticeState, subscribePractice } from './practiceState';
import { PracticeActions } from './practiceActions';
import { reset as resetPracticeServer } from './practiceServer';
import { clearPracticeMemory, notifySelectedCommunityUpdated } from '../utils/storage';
import { AUTH_CHANGED_EVENT, getAuthUserId } from '../auth/storage';
import PracticeExitModal from '../components/practice/PracticeExitModal';

/**
 * 연습 시작·진행·끝. 시작과 끝에 react-query 캐시를 비운다 —
 * 실제 목록과 연습 목록이 한 화면에 섞이지 않게.
 */
export const PracticeProvider = ({ children }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [exitOpen, setExitOpen] = useState(false);
  const practiceActive = useSyncExternalStore(subscribePractice, () => getPracticeState().active);

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
      // 연습 중 헤더 뒤로 가기 — 바로 나가지 않고 종료 확인을 띄운다
      askExit: () => setExitOpen(true),
      finish: (to = '/community') => {
        setExitOpen(false);
        setPracticeState({ active: false, step: null });
        wipe();
        notifySelectedCommunityUpdated();
        navigate(to, { replace: true });
      },
    };
  }, [navigate, queryClient]);

  // 기기 뒤로 가기도 연습 중에만 종료 확인을 띄운다. 연습이 끝나면 리스너를 떼서 원래 동작으로 돌아간다
  // (안드로이드 뒤로 버튼은 리스너가 있는 동안만 기본 동작이 막힌다. 웹은 이미 뒤로 간 걸 앞으로 되돌린다)
  useEffect(() => {
    if (!practiceActive) return undefined;
    if (Capacitor.isNativePlatform()) {
      const handler = CapApp.addListener('backButton', () => setExitOpen(true));
      return () => { handler.then(h => h.remove()); };
    }
    const onPopState = () => {
      window.history.forward();
      setExitOpen(true);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [practiceActive]);

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

  return (
    <PracticeActions.Provider value={actions}>
      {children}
      {exitOpen && <PracticeExitModal onClose={() => setExitOpen(false)} onConfirm={() => actions.finish()} />}
    </PracticeActions.Provider>
  );
};
