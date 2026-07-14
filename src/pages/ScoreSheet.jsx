import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import NavAvatar from '../components/NavAvatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createMatch, updateMatch } from '../api/services/matches';
import { getGame } from '../api/services/games';
import { useLanguage } from '../i18n/LanguageContext';
import { SCORE_SCHEMAS } from '../scoreSheets/schemas/index';
import FlatTable from '../scoreSheets/tables/FlatTable';
import SectionedTable from '../scoreSheets/tables/SectionedTable';
import ConditionTable from '../scoreSheets/tables/ConditionTable';
import { getAllCategories } from '../scoreSheets/shared/scoreUtils';
import { ScienceModal } from '../scoreSheets/shared/ScoreCell';
import WinnerBanner from '../scoreSheets/shared/WinnerBanner';
import RankInputTable from '../scoreSheets/components/RankInputTable';

// DB에 저장된 스키마(JSON)를 렌더링 가능한 스키마로 변환.
// simple은 TableComponent가 없다 → RankInputTable(순위 입력)이 그려진다.
const parseSchema = (raw) => {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed.type === 'flat') return { ...parsed, TableComponent: FlatTable };
    if (parsed.type === 'sectioned') return { ...parsed, TableComponent: SectionedTable };
    if (parsed.type === 'conditional') return { ...parsed, TableComponent: ConditionTable };
    if (parsed.type === 'simple') return { ...parsed, TableComponent: null };
  } catch { /* 깨진 스키마는 없는 것으로 취급 */ }
  return null;
};

