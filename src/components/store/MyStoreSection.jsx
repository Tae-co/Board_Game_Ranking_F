import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyStores } from '../../hooks/useMyStores';
import { useStoreDirectory } from '../../hooks/useStoreDirectory';
import { STORE_DIRECTORY_PREVIEW, storeArea, storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import StoreCard from './StoreCard';
import StoreLeaveModal from './StoreLeaveModal';
import { QrIcon } from './StoreIcons';

const sectionStyle = { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' };
const h2Style = { margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') };

/** 입점 매장 미리 보기 (두 곳) + 전체 보기 → 1g. 1e도 같이 쓴다. 내 매장도 빼지 않고 뒤로 보낸다 — 가입해도 섹션이 남아야 한다 */
export const StoreDirectoryPreview = ({ t }) => {
  const navigate = useNavigate();
  const { data: directory = [] } = useStoreDirectory();
  const { data: myStores = [] } = useMyStores();

  if (directory.length === 0) return null;

  // STAFF의 지정 매장은 가입(store_member)이 아니라 joined가 false다 — 내 매장 목록으로도 본다
  const mine = new Set(myStores.map(s => s.id));
  const isMine = (s) => s.joined || mine.has(s.id);
  const ordered = [...directory.filter(s => !isMine(s)), ...directory.filter(isMine)];

  return (
    <section style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={h2Style}>{t('store', 'directoryTitle')}</h2>
        <button
          onClick={() => navigate('/stores')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: V('--th-primary'), padding: 0 }}
        >
          {t('store', 'directorySeeAll')}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        {ordered.slice(0, STORE_DIRECTORY_PREVIEW).map(store => (
          <button
            key={store.id}
            onClick={() => navigate(`/store/${store.id}`)}
            style={{
              flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer',
              backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '16px',
              padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {storeTitle(store)}
            </span>
            <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
              {t('store', 'areaAndRooms').replace('{area}', storeArea(store)).replace('{rooms}', store.gameCount)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

/**
 * 로비 맨 위 내 매장 (시안 1). 여러 곳이면 옆으로 넘긴다 (다음 카드가 살짝 보인다).
 * 매장이 하나도 없으면 그리지 않는다 — 1e(lobbyFocus='store')는 CommunityLobby가 따로 그린다.
 */
const MyStoreSection = ({ lang, t }) => {
  const navigate = useNavigate();
  const { data: myStores = [], isLoading } = useMyStores();
  const [page, setPage] = useState(0);
  const [leaving, setLeaving] = useState(null);

  if (isLoading) return null;

  const isStaff = myStores.some(s => s.role === 'STAFF');

  // 카드 폭 318 + 간격 12
  const handleScroll = (e) => setPage(Math.round(e.currentTarget.scrollLeft / 330));

  return (
    <>
      {myStores.length > 0 && (
        <section style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <h2 style={h2Style}>
              {t('store', 'myStores')}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: V('--th-text-sub') }}>
                {t('store', 'placeCount').replace('{n}', myStores.length)}
              </span>
            </h2>
            {!isStaff && (
              <span style={{ fontSize: '12px', color: V('--th-text-sub'), display: 'flex', alignItems: 'center', gap: '4px', textAlign: 'right' }}>
                <QrIcon size={14} />
                {t('store', 'qrHint')}
              </span>
            )}
          </div>
          <div
            onScroll={handleScroll}
            style={{
              display: 'flex', gap: '12px', marginRight: -20, paddingRight: 20,
              overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
            }}
          >
            {myStores.map(store => (
              <StoreCard key={store.id} store={store} onOpen={(s) => navigate(`/store/${s.id}`)} onLeave={setLeaving} lang={lang} t={t} />
            ))}
          </div>
          {myStores.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }} aria-hidden="true">
              {myStores.map((s, i) => (
                <span key={s.id} style={{
                  width: i === page ? 18 : 6, height: 6, borderRadius: 999, transition: 'width 0.2s',
                  backgroundColor: i === page ? V('--th-primary') : '#D1D5DB',
                }} />
              ))}
            </div>
          )}
        </section>
      )}
      <StoreDirectoryPreview t={t} />
      {leaving && (
        <StoreLeaveModal
          store={leaving}
          t={t}
          onClose={() => { setLeaving(null); setPage(0); }}
        />
      )}
    </>
  );
};

export default MyStoreSection;
