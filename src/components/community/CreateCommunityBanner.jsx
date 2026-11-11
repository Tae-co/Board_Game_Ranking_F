import { Plus } from 'lucide-react';

/** 내 커뮤니티가 없을 때 그 자리에 보이는 '커뮤니티 만들기' 큰 버튼 */
const CreateCommunityBanner = ({ onClick, t }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', borderRadius: '18px', padding: '28px 24px',
      border: 'none', cursor: 'pointer', textAlign: 'left',
      background: 'linear-gradient(135deg, #5B4EDA 0%, #7B8FF5 100%)',
      position: 'relative', overflow: 'hidden', marginBottom: '28px',
      display: 'block',
    }}
  >
    <div style={{ position: 'absolute', right: -10, bottom: -20, width: 100, height: 100, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }}/>
    <div style={{ position: 'absolute', right: 40, top: -20, width: 60, height: 60, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}/>
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '14px',
    }}>
      <Plus size={18} color="#fff" />
    </div>
    <p style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>
      {t('community', 'createCommunity')}
    </p>
    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
      {t('community', 'createCommunityDesc')}
    </p>
  </button>
);

export default CreateCommunityBanner;