const ScoreSheet = () => {
  const { boardGameId: boardGameIdStr } = useParams();
  const boardGameId = Number(boardGameIdStr);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const { players = [], roomId, gameName = '', editMatchId = null, savedScores = null, readOnly = false, backTo = null, backState = null, previewMode = false, schemaJson = null } = location.state || {};

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
  const { data: fetchedGame, isLoading: isGameLoading } = useQuery({
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

  // 순위만 입력하는 게임(simple)은 점수 입력 없이 곧바로 순위 모드로 동작한다.
  const isRankOnly = currentSchema?.type === 'simple';

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

  const allCategories = useMemo(() => (
    currentSchema ? getAllCategories(currentSchema) : []
  ), [currentSchema]);

  const handleChange = (catKey, memberId, value) => {
    setScores(prev => ({ ...prev, [catKey]: { ...prev[catKey], [memberId]: value } }));
  };

  const isRoundBased = currentSchema?.type === 'uno' || currentSchema?.type === 'rummikub' || currentSchema?.type === 'dicethrone' || currentSchema?.type === 'saboteur' || currentSchema?.type === 'radlands';
  const lowestWins = !!currentSchema?.lowestWins;

  const totals = useMemo(() => {
    // 라운드 기반 게임은 테이블 컴포넌트에서 받은 roundTotals 사용
    if (isRoundBased) return roundTotals;
    const t = {};
    players.forEach(p => {
      if (currentSchema?.type === 'catan') {
        t[p.memberId] = currentSchema.categories.reduce((sum, cat) => {
          const v = scores[cat.key]?.[p.memberId];
          if (cat.type === 'exclusive_check') return sum + (v ? cat.bonus : 0);
          return sum + (Number(v) || 0) * (cat.multiplier || 1);
        }, 0);
      } else {
        t[p.memberId] = allCategories.reduce((sum, cat) => {
          const v = Number(scores[cat.key]?.[p.memberId]) || 0;
          return cat.negative && !cat.allowNegative ? sum - Math.abs(v) : sum + v;
        }, 0);
      }
    });
    return t;
  }, [scores, players, allCategories, currentSchema, isRoundBased, roundTotals]);

  // lowestWins(루미큐브)는 낮은 점수가 1위
  const winnerId = useMemo(() => {
    if (!players.length) return null;
    return players.reduce((a, b) => {
      const sa = totals[a.memberId] ?? 0;
      const sb = totals[b.memberId] ?? 0;
      return lowestWins ? (sa <= sb ? a : b) : (sa >= sb ? a : b);
    }, players[0])?.memberId;
  }, [totals, players, lowestWins]);

  const calcPlacements = () => {
    const entries = players.map(p => ({ memberId: p.memberId, score: totals[p.memberId] }));
    // lowestWins: 낮은 점수가 1위
    const sorted = [...entries].sort((a, b) => lowestWins ? a.score - b.score : b.score - a.score);
    const placements = {};
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].score === sorted[i - 1].score) {
        placements[sorted[i].memberId] = placements[sorted[i - 1].memberId];
      } else {
        placements[sorted[i].memberId] = currentRank;
      }
      currentRank++;
    }
    return placements;
  };

  const handleSubmit = async () => {
    let participants;
    if (currentSchema?.type === "conditional") {
      if (!duelWinnerId) { alert(t('scoreSheet', 'winnerRequired')); return; }
      participants = players.map(p => ({
        memberId: p.memberId,
        placement: p.memberId === duelWinnerId ? 1 : 2,
        scoresJson: JSON.stringify({
          win_condition: duelWinCondition,
          won: p.memberId === duelWinnerId,
        }),
      }));
    } else if (currentSchema?.type === "duel" || currentSchema?.type === "splendorduel") {
      if (!duelWinnerId) { alert(t('scoreSheet', 'winnerRequired')); return; }
      const allCats = getAllCategories(currentSchema);
      participants = players.map(p => ({
        memberId: p.memberId,
        placement: p.memberId === duelWinnerId ? 1 : 2,
        scoresJson: JSON.stringify({
          ...Object.fromEntries(allCats.map(cat => [cat.key, scores[cat.key]?.[p.memberId] ?? 0])),
          win_condition: duelWinCondition,
          won: p.memberId === duelWinnerId,
        }),
      }));
    } else if (rankMode || isRankOnly) {
      // 순위 직접 입력 모드: rankInputs에서 placement 사용
      const allFilled = players.every(p => rankInputs[p.memberId]);
      if (!allFilled) { alert('모든 플레이어의 순위를 선택해주세요.'); return; }
      participants = players.map(p => ({
        memberId: p.memberId,
        placement: rankInputs[p.memberId],
        scoresJson: null,
      }));
    } else if (isRoundBased) {
      // 라운드 기반: roundTotals로 placement 계산, 전체 게임 데이터 scoresJson 전달
      if ((currentSchema?.type === 'radlands' || currentSchema?.type === 'dicethrone') && Object.keys(roundTotals).length === 0) {
        alert('승패를 선택해주세요.');
        return;
      }
      const placements = calcPlacements();
      const roundData = scores["_data"]?.["all"] || null;
      participants = players.map(p => ({
        memberId: p.memberId,
        placement: placements[p.memberId],
        scoresJson: roundData,
      }));
    } else {
      const placements = calcPlacements();
      const allCats = getAllCategories(currentSchema);
      participants = players.map(p => ({
        memberId: p.memberId,
        placement: placements[p.memberId],
        scoresJson: JSON.stringify(
          Object.fromEntries(allCats.map(cat => [cat.key, scores[cat.key]?.[p.memberId]]))
        ),
      }));
    }
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
      ]);
      navigate(`/invite/${roomId}`, { state: { matchResult: res }, replace: true });
    } catch (err) {
      alert(t('scoreSheet', 'saveFailed'));
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
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--th-bg)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😅</div>
        <p style={{ color: "var(--th-text-sub)", marginBottom: 24 }}>{t('scoreSheet', 'wrongAccess')}</p>
        <button onClick={handleBack} style={{ padding: "12px 32px", borderRadius: 24, backgroundColor: "var(--th-primary)", color: "#FFFFFF", border: "none", cursor: "pointer", fontWeight: 700 }}>
          {t('scoreSheet', 'goBack')}
        </button>
      </div>
    );
  }

  // 스키마를 아직 못 가져왔으면 "준비 안됨" 화면이 잠깐 스치는 걸 막는다
  if (!currentSchema && isGameLoading) return null;

  if (!currentSchema) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--th-bg)", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
        <p style={{ color: "var(--th-text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>점수판이 아직 준비되지 않았습니다.</p>
        <p style={{ color: "var(--th-text-sub)", fontSize: 13, marginBottom: 24 }}>관리자에게 문의하세요.</p>
        <button onClick={handleBack} style={{ padding: "12px 32px", borderRadius: 24, backgroundColor: "var(--th-primary)", color: "#FFFFFF", border: "none", cursor: "pointer", fontWeight: 700 }}>
          {t('scoreSheet', 'goBack')}
        </button>
      </div>
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
        <div style={{ margin: "16px 16px 12px", display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid var(--th-border)" }}>
          <button
            onClick={() => { setRankMode(false); setRankInputs({}); }}
            style={{
              flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              background: !rankMode ? "var(--th-primary)" : "var(--th-card)",
              color: !rankMode ? "#fff" : "var(--th-text-sub)",
            }}
          >
            {t('scoreSheet', 'scoreInput')}
          </button>
          <button
            onClick={() => setRankMode(true)}
            style={{
              flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              background: rankMode ? "var(--th-primary)" : "var(--th-card)",
              color: rankMode ? "#fff" : "var(--th-text-sub)",
            }}
          >
            {t('scoreSheet', 'rankInput')}
          </button>
        </div>
      )}

      {/* 테이블 */}
      <div style={{ margin: currentSchema?.supportsRankMode && !readOnly ? "0 16px" : "16px 16px 0", background: "var(--th-card)", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid var(--th-border)" }}>
        {(rankMode || !TableComponent) ? (
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

      <WinnerBanner
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
      />

      {/* Bottom Fixed Button */}
      {!readOnly && !previewMode && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'linear-gradient(to top, var(--th-bg) 70%, transparent)' }}>
          <div style={{ maxWidth: 375, margin: '0 auto', padding: '20px 16px calc(32px + env(safe-area-inset-bottom))' }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 50, border: 'none',
                background: isSubmitting ? 'var(--th-border)' : 'var(--th-primary)',
                color: '#fff', fontSize: 14, fontWeight: 900, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(107, 92, 231, 0.4)',
              }}
            >
              {isSubmitting ? t('scoreSheet', 'saving') : editMatchId ? t('scoreSheet', 'submitEdit') : t('scoreSheet', 'submit')}
            </button>
          </div>
        </div>
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
