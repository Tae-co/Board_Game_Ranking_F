import { V } from '../../utils/cssUtils';

/** 사용방법 화면 아래 고정 「연습 해보기」. 세 화면 모두 같은 버튼이다. */
const PracticeFooter = ({ onClick, t }) => (
  <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: V('--th-bg') }}>
    <div style={{ maxWidth: 390, margin: '0 auto', padding: '12px 20px calc(24px + env(safe-area-inset-bottom))' }}>
      <button
        onClick={onClick}
        style={{
          width: '100%', padding: '15px', borderRadius: '14px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          color: '#fff', fontSize: '16px', fontWeight: 700,
        }}
      >
        {t('help', 'practice')}
      </button>
    </div>
  </div>
);

export default PracticeFooter;
