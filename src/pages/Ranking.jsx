import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { RankRowSkeleton } from '../components/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { REGION_TIMEZONE } from '../constants/regions';
import StatsCard from '../components/ranking/StatsCard';
import MatchCard from '../components/ranking/MatchCard';
import PodiumRanking from '../components/ranking/PodiumRanking';
import RankingTable from '../components/ranking/RankingTable';
import RatingEditModal from '../components/ranking/RatingEditModal';


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

const Ranking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/invite/${roomId}`, { replace: true });
  }, [roomId, navigate]);
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const matchResult = location.state?.matchResult || null;

  const [activeTab, setActiveTab] = useState(location.state?.activeTab ?? 'group');
  const [ratingEditModal, setRatingEditModal] = useState(null);
  const [ratingEditValue, setRatingEditValue] = useState('');
  const [isRatingEditSaving, setIsRatingEditSaving] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const myUserId = Number(localStorage.getItem('userId'));
  const communityRegion = (() => {
    try { return JSON.parse(localStorage.getItem('selectedCommunity'))?.region; } catch { return null; }
  })();
  const communityTimezone = REGION_TIMEZONE[communityRegion] || undefined;

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}`); return res.data; },
    staleTime: 1000 * 60 * 10,
  });

  const { data: roomMembers = [] } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/members`); return res.data || []; },
    staleTime: 1000 * 60 * 2,
  });

  const isHost = useMemo(
    () => roomMembers.find(m => m.memberId === myUserId)?.isHost ?? false,
    [roomMembers, myUserId]
  );

  const { data: rankings = [], isLoading: isRankingLoading } = useQuery({
    queryKey: ['rankings', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/rankings`); return res.data || []; },
    staleTime: 1000 * 60 * 3,
  });

  const { data: allMatchesRaw = [], isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['matches', roomId],
    queryFn: async () => { const res = await api.get(`/rooms/${roomId}/matches`); return res.data || []; },
    staleTime: 1000 * 60 * 1,
  });
  const allMatches = room?.boardGameId
    ? allMatchesRaw.filter(m => m.boardGameId === room.boardGameId)
    : allMatchesRaw;

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data),
    staleTime: 1000 * 60 * 30,
  });

  const gameInfo = useMemo(
    () => games.find(g => g.id === room?.boardGameId) || null,
    [games, room]
  );

  const myRank = useMemo(() => rankings.find(r => r.memberId === myUserId), [rankings, myUserId]);
  const myRankPosition = useMemo(() => {
    const idx = rankings.findIndex(r => r.memberId === myUserId);
    return idx >= 0 ? idx + 1 : null;
  }, [rankings, myUserId]);
  const myWinRate = useMemo(() => {
    if (!myRank || (myRank.winCount + myRank.loseCount) === 0) return 0;
    return Math.round(myRank.winCount / (myRank.winCount + myRank.loseCount) * 100);
  }, [myRank]);

  const nativeShare = (title, text) => {
    if (navigator.share) {
      navigator.share({ title, text }).catch(() => {});
    }
  };

  const shareMatchResult = () => {
    if (!matchResult) return;
    const gameName = gameInfo?.name || room?.roomName || '보드게임';
    const lines = matchResult
      .sort((a, b) => b.ratingChange - a.ratingChange)
      .map(r => `${r.nickname} ${r.ratingChange >= 0 ? '+' : ''}${Math.round(r.ratingChange)}`)
      .join(' · ');
    nativeShare(
      `🎮 ${gameName} 한판 결과!`,
      `${lines}\n\nYadaRank에서 보드게임 랭킹을 기록 중이에요 👉 yadarank.com`,
    );
  };

  const shareMyRank = () => {
    if (!myRank || !myRankPosition) return;
    const gameName = gameInfo?.name || room?.roomName || '보드게임';
    const nickname = localStorage.getItem('nickname') || myRank.nickname;
    nativeShare(
      `🏆 ${nickname}의 ${gameName} 랭킹`,
      `${myRankPosition}위 · 레이팅 ${Math.round(myRank.rating)} · 승률 ${myWinRate}% (${myRank.winCount}승 ${myRank.loseCount}패)\n\nYadaRank에서 보드게임 랭킹 관리 중 👉 yadarank.com`,
    );
  };

  const handleUpdateRating = async () => {
    if (!ratingEditModal) return;
    const val = Number(ratingEditValue);
    if (isNaN(val) || val < 0) return;
    setIsRatingEditSaving(true);
    try {
      await api.put(`/rooms/${roomId}/members/${ratingEditModal.memberId}/rating`, {
        requesterId: myUserId, rating: val,
      });
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
        savedScores, backTo: `/ranking/${roomId}`,
        backState: { activeTab: 'matches' },
        ...(readOnly ? { readOnly: true } : { editMatchId: match.matchId }),
      },
    });
  }, [navigate, roomId]);

  const handleViewMatch = useCallback((match) => openScoreSheet(match, true), [openScoreSheet]);
  const handleEditMatch = useCallback((match) => openScoreSheet(match, false), [openScoreSheet]);

  const handleDeleteMatch = useCallback(async (matchId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/matches/${matchId}?requesterId=${myUserId}`);
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
    } catch { alert('삭제에 실패했습니다.'); }
  }, [myUserId, queryClient, refetchMatches, roomId]);

  const handleOpenRatingEdit = useCallback((rank) => {
    setRatingEditModal(rank);
    setRatingEditValue(String(Math.round(rank.rating)));
  }, []);

  const pagedRankings = useMemo(
    () => rankings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [rankings, page]
  );
  const totalPages = useMemo(() => Math.ceil(rankings.length / PAGE_SIZE), [rankings.length]);
  const isLoading = activeTab === 'matches' ? isMatchesLoading : isRankingLoading;

  const podium = useMemo(() => {
    const top = rankings.slice(0, 3);
    // order: 2nd, 1st, 3rd
    return [top[1], top[0], top[2]].filter(Boolean);
  }, [rankings]);

  return (
    <div style={{ backgroundColor: V('--th-bg'), minHeight: '100vh', paddingBottom: 100, fontFamily: "'Pretendard', sans-serif" }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate(`/invite/${roomId}`)} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--th-primary)', flexShrink: 0 }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--th-primary)' }}>My Group</span>
          <NavAvatar />
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto' }}>

      {/* Room info row */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: V('--th-text') }}>{room?.roomName || ''}</span>
      </div>

      <StatsCard
        gameInfo={gameInfo}
        myRank={myRank}
        myWinRate={myWinRate}
        myRankPosition={myRankPosition}
        onShare={shareMyRank}
        t={t}
      />

      {/* Tabs */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', borderRadius: 24, padding: 4, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
          {[
            { key: 'group', label: t('ranking', 'groupTab') },
            { key: 'matches', label: t('ranking', 'matchesTab') },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '8px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: activeTab === tab.key ? V('--th-primary') : 'transparent',
                color: activeTab === tab.key ? '#fff' : V('--th-text-sub'),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Result Banner */}
      {matchResult && activeTab === 'group' && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ borderRadius: 12, padding: 14, backgroundColor: V('--th-card'), border: `1px solid var(--th-primary)` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-primary'), margin: 0 }}>🎮 {t('ranking', 'matchResult')}</p>
              <button
                onClick={shareMatchResult}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8,
                  backgroundColor: 'color-mix(in srgb, var(--th-primary) 10%, transparent)',
                  border: '1px solid var(--th-primary)', cursor: 'pointer',
                }}
              >
                <Share2 size={13} color="var(--th-primary)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--th-primary)' }}>결과 공유</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {matchResult.map((r) => (
                <div key={r.memberId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, backgroundColor: V('--th-bg') }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: V('--th-text') }}>{r.nickname}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.ratingChange > 0 ? '#16a34a' : '#dc2626' }}>
                    {r.ratingChange > 0 ? '+' : ''}{Math.round(r.ratingChange)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '12px 16px 0' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
            {[0, 1, 2, 3, 4].map(i => <RankRowSkeleton key={i} />)}
          </div>
        ) : activeTab === 'matches' ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>RECENT SESSIONS</div>
            {allMatches.length === 0 ? (
              <div style={{ borderRadius: 16, padding: 40, border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
                <p style={{ color: V('--th-text') }}>{t('ranking', 'noMatches')}</p>
                <p style={{ fontSize: 13, marginTop: 8, color: V('--th-text-sub') }}>{t('ranking', 'noMatchesDesc')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allMatches.map((match) => (
                  <MatchCard
                    key={match.matchId}
                    match={match}
                    myUserId={myUserId}
                    communityTimezone={communityTimezone}
                    isHost={isHost}
                    onView={handleViewMatch}
                    onEdit={handleEditMatch}
                    onDelete={handleDeleteMatch}
                  />
                ))}
              </div>
            )}
          </>
        ) : rankings.length === 0 ? (
          <div style={{ borderRadius: 16, padding: 40, border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
            <p style={{ fontSize: 17, color: V('--th-text') }}>{t('ranking', 'noRecord')}</p>
            <p style={{ fontSize: 13, marginTop: 8, color: V('--th-text-sub') }}>{t('ranking', 'noRecordDesc')}</p>
          </div>
        ) : (
          <>
            {rankings.length >= 1 && (
              <PodiumRanking rankings={rankings} myUserId={myUserId} />
            )}

            {rankings.length >= 1 && (
              <RankingTable
                pagedRankings={pagedRankings}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                myUserId={myUserId}
                isHost={isHost}
                onEditRating={handleOpenRatingEdit}
                PAGE_SIZE={PAGE_SIZE}
              />
            )}
          </>
        )}
      </div>

      </div>

      {/* Bottom Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'linear-gradient(to top, var(--th-bg) 70%, transparent)' }}>
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 32px' }}>
          <button
            onClick={() => navigate(`/invite/${roomId}`)}
            style={{
              width: '100%', padding: '15px', borderRadius: '50px', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 4px 16px rgba(107, 92, 231, 0.4)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#FFFFFF' }}>
              {t('ranking', 'startGame')}
            </span>
          </button>
        </div>
      </div>

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

export default Ranking;
