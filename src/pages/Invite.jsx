import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { RankRowSkeleton } from '../components/Skeleton';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { isChipGame } from '../utils/chipUtils';
import { mergeRankedMembers, getMyStreak, getWinRate } from '../utils/roomStats';
import { getSelectedCommunity } from '../utils/storage';
import { getAuthUserId } from '../auth/storage';
import { REGION_TIMEZONE } from '../constants/regions';
import RoomSettingsOverlay from '../components/invite/RoomSettingsOverlay';
import LeaveConfirmModal from '../components/shared/LeaveConfirmModal';
import GameCard from '../components/invite/GameCard';
import StatsCard from '../components/ranking/StatsCard';
import { EVENTS, logEvent } from '../api/services/events';
import PodiumRanking from '../components/ranking/PodiumRanking';
import RankingTable from '../components/ranking/RankingTable';
import RatingEditModal from '../components/ranking/RatingEditModal';
import RatingInfoModal from '../components/ranking/RatingInfoModal';
import SeasonTab from '../components/season/SeasonTab';
import SeasonHeader from '../components/season/SeasonHeader';
import SeasonEditModal from '../components/invite/SeasonEditModal';
import RoomTabs from '../components/invite/RoomTabs';
import MatchResultBanner from '../components/invite/MatchResultBanner';
import MatchHistoryTab from '../components/invite/MatchHistoryTab';
import RankingSearchBar from '../components/invite/RankingSearchBar';
import StartGameBar from '../components/invite/StartGameBar';
import InviteHeader from '../components/invite/InviteHeader';
import MembersSectionHeader from '../components/invite/MembersSectionHeader';
import { useRoomLobbyData } from '../hooks/useRoomLobbyData';
import { useInviteShare } from '../hooks/useInviteShare';
import { useRoomActions } from '../hooks/useRoomActions';
import { useMatchActions } from '../hooks/useMatchActions';

const PAGE_SIZE = 7;

