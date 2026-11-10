// 닉네임 허용 문자: 글자(한글·영문 등)·숫자·이모지. 공백·%·_ 같은 특수문자는 금지.
// 백엔드 Utils/NicknameRules.java 와 같은 규칙을 유지할 것.
const NICKNAME_PATTERN = /^(?:\p{Extended_Pictographic}️|[\p{L}\p{M}\p{Nd}\p{Emoji_Presentation}‍\u{E0020}-\u{E007F}])+$/u;

export const hasOnlyAllowedNicknameChars = (value) => NICKNAME_PATTERN.test(value);
