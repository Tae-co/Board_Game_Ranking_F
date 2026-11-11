import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Share2, CheckCheck } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { RankRowSkeleton } from '../components/Skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { joinRoom, leaveRoom, deleteRoom, kickRoomMember, updateRoomName, updateMemberRating, updateCurrentSeason } from '../api/services/rooms';
import { deleteMatch } from '../api/services/matches';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { isChipGame } from '../utils/chipUtils';
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
import { useRoomLobbyData } from '../hooks/useRoomLobbyData';
import { useInviteShare } from '../hooks/useInviteShare';

const buildSavedScores = (participants) => {
  const first = participants.find(p => p.scoresJson);
  if (!first) return null;
  try {
    const sample = JSON.parse(first.scoresJson);
    if (Array.isArray(sample.rounds) || sample.hpMap !== undefined) {
      return { "_data": { "all": first.scoresJson } };
    }
  } catch { return null; }
  const savedScores = {};
  participants.forEach((p) => {
    if (!p.scoresJson) return;
    try {
      const parsed = JSON.parse(p.scoresJson);
      Object.entries(parsed).forEach(([catKey, val]) => {
        if (!savedScores[catKey]) savedScores[catKey] = {};
        savedScores[catKey][p.memberId] = val;
      });
    } catch { /* ignore */ }
  });
  return Object.keys(savedScores).length > 0 ? savedScores : null;
};

