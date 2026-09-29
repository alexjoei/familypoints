"""Check an EAS Android APK before sharing its download link."""

import hashlib
import sys
import zipfile
from pathlib import Path


apk = Path(sys.argv[1])
with zipfile.ZipFile(apk) as archive:
    names = archive.namelist()
    checks = {
        "AndroidManifest.xml": "AndroidManifest.xml" in names,
        "DEX code": any(name.endswith(".dex") for name in names),
        "app bundle": any("index.android.bundle" in name for name in names),
        "ZIP integrity": archive.testzip() is None,
    }

print(f"File: {apk}")
print(f"Size: {apk.stat().st_size} bytes")
print(f"SHA256: {hashlib.sha256(apk.read_bytes()).hexdigest().upper()}")
for label, okay in checks.items():
    print(f"{label}: {'OK' if okay else 'MISSING'}")
if not all(checks.values()):
    raise SystemExit(1)
