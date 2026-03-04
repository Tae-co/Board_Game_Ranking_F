import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

const MatchForm = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 이전 화면(GameSelect)에서 넘겨준 state 받기
  // 만약 새로고침 등으로 데이터가 날아가면 에러가 나지 않도록 기본값 세팅
  const { gameId, players } = location.state || { gameId: null, players: [] };

  const [playerDetails, setPlayerDetails] = useState([]);
  const [results, setResults] = useState({}); // { memberId: 'WIN' | 'LOSE' }

  useEffect(() => {
    // 실제로는 players(id 배열)를 바탕으로 백엔드에서 참가자 정보를 가져오거나,
    // 전역 상태에서 불러옵니다. 여기서는 UI 확인을 위해 임시 데이터를 매칭해 줄게!
    const fetchSelectedMembers = async () => {
      try {
        // 방 전체 멤버를 불러온 뒤, 이전 화면에서 선택한 멤버(players)만 필터링
        const res = await api.get(`/rooms/${roomId}/members`);
        const allMembers = res.data || [];
        const selected = allMembers.filter(m => players.includes(m.memberId));
        setPlayerDetails(selected);

        // 기본값을 'LOSE'로 세팅
        const initialResults = {};
        selected.forEach(p => {
          initialResults[p.memberId] = 'LOSE';
        });
        setResults(initialResults);
      } catch (err) {
        console.error('참가자 정보를 불러오는데 실패했습니다.', err);
      }
    };
    
    if (players.length > 0) {
      fetchSelectedMembers();
    }
  }, [roomId, players]);

  // 승/패 토글 핸들러
  const handleResultChange = (memberId, status) => {
    setResults(prev => ({
      ...prev,
      [memberId]: status
    }));
  };

// 결과 저장 API 
  const handleSubmit = async () => {
    const hasWinner = Object.values(results).includes('WIN');
    if (!hasWinner && !window.confirm('승리자가 아무도 없나요? 이대로 저장할까요?')) return;

    try {
      // 백엔드가 요구하는 Request Body 형식에 맞춰 수정하세요!
      const payload = {
        gameId: gameId,
        matchResults: Object.entries(results).map(([memberId, result]) => ({
          memberId: Number(memberId),
          result: result // 'WIN' or 'LOSE'
        }))
      };

      await api.post(`/rooms/${roomId}/matches`, payload);
      
      alert('결과가 성공적으로 저장되었습니다!');
      navigate(`/ranking/${roomId}`);
    } catch (error) {
      alert('결과 저장에 실패했습니다.');
      console.error(error);
    }
  };

  // 비정상적인 접근(state 없이 URL로 직접 접속 등) 방어
  if (!gameId || players.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-500 mb-4">잘못된 접근이거나 데이터가 없습니다.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 font-bold">뒤로 가기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pb-32">
      <div className="max-w-md w-full mt-10 space-y-8">
        
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="text-slate-400 font-bold hover:text-slate-700">
            ← 뒤로가기
          </button>
          <h1 className="text-2xl font-black text-slate-900">결과 입력</h1>
          <div className="w-16"></div>
        </div>

        {/* 안내 문구 */}
        <div className="bg-blue-100 p-4 rounded-2xl text-center">
          <p className="text-blue-800 font-bold text-sm">
            이번 게임의 승리자를 선택해 주세요! 👑
          </p>
        </div>

        {/* 참가자별 승패 입력 폼 */}
        <div className="space-y-3">
          {playerDetails.map((player) => {
            const isWinner = results[player.memberId] === 'WIN';

            return (
              <div 
                key={player.memberId} 
                className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between"
              >
                {/* 플레이어 정보 */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-lg text-slate-600">
                    {player.nickname.charAt(0)}
                  </div>
                  <span className="font-bold text-lg text-slate-800">{player.nickname}</span>
                </div>

                {/* 승/패 선택 버튼 그룹 */}
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => handleResultChange(player.memberId, 'WIN')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      isWinner 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    승리
                  </button>
                  <button
                    onClick={() => handleResultChange(player.memberId, 'LOSE')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      !isWinner 
                        ? 'bg-slate-500 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    패배
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 하단 고정: 결과 저장 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent flex justify-center">
        <button 
          onClick={handleSubmit}
          className="w-full max-w-md py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
        >
          결과 저장하기
        </button>
      </div>
    </div>
  );
};

export default MatchForm;