/**
 * 연습의 남색 말풍선. arrow: 'up'(위를 가리킴) | 'down'(아래를 가리킴) | undefined.
 * 테마와 상관없이 같은 색이다 (캔버스 라이트·다크 동일).
 */
const CoachNote = ({ title, desc, arrow, arrowLeft = 40, style }) => (
  <div role="note" style={{
    position: 'relative', backgroundColor: '#3730A3', color: '#fff',
    borderRadius: '16px', padding: '14px 16px',
    boxShadow: '0 8px 24px rgba(55,48,163,0.3)', ...style,
  }}>
    {arrow && (
      <div aria-hidden="true" style={{
        position: 'absolute', left: arrowLeft, width: 14, height: 14,
        backgroundColor: '#3730A3', transform: 'rotate(45deg)', borderRadius: 2,
        ...(arrow === 'up' ? { top: -6 } : { bottom: -6 }),
      }} />
    )}
    <p style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px' }}>{title}</p>
    <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0, color: '#E0E7FF' }}>{desc}</p>
  </div>
);

export default CoachNote;
