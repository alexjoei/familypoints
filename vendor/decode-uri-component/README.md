# Temporary CommonJS compatibility adapter

Declare the adapter as a direct root `file:` dependency and reference it with `$decode-uri-component` in overrides. An override with only a relative `file:` path can produce a lockfile link under `node_modules/query-string/vendor`, which does not exist on clean EAS installations. The correct resolved link is `vendor/decode-uri-component`.

Expo Router 57 depends on query-string 7, which expects decode-uri-component to export a CommonJS function. The upstream fixed decoder 0.5.0 uses an ESM default export. This adapter only bridges that export; all decoding is performed by the unmodified upstream dependency.

It avoids the malformed-input denial of service reported in GHSA-vcc3-ghjq-m6fr without downgrading Expo or changing query-string's API. Remove the override and this adapter when Expo Router consumes a fixed decoder natively. Node 22.13+ is already required by Expo 57 and supports synchronous require of this ESM module. Metro handles the ESM dependency for mobile/web bundles.

The xcode -> uuid 11.1.1 override separately fixes GHSA-w5hq-g745-h8pq. xcode uses the unchanged CommonJS v4() API, covered by a compatibility test.
