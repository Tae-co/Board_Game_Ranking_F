import { V } from '../../utils/cssUtils';

/** 로비 목록 아래 동그란 페이지 번호 버튼 (1페이지뿐이면 그리지 않는다) */
const PageNumbers = ({ page, totalPages, onChange, marginTop }) => {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop }}>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          style={{
            width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
            fontSize: '13px', fontWeight: '700',
            backgroundColor: page === i ? 'var(--th-primary)' : 'var(--th-card)',
            color: page === i ? '#fff' : V('--th-text-sub'),
            border: `1px solid ${page === i ? 'var(--th-primary)' : 'var(--th-border)'}`,
            transition: 'all 0.15s',
          }}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
};

export default PageNumbers;
