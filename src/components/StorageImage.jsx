import { useEffect, useMemo, useState } from 'react';

const SUPABASE_PUBLIC_SEGMENT = '/storage/v1/object/public/';
const SUPABASE_RENDER_SEGMENT = '/storage/v1/render/image/public/';
const SUPABASE_TRANSFORM_ENABLED = import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORM === 'true';

const buildQuery = (transform) => {
  const params = new URLSearchParams();
  if (transform.width) params.set('width', String(transform.width));
  if (transform.height) params.set('height', String(transform.height));
  if (transform.quality) params.set('quality', String(transform.quality));
  if (transform.resize) params.set('resize', transform.resize);
  if (transform.format) params.set('format', transform.format);
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const getStorageImageUrl = (src, transform = null) => {
  if (!src || !transform || !SUPABASE_TRANSFORM_ENABLED || src.startsWith('data:')) {
    return src;
  }

  try {
    const url = new URL(src);
    if (!url.pathname.includes(SUPABASE_PUBLIC_SEGMENT)) {
      return src;
    }

    const transformedPath = url.pathname.replace(SUPABASE_PUBLIC_SEGMENT, SUPABASE_RENDER_SEGMENT);
    const transformedUrl = new URL(url.origin + transformedPath);
    transformedUrl.search = buildQuery(transform);
    return transformedUrl.toString();
  } catch {
    return src;
  }
};

const StorageImage = ({
  src,
  transform = null,
  onError,
  onLoad,
  ...props
}) => {
  const optimizedSrc = useMemo(() => getStorageImageUrl(src, transform), [src, transform]);
  const [currentSrc, setCurrentSrc] = useState(optimizedSrc);

  useEffect(() => {
    setCurrentSrc(optimizedSrc);
  }, [optimizedSrc]);

  const handleError = (event) => {
    if (currentSrc !== src && src) {
      setCurrentSrc(src);
      return;
    }
    onError?.(event);
  };

  const handleContextMenu = (e) => e.preventDefault();

  return (
    <img
      draggable={false}
      onContextMenu={handleContextMenu}
      {...props}
      src={currentSrc}
      onError={handleError}
      onLoad={onLoad}
    />
  );
};

export default StorageImage;
