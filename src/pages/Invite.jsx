import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Invite = () => {
  // App.jsx에서 <Route path="/invite/:roomId" /> 처럼 설정했다고 가정하고 URL에서 방 ID를 가져옴
  const { roomId } = useParams(); 
  const navigate = useNavigate();
  
  const [roomInfo, setRoomInfo] = useState({ name: '', inviteCode: '' });
  const [members, setMembers] = useState([]);

  useEffect(() => {
    // 실제 백엔드 연동 시 사용할 코드 형태
    const fetchRoomDetails = async () => {
      try {
        // 1. 방 정보 (이름, 초대코드 등) 가져오기
        const roomRes = await api.get(`/rooms/${roomId}`);
        setRoomInfo({ 
          name: roomRes.data.name, 
          inviteCode: roomRes.data.inviteCode 
        });

        const memberRes = await api.get(`/rooms/${roomId}/members`);
        setMembers(memberRes.data || []);
        
      } catch (err) {
        console.error('방 정보를 불러오는데 실패했습니다.', err);
      }
    };
    
    fetchRoomDetails();
  }, [roomId]);

  // 초대 코드 복사 기능
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomInfo.inviteCode);
    alert(`초대 코드 [${roomInfo.inviteCode}]가 복사되었습니다! 카톡으로 친구에게 공유해보세요.`);
  };

  // 게임 선택 화면으로 이동
  const handleGoToGameSelect = () => {
    // 다음 화면인 GameSelect.jsx로 넘어갈 때 어떤 방인지 알아야 하니까 roomId를 같이 넘겨줌
    navigate(`/games/${roomId}`); 
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-md w-full space-y-6 mt-10">
        
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="text-slate-400 font-bold hover:text-slate-700">
            ← 뒤로가기
          </button>
          <h1 className="text-xl font-black text-slate-900">{roomInfo.name}</h1>
          <div className="w-16"></div> {/* 가운데 정렬용 빈 공간 */}
        </div>

        {/* 초대 코드 영역 */}
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center space-y-4 border-2 border-blue-50">
          <h2 className="text-sm font-bold text-slate-500">이 코드를 친구에게 알려주세요!</h2>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-black tracking-widest text-blue-600">
              {roomInfo.inviteCode}
            </span>
          </div>
          <button 
            onClick={handleCopyCode}
            className="w-full mt-2 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
          >
            초대 코드 복사하기
          </button>
        </div>

        {/* 현재 참가자 목록 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-slate-800">참가자</h2>
            <span className="text-blue-600 font-black">{members.length}명</span>
          </div>
          
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.memberId} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl">
                {/* 프로필 이미지 대신 이름 첫 글자 표시 */}
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-lg">
                  {member.nickname.charAt(0)}
                </div>
                <div className="flex-1 font-bold text-slate-800 text-lg">
                  {member.nickname}
                </div>
                {/* 방장 표시 마크 */}
                {member.isHost && (
                  <span className="text-xs bg-amber-100 text-amber-600 px-3 py-1.5 rounded-lg font-black">
                    방장
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 고정: 게임 선택 넘어가기 버튼 */}
        <div className="pt-4">
          <button 
            onClick={handleGoToGameSelect}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            어떤 게임 할까? (게임 선택)
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default Invite;