# 로그인 화면 개선 계획

## 변경 목표

- **일반 로그인**: 전화번호 로그인 제거 → 소셜 로그인(Google, Kakao)만 노출
- **관리자 로그인**: 기존 아이디/비밀번호 유지 + 전화번호 로그인 탭 추가 (테스트 계정 접근용)

---

## 1. Login.jsx — 전화번호 로그인 제거

### 현재 구조
- Step 1: 전화번호 입력 → 기존 회원 여부 확인
- Step 2a: 기존 회원 → 비밀번호 입력 후 로그인
- Step 2b: 신규 회원 → OTP 인증
- Step 3: 닉네임 + 비밀번호 설정 (회원가입)
- 소셜 로그인: Google, Kakao (Step 1 하단에 위치)

### 변경 후 구조
- 소셜 로그인만 남김: Google 버튼 + Kakao 버튼
- Step, phone, otp, password 관련 state 전부 제거
- `InputOTP` 컴포넌트 import 제거
- 카드 내부가 단순해지므로 UI도 정리

### 삭제할 코드
- `step`, `phone`, `password`, `otp`, `isExisting`, `memberId`, `nicknameStatus`, `nickname`, `newPassword` state
- `handleCheckPhone`, `handleExistingLogin`, `handleVerifyOtp`, `checkNickname`, `handleNicknameChange`, `handleRegister` 함수
- Step 1 전화번호 입력 UI
- Step 2a 비밀번호 입력 UI
- Step 2b OTP 입력 UI
- Step 3 닉네임/비밀번호 등록 UI

### 유지할 코드
- `handleKakaoLogin`, `saveLoginData` 함수
- Google 로그인 버튼
- Kakao 로그인 버튼
- 하단 관리자 로그인 링크 (`/admin-login`)

---

## 2. AdminLogin.jsx — 전화번호 로그인 추가

### 현재 구조
- 아이디 + 비밀번호 입력 → `/auth/admin-login` 호출

### 변경 후 구조
- 상단에 탭 2개: **[관리자 로그인]** | **[테스트 계정 로그인]**
- 탭 1 (관리자): 기존 아이디/비밀번호 유지
- 탭 2 (테스트 계정): 전화번호 + 비밀번호 로그인
  - 전화번호 입력 후 "다음" → 비밀번호 입력 → `/auth/login` 호출
  - 신규 가입 없음 (기존 테스트 계정만 사용)
  - 전화번호 존재 여부 확인(`/auth/check-phone`) 후 없으면 에러 표시

### API 사용
- 탭 1: `POST /auth/admin-login` (기존 그대로)
- 탭 2: `POST /auth/check-phone` → `POST /auth/login` (`phoneNumber` + `password`)

---

## 구현 순서

1. Login.jsx 단순화 (전화번호 코드 제거) ✅
2. AdminLogin.jsx 탭 추가 + 전화번호 로그인 구현 ✅
