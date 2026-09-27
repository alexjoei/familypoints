// query-string 7 expects a CommonJS function. Keep that interface while using
// the upstream fixed decoder (0.5.0), which exports an ESM default function.
module.exports = require('decode-uri-component-modern').default;
