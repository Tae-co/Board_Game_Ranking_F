import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import NavAvatar from '../components/NavAvatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createMatch, updateMatch } from '../api/services/matches';
import { EVENTS, logEvent } from '../api/services/events';
import { getGame } from '../api/services/games';
import { useLanguage } from '../i18n/LanguageContext';
import { SCORE_SCHEMAS } from '../scoreSheets/schemas/index';
import { parseSchema } from '../scoreSheets/parseSchema';
import ScoreSheetNotice from '../scoreSheets/components/ScoreSheetNotice';
import InputModeToggle from '../scoreSheets/components/InputModeToggle';
import SubmitBar from '../scoreSheets/components/SubmitBar';
import { getAllCategories } from '../scoreSheets/shared/scoreUtils';
import { ScienceModal } from '../scoreSheets/shared/ScoreCell';
import WinnerBanner from '../scoreSheets/shared/WinnerBanner';
import RankInputTable from '../scoreSheets/components/RankInputTable';
import WinDrawLossTable, { OUTCOME_TIER } from '../scoreSheets/components/WinDrawLossTable';
import ChipTable from '../scoreSheets/components/ChipTable';
import ChipCountTable from '../scoreSheets/components/ChipCountTable';
import { buyInResults, chipModeOf, chipDenominationsOf, chipCountTotal, formatChipDelta } from '../utils/chipUtils';
import { buildParticipants, computeTotals } from '../scoreSheets/submitPayload';

