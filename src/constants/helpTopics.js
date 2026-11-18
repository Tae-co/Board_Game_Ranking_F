import { Flag, LogIn, UserPlus, LineChart } from 'lucide-react';

// 사용방법 주제. steps는 번역 키 앞부분 — help.<key><n>Title / help.<key><n>Desc.
// score는 단계 화면 대신 기존 점수 계산 안내 모달을 연다.
export const HELP_TOPICS = [
  { key: 'start', icon: Flag, steps: 5 },
  { key: 'invited', icon: LogIn, steps: 4 },
  { key: 'invite', icon: UserPlus, steps: 4 },
  { key: 'score', icon: LineChart, steps: 0 },
];
