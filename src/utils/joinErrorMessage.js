/**
 * 커뮤니티 참가 실패 문구.
 *
 * 서버 메시지는 한국어 고정인데 앱 기본 언어는 en이다. 그래서 서버가 코드를 준
 * 경우에는 그 코드로 프론트에서 문구를 만들고, 모르는 에러일 때만 서버 문구를 쓴다.
 */
export const joinErrorMessage = (error, t) => {
  const data = error?.response?.data;

  if (data?.code === 'COMMUNITY_FULL') {
    return t('community', 'joinFullMessage')
      .replace('{count}', data.memberCount ?? '')
      .replace('{limit}', data.limit ?? '');
  }

  return data?.message || t('community', 'invalidCode');
};