const ScoreSheet = () => {
  const { boardGameId: boardGameIdStr } = useParams();
  const boardGameId = Number(boardGameIdStr);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const { players = [], roomId, gameName = '', editMatchId = null, savedScores = null, readOnly = false, backTo = null, backState = null, previewMode = false, schemaJson = null } = location.state || {};

  // 이탈률의 분모. "기록하려고 열었다"만 세어야 한다 — 수정·읽기전용·미리보기는
  // MATCH_SUBMITTED로 이어지지 않으므로 분모에 들어가면 이탈로 잘못 잡힌다.
  useEffect(() => {
    if (readOnly || previewMode || editMatchId) return;
    logEvent(EVENTS.SCORE_SHEET_OPENED, { boardGameId, roomId });
  }, [boardGameId, roomId, readOnly, previewMode, editMatchId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scienceModal, setScienceModal] = useState(null);
  const [duelWinnerId, setDuelWinnerId] = useState(() => {
    if (!savedScores?.won) return null;
    const entry = Object.entries(savedScores.won).find(([, v]) => v === true);
    return entry ? Number(entry[0]) : null;
  });
  const [duelWinCondition, setDuelWinCondition] = useState(() => {
    if (!savedScores?.win_condition) return null;
    return Object.values(savedScores.win_condition)[0] ?? null;
  });
  const [duelFellowshipId, setDuelFellowshipId] = useState(() => players[0]?.memberId ?? null);

  // 순위 직접 입력 모드 (supportsRankMode: true 게임 또는 스키마 없는 게임)
  const [rankMode, setRankMode] = useState(false);
  const [rankInputs, setRankInputs] = useState({});

  // 라운드 기반 게임(UNO, 루미큐브)의 totals를 테이블에서 받아옴
  const [roundTotals, setRoundTotals] = useState({});

  // 스키마를 boardGameId로 직접 가져온다. 호출부(초대/랭킹/매치수정)가 schemaJson을 넘겨주지
  // 않아도 커스텀 점수판이 그려지고, 초대 링크로 들어온 비(非)커뮤니티 멤버도 점수판을 볼 수 있다.
  const { data: fetchedGame, isLoading: isGameLoading, isError: isGameError, refetch: refetchGame } = useQuery({
    queryKey: ['game', boardGameId],
    queryFn: () => getGame(boardGameId),
    enabled: Number.isFinite(boardGameId) && boardGameId > 0,
    staleTime: 1000 * 60 * 30,
  });

  const currentSchema = useMemo(() => {
    const dbSchema = parseSchema(schemaJson ?? fetchedGame?.schemaJson);

    // 커스텀 게임은 항상 자기 스키마를 쓴다.
    // (이름이 기존 게임과 겹쳐도 — 예: "UNO 하우스룰" — 코드 스키마에 덮이지 않도록)
    if (fetchedGame?.communityId != null) return dbSchema;

    const normalizedGameName = gameName.toLowerCase();

    // 1. 코드 기반 스키마 (카탄, 우노 등)
    const codeSchema = SCORE_SCHEMAS[boardGameId]
      ?? (gameName && Object.values(SCORE_SCHEMAS).find(s =>
        normalizedGameName.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(normalizedGameName)
      ));
    if (codeSchema) return codeSchema;

    // 2. DB 기반 스키마 (어드민에서 등록한 flat/sectioned 게임)
    // 3. 없으면 null → 점수판 준비 안됨 UI
    return dbSchema;
  }, [boardGameId, gameName, schemaJson, fetchedGame]);

  // 승/무/패만 입력하는 게임(outcome). 저장된 매치를 열면 이전 선택을 복원한다.
  const isOutcomeOnly = currentSchema?.type === 'outcome';
  const [outcomeInputs, setOutcomeInputs] = useState(() => savedScores?.outcome ?? {});

  // 칩 게임(chip). 바이인 금액·플레이어별 바이인 횟수·우승자로 손익을 계산한다.
  // 저장된 매치를 열면 scoresJson의 buyIn / buyIns / chipWon으로 이전 입력을 복원한다.
  const isChip = currentSchema?.type === 'chip';
  const [chipBuyIn, setChipBuyIn] = useState(() => {
    const saved = Object.values(savedScores?.buyIn ?? {})[0];
    return saved ? String(saved) : '';
  });
  const [chipBuyIns, setChipBuyIns] = useState(() => Object.fromEntries(
    players.map(p => [p.memberId, savedScores?.buyIns?.[p.memberId] ?? 1])
  ));
  const [chipWinnerIds, setChipWinnerIds] = useState(() => (
    Object.entries(savedScores?.chipWon ?? {}).filter(([, v]) => v === true).map(([id]) => Number(id))
  ));
  const chipResults = useMemo(
    () => buyInResults(players, Number(chipBuyIn), chipBuyIns, chipWinnerIds),
    [players, chipBuyIn, chipBuyIns, chipWinnerIds],
  );

  // 칩 세기 방식(schema.chipMode === 'count'). 1인 시작 칩과 칩 종류별 남은 개수로 손익을 계산한다.
  // 저장된 매치는 scoresJson의 chipStart / chipCounts로 복원한다.
  const chipMode = chipModeOf(currentSchema);
  const chipDenominations = useMemo(() => chipDenominationsOf(currentSchema?.denominations), [currentSchema]);
  const [chipStart, setChipStart] = useState(() => {
    const saved = Object.values(savedScores?.chipStart ?? {})[0];
    return saved ? String(saved) : '';
  });
  const [chipCounts, setChipCounts] = useState(() => savedScores?.chipCounts ?? {});
  const chipCountDeltas = useMemo(() => Object.fromEntries(players.map(p => {
    const total = chipCountTotal(chipCounts[p.memberId], chipDenominations);
    return [p.memberId, Number(chipStart) > 0 ? total - Number(chipStart) : null];
  })), [players, chipCounts, chipDenominations, chipStart]);

  const initScores = (schema, playerList) => {
    const cats = getAllCategories(schema);
    const init = {};
    cats.forEach(cat => {
      init[cat.key] = {};
      playerList.forEach(p => { init[cat.key][p.memberId] = cat.type === 'exclusive_check' ? false : ""; });
    });
    return init;
  };

  const handleCatanCheck = (catKey, memberId) => {
    setScores(prev => {
      const wasChecked = prev[catKey]?.[memberId];
      const newChecks = {};
      players.forEach(p => { newChecks[p.memberId] = p.memberId === memberId ? !wasChecked : false; });
      return { ...prev, [catKey]: newChecks };
    });
  };

  const [scores, setScores] = useState(() => {
    if (!currentSchema) return {};
    if (savedScores) return savedScores;
    return initScores(currentSchema, players);
  });

  const handleChange = (catKey, memberId, value) => {
    setScores(prev => ({ ...prev, [catKey]: { ...prev[catKey], [memberId]: value } }));
  };

  const lowestWins = !!currentSchema?.lowestWins;

  const totals = useMemo(
    () => computeTotals({ schema: currentSchema, players, scores, roundTotals }),
    [scores, players, currentSchema, roundTotals],
  );

  // lowestWins(루미큐브)는 낮은 점수가 1위
  const winnerId = useMemo(() => {
    if (!players.length) return null;
    return players.reduce((a, b) => {
      const sa = totals[a.memberId] ?? 0;
      const sb = totals[b.memberId] ?? 0;
      return lowestWins ? (sa <= sb ? a : b) : (sa >= sb ? a : b);
    }, players[0])?.memberId;
  }, [totals, players, lowestWins]);

  const handleSubmit = async () => {
    const result = buildParticipants({
      schema: currentSchema, players, scores,
      duelWinnerId, duelWinCondition,
      outcomeInputs,
      chipCountDeltas, chipStart, chipCounts,
      chipResults, chipWinnerIds, chipBuyIns, chipBuyIn,
      rankMode, rankInputs,
      roundTotals,
    });
    if (result.error) { alert(t('scoreSheet', result.error)); return; }
    // 칩 세기 합계가 0이 아니면 세다가 틀렸을 수 있다 — 경고만 하고 저장은 사용자가 고른다
    if (result.confirmChipSum != null
      && !window.confirm(t('scoreSheet', 'chipSumConfirm').replace('{sum}', formatChipDelta(result.confirmChipSum)))) {
      return;
    }
    const { participants } = result;
    try {
      setIsSubmitting(true);
      const res = editMatchId
        ? await updateMatch(editMatchId, { boardGameId, roomId, participants })
        : await createMatch({ boardGameId, roomId, participants });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rankings', String(roomId)] }),
        queryClient.invalidateQueries({ queryKey: ['matches', String(roomId)] }),
        queryClient.invalidateQueries({ queryKey: ['rankings', Number(roomId)] }),
        queryClient.invalidateQueries({ queryKey: ['matches', Number(roomId)] }),
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
        queryClient.invalidateQueries({ queryKey: ['communityRooms'] }),
        // 커뮤니티 현황은 경기로 바로 집계된다 — 비우지 않으면 캐시 동안 옛 순위가 보인다
        queryClient.invalidateQueries({ queryKey: ['communityStatus'] }),
        // 종료 시각이 지난 시즌은 경기 등록 직전에 서버가 넘긴다 — 헤더와 지난 시즌 목록을 다시 받는다
        queryClient.invalidateQueries({ queryKey: ['currentSeason'] }),
        queryClient.invalidateQueries({ queryKey: ['roomSeasons'] }),
      ]);
      navigate(`/invite/${roomId}`, { state: { matchResult: res }, replace: true });
    } catch (err) {
      // 403: 참가자나 내가 그사이 방을 나갔다 (서버: 방 멤버가 아닌 참가자는 등록할 수 없음)
      alert(t('scoreSheet', err?.response?.status === 403 && !editMatchId ? 'saveFailedLeft' : 'saveFailed'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo, { state: backState });
      return;
    }
    navigate(-1);
  };

  if (!players.length) {
    return (
      <ScoreSheetNotice emoji="😅" desc={t('scoreSheet', 'wrongAccess')}
        actions={[{ label: t('scoreSheet', 'goBack'), onClick: handleBack }]} />
    );
  }

  // 스키마를 아직 못 가져왔으면 "준비 안됨" 화면이 잠깐 스치는 걸 막는다
  if (!currentSchema && isGameLoading) return null;

  // 게임을 못 불러온 것(네트워크·서버 오류)과 점수판이 정말 없는 것은 다르다.
  // 전자를 "준비 안됨"으로 표시하면 사용자가 다시 시도할 방법이 없다.
  if (!currentSchema && isGameError) {
    return (
      <ScoreSheetNotice emoji="📡" title={t('scoreSheet', 'loadFailed')} desc={t('scoreSheet', 'loadFailedDesc')}
        actions={[
          { label: t('scoreSheet', 'retry'), onClick: () => refetchGame() },
          { label: t('scoreSheet', 'goBack'), onClick: handleBack, secondary: true },
        ]} />
    );
  }

  if (!currentSchema) {
    return (
      <ScoreSheetNotice emoji="🎲" title={t('scoreSheet', 'schemaNotReady')} desc={t('scoreSheet', 'contactAdmin')}
        actions={[{ label: t('scoreSheet', 'goBack'), onClick: handleBack }]} />
    );
  }

  const TableComponent = currentSchema?.TableComponent;
  const winnerNickname = players.find(p => p.memberId === winnerId)?.nickname;

  return (
    <div style={{ fontFamily: "'Pretendard', sans-serif", background: "var(--th-bg)", minHeight: "100vh", paddingBottom: 'calc(100px + env(safe-area-inset-bottom))', maxWidth: '375px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--th-nav-bg)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--th-border)" }}>
        <button onClick={handleBack} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--th-text)", flexShrink: 0 }}>
          <ArrowLeft size={22} />
        </button>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: "var(--th-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentSchema.name}</span>
        <NavAvatar />
      </div>

      {/* 순위 입력 모드 토글 (supportsRankMode 게임만) */}
      {currentSchema?.supportsRankMode && !readOnly && (
        <InputModeToggle
          rankMode={rankMode}
          onScoreMode={() => { setRankMode(false); setRankInputs({}); }}
          onRankMode={() => setRankMode(true)}
          t={t}
        />
      )}

      {/* 테이블 */}
      <div style={{ margin: currentSchema?.supportsRankMode && !readOnly ? "0 16px" : "16px 16px 0", background: "var(--th-card)", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid var(--th-border)" }}>
        {isChip && chipMode === 'count' ? (
          <ChipCountTable
            players={players}
            startChips={chipStart}
            onStartChange={setChipStart}
            denominations={chipDenominations}
            chipCounts={chipCounts}
            onCountChange={(memberId, denom, digits) => setChipCounts(prev => ({ ...prev, [memberId]: { ...prev[memberId], [denom]: digits } }))}
            deltas={chipCountDeltas}
            readOnly={readOnly}
          />
        ) : isChip ? (
          <ChipTable
            players={players}
            buyIn={chipBuyIn}
            onBuyInChange={setChipBuyIn}
            buyIns={chipBuyIns}
            onBuyInsChange={(memberId, n) => setChipBuyIns(prev => ({ ...prev, [memberId]: n }))}
            winnerIds={chipWinnerIds}
            onToggleWinner={(memberId) => setChipWinnerIds(prev => (
              prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
            ))}
            results={chipResults}
            readOnly={readOnly}
          />
        ) : isOutcomeOnly ? (
          <WinDrawLossTable
            players={players}
            outcomeInputs={outcomeInputs}
            onChange={(memberId, outcome) => setOutcomeInputs(prev => ({ ...prev, [memberId]: outcome }))}
            readOnly={readOnly}
          />
        ) : (rankMode || !TableComponent) ? (
          <RankInputTable
            players={players}
            rankInputs={rankInputs}
            onChange={(memberId, placement) => setRankInputs(prev => ({ ...prev, [memberId]: placement }))}
            readOnly={readOnly}
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <TableComponent
              schema={currentSchema}
              players={players}
              scores={scores}
              totals={totals}
              winnerId={winnerId}
              handleChange={handleChange}
              handleCatanCheck={handleCatanCheck}
              setScienceModal={setScienceModal}
              duelWinCondition={duelWinCondition}
              setDuelWinCondition={setDuelWinCondition}
              duelWinnerId={duelWinnerId}
              setDuelWinnerId={setDuelWinnerId}
              duelFellowshipId={duelFellowshipId}
              setDuelFellowshipId={setDuelFellowshipId}
              onTotalsChange={setRoundTotals}
              t={t}
              lang={lang}
              readOnly={readOnly}
            />
          </div>
        )}
      </div>

      {!isChip && <WinnerBanner
        schema={currentSchema}
        duelWinnerId={duelWinnerId}
        duelFellowshipId={duelFellowshipId}
        duelWinCondition={duelWinCondition}
        players={players}
        totals={totals}
        winnerId={winnerId}
        winnerNickname={winnerNickname}
        scores={scores}
        t={t}
        lang={lang}
      />}

      {/* Bottom Fixed Button */}
      {!readOnly && !previewMode && (
        <SubmitBar onSubmit={handleSubmit} isSubmitting={isSubmitting} isEdit={!!editMatchId} t={t} />
      )}

      {/* 과학 모달 */}
      {scienceModal && (
        <ScienceModal
          onConfirm={(score) => { handleChange("science", scienceModal.memberId, score); setScienceModal(null); }}
          onClose={() => setScienceModal(null)}
        />
      )}
    </div>
  );
};

export default ScoreSheet;
