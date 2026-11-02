import { ScanLine } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/** "휴대폰 카메라로 매장 QR을 찍으면…" 안내. 로비(1·1e)와 매장 구경 하단(2d)이 같이 쓴다 */
const StoreQrHint = ({ text }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 14px', borderRadius: '14px',
    backgroundColor: V('--th-card'), border: `1px dashed ${V('--th-border')}`,
  }}>
    <ScanLine size={18} color={V('--th-primary')} style={{ flexShrink: 0 }} />
    <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>{text}</p>
  </div>
);

export default StoreQrHint;
