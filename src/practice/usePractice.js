import { useContext, useSyncExternalStore } from 'react';
import { getPracticeState, subscribePractice, PRACTICE_STEPS } from './practiceState';
import { PracticeActions } from './practiceActions';

/** { active, step, progress(1~5), at(step), start, advance, finish } */
export const usePractice = () => {
  const state = useSyncExternalStore(subscribePractice, getPracticeState);
  const actions = useContext(PracticeActions);
  return {
    ...state,
    ...actions,
    progress: PRACTICE_STEPS[state.step] ?? 0,
    at: (step) => state.active && state.step === step,
  };
};
