import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyStores } from '../../hooks/useMyStores';
import { useStoreDirectory } from '../../hooks/useStoreDirectory';
import { useSwipePaging } from '../../hooks/useSwipePaging';
import { STORE_DIRECTORY_PREVIEW } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import StoreCard from './StoreCard';
import StoreDirectoryList from './StoreDirectoryList';
import StoreLeaveModal from './StoreLeaveModal';
import StoreQrHint from './StoreQrHint';

const SectionTitle = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
    <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), margin: 0 }}>{children}</p>
    {action}
  </div>
);

/** 입점 매장 미리 보기 (내 매장 제외, 최대 5개) + 전체 보기 → 1g. 1e도 같이 쓴다 */
export const StoreDirectoryPreview = ({ t }) => {
  const navigate = useNavigate();
  const { data: directory = [] } = useStoreDirectory();
  const { data: myStores = [] } = useMyStores();
  // STAFF의 지정 매장은 가입(store_member)이 아니라 joined가 false다 — 내 매장 목록으로도 거른다
  const mine = new Set(myStores.map(s => s.id));
  const others = directory.filter(s => !s.joined && !mine.has(s.id));
  if (others.length === 0) return null;
  return (
    <div style={{ marginBottom: '28px' }}>
      <SectionTitle action={(
        <button
          onClick={() => navigate('/stores')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: V('--th-primary'), padding: 0 }}
        >
          {t('store', 'directorySeeAll')}
        </button>
      )}>
        {t('store', 'directoryTitle')}
      </SectionTitle>
      <StoreDirectoryList stores={others.slice(0, STORE_DIRECTORY_PREVIEW)} onOpen={(s) => navigate(`/store/${s.id}`)} t={t} />
    </div>
  );
};

/**
 * 로비 맨 위 내 매장 (시안 1). 여러 곳이면 옆으로 넘긴다.
 * 매장이 하나도 없고 입점 매장도 없으면(입점 전) 아무것도 그리지 않는다 — 기존 사용자 로비를 비워 두지 않으려고.
 */
const MyStoreSection = ({ t }) => {
  const navigate = useNavigate();
  const { data: myStores = [], isLoading } = useMyStores();
  const { data: directory = [], isLoading: directoryLoading } = useStoreDirectory();
  const [page, setPage] = useState(0);
  const [leaving, setLeaving] = useState(null);
  const swipe = useSwipePaging(page, myStores.length, setPage);

  if (isLoading || directoryLoading) return null;
  if (myStores.length === 0 && directory.length === 0) return null;

  const isStaff = myStores.some(s => s.role === 'STAFF');
  const current = myStores[Math.min(page, myStores.length - 1)];

  return (
    <>
      <div style={{ marginBottom: '28px' }}>
        <SectionTitle>{t('store', 'myStores')}</SectionTitle>
        {current && (
          <div {...swipe} style={{ marginBottom: '10px' }}>
            <StoreCard store={current} onOpen={(s) => navigate(`/store/${s.id}`)} onLeave={setLeaving} t={t} />
            {myStores.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                {myStores.map((s, i) => (
                  <button
                    key={s.id}
                    aria-label={`${i + 1}`}
                    onClick={() => setPage(i)}
                    style={{
                      width: i === page ? 16 : 6, height: 6, borderRadius: 3, padding: 0,
                      border: 'none', cursor: 'pointer', transition: 'width 0.2s',
                      backgroundColor: i === page ? V('--th-primary') : V('--th-border'),
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {!isStaff && <StoreQrHint text={t('store', 'qrHint')} />}
      </div>
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
