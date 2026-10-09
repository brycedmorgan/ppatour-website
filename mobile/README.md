# PPA Tour iOS shell (Capacitor)

Native wrapper around the live app: loads `https://www.ppatour.com/scores/?source=pwa`
(server.url), so every web deploy shows up on reopen. App mode keys on `?source=pwa`.

- **Bryce's phone, now:** personal team (7-day expiry):
  `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination id=00008140-001665EA3AE1401C -derivedDataPath ios/DerivedData -allowProvisioningUpdates DEVELOPMENT_TEAM=M6B7DVNGVS PRODUCT_BUNDLE_IDENTIFIER=com.brycemorgan.ppatour.dev build`
  then `xcrun devicectl device install app --device 00008140-001665EA3AE1401C ios/DerivedData/Build/Products/Debug-iphoneos/App.app`.
- **TestFlight:** Pickleball OpCo team `A7FZ282VS8`. Bryce can't register devices there, so device builds must use the personal team. Archive + `xcodebuild -exportArchive -exportOptionsPlist ios/exportOptions.plist` uploads.
  ⚠ Bundle `com.ppatour.game` = the shelved arcade's App Store Connect record ("PPA Tour"). Using it for the fan app needs Bryce's OK; the proper fix is a new record (`com.ppatour.app`) from Jason/Tom.
- ⚠ A remote-URL wrapper is fine for internal TestFlight, NOT for App Store review (guideline 4.2). Store build needs native push, offline, etc. (docs/app-plan.md Phase 5).
