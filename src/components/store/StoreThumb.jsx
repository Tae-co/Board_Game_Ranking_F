import StorageImage from '../StorageImage';
import { V } from '../../utils/cssUtils';

/** 매장 사진. 없으면 커뮤니티 카드처럼 이름 첫 글자 */
const StoreThumb = ({ store, size = 48, radius = 12 }) => (
  <div style={{
    width: size, height: size, borderRadius: radius, overflow: 'hidden', flexShrink: 0,
    backgroundColor: V('--th-bg'), border: `1px solid ${V('--th-border')}`,
  }}>
    {store.imageUrl ? (
      <StorageImage src={store.imageUrl} alt={store.name} loading="lazy" decoding="async"
        transform={{ width: size * 2, height: size * 2, quality: 70 }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    ) : (
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.42), fontWeight: '800', color: '#fff',
      }}>
        {(store.name || '?')[0].toUpperCase()}
      </div>
    )}
  </div>
);

export default StoreThumb;
