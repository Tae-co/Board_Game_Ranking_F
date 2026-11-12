import { useState } from 'react';
import { X } from 'lucide-react';
import { createGame, uploadGameImage } from '../../api/services/games';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';
import { DEFAULT_CHIP_DENOMINATIONS } from '../../utils/chipUtils';
import { buildCustomSchemaJson, validateCustomGame, newCategory } from '../../scoreSheets/customSchema';
import GameImageField from './GameImageField';
import PlayerCountField from './PlayerCountField';
import ScoreTypePicker from './ScoreTypePicker';
import CategoryListField from './CategoryListField';
import { useApiErrorMessage } from '../../hooks/useApiErrorMessage';

const CustomGameBuilder = ({ initialName, communityId, onCancel, onCreated }) => {
  const { t } = useLanguage();
  const errorText = useApiErrorMessage();

  const [name, setName] = useState(initialName ?? '');
  const [scoreType, setScoreType] = useState(null); // 'simple' | 'flat' | 'outcome' | 'chip'
  const [categories, setCategories] = useState([newCategory(), newCategory()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(8);
  // 칩 게임만. 'buyin'(바이인·우승자) | 'count'(칩 종류별로 세기). 세기 방식은 칩 종류도 정한다
  const [chipMode, setChipMode] = useState('buyin');
  const [denominations, setDenominations] = useState(DEFAULT_CHIP_DENOMINATIONS);

  const handlePickImage = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
  };

  const handleCreate = async () => {
    const form = { name, minPlayers, maxPlayers, scoreType, chipMode, denominations, categories };
    const invalid = validateCustomGame(form);
    if (invalid) { alert(t('lobby', invalid)); return; }

    setIsSubmitting(true);
    try {
      // 사진은 선택사항. 업로드가 실패하면 게임도 만들지 않는다.
      const imageUrl = imageFile ? await uploadGameImage(imageFile, Number(communityId)) : '';

      // memberId는 보내지 않는다. 백엔드가 JWT 토큰에서 꺼낸다.
      const game = await createGame({
        name: name.trim(),
        communityId: Number(communityId),
        schemaJson: buildCustomSchemaJson(form),
        imageUrl,
        minPlayers,
        maxPlayers,
      });
      onCreated(game);
    } catch (err) {
      alert(errorText(err, t('lobby', 'customCreateFailed')));
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
          {t('lobby', 'gameNameLabel')}
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

        <GameImageField preview={imagePreview} onPick={handlePickImage} onClear={clearImage} t={t} />

        <PlayerCountField
          minPlayers={minPlayers} setMinPlayers={setMinPlayers}
          maxPlayers={maxPlayers} setMaxPlayers={setMaxPlayers}
          t={t}
        />

        <ScoreTypePicker
          scoreType={scoreType} setScoreType={setScoreType}
          chipMode={chipMode} setChipMode={setChipMode}
          denominations={denominations} setDenominations={setDenominations}
          t={t}
        />

        {/* Categories (flat only) */}
        {scoreType === 'flat' && (
          <CategoryListField categories={categories} setCategories={setCategories} t={t} />
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
