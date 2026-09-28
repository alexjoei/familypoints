// The Android deep-link listener and browser session can deliver the same code.
// Share the exchange so both callers await the same session or failure.
export function createCodeExchange(exchange: (code: string) => Promise<void>) {
  let completed: string | undefined;
  const pending = new Map<string, Promise<void>>();
  return (code: string): Promise<void> => {
    if (completed === code) return Promise.resolve();
    const existing = pending.get(code);
    if (existing) return existing;
    const result = Promise.resolve()
      .then(() => exchange(code))
      .then(() => {
        completed = code;
      })
      .finally(() => pending.delete(code));
    pending.set(code, result);
    return result;
  };
}
