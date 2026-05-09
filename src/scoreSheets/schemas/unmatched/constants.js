export const HP_MAX = 30;

export const TEAM_COLORS = [
  null,
  { border: '#ef4444', badge: '#ef4444', text: '#fff', label: 'A' },
  { border: '#3b82f6', badge: '#3b82f6', text: '#fff', label: 'B' },
  { border: '#22c55e', badge: '#22c55e', text: '#fff', label: 'C' },
  { border: '#f59e0b', badge: '#f59e0b', text: '#fff', label: 'D' },
];

export const getAvailableModes = (playerCount) => {
  if (playerCount === 2) return ['1v1'];
  if (playerCount === 3) return ['ffa'];
  if (playerCount === 4) return ['2v2', 'ffa'];
  return ['ffa'];
};
