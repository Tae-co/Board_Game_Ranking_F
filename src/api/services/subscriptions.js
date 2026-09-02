import api from '../axios';

/**
 * 모임장 Pro 구독. **결제 연동 없음 — 서버는 플래그만 들고 있다.**
 *
 * 서버에 두는 이유는 매출 보호가 아니라, 커뮤니티에 들어오려는 사람의 앱이
 * 그 모임 운영자가 Pro인지 알 방법이 없어서다. 인원 한도를 join에서 막으려면
 * 서버가 구독을 알아야 한다.
 */
export const getMySubscription = () =>
  api.get('/subscriptions/me').then(r => r.data);

export const subscribeMock = (billing) =>
  api.post('/subscriptions/mock', { billing }).then(r => r.data);

/** 해지 예약. 남은 기간은 유지된다. */
export const cancelSubscription = () =>
  api.delete('/subscriptions/mock').then(r => r.data);

export const resumeSubscription = () =>
  api.post('/subscriptions/mock/resume').then(r => r.data);
