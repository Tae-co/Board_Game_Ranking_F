import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoom } from '../api/services/rooms';
import { getGames, deleteGame } from '../api/services/games';
import CustomGameBuilder from '../components/lobby/CustomGameBuilder';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import GamePicker from '../components/lobby/GamePicker';
import SeasonFields from '../components/shared/SeasonFields';
import OnboardingSteps from '../components/shared/OnboardingSteps';
import { defaultEndDate, isSeasonInputValid } from '../utils/seasonUtils';
import { getNickname } from '../auth/storage';
import { getSelectedCommunity } from '../utils/storage';
import { useApiErrorMessage } from '../hooks/useApiErrorMessage';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const errorText = useApiErrorMessage();
  const queryClient = useQueryClient();
  const selectedCommunity = getSelectedCommunity();
  const communityId = selectedCommunity?.communityId ?? null;
  const isCommunityAdmin = selectedCommunity?.isAdmin ?? false;
  const region = selectedCommunity?.region;
  // 친구 부르기 대기실에서 넘어왔다면 온보딩의 마지막 단계로 보여준다
  const fromOnboarding = !!useLocation().state?.fromOnboarding;

  const [roomName, setRoomName] = useState('');
  const [seasonName, setSeasonName] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState(() => defaultEndDate(region));
  const [selectedGameId, setSelectedGameId] = useState(null);
  // 점수판 만들기를 열 때의 검색어. 만들고 나면 게임 고르기를 새로 그려(key) 검색·페이지를 처음으로 돌린다
  const [builderName, setBuilderName] = useState('');
  const [pickerKey, setPickerKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState(null);

  // 커뮤니티별로 목록이 다르므로 캐시 키에 communityId를 포함한다
  const { data: games = [] } = useQuery({
    queryKey: ['games', communityId],
    queryFn: () => getGames(communityId),
    staleTime: 1000 * 60 * 30,
  });

  const handleGameCreated = (game) => {
    queryClient.invalidateQueries({ queryKey: ['games', communityId] });
    setIsBuilderOpen(false);
    setPickerKey(k => k + 1);
    setSelectedGameId(game.id);
  };

  // 커스텀 점수판은 커뮤니티 어드민만 만들 수 있다 (백엔드도 동일하게 막는다)
  const canCreateGame = isCommunityAdmin && !!communityId;

  const handleDeleteGame = async (game) => {
    if (!window.confirm(t('lobby', 'customDeleteConfirm').replace('{n}', game.name))) return;
    setDeletingGameId(game.id);
    try {
      await deleteGame(game.id);
      if (selectedGameId === game.id) setSelectedGameId(null);
      await queryClient.invalidateQueries({ queryKey: ['games', communityId] });
    } catch (err) {
      // 방이나 플레이 기록이 있으면 백엔드가 409로 막는다 — 그 이유를 그대로 보여준다
      alert(errorText(err, t('lobby', 'customDeleteFailed')));
    } finally {
      setDeletingGameId(null);
    }
  };

  const canCreate = !!roomName.trim() && !!selectedGameId && isSeasonInputValid(seasonName, seasonEndDate, region);

  const handleCreate = async () => {
    if (!canCreate) return;
    setIsSubmitting(true);
    try {
      const res = await createRoom({
        roomName: roomName.trim(),
        boardGameId: selectedGameId,
        seasonName: seasonName.trim(),
        seasonEndDate,
        ...(communityId ? { communityId: Number(communityId) } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['communityRooms'] });
      navigate(`/invite/${res.roomId}`);
    } catch (err) {
      // 어드민이 아니면 403 등 — 서버가 보낸 이유를 그대로 보여준다
      alert(errorText(err, t('lobby', 'createFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <button
              onClick={() => navigate('/lobby')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
            >
              <ArrowLeft style={{ width: 24, height: 24 }} />
            </button>
            <h1 style={{ fontSize: '17px', fontWeight: '700', color: V('--th-text'), flex: 1 }}>
              {t('lobby', 'createGroup')}
            </h1>
          </div>
          <div
            onClick={() => navigate('/profile')}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: 'var(--th-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0,
            }}
          >
            {getNickname()[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '24px 20px' }}>

        {fromOnboarding && <OnboardingSteps current={2} t={t} />}

        {/* Group Name */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: '10px' }}>
            {t('lobby', 'groupNameLabel')}
          </p>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={t('lobby', 'groupNamePlaceholder')}
            autoFocus
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px',
              backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
              color: V('--th-text'), fontSize: '15px', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
          />
        </div>

        {/* Season — 방마다 시즌을 따로 돌린다 (plan-season-reset §22) */}
        <div style={{ marginBottom: '28px' }}>
          <SeasonFields
            name={seasonName}
            setName={setSeasonName}
            endDate={seasonEndDate}
            setEndDate={setSeasonEndDate}
            region={region}
            t={t}
          />
        </div>

        <GamePicker
          key={pickerKey}
          games={games}
          selectedGameId={selectedGameId}
          onSelect={setSelectedGameId}
          canManage={canCreateGame}
          deletingGameId={deletingGameId}
          onDelete={handleDeleteGame}
          onCreateCustom={(name) => { setBuilderName(name); setIsBuilderOpen(true); }}
          t={t}
        />
      </div>

      {/* Sticky Create Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '12px 20px calc(24px + env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleCreate}
            disabled={isSubmitting || !canCreate}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              backgroundColor: 'var(--th-primary)', color: '#FFFFFF',
              fontWeight: '700', fontSize: '15px', border: 'none', cursor: 'pointer',
              opacity: (isSubmitting || !canCreate) ? 0.4 : 1,
            }}
          >
            {isSubmitting ? t('lobby', 'creating') : t('lobby', 'createRoom')}
          </button>
        </div>
      </div>

      {isBuilderOpen && (
        <CustomGameBuilder
          initialName={builderName}
          communityId={communityId}
          onCancel={() => setIsBuilderOpen(false)}
          onCreated={handleGameCreated}
        />
      )}
    </div>
  );
};

export default CreateGroup;
