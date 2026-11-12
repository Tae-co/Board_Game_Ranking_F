import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { V } from '../../utils/cssUtils';

// 커스텀 게임 썸네일(선택). 고른 파일은 미리보기만 하고, 업로드는 만들기 누를 때 한다.
const GameImageField = ({ preview, onPick, onClear, t }) => {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert(t('lobby', 'customImageOnly')); return; }
    onPick(file);
  };

  const clear = () => {
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
        {t('lobby', 'customImage')}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 72, height: 72, borderRadius: 12, flexShrink: 0, cursor: 'pointer',
            backgroundColor: V('--th-card'), overflow: 'hidden', padding: 0,
            border: `1px ${preview ? 'solid' : 'dashed'} var(--th-border)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {preview
            ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <ImagePlus style={{ width: 22, height: 22, color: V('--th-text-sub') }} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, color: V('--th-text-sub'), lineHeight: 1.4 }}>
            {t('lobby', 'customImageHint')}
          </p>
          {preview && (
            <button
              onClick={clear}
              style={{
                marginTop: 6, padding: 0, background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: '#ef4444',
              }}
            >
              {t('lobby', 'customImageRemove')}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default GameImageField;
