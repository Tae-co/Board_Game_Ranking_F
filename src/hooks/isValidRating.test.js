import { describe, it, expect } from 'vitest';
import { isValidRating } from './useRoomActions';

describe('isValidRating (LP 수정 입력)', () => {
  it('0 이상의 숫자만 저장할 수 있다', () => {
    expect(isValidRating('800')).toBe(true);
    expect(isValidRating('0')).toBe(true);
    expect(isValidRating('512.5')).toBe(true);
  });

  it('음수·빈값·숫자 아님은 막는다', () => {
    expect(isValidRating('-100')).toBe(false);
    expect(isValidRating('')).toBe(false);
    expect(isValidRating('   ')).toBe(false);
    expect(isValidRating('abc')).toBe(false);
  });
});