const Invite = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const userId = Number(getAuthUserId());
  const matchResult = location.state?.matchResult || null;
  const communityRegion = getSelectedCommunity()?.region;
  const communityTimezone = REGION_TIMEZONE[communityRegion] || undefined;

  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [nudge, setNudge] = useState(null); // null | 'select' | 'deselect'
  const rankingListRef = useRef(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showSeasonEdit, setShowSeasonEdit] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab ?? 'group');
  const [showRatingInfo, setShowRatingInfo] = useState(false);
  const [page, setPage] = useState(location.state?.matchPage ?? 0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    roomInfo, members, membersLoading, gameInfo,
    rankings, isRankingLoading,
    currentSeason, isSeasonLoading, closedSeasons, latestSeasonId, justReset, championIds,
    allMatches, isMatchesLoading,
  } = useRoomLobbyData(roomId, userId);
  const roomName = roomInfo.roomName || '';
  const isHost = members.find(m => m.memberId === userId)?.isHost ?? false;
  const isMember = members.some(m => m.memberId === userId);
  // 칩 게임은 점수 대신 누적 손익으로 줄 세우고, LP 수정이 없다
  const isChip = isChipGame(gameInfo);

  const room = useRoomActions({ roomId, userId, roomName, inviteCode: roomInfo.inviteCode, t });
  const { handleViewMatch, handleEditMatch, handleDeleteMatch } = useMatchActions({ roomId, page, t });

  const myRank = useMemo(() => rankings.find(r => r.memberId === userId), [rankings, userId]);
  const myRankPosition = useMemo(() => {
    const idx = rankings.findIndex(r => r.memberId === userId);
    return idx >= 0 ? idx + 1 : null;
  }, [rankings, userId]);
  const myWinRate = useMemo(() => getWinRate(myRank), [myRank]);
  const myStreak = useMemo(() => getMyStreak(allMatches, userId), [allMatches, userId]);
  const mergedPlayers = useMemo(() => mergeRankedMembers(members, rankings), [members, rankings]);

  const pagedRankings = useMemo(
    () => mergedPlayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [mergedPlayers, page]
  );
  const totalPages = useMemo(() => Math.ceil(mergedPlayers.length / PAGE_SIZE), [mergedPlayers.length]);

  const searchResult = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const idx = mergedPlayers.findIndex(r => r.nickname.toLowerCase().includes(q));
    if (idx === -1) return null;
    return { memberId: mergedPlayers[idx].memberId, pageNum: Math.floor(idx / PAGE_SIZE) };
  }, [searchQuery, mergedPlayers]);

  useEffect(() => {
    if (searchResult) setPage(searchResult.pageNum);
  }, [searchResult]);

  const minPlayers = gameInfo?.minPlayers ?? 2;
  const maxPlayers = gameInfo?.maxPlayers ?? 99;
  const canStart = selectedPlayers.size >= minPlayers && selectedPlayers.size <= maxPlayers;
  // 매치기록은 시즌 시작일로 거르므로 시즌이 오기 전에 그리면 지난 시즌 경기가 잠깐 보인다.
  const isLoading = activeTab === 'matches' ? (isMatchesLoading || isSeasonLoading) : (membersLoading || isRankingLoading);

  const overMax = selectedPlayers.size > maxPlayers;

  // The button must never claim a state it isn't in: a label promising "start"
  // while the button refuses to act is what left users stuck (see startNeedMore).
  const startLabel = canStart
    ? t('gameSelect', 'startReady').replace('{n}', selectedPlayers.size)
    : overMax
      ? t('gameSelect', 'startOverMax')
          .replace('{n}', selectedPlayers.size - maxPlayers)
          .replace('{max}', maxPlayers)
      : selectedPlayers.size === 0
        ? t('gameSelect', 'startPrompt')
        : t('gameSelect', 'startNeedMore')
            .replace('{n}', minPlayers - selectedPlayers.size)
            .replace('{min}', minPlayers);

  const togglePlayer = (memberId) => {
    setSelectedPlayers(prev => {
      const next = new Set(prev);
      next.has(memberId) ? next.delete(memberId) : next.add(memberId);
      return next;
    });
  };

  const handleTabChange = (tab) => { setActiveTab(tab); setPage(0); };

  // "기록은 영원히 남는다"를 실제로 쓰는지 보려면 지난 시즌을 조회한 순간을 세야 한다 (§10).
  // season_key는 월간 시절 이벤트(2026-09)와 같은 축으로 묶어 보려고 같이 남긴다 (plan-season-reset §10).
  const handlePastSeasonViewed = useCallback((seasonId, seasonKey) => {
    logEvent(EVENTS.SEASON_PAST_VIEWED, {
      roomId: Number(roomId),
      props: { room_season_id: seasonId, season_key: seasonKey },
    });
  }, [roomId]);

  // 리셋 직후 안내에서 지난 시즌으로 넘어가는 것도 결과 열람이다.
  const handleViewPastSeason = () => {
    logEvent(EVENTS.SEASON_RESULT_OPENED, {
      roomId: Number(roomId),
      props: { room_season_id: latestSeasonId, season_key: closedSeasons[0]?.seasonKey },
    });
    handleTabChange('season');
  };

  const handleStartGame = () => {
    if (!canStart) {
      if (activeTab !== 'group') handleTabChange('group');
      // Point at the rows the user must act on: too few → the empty ones,
      // too many → the ones already picked.
      setNudge(overMax ? 'deselect' : 'select');
      setTimeout(() => setNudge(null), 1400);
      requestAnimationFrame(() => {
        rankingListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    navigate(`/score-sheet/${roomInfo.boardGameId}`, {
      state: {
        roomId,
        gameName: gameInfo?.name || '',
        players: mergedPlayers.filter(p => selectedPlayers.has(p.memberId)),
      },
    });
  };

  // 호스트가 나가면 백엔드가 방장을 넘기거나(멤버가 남을 때) 방을 지운다(혼자일 때).
  const leaveAlone = isHost && members.length <= 1;
  const leaveItems = leaveAlone
    ? [t('invite', 'leaveItemAlone')]
    : [t('invite', 'leaveItemScores'), ...(isHost ? [t('invite', 'leaveItemHost')] : [])];

  const { sharedCopiedKind, shareMyRank, shareMatchResult } = useInviteShare({
    roomId, gameInfo, roomInfo, isChip, myRank, myRankPosition, myWinRate, matchResult, t,
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: activeTab === 'group'
      ? 'calc(100px + env(safe-area-inset-bottom))'
      : 'calc(28px + env(safe-area-inset-bottom))' }}>

      <InviteHeader onBack={() => navigate('/lobby')} title={t('invite', 'lobbyTitle')} />

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Board Game Card */}
        {roomInfo.boardGameId && <GameCard gameInfo={gameInfo} />}

        {/* Stats Card */}
        <StatsCard
          myRank={myRank}
          myWinRate={myWinRate}
          myStreak={myStreak}
          streakLoading={isMatchesLoading}
          myRankPosition={myRankPosition}
          rankLoading={isRankingLoading}
          t={t}
        />

        {/* Players section */}
        <div>
          <MembersSectionHeader
            title={t('invite', 'members')}
            showShare={!!myRank}
            shareCopied={sharedCopiedKind === 'my_rank'}
            onShare={shareMyRank}
            onOpenSettings={room.openSettings}
          />

          <RoomTabs activeTab={activeTab} onChange={handleTabChange} t={t} />

          {matchResult && activeTab === 'group' && (
            <MatchResultBanner
              matchResult={matchResult}
              chip={isChip}
              copied={sharedCopiedKind === 'match_result'}
              onShare={shareMatchResult}
              t={t}
            />
          )}

          {/* Content */}
          {activeTab === 'season' ? (
            <SeasonTab
              roomId={roomId}
              userId={userId}
              season={currentSeason}
              region={communityRegion}
              myRankPosition={myRankPosition}
              myScore={myRank?.rating}
              chip={isChip}
              onPastSeasonViewed={handlePastSeasonViewed}
              t={t}
              lang={lang}
            />
          ) : isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
              {[0, 1, 2, 3].map(i => <RankRowSkeleton key={i} />)}
            </div>
          ) : activeTab === 'matches' ? (
            <MatchHistoryTab
              matches={allMatches}
              page={page}
              setPage={setPage}
              myUserId={userId}
              communityTimezone={communityTimezone}
              isHost={isHost}
              onView={handleViewMatch}
              onEdit={handleEditMatch}
              onDelete={handleDeleteMatch}
              chip={isChip}
              t={t}
            />
          ) : mergedPlayers.length === 0 ? (
            <div style={{ borderRadius: 16, padding: 40, border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
              <p style={{ fontSize: 17, color: V('--th-text') }}>{t('ranking', 'noRecord')}</p>
              <p style={{ fontSize: 13, marginTop: 8, color: V('--th-text-sub') }}>{t('ranking', 'noRecordDesc')}</p>
            </div>
          ) : (
            <>
              <SeasonHeader
                season={currentSeason}
                region={communityRegion}
                compact
                justReset={justReset}
                onViewPastSeason={handleViewPastSeason}
                t={t}
                lang={lang}
              />
              {rankings.length >= 1 && (
                <PodiumRanking rankings={rankings} myUserId={userId} chip={isChip} />
              )}
              <RankingSearchBar
                showSearch={showSearch}
                setShowSearch={setShowSearch}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onShowRatingInfo={() => setShowRatingInfo(true)}
                t={t}
              />
              <div ref={rankingListRef}>
                <RankingTable
                  pagedRankings={pagedRankings}
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  myUserId={userId}
                  isHost={isHost}
                  onEditRating={isChip ? undefined : room.handleOpenRatingEdit}
                  PAGE_SIZE={PAGE_SIZE}
                  selectedPlayers={selectedPlayers}
                  onToggle={isMember ? togglePlayer : undefined}
                  highlightMemberId={searchResult?.memberId}
                  nudge={nudge}
                  championIds={championIds}
                  scoreLabel={isChip ? t('ranking', 'chipHolding') : t('season', 'seasonScore')}
                  chip={isChip}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky Start Game Button — 플레이어를 고르는 그룹 랭킹 탭에서만 쓴다.
          아직 참가하지 않은 사람에겐 같은 자리에 참가하기 버튼을 보여준다. 멤버 로딩 중엔 어느 쪽인지 모르니 비워둔다. */}
      {activeTab === 'group' && !membersLoading && (
        <StartGameBar
          isMember={isMember}
          onJoin={room.handleJoinRoom}
          isJoining={room.isJoiningRoom}
          joinDisabled={room.isJoiningRoom || !roomInfo.inviteCode}
          onStart={handleStartGame}
          canStart={canStart}
          overMax={overMax}
          label={startLabel}
          t={t}
        />
      )}

      {room.showSettings && (
        <RoomSettingsOverlay
          onClose={() => room.setShowSettings(false)}
          onSave={room.handleSaveSettings}
          onDeleteRoom={room.handleDeleteRoom}
          onLeaveRoom={isMember ? () => setShowLeaveConfirm(true) : undefined}
          isHost={isHost}
          editRoomName={room.editRoomName}
          setEditRoomName={room.setEditRoomName}
          members={members}
          userId={userId}
          saving={room.saving}
          onKickMember={room.handleKickMember}
          t={t}
          season={currentSeason}
          onEditSeason={() => setShowSeasonEdit(true)}
        />
      )}

      {showLeaveConfirm && (
        <LeaveConfirmModal
          title={t('invite', 'leaveTitle').replace('{name}', roomName)}
          desc={t('invite', leaveAlone ? 'leaveDescAlone' : 'leaveDesc')}
          items={leaveItems}
          note={leaveAlone ? null : t('invite', 'leaveAnonymous')}
          cancelText={t('invite', 'leaveCancel')}
          confirmText={t('invite', 'leaveRoom')}
          failText={t('invite', 'leaveFailed')}
          onClose={() => setShowLeaveConfirm(false)}
          onConfirm={room.confirmLeaveRoom}
        />
      )}

      {showSeasonEdit && currentSeason && (
        <SeasonEditModal
          season={currentSeason}
          region={communityRegion}
          onClose={() => setShowSeasonEdit(false)}
          onSave={room.handleSaveSeason}
          t={t}
        />
      )}

      {showRatingInfo && (
        <RatingInfoModal chip={isChip} onClose={() => setShowRatingInfo(false)} t={t} />
      )}
      {room.ratingEditModal && (
        <RatingEditModal
          ratingEditModal={room.ratingEditModal}
          onClose={() => room.setRatingEditModal(null)}
          ratingEditValue={room.ratingEditValue}
          setRatingEditValue={room.setRatingEditValue}
          onSave={room.handleUpdateRating}
          isSaving={room.isRatingEditSaving}
          t={t}
        />
      )}
    </div>
  );
};

export default Invite;
