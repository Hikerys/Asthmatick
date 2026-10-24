#!/usr/bin/env sh
set -eu
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
build_type=${1:-debug}
case "$build_type" in
  debug) task=assembleDebug; source_apk=debug/app-debug.apk; output=Asthmatick-debug.apk ;;
  release) task=assembleRelease; source_apk=release/app-release.apk; output=Asthmatick.apk ;;
  *) echo 'Usage: scripts/build-apk.sh [debug|release]' >&2; exit 2 ;;
esac
"$project_dir/android/gradlew" -p "$project_dir/android" "$task"
if [ ! -f "$project_dir/android/app/build/outputs/apk/$source_apk" ]; then
  echo 'Signed release APK is missing. Configure the release keystore or use debug.' >&2
  exit 1
fi
mkdir -p "$project_dir/releases"
cp "$project_dir/android/app/build/outputs/apk/$source_apk" "$project_dir/releases/$output"
if [ "$build_type" = release ]; then
  cp "$project_dir/releases/$output" "$project_dir/$output"
fi
printf '%s\n' "$project_dir/releases/$output"
