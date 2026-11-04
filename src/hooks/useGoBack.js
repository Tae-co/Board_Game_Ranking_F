import { useNavigate } from 'react-router-dom';

/**
 * 뒤로 가기: 앱 안에서 넘어왔으면 직전 화면으로, QR·링크로 바로 열려 이전 화면이 없으면 fallback으로.
 * React Router가 history.state.idx에 이 앱 안에서 몇 번째 화면인지 적어 둔다 (0이면 첫 화면)
 */
export const useGoBack = () => {
  const navigate = useNavigate();
  return (fallback) => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
};
