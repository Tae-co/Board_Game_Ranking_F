import { useQuery } from '@tanstack/react-query';
import { getStores } from '../api/services/stores';
import { getAuthUserId } from '../auth/storage';

/** 입점 매장 (로비 미리 보기·1g 전체). joined가 계정마다 달라서 키에 userId를 붙인다 */
export const useStoreDirectory = (q = '') => {
  const userId = getAuthUserId();
  return useQuery({
    queryKey: ['stores', 'list', q, userId],
    queryFn: () => getStores(q),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
};
