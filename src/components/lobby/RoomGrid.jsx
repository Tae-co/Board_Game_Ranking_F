import { useState } from 'react';
import { V } from '../../utils/cssUtils';
import { useSwipePaging } from '../../hooks/useSwipePaging';
import RoomCard from './RoomCard';
import PageNumbers from './PageNumbers';

const ROOMS_PER_PAGE = 9; // 3열 × 3행

/** 로비의 게임방 목록 (멤버 많은 순, 9개씩 페이지). 커뮤니티 미선택이면 방 사진 대신 게임 사진을 쓴다. */
const RoomGrid = ({ rooms, games, communityId, onEnter, t }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rooms.length / ROOMS_PER_PAGE);
  const swipe = useSwipePaging(page, totalPages, setPage);

  if (rooms.length === 0) {
    return (
      <div style={{
        borderRadius: '16px', padding: '40px 20px', border: `2px dashed var(--th-border)`,
        textAlign: 'center',
      }}>
        <p style={{ color: V('--th-text-sub'), fontSize: '14px', margin: '0 0 6px' }}>{t('lobby', 'noGroups')}</p>
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: 0 }}>{t('lobby', 'noGroupsDesc')}</p>
      </div>
    );
  }

  const sortedRooms = [...rooms].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
  const pagedRooms = sortedRooms.slice(page * ROOMS_PER_PAGE, (page + 1) * ROOMS_PER_PAGE);

  return (
    <>
      <div {...swipe} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
      }}>
        {pagedRooms.map((room) => {
          const gameInfo = !communityId ? games.find(g => g.id === room.boardGameId) : null;
          const imageUrl = communityId ? room.imageUrl : gameInfo?.imageUrl;
          const isMember = communityId ? room.isMember : true;
          return (
            <RoomCard
              key={room.roomId}
              room={room}
              imageUrl={imageUrl}
              isMember={isMember}
              communityId={communityId}
              onClick={() => onEnter(room)}
            />
          );
        })}
      </div>
      <PageNumbers page={page} totalPages={totalPages} onChange={setPage} marginTop="16px" />
    </>
  );
};

export default RoomGrid;
