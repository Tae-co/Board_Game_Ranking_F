// Invite.jsx / CommunityLobby.jsx 등에서 중복 선언되던 아바타 색상 통합

export const AVATAR_COLORS = [
  '#6B5CE7', '#7B8FF5', '#A78BFA', '#60A5FA', '#34D399',
  '#F472B6', '#FB923C', '#FBBF24', '#38BDF8', '#4ADE80',
];

// memberId(숫자) 기반 색상 — Invite.jsx 패턴
export const getAvatarColorById = (memberId) =>
  AVATAR_COLORS[memberId % AVATAR_COLORS.length];

// 문자열(닉네임 등) 기반 색상 — CommunityLobby.jsx 패턴
export const getAvatarColorByStr = (str) =>
  AVATAR_COLORS[(str?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
