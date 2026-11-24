#!/usr/bin/env bash
# Build the Lingo Daily Android app (APK) for a deployed site.
#
#   android/build-apk.sh https://your-lingo-daily-site.example
#
# - Creates a signing key on the first run in android/keystore/ (git-ignored). Keep that folder:
#   every later update must be signed with the same key, or phones will refuse to update the app.
# - Writes web/.well-known/assetlinks.json so the site vouches for the app. Redeploy the site after
#   building; until then the app still works but shows a small address bar at the top.
# - Puts the APK in android/dist/.
set -euo pipefail

URL="${1:-}"
if [[ ! "$URL" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?/?$ ]]; then
  echo "usage: android/build-apk.sh https://<site-host>   (the deployed Lingo Daily address, https only)" >&2
  exit 2
fi
HOST="${URL#https://}"
HOST="${HOST%/}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID="$ROOT/android"
KEYDIR="$ANDROID/keystore"
STORE="$KEYDIR/release.keystore"
PROPS="$KEYDIR/keystore.properties"
ALIAS="lingodaily"
PACKAGE="app.lingodaily.family"
export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"

if [[ ! -d "$ANDROID_HOME/platforms/android-35" ]]; then
  echo "Android SDK platform 35 not found under $ANDROID_HOME (see android/README.md)." >&2
  exit 1
fi

mkdir -p "$KEYDIR" "$ANDROID/dist"
chmod 700 "$KEYDIR"
if [[ ! -f "$STORE" ]]; then
  PASS="$(openssl rand -hex 18)"
  keytool -genkeypair -keystore "$STORE" -storetype PKCS12 -alias "$ALIAS" -keyalg RSA -keysize 2048 \
    -validity 10000 -dname "CN=Lingo Daily, O=Family" -storepass "$PASS" -keypass "$PASS" >/dev/null 2>&1
  umask 077
  printf 'storePassword=%s\nkeyAlias=%s\n' "$PASS" "$ALIAS" >"$PROPS"
  echo "Created a new signing key in android/keystore/. Back up that folder somewhere private."
fi
PASS="$(sed -n 's/^storePassword=//p' "$PROPS")"

FINGERPRINT="$(keytool -list -v -keystore "$STORE" -alias "$ALIAS" -storepass "$PASS" 2>/dev/null |
  sed -n 's/^[[:space:]]*SHA256:[[:space:]]*//p' | head -1)"
if [[ -z "$FINGERPRINT" ]]; then
  echo "Could not read the signing key fingerprint." >&2
  exit 1
fi

VERSION_CODE="$(date -u +%y%m%d%H)"
VERSION_NAME="1.0.$(date -u +%Y%m%d)"

cd "$ANDROID"
LD_KEYSTORE="$STORE" LD_KEYSTORE_PASSWORD="$PASS" LD_KEY_ALIAS="$ALIAS" LD_KEY_PASSWORD="$PASS" \
  ./gradlew --no-daemon -q assembleRelease \
  -PtwaHost="$HOST" -PversionCode="$VERSION_CODE" -PversionName="$VERSION_NAME"

APK="$ANDROID/dist/lingo-daily.apk"
cp "$ANDROID/app/build/outputs/apk/release/app-release.apk" "$APK"

# Also serve it from the site at /downloads/lingo-daily.apk (git-ignored: the APK contains the site address).
mkdir -p "$ROOT/web/downloads"
cp "$APK" "$ROOT/web/downloads/lingo-daily.apk"

mkdir -p "$ROOT/web/.well-known"
cat >"$ROOT/web/.well-known/assetlinks.json" <<JSON
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "$PACKAGE",
      "sha256_cert_fingerprints": ["$FINGERPRINT"]
    }
  }
]
JSON

echo "APK:          android/dist/lingo-daily.apk ($VERSION_NAME, code $VERSION_CODE) for https://$HOST/"
echo "Site copy:    web/downloads/lingo-daily.apk -> https://$HOST/downloads/lingo-daily.apk after redeploy"
echo "Asset links:  web/.well-known/assetlinks.json (commit it and redeploy the site)"
