import { useRef } from 'react';

const SWIPE_MIN_PX = 50;

/**
 * 페이지 목록을 좌우 스와이프로 넘긴다. 반환값을 목록 컨테이너에 펼쳐 넣는다.
 * 세로 스크롤 중에 넘어가지 않도록 가로 이동이 세로보다 클 때만 넘긴다.
 */
export const useSwipePaging = (page, totalPages, setPage) => {
  const start = useRef(null);

  return {
    onTouchStart: (e) => {
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e) => {
      if (!start.current) return;
      const dx = start.current.x - e.changedTouches[0].clientX;
      const dy = start.current.y - e.changedTouches[0].clientY;
      start.current = null;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;
      if (dx > 0 && page < totalPages - 1) setPage(page + 1);
      else if (dx < 0 && page > 0) setPage(page - 1);
    },
  };
};
