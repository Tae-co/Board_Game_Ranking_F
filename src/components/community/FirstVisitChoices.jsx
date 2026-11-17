import { Plus, Ticket, PlayCircle } from 'lucide-react';
import { V } from '../../utils/cssUtils';

const iconBox = { width: 44, height: 44, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

/**
 * 첫 방문: 이 앱은 혼자 쓸 수 없다. 빈 목록 두 개 대신 "만들기 / 참가" 둘 중 하나를 고르게 한다.
 * 세 번째는 연습 — 저장되지 않는 시뮬레이션으로 모임부터 점수 기록까지 따라 해 본다 (모임이 하나도 없을 때만 보인다)
 */
const FirstVisitChoices = ({ onCreate, onJoin, onPractice, t }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), margin: '0 0 2px' }}>
      {t('community', 'firstVisitTitle')}
    </p>
    <button
      onClick={onCreate}
      style={{
        width: '100%', borderRadius: '18px', padding: '22px 20px',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        background: 'linear-gradient(135deg, #5B4EDA 0%, #7B8FF5 100%)',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: '0 4px 16px rgba(107,92,231,0.3)',
      }}
    >
      <div style={{ ...iconBox, backgroundColor: 'rgba(255,255,255,0.18)' }}>
        <Plus size={22} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: '0 0 4px' }}>{t('community', 'firstVisitCreate')}</p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>{t('community', 'firstVisitCreateDesc')}</p>
      </div>
    </button>
    <button
      onClick={onJoin}
      style={{
        width: '100%', borderRadius: '18px', padding: '22px 20px',
        cursor: 'pointer', textAlign: 'left',
        backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
        display: 'flex', alignItems: 'center', gap: '14px',
      }}
    >
      <div style={{ ...iconBox, backgroundColor: V('--th-bg') }}>
        <Ticket size={22} color="var(--th-primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '17px', fontWeight: '800', color: V('--th-text'), margin: '0 0 4px' }}>{t('community', 'firstVisitJoin')}</p>
        <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>{t('community', 'firstVisitJoinDesc')}</p>
      </div>
    </button>
    <button
      onClick={onPractice}
      style={{
        width: '100%', borderRadius: '18px', padding: '16px 20px',
        cursor: 'pointer', textAlign: 'left',
        backgroundColor: V('--th-practice-bg'), border: `1px dashed var(--th-practice-text)`,
        display: 'flex', alignItems: 'center', gap: '14px',
      }}
    >
      <div style={{ ...iconBox, width: 40, height: 40, borderRadius: '12px', backgroundColor: V('--th-card') }}>
        <PlayCircle size={20} color="var(--th-practice-text)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: V('--th-text'), margin: '0 0 3px' }}>{t('practice', 'entryTitle')}</p>
        <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.45 }}>{t('practice', 'entryDesc')}</p>
      </div>
    </button>
  </div>
);

export default FirstVisitChoices;
