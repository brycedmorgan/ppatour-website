#!/bin/zsh
# Archive the iOS shell and upload it to TestFlight (Pickleball OpCo team).
# Bundle: the shelved arcade's App Store Connect record ("PPA Tour", com.ppatour.game)
# until a com.ppatour.app record exists. Bump BUILD on every upload.
set -euo pipefail
cd "$(dirname "$0")"
BUILD=${BUILD:-2}
npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath ios/build/PPATour.xcarchive \
  -allowProvisioningUpdates DEVELOPMENT_TEAM=A7FZ282VS8 \
  PRODUCT_BUNDLE_IDENTIFIER=${BUNDLE:-com.ppatour.game} MARKETING_VERSION=1.0 CURRENT_PROJECT_VERSION=$BUILD \
  archive | tail -3
xcodebuild -exportArchive -archivePath ios/build/PPATour.xcarchive \
  -exportOptionsPlist ios/exportOptions.plist -exportPath ios/build/export -allowProvisioningUpdates | tail -5
