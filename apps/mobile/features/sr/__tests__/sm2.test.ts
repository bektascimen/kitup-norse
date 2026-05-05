import { nextInterval } from '../sm2';

describe('SM-2 lite nextInterval', () => {
  it('first wrong answer → 1 day, ease 2.5', () => {
    expect(nextInterval({ ease: 2.5, intervalDays: 0, correct: false }))
      .toEqual({ ease: 2.5, intervalDays: 1 });
  });
  it('correct review → interval *= ease, ease += 0.1 (capped at 3.0)', () => {
    expect(nextInterval({ ease: 2.5, intervalDays: 3, correct: true }))
      .toEqual({ ease: 2.6, intervalDays: 8 });
  });
  it('caps ease at 3.0', () => {
    expect(nextInterval({ ease: 3.0, intervalDays: 5, correct: true }).ease).toBe(3.0);
  });
  it('wrong review → reset to 1, ease -= 0.2 floor 1.3', () => {
    expect(nextInterval({ ease: 1.4, intervalDays: 8, correct: false }))
      .toEqual({ ease: 1.3, intervalDays: 1 });
  });
});
