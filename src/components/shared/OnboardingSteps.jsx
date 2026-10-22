import { Check } from 'lucide-react';
import { V } from '../../utils/cssUtils';

const STEP_KEYS = ['onboardStepCreate', 'onboardStepInvite', 'onboardStepRoom'];

// 첫 사용자 온보딩의 3단계(모임 만들기 → 친구 부르기 → 첫 게임방). current 앞의 단계는 완료로 그린다.
const OnboardingSteps = ({ current, t }) => (
  <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
    {STEP_KEYS.map((key, i) => {
      const done = i < current;
      const isCurrent = i === current;
      return (
        <div key={key} style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            height: 4, borderRadius: 2, marginBottom: 8,
            backgroundColor: done || isCurrent ? V('--th-primary') : V('--th-border'),
            opacity: isCurrent ? 0.45 : 1,
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {done && <Check size={12} color="var(--th-primary)" strokeWidth={3} />}
            <span style={{
              fontSize: '11px', fontWeight: isCurrent ? '800' : '600',
              color: done || isCurrent ? V('--th-text') : V('--th-text-sub'),
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {t('community', key)}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

export default OnboardingSteps;
