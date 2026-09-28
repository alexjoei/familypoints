import { describe, it, expect, vi } from 'vitest';
import { createCodeExchange } from '../src/lib/auth-code';
describe('Google callback exchange', () => {
  it('shares concurrent browser and deep-link callbacks and ignores a completed duplicate', async () => {
    const exchange = vi.fn(async () => {});
    const finish = createCodeExchange(exchange);
    await Promise.all([finish('same-code'), finish('same-code')]);
    await finish('same-code');
    expect(exchange).toHaveBeenCalledTimes(1);
    await finish('next-code');
    expect(exchange).toHaveBeenCalledTimes(2);
  });
  it('reports failure to both callers and allows retry', async () => {
    const exchange = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(undefined);
    const finish = createCodeExchange(exchange);
    const results = await Promise.allSettled([finish('code'), finish('code')]);
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(exchange).toHaveBeenCalledTimes(1);
    await expect(finish('code')).resolves.toBeUndefined();
    expect(exchange).toHaveBeenCalledTimes(2);
  });
});
