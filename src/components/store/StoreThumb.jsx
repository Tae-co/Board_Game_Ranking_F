import StorageImage from '../StorageImage';
import { V } from '../../utils/cssUtils';

/** 매장 사진. 없으면 빈 칸 (시안과 같다). width를 안 주면 부모 폭을 채운다 */
const StoreThumb = ({ store, size, height, radius = 0 }) => (
  <div style={{
    width: size ?? '100%', height: height ?? size, borderRadius: radius, overflow: 'hidden', flexShrink: 0,
    backgroundColor: V('--th-bg-deep'),
  }}>
    {store.imageUrl && (
      <StorageImage src={store.imageUrl} alt={store.name} loading="lazy" decoding="async"
        transform={{ width: size ? size * 2 : 640, height: (height ?? size) * 2, quality: 70 }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    )}
  </div>
);

export default StoreThumb;