const Invite = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const userId = Number(getAuthUserId());
  const matchResult = location.state?.matchResult || null;
  const communityRegion = getSelectedCommunity()?.region;
  const communityTimezone = REGION_TIMEZONE[communityRegion] || undefined;

  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [nudge, setNudge] = useState(null); // null | 'select' | 'deselect'
  const rankingListRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab ?? 'group');
  const [ratingEditModal, setRatingEditModal] = useState(null);
  const [showRatingInfo, setShowRatingInfo] = useState(false);
  const [ratingEditValue, setRatingEditValue] = useState('');
  const [isRatingEditSaving, setIsRatingEditSaving] = useState(false);
  const [page, setPage] = useState(location.state?.matchPage ?? 0);
  const PAGE_SIZE = 7;
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
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  // 칩 게임은 점수 대신 누적 손익으로 줄 세우고, LP 수정이 없다
  const isChip = isChipGame(gameInfo);

  const myRank = useMemo(() => rankings.find(r => r.memberId === userId), [rankings, userId]);
  const myRankPosition = useMemo(() => {
    const idx = rankings.findIndex(r => r.memberId === userId);
    return idx >= 0 ? idx + 1 : null;
  }, [rankings, userId]);
  const myWinRate = useMemo(() => {
    if (!myRank || myRank.winCount + myRank.loseCount === 0) return 0;
    return Math.round(myRank.winCount / (myRank.winCount + myRank.loseCount) * 100);
  }, [myRank]);

  const myStreak = useMemo(() => {
    const myMatches = allMatches
      .filter(m => m.participants?.some(p => p.memberId === userId))
      .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
    if (myMatches.length === 0) return null;
    const first = myMatches[0].participants.find(p => p.memberId === userId);
    const isWin = first?.placement === 1;
    let count = 1;
    for (let i = 1; i < myMatches.length; i++) {
      const p = myMatches[i].participants.find(p => p.memberId === userId);
      if ((p?.placement === 1) === isWin) count++;
      else break;
    }
    return { count, isWin };
  }, [allMatches, userId]);

  const mergedPlayers = useMemo(() => {
    const memberMap = new Map(members.map(m => [m.memberId, m]));
    const rankedIds = new Set(rankings.map(r => r.memberId));
    // rankings 순서(rating 내림차순)를 유지
    const ranked = rankings
      .map((r, i) => ({ ...memberMap.get(r.memberId), ...r, rankPosition: i + 1 }))
      .filter(r => r.memberId != null);
    const unranked = members
      .filter(m => !rankedIds.has(m.memberId))
      .map(m => ({ ...m, hasRank: false }));
    return [...ranked, ...unranked];
  }, [members, rankings]);

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
  }, [searchQuery, mergedPlayers, PAGE_SIZE]);

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

  const [showSeasonEdit, setShowSeasonEdit] = useState(false);
  const handleSaveSeason = async (payload) => {
    const updated = await updateCurrentSeason(roomId, payload);
    queryClient.setQueryData(['currentSeason', roomId], updated);
  };

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

  const handleJoinRoom = async () => {
    setIsJoiningRoom(true);
    try {
      await joinRoom(roomInfo.inviteCode);
      queryClient.invalidateQueries({ queryKey: ['roomMembers', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['communityRooms'] });
    } catch { alert(t('invite', 'joinFailed')); }
    setIsJoiningRoom(false);
  };

  const handleLeaveRoom = () => setShowLeaveConfirm(true);

  // 팝업의 나가기. 실패하면 팝업이 서버 문구를 보여 주도록 그대로 던진다.
  const confirmLeaveRoom = async () => {
    await leaveRoom(roomId, userId);
    const removeRoom = (old) => Array.isArray(old) ? old.filter(r => String(r.roomId) !== String(roomId)) : old;
    queryClient.setQueriesData({ queryKey: ['rooms'] }, removeRoom);
    // 커뮤니티 방은 나가도 목록에 남아야 다시 참가할 수 있다.
    queryClient.invalidateQueries({ queryKey: ['communityRooms'] });
    // 다시 들어왔을 때 캐시된 목록에 내가 멤버로 남아 있지 않도록 비운다.
    queryClient.removeQueries({ queryKey: ['roomMembers', roomId] });
    queryClient.removeQueries({ queryKey: ['rankings', roomId] });
    navigate('/lobby');
  };

  // 호스트가 나가면 백엔드가 방장을 넘기거나(멤버가 남을 때) 방을 지운다(혼자일 때).
  const leaveAlone = isHost && members.length <= 1;
  const leaveItems = leaveAlone
    ? [t('invite', 'leaveItemAlone')]
    : [t('invite', 'leaveItemScores'), ...(isHost ? [t('invite', 'leaveItemHost')] : [])];

  const handleDeleteRoom = async () => {
    if (!window.confirm(t('invite', 'deleteConfirm'))) return;
    try {
      await deleteRoom(roomId);
      const removeRoom = (old) => Array.isArray(old) ? old.filter(r => String(r.roomId) !== String(roomId)) : old;
      queryClient.setQueriesData({ queryKey: ['rooms'] }, removeRoom);
      queryClient.setQueriesData({ queryKey: ['communityRooms'] }, removeRoom);
      navigate('/lobby');
    } catch { alert(t('invite', 'deleteFailed')); }
  };

  const handleKickMember = async (member) => {
    if (!window.confirm(`${member.nickname}${t('invite', 'kickConfirm')}`)) return;
    try {
      await kickRoomMember(roomId, member.memberId);
      queryClient.setQueryData(['roomMembers', roomId], (old) =>
        Array.isArray(old) ? old.filter(m => m.memberId !== member.memberId) : old
      );
    } catch { alert(t('invite', 'kickFailed')); }
  };

  const handleSaveSettings = async () => {
    const trimmed = editRoomName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await updateRoomName(roomId, trimmed);
      const updateName = (old) =>
        Array.isArray(old)
          ? old.map(r => String(r.roomId) === String(roomId) ? { ...r, roomName: trimmed } : r)
          : old;
      queryClient.setQueryData(['room', roomId], (old) => old ? { ...old, roomName: trimmed } : old);
      queryClient.setQueriesData({ queryKey: ['rooms'] }, updateName);
      queryClient.setQueriesData({ queryKey: ['communityRooms'] }, updateName);
      setShowSettings(false);
    } catch { alert(t('invite', 'renameFailed')); }
    setSaving(false);
  };

  const openSettings = () => { setEditRoomName(roomName); setShowSettings(true); };

  const { sharedCopiedKind, shareMyRank, shareMatchResult } = useInviteShare({
    roomId, gameInfo, roomInfo, isChip, myRank, myRankPosition, myWinRate, matchResult, t,
  });

  const handleUpdateRating = async () => {
    if (!ratingEditModal) return;
    const val = Number(ratingEditValue);
    if (isNaN(val) || val < 0) return;
    setIsRatingEditSaving(true);
    try {
      await updateMemberRating(roomId, ratingEditModal.memberId, { rating: val });
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
      setRatingEditModal(null);
    } catch { alert(t('ranking', 'editRatingFailed')); }
    finally { setIsRatingEditSaving(false); }
  };

  const openScoreSheet = useCallback((match, readOnly = false) => {
    const savedScores = buildSavedScores(match.participants);
    navigate(`/score-sheet/${match.boardGameId}`, {
      state: {
        roomId: Number(roomId), gameName: match.gameName,
        players: match.participants.map(p => ({ memberId: p.memberId, nickname: p.nickname })),
        savedScores, backTo: `/invite/${roomId}`,
        backState: { activeTab: 'matches', matchPage: page },
        ...(readOnly ? { readOnly: true } : { editMatchId: match.matchId }),
      },
    });
  }, [navigate, roomId, page]);

  const handleViewMatch = useCallback((match) => openScoreSheet(match, true), [openScoreSheet]);
  const handleEditMatch = useCallback((match) => openScoreSheet(match, false), [openScoreSheet]);

  const handleDeleteMatch = useCallback(async (matchId) => {
    if (!window.confirm(t('ranking', 'matchDeleteConfirm'))) return;
    try {
      await deleteMatch(matchId);
      queryClient.setQueryData(['matches', roomId], (old) =>
        Array.isArray(old) ? old.filter(m => m.matchId !== matchId) : old
      );
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
      queryClient.invalidateQueries({ queryKey: ['communityStatus'] });
    } catch { alert(t('ranking', 'matchDeleteFailed')); }
  }, [queryClient, roomId, t]);

  const handleOpenRatingEdit = useCallback((rank) => {
    setRatingEditModal(rank);
    setRatingEditValue(String(Math.round(rank.rating)));
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: activeTab === 'group'
      ? 'calc(100px + env(safe-area-inset-bottom))'
      : 'calc(28px + env(safe-area-inset-bottom))' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: V('--th-nav-bg'),
        borderBottom: `1px solid var(--th-border)`,
      }}>
        <div style={{
          maxWidth: 390, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
        }}>
          <button
            onClick={() => navigate('/lobby')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
          >
            <ArrowLeft style={{ width: 24, height: 24 }} />
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)', margin: 0 }}>
            {t('invite', 'lobbyTitle')}
          </h1>
          <NavAvatar />
        </div>
      </div>

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text') }}>
              {t('invite', 'members')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {myRank && (
                <button
                  onClick={shareMyRank}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: V('--th-text-sub'), display: 'flex', alignItems: 'center' }}
                >
                  {sharedCopiedKind === 'my_rank'
                    ? <CheckCheck style={{ width: 18, height: 18 }} color="#22c55e" />
                    : <Share2 style={{ width: 18, height: 18 }} />}
                </button>
              )}
              <button
                onClick={openSettings}
                style={{
                  background: 'none', border: 'none', padding: '4px', display: 'flex', alignItems: 'center',
                  cursor: 'pointer',
                  color: V('--th-text-sub'),
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </button>
            </div>
          </div>

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
                  onEditRating={isChip ? undefined : handleOpenRatingEdit}
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
          onJoin={handleJoinRoom}
          isJoining={isJoiningRoom}
          joinDisabled={isJoiningRoom || !roomInfo.inviteCode}
          onStart={handleStartGame}
          canStart={canStart}
          overMax={overMax}
          label={startLabel}
          t={t}
        />
      )}

      {showSettings && (
        <RoomSettingsOverlay
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          onDeleteRoom={handleDeleteRoom}
          onLeaveRoom={isMember ? handleLeaveRoom : undefined}
          isHost={isHost}
          editRoomName={editRoomName}
          setEditRoomName={setEditRoomName}
          members={members}
          userId={userId}
          saving={saving}
          onKickMember={handleKickMember}
          navigate={navigate}
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
          onConfirm={confirmLeaveRoom}
        />
      )}

      {showSeasonEdit && currentSeason && (
        <SeasonEditModal
          season={currentSeason}
          region={communityRegion}
          onClose={() => setShowSeasonEdit(false)}
          onSave={handleSaveSeason}
          t={t}
        />
      )}

      {showRatingInfo && (
        <RatingInfoModal chip={isChip} onClose={() => setShowRatingInfo(false)} t={t} />
      )}
      {ratingEditModal && (
        <RatingEditModal
          ratingEditModal={ratingEditModal}
          onClose={() => setRatingEditModal(null)}
          ratingEditValue={ratingEditValue}
          setRatingEditValue={setRatingEditValue}
          onSave={handleUpdateRating}
          isSaving={isRatingEditSaving}
          t={t}
        />
      )}
    </div>
  );
};

export default Invite;
