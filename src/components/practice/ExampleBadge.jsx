import { V } from '../../utils/cssUtils';

/** 연습의 예시 친구·예시 트로피 옆 「예시」 표시 */
const ExampleBadge = ({ t }) => (
  <span style={{
    fontSize: '10px', fontWeight: 800, flexShrink: 0,
    color: V('--th-practice-text'), backgroundColor: V('--th-practice-bg'),
    borderRadius: '20px', padding: '1px 7px',
  }}>
    {t('practice', 'example')}
  </span>
);

export default ExampleBadge;
