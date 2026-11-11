import { Plus } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/** 커뮤니티 목록의 섹션 제목 + 오른쪽 동그란 + 버튼 (onAdd가 없으면 버튼 없음) */
const CommunitySectionHeader = ({ title, onAdd }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
    <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), margin: 0 }}>
      {title}
    </p>
    {onAdd && (
      <button
        onClick={onAdd}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(107,92,231,0.3)',
        }}
      >
        <Plus size={16} color="#fff" />
      </button>
    )}
  </div>
);

export default CommunitySectionHeader;
