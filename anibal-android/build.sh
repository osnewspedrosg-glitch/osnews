#!/bin/bash
# Build a signed Aníbal release APK using the OSNews Android toolchain.
# Keystore is never written into the repo. Set ANIBAL_KS / ANIBAL_KS_PASS / ANIBAL_KS_ALIAS
# or reuse the local MAY keystore if present. Otherwise a temporary debug key is used.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf out
T="${ANDROID_TOOLCHAIN:-/workspace/tools}"
export JAVA_HOME="${JAVA_HOME:-$T/jdk-17.0.21+9}"
export PATH="$JAVA_HOME/bin:$PATH"
BT="${ANDROID_BUILD_TOOLS:-$T/sdk/build-tools/34.0.0}"
AJ="${ANDROID_JAR:-$T/sdk/platforms/android-34/android.jar}"
APK_NAME="${APK_NAME:-Anibal-OSNews-v1.2.apk}"

# Plain JVM unit checks for the Android-free logic (share-to-X URL, shared links, history, bookmarks, theme).
rm -rf out/test && mkdir -p out/test
javac -nowarn -d out/test src/com/osnews/anibal/AnibalLogic.java test/AnibalLogicTest.java
java -cp out/test com.osnews.anibal.AnibalLogicTest
if [ "${1:-}" = "test" ]; then exit 0; fi

mkdir -p out/c out/gen out/dex
"$BT/aapt2" compile --dir res -o out/res.zip
"$BT/aapt2" link -I "$AJ" --manifest AndroidManifest.xml -o out/base.apk --java out/gen out/res.zip --auto-add-overlay
javac -source 8 -target 8 -nowarn -classpath "$AJ" -d out/c $(find src out/gen -name '*.java')
"$BT/d8" --min-api 24 --lib "$AJ" --output out/dex $(find out/c -name '*.class')
cp out/base.apk out/u.apk
python3 -c "import zipfile; zipfile.ZipFile('out/u.apk','a').write('out/dex/classes.dex','classes.dex')"
"$BT/zipalign" -f 4 out/u.apk out/a.apk

KS="${ANIBAL_KS:-}"
KSPASS="${ANIBAL_KS_PASS:-}"
ALIAS="${ANIBAL_KS_ALIAS:-may}"
MAY_KS_DIR="${MAY_KS_DIR:-/workspace/osnews/may-app-keystore}"
if [ -z "$KS" ] && [ -f "$MAY_KS_DIR/may-release.jks" ] && [ -f "$MAY_KS_DIR/password.txt" ]; then
  KS="$MAY_KS_DIR/may-release.jks"
  KSPASS="file:$MAY_KS_DIR/password.txt"
  ALIAS="${ANIBAL_KS_ALIAS:-may}"
fi

if [ -n "$KS" ]; then
  if [ -z "$KSPASS" ]; then
    echo "ANIBAL_KS is set but ANIBAL_KS_PASS is missing" >&2
    exit 1
  fi
  "$BT/apksigner" sign --ks "$KS" --ks-key-alias "$ALIAS" --ks-pass "$KSPASS" --out "out/$APK_NAME" out/a.apk
else
  TMPKS=$(mktemp -d)
  trap 'rm -rf "$TMPKS"' EXIT
  keytool -genkeypair -keystore "$TMPKS/debug.jks" -storepass android -keypass android \
    -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Anibal OSNews debug,O=OSNews,C=ES" >/dev/null
  "$BT/apksigner" sign --ks "$TMPKS/debug.jks" --ks-key-alias androiddebugkey \
    --ks-pass pass:android --key-pass pass:android --out "out/$APK_NAME" out/a.apk
  echo "Signed with a temporary debug key (no release keystore found)."
fi

"$BT/apksigner" verify --print-certs "out/$APK_NAME"
ls -l "out/$APK_NAME"
