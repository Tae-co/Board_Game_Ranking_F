import { useQuery } from '@tanstack/react-query';
import { getMyStores } from '../api/services/stores';
import { getAuthUserId } from '../auth/storage';

// 무효화는 앞부분 ['stores', 'mine']으로 한다. 뒤의 userId는 계정을 바꿔 로그인했을 때 캐시가 섞이지 않게
export const MY_STORES_KEY = ['stores', 'mine'];

/** 내 매장 (로비·입점 매장 전체·매장 홈이 같이 쓴다). STAFF는 지정된 매장 하나 */
export const useMyStores = () => {
  const userId = getAuthUserId();
  return useQuery({
    queryKey: [...MY_STORES_KEY, userId],
    queryFn: getMyStores,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
