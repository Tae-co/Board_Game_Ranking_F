import { useState } from 'react';

/** 목록을 perPage개씩 나눈다. 목록이 줄어 지금 쪽이 없어지면 마지막 쪽을 보여 준다 */
const usePaged = (list, perPage) => {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(list.length / perPage));
  const cur = Math.min(page, pageCount - 1);
  return {
    items: list.slice(cur * perPage, (cur + 1) * perPage),
    cur,
    pageCount,
    go: (p) => setPage(Math.max(0, Math.min(pageCount - 1, p))),
  };
};

export default usePaged;
