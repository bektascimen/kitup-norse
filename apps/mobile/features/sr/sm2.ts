type In = { ease: number; intervalDays: number; correct: boolean };
type Out = { ease: number; intervalDays: number };

export function nextInterval(input: In): Out {
  if (!input.correct) {
    // First-time wrong (intervalDays === 0): keep ease at default, set interval = 1.
    // Subsequent wrong (already-queued review): decrement ease by 0.2, floor 1.3, reset interval = 1.
    if (input.intervalDays === 0) {
      return { ease: input.ease, intervalDays: 1 };
    }
    return { ease: Math.max(1.3, +(input.ease - 0.2).toFixed(2)), intervalDays: 1 };
  }
  const newEase = Math.min(3.0, +(input.ease + 0.1).toFixed(2));
  const baseInterval = input.intervalDays === 0 ? 1 : input.intervalDays;
  return { ease: newEase, intervalDays: Math.round(baseInterval * input.ease) };
}
