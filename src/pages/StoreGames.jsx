import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoreGames, getStoreHome } from '../api/services/stores';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StorageImage from '../components/StorageImage';
import GameImageFallback from '../components/shared/GameImageFallback';
import StoreTopBar from '../components/store/StoreTopBar';
import { BackIcon, ChevronRightIcon, PlusIcon, SearchIcon } from '../components/store/StoreIcons';
import StoreBottomBar from '../components/store/StoreBottomBar';
import { fmt } from '../components/store/fmt';

const PER_PAGE = 8;

const Tile = ({ game, onClick, label }) => {
  const [err, setErr] = useState(false);
  return (
    <button onClick={onClick} disabled={!onClick} style={{
      padding: 0, textAlign: 'left', cursor: onClick ? 'pointer' : 'default', minWidth: 0, backgroundColor: V('--th-card'),
      border: `1px solid ${V('--th-border')}`, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 96, width: '100%', backgroundColor: V('--th-bg-deep'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {game.imageUrl && !err
          ? <StorageImage src={game.imageUrl} alt={game.name} loading="lazy" onError={() => setErr(true)} transform={{ width: 360, height: 192, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <GameImageFallback size={40} />}
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</span>
        <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{label}</span>
      </div>
    </button>
  );
};

/** 매장 게임 전체 (시안 2c · 구경 2f). 검색 · 8개씩 옆으로 넘기는 페이지 · 오른쪽 위 점수판 요청(2g) */
const StoreGames = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const scroller = useRef(null);

  const { data: home } = useQuery({ queryKey: ['store', Number(storeId), 'home'], queryFn: () => getStoreHome(storeId), staleTime: 30_000 });
  const { data: games = [] } = useQuery({ queryKey: ['store', Number(storeId), 'games'], queryFn: () => getStoreGames(storeId) });
  const filtered = useMemo(() => games.filter(g => g.name.toLowerCase().includes(q.trim().toLowerCase())), [games, q]);
  const pages = [];
  for (let i = 0; i < filtered.length; i += PER_PAGE) pages.push(filtered.slice(i, i + PER_PAGE));
  const count = Math.max(1, pages.length);
  const go = (p) => {
    const target = Math.max(0, Math.min(count - 1, p));
    scroller.current?.scrollTo({ left: target * scroller.current.clientWidth, behavior: 'smooth' });
    setPage(target);
  };
  const storeName = home ? [home.store.name, home.store.branch].filter(Boolean).join(' ') : '';
  // 2f 구경: 눌러도 게임방에 안 가고, 아래 QR 안내
  const isVisitor = home && (home.viewer.role === 'VISITOR' || home.viewer.role === 'STAFF_OTHER');
  const canEnter = home?.viewer.role === 'MEMBER' && home.viewer.checkin?.active && !home.store.closed;
  const navBtn = { width: 44, height: 44, border: 'none', borderRadius: '12px', background: 'none', cursor: 'pointer', color: V('--th-text-sub'), display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar
        title={t('store', 'storeGames')}
        onBack={() => navigate(-1)}
        backLabel={t('common', 'back')}
        right={(
          <button onClick={() => navigate(`/store/${storeId}/score-request`)} style={{
            height: 36, boxSizing: 'border-box', padding: '0 12px', borderRadius: 999, cursor: 'pointer',
            border: `1px solid rgba(${V('--th-primary-rgb')}, 0.3)`, backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.12)`,
            color: V('--th-primary'), fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <PlusIcon />{t('store', 'scoreRequestButton')}
          </button>
        )}
      />
      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: isVisitor ? '20px 20px 150px' : '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>
            {fmt(t('store', 'gamesHeading'), { store: storeName })}{' '}
            <span style={{ fontSize: '16px', fontWeight: 500, color: V('--th-text-sub') }}>{t('store', 'gameCountShort').replace('{n}', games.length)}</span>
          </h1>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', isVisitor ? 'gamesSubVisitor' : 'gamesSub')}</span>
        </section>
        <label style={{ height: 48, boxSizing: 'border-box', padding: '0 14px', borderRadius: '12px', border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), display: 'flex', alignItems: 'center', gap: '10px', color: V('--th-text-sub') }}>
          <SearchIcon />
          <input value={q} onChange={(e) => { setQ(e.target.value); go(0); }} placeholder={t('store', 'gameSearch')} aria-label={t('store', 'gameSearch')}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: V('--th-text') }} />
        </label>
        <div ref={scroller} onScroll={(e) => {
          const p = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
          if (p !== page) setPage(p);
        }} style={{ display: 'flex', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', overscrollBehaviorX: 'contain', scrollbarWidth: 'none' }}>
          {pages.map((pg, i) => (
            <div key={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridAutoRows: 152, alignContent: 'start', gap: '12px' }}>
              {pg.map(g => (
                <Tile key={g.storeRoomId} game={g} label={fmt(t('store', 'gamePlayers'), { n: g.playerCount })}
                  onClick={canEnter ? () => navigate(`/store/${storeId}/rooms/${g.storeRoomId}`) : undefined} />
              ))}
            </div>
          ))}
        </div>
        {pages.length > 1 && (
          <nav aria-label="pages" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <button onClick={() => go(page - 1)} aria-label={t('store', 'prevPage')} style={navBtn}><BackIcon size={18} /></button>
            {pages.map((_, i) => (
              <button key={i} onClick={() => go(i)} aria-current={i === page ? 'page' : undefined} style={{
                ...navBtn, fontSize: '15px', fontWeight: i === page ? 700 : 500,
                backgroundColor: i === page ? V('--th-primary') : 'transparent', color: i === page ? '#fff' : V('--th-text-sub'),
              }}>{i + 1}</button>
            ))}
            <button onClick={() => go(page + 1)} aria-label={t('store', 'nextPage')} style={navBtn}><ChevronRightIcon size={18} /></button>
          </nav>
        )}
      </main>
      {isVisitor && <StoreBottomBar title={t('store', 'visitorBarTitle')} desc={t('store', 'visitorBarDesc')} note={t('store', 'visitorBarNote')} />}
    </div>
  );
};

export default StoreGames;
