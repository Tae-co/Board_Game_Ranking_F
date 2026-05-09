export const formatDate = (dateStr, timezone) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(dateStr));

export const formatTime = (dateStr, timezone) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(dateStr));

export const ordinalSuffix = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
