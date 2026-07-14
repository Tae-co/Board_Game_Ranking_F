import { useRef, useState } from 'react';
import { X, Plus, Trophy, Hash, ImagePlus } from 'lucide-react';
import { createGame, uploadGameImage } from '../../api/services/games';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';

// 항목 색상은 사용자에게 묻지 않고 순서대로 배정한다
const PALETTE = ['#1d4ed8', '#0f766e', '#7c3aed', '#b91c1c', '#c2410c', '#0369a1', '#4d7c0f', '#a21caf'];

// 항목 하나에 총점을 적는 경우가 있어서 상한을 100 → 999로 올려둔다 (ScoreCell의 maxScore)
const MAX_SCORE = 999;

const newCategory = () => ({ uid: Math.random().toString(36).slice(2, 8), label: '', negative: false });

const CustomGameBuilder = ({ initialName, communityId, onCancel, onCreated }) => {
  const { t } = useLanguage();

  const [name, setName] = useState(initialName ?? '');
  const [scoreType, setScoreType] = useState(null); // 'simple' | 'flat'
  const [categories, setCategories] = useState([newCategory(), newCategory()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert(t('lobby', 'customImageOnly')); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateCategory = (uid, patch) =>
    setCategories(prev => prev.map(c => (c.uid === uid ? { ...c, ...patch } : c)));

  const buildSchemaJson = () => {
    if (scoreType === 'simple') {
      return JSON.stringify({ name: name.trim(), type: 'simple' });
    }
    return JSON.stringify({
      name: name.trim(),
      type: 'flat',
      categories: categories.map((c, i) => ({
        key: `c${i + 1}`,
        label: c.label.trim(),
        color: PALETTE[i % PALETTE.length],
        maxScore: MAX_SCORE,
        ...(c.negative && { negative: true }),
      })),
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) { alert(t('lobby', 'customNameRequired')); return; }
    if (scoreType === 'flat') {
      const filled = categories.filter(c => c.label.trim());
      if (filled.length === 0) { alert(t('lobby', 'customCategoryRequired')); return; }
      if (filled.length !== categories.length) { alert(t('lobby', 'customCategoryRequired')); return; }
    }

    setIsSubmitting(true);
    try {
      // 사진은 선택사항. 업로드가 실패하면 게임도 만들지 않는다.
      const imageUrl = imageFile ? await uploadGameImage(imageFile, Number(communityId)) : '';

      // memberId는 보내지 않는다. 백엔드가 JWT 토큰에서 꺼낸다.
      const game = await createGame({
        name: name.trim(),
        communityId: Number(communityId),
        schemaJson: buildSchemaJson(),
        imageUrl,
      });
      onCreated(game);
    } catch (err) {
      alert(err?.response?.data?.message || t('lobby', 'customCreateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = !!name.trim() && !!scoreType && !isSubmitting;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 390, maxHeight: '88vh', overflowY: 'auto',
        backgroundColor: V('--th-bg'), borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: V('--th-text'), margin: 0 }}>
            {t('lobby', 'customGameTitle')}
          </h2>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: V('--th-text-sub') }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Game name */}
        <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
          GAME NAME
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('lobby', 'customNamePlaceholder')}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 12, marginBottom: 24,
            backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
            color: V('--th-text'), fontSize: 15, outline: 'none', boxSizing: 'border-box',
          }}
        />

        {/* Thumbnail (optional) */}
        <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
          {t('lobby', 'customImage')}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePickImage}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 72, height: 72, borderRadius: 12, flexShrink: 0, cursor: 'pointer',
              backgroundColor: V('--th-card'), overflow: 'hidden', padding: 0,
              border: `1px ${imagePreview ? 'solid' : 'dashed'} var(--th-border)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {imagePreview
              ? <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <ImagePlus style={{ width: 22, height: 22, color: V('--th-text-sub') }} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: V('--th-text-sub'), lineHeight: 1.4 }}>
              {t('lobby', 'customImageHint')}
            </p>
            {imagePreview && (
              <button
                onClick={clearImage}
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

        {/* Score type */}
        <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
          {t('lobby', 'customScoreType')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { key: 'simple', Icon: Trophy, label: t('lobby', 'customTypeSimple'), desc: t('lobby', 'customTypeSimpleDesc') },
            { key: 'flat', Icon: Hash, label: t('lobby', 'customTypeFlat'), desc: t('lobby', 'customTypeFlatDesc') },
          ].map((opt) => {
            const selected = scoreType === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setScoreType(opt.key)}
                style={{
                  textAlign: 'left', padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
                  backgroundColor: V('--th-card'),
                  border: `2px solid ${selected ? 'var(--th-primary)' : 'var(--th-border)'}`,
                }}
              >
                <opt.Icon style={{ width: 18, height: 18, color: selected ? 'var(--th-primary)' : V('--th-text-sub'), marginBottom: 6 }} />
                <p style={{
                  margin: 0, fontSize: 13, fontWeight: 700,
                  color: selected ? V('--th-primary') : V('--th-text'),
                }}>
                  {opt.label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, lineHeight: 1.35, color: V('--th-text-sub') }}>
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Categories (flat only) */}
        {scoreType === 'flat' && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
              {t('lobby', 'customCategories')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {categories.map((cat, idx) => (
                <div key={cat.uid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="text"
                    value={cat.label}
                    onChange={(e) => updateCategory(cat.uid, { label: e.target.value })}
                    placeholder={t('lobby', 'customCategoryPlaceholder')}
                    style={{
                      flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 10,
                      backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                      color: V('--th-text'), fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => updateCategory(cat.uid, { negative: !cat.negative })}
                    title={t('lobby', 'customNegativeHint')}
                    style={{
                      flexShrink: 0, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      backgroundColor: cat.negative ? '#ef4444' : V('--th-card'),
                      color: cat.negative ? '#fff' : V('--th-text-sub'),
                      border: `1px solid ${cat.negative ? '#ef4444' : 'var(--th-border)'}`,
                    }}
                  >
                    {t('lobby', 'customNegative')}
                  </button>
                  <button
                    onClick={() => setCategories(prev => prev.filter(c => c.uid !== cat.uid))}
                    disabled={categories.length === 1}
                    style={{
                      flexShrink: 0, background: 'none', border: 'none', padding: 4,
                      cursor: categories.length === 1 ? 'not-allowed' : 'pointer',
                      opacity: categories.length === 1 ? 0.3 : 1,
                      color: V('--th-text-sub'),
                    }}
                    aria-label={`remove category ${idx + 1}`}
                  >
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCategories(prev => [...prev, newCategory()])}
              style={{
                width: '100%', padding: '10px', borderRadius: 10, marginBottom: 8,
                backgroundColor: 'transparent', border: `1px dashed var(--th-border)`,
                color: V('--th-text-sub'), fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              {t('lobby', 'customAddCategory')}
            </button>

            <p style={{ fontSize: 11, color: V('--th-text-sub'), lineHeight: 1.4, margin: '0 0 24px' }}>
              {t('lobby', 'customNegativeHint')}
            </p>
          </>
        )}

        {/* Create */}
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          style={{
            width: '100%', padding: 14, borderRadius: 12, marginTop: scoreType === 'flat' ? 0 : 4,
            backgroundColor: 'var(--th-primary)', color: '#FFFFFF',
            fontWeight: 700, fontSize: 15, border: 'none',
            cursor: canCreate ? 'pointer' : 'not-allowed',
            opacity: canCreate ? 1 : 0.4,
          }}
        >
          {isSubmitting ? t('lobby', 'creating') : t('lobby', 'customCreate')}
        </button>
      </div>
    </div>
  );
};

export default CustomGameBuilder;
