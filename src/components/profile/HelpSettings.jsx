import { BookOpen, MessageSquarePlus, ChevronRight } from 'lucide-react';
import { V } from '../../utils/cssUtils';

const rowStyle = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
  padding: '16px 18px', background: 'none', border: 'none',
  cursor: 'pointer', textAlign: 'left',
};

/** 프로필의 도움말 카드 — 사용방법, 피드백 / 버그 신고 */
const HelpSettings = ({ onOpenHelp, onOpenFeedback, t }) => (
  <div>
    <p style={{ fontSize: 14, fontWeight: 800, color: V('--th-text'), margin: '0 0 10px 4px' }}>
      {t('profile', 'helpSection')}
    </p>
    <div style={{ borderRadius: 18, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <button onClick={onOpenHelp} style={rowStyle}>
        <BookOpen size={18} style={{ color: V('--th-primary'), flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: V('--th-text') }}>{t('profile', 'helpButton')}</span>
        <ChevronRight size={16} style={{ color: V('--th-text-sub') }} />
      </button>
      <button onClick={onOpenFeedback} style={{ ...rowStyle, borderTop: `1px solid var(--th-border)` }}>
        <MessageSquarePlus size={18} style={{ color: V('--th-primary'), flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: V('--th-text') }}>{t('profile', 'feedbackButton')}</span>
        <ChevronRight size={16} style={{ color: V('--th-text-sub') }} />
      </button>
    </div>
  </div>
);

export default HelpSettings;
