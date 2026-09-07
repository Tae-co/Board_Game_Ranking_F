#!/bin/sh
# 릴리즈 빌드. capacitor.config.json의 라이브 리로드용 server 블록을 빌드 동안만
# 제거해, localhost를 로드하는 앱이 스토어에 올라가는 것을 막는다.
set -e

PLATFORM="$1"
case "$PLATFORM" in
  android|ios) ;;
  *) echo "사용법: npm run release:android | npm run release:ios"; exit 1 ;;
esac

BACKUP=$(mktemp)
cp capacitor.config.json "$BACKUP"
trap 'cp "$BACKUP" capacitor.config.json; rm -f "$BACKUP"; echo "▸ capacitor.config.json 원복"' EXIT

node -e '
  const fs = require("fs");
  const f = "capacitor.config.json";
  const c = JSON.parse(fs.readFileSync(f, "utf8"));
  if (c.server) {
    delete c.server;
    fs.writeFileSync(f, JSON.stringify(c, null, 2) + "\n");
    console.log("▸ server 블록 제거 (빌드 동안만)");
  }
'

npm run build
npm run "sync:$PLATFORM"

if [ "$PLATFORM" = "ios" ]; then
  echo "▸ iOS sync 완료. Xcode에서 Archive 하세요."
  exit 0
fi

(cd android && ./gradlew bundleRelease)

AAB=android/app/build/outputs/bundle/release/app-release.aab

# 웹뷰가 번들 에셋 대신 개발 서버를 보게 되는 상태인지 확인.
# (vendor 라이브러리에 "http://localhost" fallback 문자열이 있어 bare grep은 오탐)
if unzip -p "$AAB" base/assets/capacitor.config.json | grep -q '"server"'; then
  echo "✖ AAB의 capacitor.config.json에 server 블록이 있습니다. 배포하지 마세요."
  exit 1
fi
if unzip -p "$AAB" 'base/assets/public/assets/*.js' | grep -qE "localhost:(5173|8080)"; then
  echo "✖ AAB에 로컬 서버 주소가 박혀 있습니다. .env 설정을 확인하세요."
  exit 1
fi
echo "✔ $AAB"
echo "✔ 개발 서버 설정 없음 /$(grep -m1 versionCode android/app/build.gradle | tr -s ' ')"
