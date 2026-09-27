import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire(import.meta.url);
describe('security update compatibility', () => {
  it('keeps query-string parsing and encoding compatible with Expo routes', () => {
    const qs = require('query-string');
    expect(qs.parse('code=abc%2Fdef&name=compa%C3%B1%C3%ADa')).toMatchObject({
      code: 'abc/def',
      name: 'compañía',
    });
    expect(qs.stringify({ id: 'a/b', sort: 'false' }, { sort: false })).toBe('id=a%2Fb&sort=false');
  });
  it('decodes long malformed inputs without recursive exponential work', () => {
    const qs = require('query-string');
    const malformed = '%C0%AF'.repeat(2000);
    const start = performance.now();
    expect(qs.parse('code=' + malformed).code).toBe(malformed);
    expect(performance.now() - start).toBeLessThan(1000);
  });
  it('preserves xcode project UUID generation', () => {
    const xcode = require('xcode');
    const project = xcode.project('unused.pbxproj');
    project.hash = { project: { objects: {} } };
    expect(project.generateUuid()).toMatch(/^[A-F0-9]{24}$/);
  });
});
